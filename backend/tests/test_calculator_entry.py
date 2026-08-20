"""US-003: digit and decimal-point entry rules, exercised through the entry service.

The number-entry logic lives in ``app.services.calculator_entry`` but was not
wired to a REST endpoint for this ticket (only /calculator/backspace exists),
so these tests drive the public service API (``apply_key`` over ``Entry``)
rather than a private helper.
"""

from app.services.calculator_entry import Entry, apply_key

INITIAL = Entry(display="0", entering=False)


def _press(entry: Entry, *keys: str) -> Entry:
    for key in keys:
        entry = apply_key(entry, key)
    return entry


def test_ac008_multi_digit_entry_drops_leading_zero():
    # Display shows 0 with no entry in progress; press 5 then 2.
    result = _press(INITIAL, "5", "2")
    assert result.display == "52"
    assert result.entering is True


def test_ac009_decimal_then_digit_extends_the_number():
    # Display shows 12; press the decimal point then 5.
    twelve = _press(INITIAL, "1", "2")
    assert twelve.display == "12"
    result = _press(twelve, ".", "5")
    assert result.display == "12.5"


def test_ac010_second_decimal_point_is_ignored():
    # Display shows 12.5; press the decimal point again -> unchanged.
    twelve_point_five = _press(INITIAL, "1", "2", ".", "5")
    assert twelve_point_five.display == "12.5"
    result = apply_key(twelve_point_five, ".")
    assert result.display == "12.5"
    assert result.entering is True


def test_ac011_leading_decimal_yields_zero_point():
    # Display shows 0 with no entry in progress; press the decimal point first.
    result = apply_key(INITIAL, ".")
    assert result.display == "0."
    assert result.entering is True
    # so that a value such as 0.75 can be typed in full
    full = _press(result, "7", "5")
    assert full.display == "0.75"
