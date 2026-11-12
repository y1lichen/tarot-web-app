# Tarot Anytime 後端

Python、FastAPI。提供牌義查詢與 AI 解讀 API，解讀由 Claude API 產生；沒有設定 API key 時回傳標示為暫代的解讀文字，前端可以先串接。

## 啟動

需要 Python 3.10 以上，先在終端機確認版本：macOS 執行 `python3 --version`，Windows 執行 `py --version`。

以下指令都在 `backend/` 資料夾內執行（解壓縮後先 `cd` 進 `backend`）。

macOS：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Windows（PowerShell）：

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
copy .env.example .env
uvicorn app.main:app --reload
```

- 啟用 venv 後，提示字元前面會出現 `(.venv)`。之後每次開新的終端機，都要先 `cd` 到 `backend/` 再執行啟用那一行（macOS 是 `source .venv/bin/activate`），才能執行 `uvicorn`。
- `pip install` 只需要第一次執行；`requirements.txt` 有更新時再執行一次。
- `.env` 不需要填任何東西也能啟動：沒有 `ANTHROPIC_API_KEY` 時，解讀會回傳標示「【暫代文字】」的內容，回應中 `mock` 為 `true`。

啟動成功時終端機會出現 `Application startup complete.`，接著確認：

- 健康檢查：http://localhost:8000/health，應回傳 `{"status":"ok","cards":78,"llm":"mock"}`
- API 文件與試打介面：http://localhost:8000/docs，在 `POST /readings` 按「Try it out」再按「Execute」，應回傳 200

伺服器會佔用該終端機，要做其他事時另開一個終端機；停止伺服器按 `Ctrl + C`。

## 測試

另開一個終端機，進入 `backend/` 並啟用 venv 後執行：

```bash
python -m pytest -v
```

測試一律使用暫代解讀，不呼叫 Claude API，伺服器不需要啟動。

## API

| 方法與路徑 | 用途 | 輸入 | 輸出 | 錯誤 |
| --- | --- | --- | --- | --- |
| `GET /health` | 確認服務運作 | 無 | 狀態、牌數、目前的 LLM 模式 | 無 |
| `GET /cards` | 取得 78 張牌的列表 | 無 | 每張牌的 id、中英文名稱、大小阿爾克那、花色、數字、rank、圖片 | 無 |
| `GET /cards/{card_id}` | 取得一張牌的完整牌義 | 路徑中的牌 id | 列表欄位加上牌面象徵、元素、占星對應，以及正位、逆位各自的關鍵字、基本牌義、感情、工作、反思問題 | 404：牌不存在 |
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

## 前端串接

- 後端網址：本機開發為 `http://localhost:8000`。建議在前端用環境變數設定，例如 Vite 的 `.env` 寫 `VITE_API_BASE_URL=http://localhost:8000`，部署後改成 Render 的網址。
- CORS：後端預設只允許 `http://localhost:5173`（Vite 開發伺服器的預設網址）呼叫。前端跑在其他 port 時，瀏覽器 console 會出現 CORS 錯誤，請在後端 `.env` 的 `CORS_ORIGINS` 加上該網址（逗號分隔）並重啟後端。
- 抽牌由前端負責：從 `GET /cards` 取得 78 張牌的 id，隨機抽三張不重複的牌，決定各自的正逆位，再連同問題送到 `POST /readings`。
- 解讀需要數秒到十幾秒（呼叫 Claude API 時），等待期間前端要顯示載入狀態，並防止重複送出。
- `mock` 為 `true` 時代表解讀是暫代文字，畫面可以照常顯示。

TypeScript 呼叫範例：

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type Position = "past" | "present" | "future";

interface DrawnCard {
  card_id: string;
  position: Position;
  reversed: boolean;
}

