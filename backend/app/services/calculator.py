import logging

from app.schemas.calculator import CalculatorState

logger = logging.getLogger(__name__)


async def backspace(state: CalculatorState) -> CalculatorState:
    """Remove the last character of the current entry.

    Mirrors the frontend reducer's backspace handling so that both halves of
    the sprint agree:
      - When the calculator is in an error state, backspace is a no-op.
      - Trimming down to nothing (or a lone minus sign) collapses the display
        to "0" and marks the entry as empty (entering=False).
      - Otherwise the trimmed value becomes the current entry (entering=True),
        which also lets a completed result be edited as a fresh entry.
    The accumulator, operator and error flag are otherwise left untouched.
    """
    if state.error:
        logger.debug("Backspace ignored while in error state")
        return CalculatorState(
            display=state.display,
            acc=state.acc,
            op=state.op,
            entering=state.entering,
            error=state.error,
        )

    trimmed = state.display[:-1]
    if trimmed == "" or trimmed == "-":
        return CalculatorState(
            display="0",
            acc=state.acc,
            op=state.op,
            entering=False,
            error=state.error,
        )

    return CalculatorState(
        display=trimmed,
        acc=state.acc,
        op=state.op,
        entering=True,
        error=state.error,
    )
