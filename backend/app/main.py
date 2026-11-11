"""Tarot Anytime 後端進入點：uvicorn app.main:app --reload"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .cards import load_cards
from .routers import cards, readings

app = FastAPI(
    title="Tarot Anytime API",
    version="0.1.0",
    description="塔羅占卜平台後端：牌義查詢與 AI 解讀。",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(cards.router)
app.include_router(readings.router)


@app.get("/health", tags=["system"], summary="確認服務是否運作")
def health() -> dict:
    return {
        "status": "ok",
        "cards": len(load_cards()),
        "llm": "mock" if config.USE_MOCK_LLM else config.ANTHROPIC_MODEL,
    }
