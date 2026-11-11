"""牌義查詢：GET /cards、GET /cards/{card_id}。"""

from typing import List

from fastapi import APIRouter, HTTPException

from ..cards import get_card, load_cards
from ..schemas import Card, CardSummary, ErrorResponse

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get("", response_model=List[CardSummary], summary="取得 78 張牌的列表")
def list_cards() -> List[CardSummary]:
    return [CardSummary(**c.model_dump()) for c in load_cards()]


@router.get(
    "/{card_id}",
    response_model=Card,
    summary="取得一張牌的完整牌義",
    responses={404: {"model": ErrorResponse, "description": "牌 id 不存在"}},
)
def read_card(card_id: str) -> Card:
    card = get_card(card_id)
    if card is None:
        raise HTTPException(status_code=404, detail=f"找不到牌：{card_id}")
    return card
