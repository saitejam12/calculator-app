"""Number-entry state machine for the calculator.

This encodes the digit and decimal-point entry rules from US-003:

- Pressing a digit while no entry is in progress starts a fresh number
  (no leading zero survives).
- A number may contain at most one decimal point.
- Pressing the decimal point before any digit yields ``0.`` so that a
  value such as ``0.75`` can be typed.

The logic is intentionally pure (no I/O, no framework types) so it can be
reused and unit-tested in isolation.
"""

from __future__ import annotations

from dataclasses import dataclass

MAX_DIGITS = 12
DIGITS = frozenset("0123456789")
DECIMAL_POINT = "."


@dataclass(frozen=True)
class Entry:
    """An in-progress number entry.

    ``display`` is the text shown to the visitor and ``entering`` records
    whether a number is currently being typed (as opposed to a settled
    result or the initial ``0``).
    """

    display: str
    entering: bool


def _count_digits(text: str) -> int:
    return sum(1 for char in text if char in DIGITS)


def apply_digit(entry: Entry, digit: str) -> Entry:
    """Append a single digit to the entry, honouring the entry rules."""
    if len(digit) != 1 or digit not in DIGITS:
        raise ValueError(f"Not a single digit: {digit!r}")

    if not entry.entering:
        # Starting a fresh number replaces whatever was on the display.
        return Entry(display=digit, entering=True)

    if _count_digits(entry.display) >= MAX_DIGITS:
        return entry

    if entry.display == "0":
        # No leading zero should remain once a real digit is typed.
        return Entry(display=digit, entering=True)

    if entry.display == "-0":
        return Entry(display="-" + digit, entering=True)

    return Entry(display=entry.display + digit, entering=True)


def apply_decimal(entry: Entry) -> Entry:
    """Append a decimal point, at most one per number."""
    if not entry.entering:
        return Entry(display="0.", entering=True)

    if DECIMAL_POINT in entry.display:
        # A number may contain at most one decimal point; leave unchanged.
        return entry

    return Entry(display=entry.display + DECIMAL_POINT, entering=True)


def apply_key(entry: Entry, key: str) -> Entry:
    """Apply a supported entry key (a digit or the decimal point).

    Raises ``ValueError`` for any key this ticket does not cover.
    """
    if key == DECIMAL_POINT:
        return apply_decimal(entry)
    if len(key) == 1 and key in DIGITS:
        return apply_digit(entry, key)
    raise ValueError(f"Unsupported entry key: {key!r}")
