"""組提示詞並呼叫 Claude API 產生解讀；沒有 API key 時回傳暫代文字。"""

from dataclasses import dataclass
from typing import List

from . import config
from .schemas import POSITION_LABELS, Card, DrawnCard


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


def _card_line(index: int, drawn: DrawnCard, card: Card) -> str:
    orientation = "逆位" if drawn.reversed else "正位"
    keywords = card.reversed if drawn.reversed else card.upright
    return (
        f"{index}. 位置：{POSITION_LABELS[drawn.position]}；"
        f"牌：{card.name_zh}（{card.name_en}）{orientation}；"
        f"牌義關鍵字：{'、'.join(keywords)}"
    )


def build_prompt(question: str, drawn: List[DrawnCard], cards: List[Card]) -> str:
    lines = [_card_line(i + 1, d, c) for i, (d, c) in enumerate(zip(drawn, cards))]
    return (
        f"使用者的問題：{question}\n\n"
        "牌陣（三張牌：過去、現在、未來趨勢）：\n"
        + "\n".join(lines)
        + "\n\n請用 submit_reading 工具提交解讀。"
    )


def mock_reading(question: str, drawn: List[DrawnCard], cards: List[Card]) -> ReadingText:
    interpretations = []
    for d, c in zip(drawn, cards):
        orientation = "逆位" if d.reversed else "正位"
        keywords = "、".join(c.reversed if d.reversed else c.upright)
        interpretations.append(
            f"【暫代文字】{c.name_zh}{orientation}出現在「{POSITION_LABELS[d.position]}」，"
            f"關鍵字是{keywords}。"
        )
    return ReadingText(
        interpretations=interpretations,
        overall=f"【暫代文字】這是針對「{question}」的示範整體分析，尚未呼叫 LLM。",
        advice="【暫代文字】設定 ANTHROPIC_API_KEY 後會改由 Claude 產生建議。",
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
