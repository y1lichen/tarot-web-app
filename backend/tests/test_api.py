"""後端測試案例：python -m pytest -v"""

import pytest
from fastapi.testclient import TestClient

from app import llm
from app.main import app
from app.routers import readings

client = TestClient(app)


def body(question="我應該如何面對目前的工作壓力？", cards=None):
    if cards is None:
        cards = [
            {"card_id": "major-00", "position": "past", "reversed": False},
            {"card_id": "cups-02", "position": "present", "reversed": True},
            {"card_id": "swords-10", "position": "future", "reversed": False},
        ]
    return {"question": question, "cards": cards}


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["cards"] == 78


def test_list_cards_returns_78_unique():
    r = client.get("/cards")
    assert r.status_code == 200
    ids = [c["id"] for c in r.json()]
    assert len(ids) == 78 and len(set(ids)) == 78


def test_get_card():
    r = client.get("/cards/major-00")
    assert r.status_code == 200
    data = r.json()
    assert data["name_zh"] == "愚者"
    for side in ("upright", "reversed"):
        assert data[side]["keywords"]
        for field in ("meaning", "love", "career", "reflection"):
            assert data[side][field]
    assert data["symbolism"]


def test_card_ids_and_images():
    ids = {c["id"] for c in client.get("/cards").json()}
    assert {"wands-ace", "cups-page", "swords-knight", "pentacles-king", "major-21"} <= ids
    assert all(c["image"] is None for c in client.get("/cards").json())
    assert client.get("/cards/wands-01").status_code == 404


def test_reading_position_labels():
    labels = [c["position_label"] for c in client.post("/readings", json=body()).json()["cards"]]
    assert labels == ["過去", "現在", "未來趨勢"]


def test_get_card_not_found():
    assert client.get("/cards/major-99").status_code == 404


def test_reading_ok():
    r = client.post("/readings", json=body())
    assert r.status_code == 200
    data = r.json()
    assert [c["card"]["id"] for c in data["cards"]] == ["major-00", "cups-02", "swords-10"]
    assert data["cards"][1]["reversed"] is True
    assert data["overall"] and data["advice"]
    assert data["mock"] is True


@pytest.mark.parametrize("question", ["", "   ", "問" * 201])
def test_reading_bad_question(question):
    assert client.post("/readings", json=body(question=question)).status_code == 422


def test_reading_duplicate_cards():
    cards = body()["cards"]
    cards[1]["card_id"] = "major-00"
    assert client.post("/readings", json=body(cards=cards)).status_code == 422


def test_reading_duplicate_positions():
    cards = body()["cards"]
    cards[1]["position"] = "past"
    assert client.post("/readings", json=body(cards=cards)).status_code == 422


def test_reading_wrong_card_count():
    assert client.post("/readings", json=body(cards=body()["cards"][:2])).status_code == 422


def test_reading_unknown_card():
    cards = body()["cards"]
    cards[2]["card_id"] = "major-99"
    assert client.post("/readings", json=body(cards=cards)).status_code == 422


def test_reading_invalid_json():
    r = client.post("/readings", content="{not json", headers={"Content-Type": "application/json"})
    assert r.status_code == 422


@pytest.mark.parametrize("exc, status", [(llm.LLMTimeout("t"), 504), (llm.LLMError("e"), 502)])
def test_reading_llm_failure(monkeypatch, exc, status):
    async def fail(*args, **kwargs):
        raise exc

    monkeypatch.setattr(readings, "generate_reading", fail)
    assert client.post("/readings", json=body()).status_code == status


def test_generate_reading_parses_claude_tool_use(monkeypatch):
    """以假的 Claude client 確認工具呼叫結果的解析，不連網。"""
    import asyncio
    from types import SimpleNamespace

    import anthropic

    from app import config
    from app.cards import get_card
    from app.schemas import ReadingRequest

    captured = {}

    class FakeMessages:
        async def create(self, **kwargs):
            captured.update(kwargs)
            block = SimpleNamespace(
                type="tool_use",
                name="submit_reading",
                input={"interpretations": ["a", "b", "c"], "overall": "o", "advice": "d"},
            )
            return SimpleNamespace(content=[block])

    class FakeClient:
        def __init__(self, **kwargs):
            self.messages = FakeMessages()

    monkeypatch.setattr(config, "USE_MOCK_LLM", False)
    monkeypatch.setattr(anthropic, "AsyncAnthropic", FakeClient)
    req = ReadingRequest(**body())
    cards = [get_card(c.card_id) for c in req.cards]
    text = asyncio.run(llm.generate_reading(req.question, req.cards, cards))
    assert text.interpretations == ["a", "b", "c"] and text.mock is False
    assert captured["tool_choice"] == {"type": "tool", "name": "submit_reading"}
    assert "聖杯二（Two of Cups）逆位" in captured["messages"][0]["content"]
    prompt = captured["messages"][0]["content"]
    assert get_card("cups-02").reversed.meaning in prompt  # 逆位用逆位牌義
    assert "而非確定的預言" in prompt  # 未來位置的 llm_hint
