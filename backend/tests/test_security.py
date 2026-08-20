import time

import pytest

from app.security import decode_token, encode_token


def test_encode_decode_roundtrip():
    payload = {"sub": "visitor", "exp": time.time() + 60}
    token = encode_token(payload)
    decoded = decode_token(token)
    assert decoded["sub"] == "visitor"


def test_invalid_signature_is_rejected():
    token = encode_token({"sub": "visitor", "exp": time.time() + 60})
    tampered = token[:-2] + ("aa" if not token.endswith("aa") else "bb")
    with pytest.raises(ValueError):
        decode_token(tampered)


def test_wrong_secret_is_rejected():
    token = encode_token({"sub": "visitor"}, secret="another-secret")
    with pytest.raises(ValueError):
        decode_token(token)


def test_expired_token_is_rejected():
    token = encode_token({"sub": "visitor", "exp": time.time() - 1})
    with pytest.raises(ValueError):
        decode_token(token)


def test_malformed_token_is_rejected():
    with pytest.raises(ValueError):
        decode_token("not-a-token")
