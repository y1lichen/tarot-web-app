"""載入牌義資料。78 張牌是唯讀資料，啟動時讀一次放在記憶體。"""

import json
from functools import lru_cache
from typing import Dict, List, Optional

from .config import CARDS_PATH
from .schemas import Card


@lru_cache(maxsize=1)
def load_cards() -> List[Card]:
    with open(CARDS_PATH, encoding="utf-8") as f:
        raw = json.load(f)
    cards = [Card(**item) for item in raw]
    ids = [c.id for c in cards]
    if len(set(ids)) != len(ids):
        raise ValueError(f"{CARDS_PATH} 有重複的牌 id")
    return cards


@lru_cache(maxsize=1)
def cards_by_id() -> Dict[str, Card]:
    return {c.id: c for c in load_cards()}


def get_card(card_id: str) -> Optional[Card]:
    return cards_by_id().get(card_id)
