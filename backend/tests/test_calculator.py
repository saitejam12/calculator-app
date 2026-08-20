import pytest
from fastapi.testclient import TestClient

from app.auth import encode_token
from app.config import get_settings
from app.main import app

ENDPOINT = "/api/v1/calculator/entry"


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    token = encode_token({"sub": "visitor"}, get_settings())
    return {"Authorization": f"Bearer {token}"}


def _entry(client, headers, display, entering, key):
    return client.post(
        ENDPOINT,
        headers=headers,
        json={"display": display, "entering": entering, "key": key},
    )


def test_ac008_no_leading_zero_remains(client, auth_headers):
    first = _entry(client, auth_headers, "0", False, "5")
    assert first.status_code == 200
    body = first.json()
    assert body == {"display": "5", "entering": True}

    second = _entry(client, auth_headers, body["display"], body["entering"], "2")
    assert second.status_code == 200
    assert second.json()["display"] == "52"


def test_ac009_decimal_then_digit(client, auth_headers):
    dot = _entry(client, auth_headers, "12", True, ".")
    assert dot.json()["display"] == "12."
    five = _entry(client, auth_headers, "12.", True, "5")
    assert five.json()["display"] == "12.5"


def test_ac010_second_decimal_unchanged(client, auth_headers):
    resp = _entry(client, auth_headers, "12.5", True, ".")
    assert resp.status_code == 200
    assert resp.json()["display"] == "12.5"


def test_ac011_decimal_first_shows_zero_point(client, auth_headers):
    resp = _entry(client, auth_headers, "0", False, ".")
    assert resp.status_code == 200
    assert resp.json() == {"display": "0.", "entering": True}


def test_requires_authentication(client):
    resp = client.post(
        ENDPOINT,
        json={"display": "0", "entering": False, "key": "5"},
    )
    assert resp.status_code == 401


def test_rejects_invalid_token(client):
    resp = client.post(
        ENDPOINT,
        headers={"Authorization": "Bearer not.a.valid.token"},
        json={"display": "0", "entering": False, "key": "5"},
    )
    assert resp.status_code == 401


def test_unsupported_key_returns_422(client, auth_headers):
    resp = _entry(client, auth_headers, "0", False, "+")
    assert resp.status_code == 422


def test_missing_key_field_returns_422(client, auth_headers):
    resp = client.post(
        ENDPOINT,
        headers=auth_headers,
        json={"display": "0", "entering": False},
    )
    assert resp.status_code == 422
