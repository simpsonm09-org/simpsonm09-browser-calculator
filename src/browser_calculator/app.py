"""The FastAPI application that serves the calculator."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import MAX_EXPRESSION_LENGTH, ExpressionError, evaluate

STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title="Browser Calculator", version="0.1.0")


class EvaluateRequest(BaseModel):
    expression: str = Field(min_length=1, max_length=MAX_EXPRESSION_LENGTH)


class EvaluateResponse(BaseModel):
    expression: str
    result: float


class HealthResponse(BaseModel):
    status: str


@app.get("/healthz", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/api/evaluate", response_model=EvaluateResponse)
def evaluate_expression(request: EvaluateRequest) -> EvaluateResponse:
    try:
        result = evaluate(request.expression)
    except ExpressionError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return EvaluateResponse(expression=request.expression, result=result)


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
