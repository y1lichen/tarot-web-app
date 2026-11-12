"""載入牌義與牌陣資料。兩者都是唯讀資料，第一次使用時讀入並放在記憶體。

- data/tarot_cards.json：78 張牌的牌義（黃煒哲整理）
- data/spreads.json：牌陣與各位置的說明、給 LLM 的提示（黃煒哲整理）
"""

import json
from dataclasses import dataclass
from functools import lru_cache
from typing import Dict, List, Optional

from .config import CARDS_PATH, SPREAD_ID, SPREADS_PATH
from .schemas import Card, Position


def _to_card(raw: dict) -> Card:
    """把資料檔的巢狀格式轉成 API 使用的 Card。"""
    return Card(
        id=raw["id"],
        name_zh=raw["name"]["zh"],
        name_en=raw["name"]["en"],
        arcana=raw["arcana"],
        suit=raw["suit"],
        number=raw["number"],
        rank=raw.get("rank"),
        image=None,  # 牌面圖尚未決定，資料檔中的路徑暫不使用
        element=raw.get("element"),
        astrology=raw.get("astrology"),
        symbolism=raw["symbolism"],
        upright=raw["upright"],
        reversed=raw["reversed"],
    )


@lru_cache(maxsize=1)
def load_cards() -> List[Card]:
    with open(CARDS_PATH, encoding="utf-8") as f:
        raw = json.load(f)
    cards = [_to_card(item) for item in raw["cards"]]
    ids = [c.id for c in cards]
    if len(set(ids)) != len(ids):
        raise ValueError(f"{CARDS_PATH} 有重複的牌 id")
    return cards


@lru_cache(maxsize=1)
def cards_by_id() -> Dict[str, Card]:
    return {c.id: c for c in load_cards()}


def get_card(card_id: str) -> Optional[Card]:
    return cards_by_id().get(card_id)


@dataclass(frozen=True)
class PositionInfo:
    name: str  # 顯示名稱，例如「未來趨勢」
    description: str
    llm_hint: str


@lru_cache(maxsize=1)
def load_positions() -> Dict[Position, PositionInfo]:
    """讀取 SPREAD_ID 指定的牌陣，並確認位置與 Position 一致。"""
    with open(SPREADS_PATH, encoding="utf-8") as f:
        spreads = json.load(f)["spreads"]
    spread = next((s for s in spreads if s["id"] == SPREAD_ID), None)
    if spread is None:
        raise ValueError(f"{SPREADS_PATH} 沒有牌陣 {SPREAD_ID}")
    positions = {
        Position(p["key"]): PositionInfo(p["name"], p["description"], p["llm_hint"])
        for p in spread["positions"]
    }
    if set(positions) != set(Position):
        raise ValueError(f"牌陣 {SPREAD_ID} 的位置與 Position 不一致")
    return positions


def position_label(position: Position) -> str:
    return load_positions()[position].name
