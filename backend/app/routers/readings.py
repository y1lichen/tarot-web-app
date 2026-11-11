"""占卜解讀：POST /readings。"""

from fastapi import APIRouter, HTTPException

from ..cards import get_card
from ..llm import LLMError, LLMTimeout, generate_reading
from ..schemas import (
    POSITION_LABELS,
    CardReading,
    CardSummary,
    ErrorResponse,
    ReadingRequest,
    ReadingResponse,
)

router = APIRouter(prefix="/readings", tags=["readings"])


@router.post(
    "",
    response_model=ReadingResponse,
    summary="依問題與三張牌產生 AI 解讀",
    responses={
        422: {"description": "輸入格式錯誤：問題空白或過長、牌不存在、重複或不是三張"},
        502: {"model": ErrorResponse, "description": "Claude API 回傳錯誤"},
        504: {"model": ErrorResponse, "description": "Claude API 逾時"},
    },
)
async def create_reading(req: ReadingRequest) -> ReadingResponse:
    cards = []
    for drawn in req.cards:
        card = get_card(drawn.card_id)
        if card is None:
            raise HTTPException(status_code=422, detail=f"找不到牌：{drawn.card_id}")
        cards.append(card)

    try:
        text = await generate_reading(req.question, req.cards, cards)
    except LLMTimeout as e:
        raise HTTPException(status_code=504, detail="解讀服務逾時，請稍後再試") from e
    except LLMError as e:
        raise HTTPException(status_code=502, detail="解讀服務暫時無法使用，請稍後再試") from e

    return ReadingResponse(
        question=req.question,
        cards=[
            CardReading(
                card=CardSummary(**card.model_dump()),
                position=drawn.position,
                position_label=POSITION_LABELS[drawn.position],
                reversed=drawn.reversed,
                interpretation=interp,
            )
            for drawn, card, interp in zip(req.cards, cards, text.interpretations)
        ],
        overall=text.overall,
        advice=text.advice,
        mock=text.mock,
    )
