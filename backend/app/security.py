"""Minimal, dependency-free JWT bearer authentication.

The approved architecture requires every ``/api/v1`` endpoint to be guarded
by a JWT bearer token. No shared auth module was available when this ticket
was built, so this provides a self-contained HS256 verifier using only the
standard library. If a shared auth dependency already exists in the project,
replace :func:`require_auth` with it.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"

bearer_scheme = HTTPBearer(auto_error=False)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + padding)


def encode_token(payload: dict[str, Any], secret: str = JWT_SECRET) -> str:
    """Create an HS256 JWT for the given payload (used by callers and tests)."""
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{header_b64}.{payload_b64}.{_b64url_encode(signature)}"


def decode_token(token: str, secret: str = JWT_SECRET) -> dict[str, Any]:
    """Verify an HS256 JWT and return its payload.

    Raises ``ValueError`` when the token is malformed, has a bad signature or
    has expired.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Malformed token")
    header_b64, payload_b64, signature_b64 = parts

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    try:
        actual = _b64url_decode(signature_b64)
    except Exception as exc:  # pragma: no cover - defensive
        raise ValueError("Malformed signature") from exc
    if not hmac.compare_digest(expected, actual):
        raise ValueError("Invalid signature")

    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except Exception as exc:
        raise ValueError("Malformed payload") from exc
    if not isinstance(payload, dict):
        raise ValueError("Malformed payload")

    exp = payload.get("exp")
    if exp is not None and time.time() > float(exp):
        raise ValueError("Token expired")
    return payload


async def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict[str, Any]:
    """FastAPI dependency that enforces a valid JWT bearer token."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return decode_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )
