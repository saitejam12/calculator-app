import os


class Settings:
    """Application settings sourced from the environment.

    The delivery scope is lightweight, so a plain object with env-backed
    defaults is used rather than a full settings framework.
    """

    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
    jwt_algorithm: str = "HS256"
    access_token_expire_seconds: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_SECONDS", "3600")
    )


settings = Settings()
