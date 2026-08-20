import os
from functools import lru_cache


class Settings:
    """Runtime configuration.

    Values come from the environment so nothing secret is baked into the image.
    The defaults are development-only and must be overridden in any real
    deployment.
    """

    def __init__(self) -> None:
        self.jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
        self.jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
        self.api_prefix: str = "/api/v1"


@lru_cache
def get_settings() -> Settings:
    return Settings()
