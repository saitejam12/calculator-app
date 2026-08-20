import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.calculator import CalculatorState
from app.services import calculator as calculator_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calculator", tags=["calculator"])


@router.post("/backspace", response_model=CalculatorState)
async def backspace(
    state: CalculatorState,
    _user: Dict[str, Any] = Depends(get_current_user),
) -> CalculatorState:
    """Delete the last character of the current entry and return the new state."""
    return await calculator_service.backspace(state)
