import base64
import hashlib
import hmac
import json
import time
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign(signing_input: bytes) -> bytes:
    return hmac.new(
        settings.jwt_secret.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()


def create_access_token(
    claims: Dict[str, Any], expires_in: Optional[int] = None
) -> str:
    """Create a signed HS256 JWT. Exposed so callers (and tests) can mint tokens."""
    header = {"alg": settings.jwt_algorithm, "typ": "JWT"}
    payload: Dict[str, Any] = dict(claims)
    ttl = settings.access_token_expire_seconds if expires_in is None else expires_in
    payload.setdefault("exp", int(time.time()) + ttl)

    segments = [
        _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8")),
        _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8")),
    ]
    signature = _sign(".".join(segments).encode("ascii"))
    segments.append(_b64url_encode(signature))
    return ".".join(segments)


def decode_token(token: str) -> Dict[str, Any]:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError:
        raise credentials_exception

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected_signature = _sign(signing_input)
    try:
        provided_signature = _b64url_decode(signature_b64)
    except (ValueError, TypeError):
        raise credentials_exception

    if not hmac.compare_digest(expected_signature, provided_signature):
        raise credentials_exception

    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except (ValueError, TypeError):
        raise credentials_exception

    exp = payload.get("exp")
    if exp is not None and float(exp) < time.time():
        raise credentials_exception

    return payload


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise credentials_exception
    return decode_token(credentials.credentials)
