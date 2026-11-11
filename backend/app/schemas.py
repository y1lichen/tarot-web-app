"""API 的請求與回應格式。FastAPI 依這些模型驗證輸入，並產生 /docs 文件。"""

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from .config import QUESTION_MAX_LENGTH


class Arcana(str, Enum):
    major = "major"
    minor = "minor"


class Suit(str, Enum):
    wands = "wands"
    cups = "cups"
    swords = "swords"
    pentacles = "pentacles"


class Position(str, Enum):
    """牌陣位置。名稱尚未定案，目前採「過去、現在、未來」。"""

    past = "past"
    present = "present"
    future = "future"


POSITION_LABELS = {
    Position.past: "過去",
    Position.present: "現在",
    Position.future: "未來趨勢",
}


class CardSummary(BaseModel):
    id: str = Field(examples=["major-00"])
    name_zh: str = Field(examples=["愚者"])
    name_en: str = Field(examples=["The Fool"])
    arcana: Arcana
    suit: Optional[Suit] = None
    number: int
    image: Optional[str] = None


class Card(CardSummary):
    upright: List[str] = Field(description="正位牌義關鍵字")
    reversed: List[str] = Field(description="逆位牌義關鍵字")


class DrawnCard(BaseModel):
    card_id: str = Field(examples=["major-00"])
    position: Position
    reversed: bool = Field(description="true 表示逆位")


class ReadingRequest(BaseModel):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "question": "我應該如何面對目前的工作壓力？",
                    "cards": [
                        {"card_id": "major-00", "position": "past", "reversed": False},
                        {"card_id": "cups-02", "position": "present", "reversed": True},
                        {"card_id": "swords-10", "position": "future", "reversed": False},
                    ],
                }
            ]
        }
    }

    question: str = Field(
        min_length=1,
        max_length=QUESTION_MAX_LENGTH,
        examples=["我應該如何面對目前的工作壓力？"],
    )
    cards: List[DrawnCard] = Field(min_length=3, max_length=3)

    @field_validator("question")
    @classmethod
    def question_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("問題不能是空白")
        return value

    @model_validator(mode="after")
    def cards_unique(self) -> "ReadingRequest":
        ids = [c.card_id for c in self.cards]
        if len(set(ids)) != len(ids):
            raise ValueError("三張牌不能重複")
        positions = [c.position for c in self.cards]
        if len(set(positions)) != len(positions):
            raise ValueError("三張牌的牌陣位置不能重複")
        return self


class CardReading(BaseModel):
    card: CardSummary
    position: Position
    position_label: str
    reversed: bool
    interpretation: str


class ReadingResponse(BaseModel):
    question: str
    cards: List[CardReading]
    overall: str = Field(description="整體牌陣分析")
    advice: str = Field(description="反思建議")
    mock: bool = Field(description="true 表示解讀是未呼叫 LLM 的暫代文字")


class ErrorResponse(BaseModel):
    detail: str
