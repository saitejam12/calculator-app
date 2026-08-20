"""Request and response models for the calculator entry endpoint."""

from __future__ import annotations

from pydantic import BaseModel, Field


class EntryPress(BaseModel):
    """A key press applied to the current entry state."""

    display: str = Field(default="0", description="Text currently on the display.")
    entering: bool = Field(
        default=False,
        description="Whether a number is currently being typed.",
    )
    key: str = Field(
        ...,
        min_length=1,
        max_length=1,
        description="The pressed key: a digit 0-9 or the decimal point '.'.",
    )


class EntryResult(BaseModel):
    """The entry state after applying a key press."""

    display: str = Field(description="Text to show on the display.")
    entering: bool = Field(description="Whether a number is still being typed.")
