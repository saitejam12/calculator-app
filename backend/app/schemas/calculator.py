from typing import Optional

from pydantic import BaseModel


class CalculatorState(BaseModel):
    """The calculator state, mirroring the shape used by the frontend reducer."""

    display: str = "0"
    acc: Optional[float] = None
    op: Optional[str] = None
    entering: bool = False
    error: bool = False
