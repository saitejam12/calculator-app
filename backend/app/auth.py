import base64
import hashlib
import hmac
import json
import time
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings

# A dependency-free HS256 JWT verifier. The delivery scope is lightweight and
# no JWT third-party library is guaranteed to be installed, so verification is
# implemented against the standard library only.

bearer_scheme = HTTPBearer(auto_error=False)


def _credentials_exception(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + padding)


def encode_token(claims: dict[str, Any], settings: Settings) -> str:
    """Produce a signed HS256 token. Used by callers and by the test suite."""
    header = {"alg": settings.jwt_algorithm, "typ": "JWT"}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(claims, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(
        settings.jwt_secret.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    return f"{header_b64}.{payload_b64}.{_b64url_encode(signature)}"


def decode_token(token: str, settings: Settings) -> dict[str, Any]:
    parts = token.split(".")
    if len(parts) != 3:
        raise _credentials_exception()

    header_b64, payload_b64, signature_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")

    try:
        header = json.loads(_b64url_decode(header_b64))
        provided_signature = _b64url_decode(signature_b64)
    except (ValueError, json.JSONDecodeError):
        raise _credentials_exception()

    if header.get("alg") != settings.jwt_algorithm:
        raise _credentials_exception()

    expected_signature = hmac.new(
        settings.jwt_secret.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    if not hmac.compare_digest(expected_signature, provided_signature):
        raise _credentials_exception()

    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except (ValueError, json.JSONDecodeError):
        raise _credentials_exception()

    exp = payload.get("exp")
    if exp is not None:
        try:
            if time.time() > float(exp):
                raise _credentials_exception("Token has expired")
        except (TypeError, ValueError):
            raise _credentials_exception()

    return payload


async def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _credentials_exception("Not authenticated")
    return decode_token(credentials.credentials, settings)
