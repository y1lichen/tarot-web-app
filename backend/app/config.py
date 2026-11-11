"""從環境變數（與 backend/.env）讀取設定。"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5").strip()
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))

# 沒有 API key 時一律使用假解讀，讓前端在沒有 key 的情況下也能串接。
USE_MOCK_LLM = _bool("USE_MOCK_LLM", default=False) or ANTHROPIC_API_KEY == ""

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

CARDS_PATH = Path(os.getenv("CARDS_PATH", str(BASE_DIR / "data" / "cards.json")))

QUESTION_MAX_LENGTH = 200
