# Tarot Anytime 後端

Python、FastAPI。提供牌義查詢與 AI 解讀 API，解讀由 Claude API 產生；沒有設定 API key 時回傳標示為暫代的解讀文字，前端可以先串接。

## 啟動

需要 Python 3.10 以上。在 `backend/` 資料夾執行：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env          # 要呼叫 Claude API 時，在 .env 填入 ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

啟動後：

- API 文件與試打介面：http://localhost:8000/docs
- 健康檢查：http://localhost:8000/health，`llm` 欄位顯示 `mock` 表示目前使用暫代解讀

port 8000 被佔用時改用 `uvicorn app.main:app --reload --port 8001`。

## 測試

```bash
python -m pytest -v
```

測試一律使用暫代解讀，不呼叫 Claude API。

## API

| 方法與路徑 | 用途 | 輸入 | 輸出 | 錯誤 |
| --- | --- | --- | --- | --- |
| `GET /health` | 確認服務運作 | 無 | 狀態、牌數、目前的 LLM 模式 | 無 |
| `GET /cards` | 取得 78 張牌的列表 | 無 | 每張牌的 id、名稱、大小阿爾克那、花色、數字、圖片 | 無 |
| `GET /cards/{card_id}` | 取得一張牌的完整牌義 | 路徑中的牌 id | 列表欄位加上正位、逆位牌義關鍵字 | 404：牌不存在 |
| `POST /readings` | 依問題與三張牌產生解讀 | `question`、`cards`（三張） | 每張牌的個別解讀、整體分析、建議、`mock` | 422、502、504 |

`POST /readings` 請求範例：

```json
{
  "question": "我應該如何面對目前的工作壓力？",
  "cards": [
    {"card_id": "major-00", "position": "past", "reversed": false},
    {"card_id": "cups-02", "position": "present", "reversed": true},
    {"card_id": "swords-10", "position": "future", "reversed": false}
  ]
}
```

回應範例（省略部分欄位）：

```json
{
  "question": "我應該如何面對目前的工作壓力？",
  "cards": [
    {
      "card": {"id": "major-00", "name_zh": "愚者", "name_en": "The Fool", "arcana": "major", "suit": null, "number": 0, "image": null},
      "position": "past",
      "position_label": "過去",
      "reversed": false,
      "interpretation": "……"
    }
  ],
  "overall": "……",
  "advice": "……",
  "mock": false
}
```

輸入規則與錯誤：

| 情況 | 狀態碼 |
| --- | --- |
| 問題空白，或超過 200 字 | 422 |
| 牌不是三張、牌重複、牌陣位置重複 | 422 |
| `position` 不是 `past`、`present`、`future`，或 `reversed` 不是布林值 | 422 |
| 牌 id 不存在 | 422 |
| 請求內容不是合法的 JSON | 422 |
| Claude API 回傳錯誤或格式不符 | 502 |
| Claude API 逾時（預設 30 秒） | 504 |

422 的回應是 FastAPI 的驗證錯誤格式，`detail` 為錯誤清單；牌 id 不存在、502、504 的 `detail` 是一段文字。

## 牌 id 規則

| 牌組 | id | 範例 |
| --- | --- | --- |
| 大阿爾克那 0～21 | `major-00`～`major-21` | `major-00` 愚者 |
| 權杖、聖杯、寶劍、錢幣 | `wands-01`～`wands-14`，其餘同理 | `cups-02` 聖杯二 |

小阿爾克那的數字：1 王牌、2～10、11 侍者、12 騎士、13 皇后、14 國王。

## 設定（.env）

| 變數 | 說明 | 預設 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Claude API key；空白時使用暫代解讀 | 空白 |
| `ANTHROPIC_MODEL` | 使用的模型 | `claude-sonnet-5-5` |
| `LLM_TIMEOUT_SECONDS` | Claude API 逾時秒數 | `30` |
| `USE_MOCK_LLM` | `true` 時不呼叫 Claude API | `false` |
| `CORS_ORIGINS` | 允許呼叫的前端網址，逗號分隔 | `http://localhost:5173` |

API key 只放在 `.env` 與部署平台的環境變數，`.env` 已列在 `.gitignore`。

## 目錄結構

```
backend/
├── app/
│   ├── main.py          FastAPI 進入點、CORS、/health
│   ├── config.py        讀取 .env 設定
│   ├── schemas.py       請求與回應的資料模型、牌陣位置
│   ├── cards.py         載入 data/cards.json
│   ├── llm.py           提示詞、呼叫 Claude API、暫代解讀
│   └── routers/
│       ├── cards.py     GET /cards、GET /cards/{card_id}
│       └── readings.py  POST /readings
├── data/cards.json      78 張牌的牌義資料
├── tests/test_api.py    測試案例
├── requirements.txt
├── requirements-dev.txt 加上測試用套件
└── .env.example
```

## 資料與暫定事項

- `data/cards.json` 是樣本資料：78 張牌的名稱與編號完整，牌義只有正位、逆位各三個關鍵字，`image` 為 `null`。正式資料由黃煒哲整理後替換，欄位名稱需維持一致，或同步修改 `app/schemas.py` 的 `Card`。
- 牌陣位置目前為過去、現在、未來趨勢（`past`、`present`、`future`），定案後修改 `app/schemas.py` 的 `Position` 與 `POSITION_LABELS`。
- 抽牌由前端負責；後端檢查牌是否存在、是否重複、位置是否重複。
- 使用者的問題會送到 Anthropic 的 Claude API。
