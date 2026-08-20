from fastapi import FastAPI

from app.routers import calculator


def create_app() -> FastAPI:
    app = FastAPI(title="Desk Machine Calculator API")
    app.include_router(calculator.router)
    return app


app = create_app()
