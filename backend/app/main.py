import logging

from fastapi import FastAPI

from app.routers import calculator

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Desk Machine Calculator API")

app.include_router(calculator.router, prefix="/api/v1")
