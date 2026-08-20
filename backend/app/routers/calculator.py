from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import require_auth
from app.schemas import EntryRequest, EntryResponse
from app.services import entry as entry_service

router = APIRouter(prefix="/api/v1/calculator", tags=["calculator"])


@router.post("/entry", response_model=EntryResponse)
async def post_entry(
    payload: EntryRequest,
    _claims: dict = Depends(require_auth),
) -> EntryResponse:
    """Apply one digit or decimal-point keypress to the display entry."""
    state = entry_service.EntryState(
        display=payload.display,
        entering=payload.entering,
    )
    try:
        result = entry_service.apply_entry(state, payload.key)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    return EntryResponse(display=result.display, entering=result.entering)
