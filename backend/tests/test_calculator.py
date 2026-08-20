from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.main import app

client = TestClient(app)

ENDPOINT = "/api/v1/calculator/backspace"


def _auth_header() -> dict:
    token = create_access_token({"sub": "visitor"})
    return {"Authorization": f"Bearer {token}"}


def test_ac012_backspace_removes_last_digit_and_keeps_state():
    payload = {
        "display": "123",
        "acc": 10,
        "op": "+",
        "entering": True,
        "error": False,
    }
    response = client.post(ENDPOINT, json=payload, headers=_auth_header())
    assert response.status_code == 200
    body = response.json()
    assert body["display"] == "12"
    # rest of the calculation state is unchanged
    assert body["acc"] == 10
    assert body["op"] == "+"
    assert body["entering"] is True
    assert body["error"] is False


def test_ac013_backspace_single_digit_becomes_zero_and_empty():
    payload = {"display": "7", "acc": None, "op": None, "entering": True, "error": False}
    response = client.post(ENDPOINT, json=payload, headers=_auth_header())
    assert response.status_code == 200
    body = response.json()
    assert body["display"] == "0"
    # the entry is treated as empty
    assert body["entering"] is False


def test_ac014_backspace_twice_on_decimal():
    first_payload = {
        "display": "4.5",
        "acc": None,
        "op": None,
        "entering": True,
        "error": False,
    }
    first = client.post(ENDPOINT, json=first_payload, headers=_auth_header())
    assert first.status_code == 200
    assert first.json()["display"] == "4."

    second = client.post(ENDPOINT, json=first.json(), headers=_auth_header())
    assert second.status_code == 200
    assert second.json()["display"] == "4"


def test_ac015_backspace_edits_completed_result_as_new_entry():
    completed = {
        "display": "20",
        "acc": None,
        "op": None,
        "entering": False,
        "error": False,
    }
    response = client.post(ENDPOINT, json=completed, headers=_auth_header())
    assert response.status_code == 200
    body = response.json()
    assert body["display"] == "2"
    # the shown result is now being edited as a fresh entry
    assert body["entering"] is True
    assert body["error"] is False


def test_backspace_is_noop_in_error_state():
    error_state = {
        "display": "Error",
        "acc": None,
        "op": None,
        "entering": False,
        "error": True,
    }
    response = client.post(ENDPOINT, json=error_state, headers=_auth_header())
    assert response.status_code == 200
    body = response.json()
    assert body["display"] == "Error"
    assert body["error"] is True


def test_requires_authentication():
    payload = {"display": "123"}
    response = client.post(ENDPOINT, json=payload)
    assert response.status_code == 401


def test_rejects_invalid_token():
    payload = {"display": "123"}
    headers = {"Authorization": "Bearer not-a-real-token"}
    response = client.post(ENDPOINT, json=payload, headers=headers)
    assert response.status_code == 401


def test_rejects_invalid_body():
    payload = {"display": 123, "entering": "maybe"}
    response = client.post(ENDPOINT, json=payload, headers=_auth_header())
    assert response.status_code == 422
