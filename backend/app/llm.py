"""組提示詞並呼叫 Claude API 產生解讀；沒有 API key 時回傳暫代文字。"""

from dataclasses import dataclass
from typing import List

from . import config
from .cards import load_positions
from .schemas import Card, DrawnCard


class LLMError(Exception):
    """Claude API 回傳錯誤或格式不符。"""


class LLMTimeout(LLMError):
    """Claude API 逾時。"""


@dataclass
class ReadingText:
    interpretations: List[str]  # 與輸入的三張牌同順序
    overall: str
    advice: str
    mock: bool


SYSTEM_PROMPT = """你是塔羅解讀助理，服務對象是不熟悉塔羅牌的一般使用者。
規則：
- 使用繁體中文，語氣溫和、白話，避免艱深術語。
- 依照實際抽到的牌、正逆位與牌陣位置解讀，不得改用其他牌。
- 解讀要連結使用者的問題，不只是重複通用牌義。
- 不做絕對的預言或保證，不提供醫療、法律、投資等專業建議；涉及這些領域時建議使用者諮詢專業人士。
- 解讀定位為自我反思的參考。"""

READING_TOOL = {
    "name": "submit_reading",
    "description": "提交三張牌的解讀結果。",
    "input_schema": {
        "type": "object",
        "properties": {
            "interpretations": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 3,
                "maxItems": 3,
                "description": "依輸入順序，每張牌在該位置的個別解讀，各 2～4 句。",
            },
            "overall": {"type": "string", "description": "整體牌陣分析，3～5 句。"},
            "advice": {"type": "string", "description": "給使用者的反思建議，2～4 句。"},
        },
        "required": ["interpretations", "overall", "advice"],
    },
}


def _card_block(index: int, drawn: DrawnCard, card: Card) -> str:
    pos = load_positions()[drawn.position]
    side = card.reversed if drawn.reversed else card.upright
    orientation = "逆位" if drawn.reversed else "正位"
    return "\n".join([
        f"{index}. 位置：{pos.name}（{pos.description}）",
        f"   解讀方式：{pos.llm_hint}",
        f"   牌：{card.name_zh}（{card.name_en}）{orientation}",
        f"   牌面象徵：{card.symbolism}",
        f"   關鍵字：{'、'.join(side.keywords)}",
        f"   基本牌義：{side.meaning}",
        f"   感情面向：{side.love}",
        f"   工作面向：{side.career}",
        f"   反思問題：{side.reflection}",
    ])


def build_prompt(question: str, drawn: List[DrawnCard], cards: List[Card]) -> str:
    blocks = [_card_block(i + 1, d, c) for i, (d, c) in enumerate(zip(drawn, cards))]
    return (
        f"使用者的問題：{question}\n\n"
        "牌陣：時間之流（過去、現在、未來趨勢）\n\n"
        + "\n\n".join(blocks)
        + "\n\n請依各位置的解讀方式，參考牌義資料並連結使用者的問題，"
        "用 submit_reading 工具提交解讀。感情與工作面向只在與問題相關時採用。"
    )


def mock_reading(question: str, drawn: List[DrawnCard], cards: List[Card]) -> ReadingText:
    positions = load_positions()
    interpretations = []
    for d, c in zip(drawn, cards):
        side = c.reversed if d.reversed else c.upright
        orientation = "逆位" if d.reversed else "正位"
        interpretations.append(
            f"【暫代文字】{c.name_zh}{orientation}出現在「{positions[d.position].name}」：{side.meaning}"
        )
    last = cards[-1].reversed if drawn[-1].reversed else cards[-1].upright
    return ReadingText(
        interpretations=interpretations,
        overall=f"【暫代文字】這是針對「{question}」的示範整體分析，尚未呼叫 LLM。",
        advice=f"【暫代文字】{last.reflection}",
        mock=True,
    )


async def generate_reading(
    question: str, drawn: List[DrawnCard], cards: List[Card]
) -> ReadingText:
    if config.USE_MOCK_LLM:
        return mock_reading(question, drawn, cards)

    import anthropic

    client = anthropic.AsyncAnthropic(
        api_key=config.ANTHROPIC_API_KEY,
        timeout=config.LLM_TIMEOUT_SECONDS,
        max_retries=1,
    )
    try:
        message = await client.messages.create(
            model=config.ANTHROPIC_MODEL,
            max_tokens=1500,
            system=SYSTEM_PROMPT,
            tools=[READING_TOOL],
            tool_choice={"type": "tool", "name": READING_TOOL["name"]},
            messages=[{"role": "user", "content": build_prompt(question, drawn, cards)}],
        )
    except anthropic.APITimeoutError as e:
        raise LLMTimeout("Claude API 逾時") from e
    except anthropic.APIError as e:
        raise LLMError(f"Claude API 錯誤：{type(e).__name__}") from e

    for block in message.content:
        if block.type == "tool_use" and block.name == READING_TOOL["name"]:
            data = block.input
            interpretations = data.get("interpretations")
            if (
                isinstance(interpretations, list)
                and len(interpretations) == 3
                and all(isinstance(x, str) for x in interpretations)
                and isinstance(data.get("overall"), str)
                and isinstance(data.get("advice"), str)
            ):
                return ReadingText(interpretations, data["overall"], data["advice"], mock=False)
    raise LLMError("Claude API 回傳的格式不符")
