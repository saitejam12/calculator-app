from dataclasses import dataclass

# The most digits a single number may contain, matching the display constraint
# on the calculator face.
MAX_DIGITS = 12

DIGITS = frozenset("0123456789")


@dataclass
class EntryState:
    """The in-progress number as shown on the display.

    ``entering`` is False when the display holds a settled value (a result or
    the initial ``0``) and no fresh number has been started. The first digit or
    decimal point pressed then begins a new entry rather than appending.
    """

    display: str
    entering: bool


def _count_digits(display: str) -> int:
    return sum(1 for ch in display if ch in DIGITS)


def press_digit(state: EntryState, digit: str) -> EntryState:
    if len(digit) != 1 or digit not in DIGITS:
        raise ValueError(f"Not a digit: {digit!r}")

    # Starting a fresh number replaces whatever settled value was on show.
    if not state.entering:
        return EntryState(display=digit, entering=True)

    # A number may not grow past the display width.
    if _count_digits(state.display) >= MAX_DIGITS:
        return EntryState(display=state.display, entering=True)

    # A lone leading zero is overwritten so no leading zero remains (AC-008).
    if state.display == "0":
        return EntryState(display=digit, entering=True)
    if state.display == "-0":
        return EntryState(display="-" + digit, entering=True)

    return EntryState(display=state.display + digit, entering=True)


def press_decimal(state: EntryState) -> EntryState:
    # Pressing the decimal point first begins the entry as ``0.`` (AC-011).
    if not state.entering:
        return EntryState(display="0.", entering=True)

    # A number may contain at most one decimal point (AC-010).
    if "." in state.display:
        return EntryState(display=state.display, entering=True)

    return EntryState(display=state.display + ".", entering=True)


def apply_entry(state: EntryState, key: str) -> EntryState:
    """Apply a digit or decimal-point keypress to the entry state.

    Raises ``ValueError`` for keys outside this ticket's scope (digits and the
    decimal point).
    """
    if key == ".":
        return press_decimal(state)
    if len(key) == 1 and key in DIGITS:
        return press_digit(state, key)
    raise ValueError(f"Unsupported entry key: {key!r}")