export async function createReading(question: string, cards: DrawnCard[]) {
  const res = await fetch(`${API_BASE}/readings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, cards }),
  });
  const data = await res.json();
  if (!res.ok) {
    // 422 的 detail 是陣列（每個元素有 msg）；502、504 與牌不存在的 detail 是字串
    const message = Array.isArray(data.detail)
      ? data.detail.map((d: { msg: string }) => d.msg).join("；")
      : data.detail;
    throw new Error(message);
  }
  return data; // 欄位見上方「回應範例」
}
```

錯誤訊息的顯示建議：422 顯示 `msg` 內容（例如「問題不能是空白」）；502、504 顯示 `detail` 並讓使用者可以重新送出。

## 牌 id 規則

| 牌組 | id |
| --- | --- |
| 大阿爾克那 0～21 | `major-00`～`major-21`，例如 `major-00` 愚者 |
| 小阿爾克那數字牌 | `<花色>-ace`、`<花色>-02`～`<花色>-10`，例如 `cups-ace` 聖杯王牌、`cups-02` 聖杯二 |
| 小阿爾克那宮廷牌 | `<花色>-page`、`<花色>-knight`、`<花色>-queen`、`<花色>-king` |

花色為 `wands`（權杖）、`cups`（聖杯）、`swords`（寶劍）、`pentacles`（錢幣）。`number` 欄位：王牌 1、數字牌 2～10、侍者 11、騎士 12、皇后 13、國王 14。`rank` 欄位：`ace`、`pip`（2～10）、`court`（宮廷牌），大阿爾克那為 `null`。

`GET /cards/{card_id}` 回應範例（省略部分欄位）：

```json
{
  "id": "major-00",
  "name_zh": "愚者",
  "name_en": "The Fool",
  "arcana": "major",
  "suit": null,
  "number": 0,
  "rank": null,
  "image": null,
  "symbolism": "站在懸崖邊的年輕旅人……",
  "upright": {
    "keywords": ["新開始", "冒險", "自由", "天真", "信任直覺"],
    "meaning": "代表一段新旅程的開端……",
    "love": "……",
    "career": "……",
    "reflection": "如果不害怕失敗，你最想嘗試的是什麼？"
  },
  "reversed": { "keywords": ["魯莽", "猶豫不前", "缺乏計畫", "逃避責任"], "meaning": "……", "love": "……", "career": "……", "reflection": "……" }
}
```

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
│   ├── cards.py         載入牌義與牌陣資料，轉成 API 格式
│   ├── llm.py           提示詞、呼叫 Claude API、暫代解讀
│   └── routers/
│       ├── cards.py     GET /cards、GET /cards/{card_id}
│       └── readings.py  POST /readings
├── data/tarot_cards.json 78 張牌的牌義資料
├── data/spreads.json    牌陣與各位置的說明、給 LLM 的解讀提示
├── tests/test_api.py    測試案例
├── requirements.txt
├── requirements-dev.txt 加上測試用套件
└── .env.example
```

## 資料

- `data/tarot_cards.json` 與 `data/spreads.json` 由黃煒哲整理，牌義依偉特體系以白話改寫。資料檔是巢狀格式（例如 `name.zh`、`upright.meaning`），後端載入時轉成 API 的平面欄位（`name_zh`），修改資料檔時維持原本的欄位結構。
- 牌陣使用 `spreads.json` 的「時間之流」（`past-present-future`）：過去、現在、未來趨勢。`spreads.json` 中的「現況、阻礙、建議」目前未使用。
- 提示詞包含每個位置的說明與 `llm_hint`，以及該牌在對應正逆位的關鍵字、基本牌義、感情與工作面向、反思問題。
- 牌面圖尚未決定，`image` 一律回傳 `null`；資料檔中的圖片路徑目前不使用。
- 抽牌由前端負責；後端檢查牌是否存在、是否重複、位置是否重複。
- 使用者的問題會送到 Anthropic 的 Claude API。

## 常見問題

| 狀況 | 處理方式 |
| --- | --- |
| `command not found: uvicorn` 或 `uvicorn` 不是可辨識的命令 | venv 沒有啟用；先 `cd` 到 `backend/` 再執行啟用 venv 的指令 |
| Windows 啟用 venv 時出現「因為這個系統上已停用指令碼執行」 | 先執行 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`，再重新啟用 |
| `address already in use` 或 port 8000 被佔用 | 改用 `uvicorn app.main:app --reload --port 8001`，前端的後端網址也改成 8001 |
| `pip install` 在 `uvloop` 或 `httptools` 失敗 | 把 `requirements.txt` 的 `uvicorn[standard]>=0.30` 改成 `uvicorn>=0.30` 後重裝 |
| 前端 console 出現 CORS 錯誤 | 見「前端串接」的 CORS 說明 |
| `/readings` 回 422 | 看回應的 `msg`：問題空白或超過 200 字、牌不是三張、牌或位置重複、牌 id 不存在 |
