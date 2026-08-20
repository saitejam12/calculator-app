from pydantic import BaseModel, Field


class EntryRequest(BaseModel):
    """A single keypress applied to the current number being entered."""

    display: str = Field(..., description="The value currently shown on the display.")
    entering: bool = Field(
        default=False,
        description="Whether a number entry is already in progress.",
    )
    key: str = Field(
        ...,
        min_length=1,
        max_length=1,
        description="The key pressed: a single digit '0'-'9' or '.'.",
    )


class EntryResponse(BaseModel):
    """The display state after the keypress has been applied."""

    display: str
    entering: bool
