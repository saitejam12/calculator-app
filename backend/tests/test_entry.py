import pytest

from app.services.entry import MAX_DIGITS, EntryState, apply_entry


def test_ac008_first_digit_replaces_leading_zero():
    state = apply_entry(EntryState("0", False), "5")
    assert state.display == "5"
    assert state.entering is True
    state = apply_entry(state, "2")
    assert state.display == "52"
    assert state.entering is True


def test_ac009_decimal_then_digit_appends():
    state = apply_entry(EntryState("12", True), ".")
    assert state.display == "12."
    state = apply_entry(state, "5")
    assert state.display == "12.5"


def test_ac010_second_decimal_is_ignored():
    state = apply_entry(EntryState("12.5", True), ".")
    assert state.display == "12.5"


def test_ac011_decimal_first_starts_zero_point():
    state = apply_entry(EntryState("0", False), ".")
    assert state.display == "0."
    assert state.entering is True


def test_negative_leading_zero_replaced():
    state = apply_entry(EntryState("-0", True), "7")
    assert state.display == "-7"


def test_max_digits_enforced():
    full = "1" * MAX_DIGITS
    state = apply_entry(EntryState(full, True), "9")
    assert state.display == full


def test_unsupported_key_raises():
    with pytest.raises(ValueError):
        apply_entry(EntryState("0", False), "+")
