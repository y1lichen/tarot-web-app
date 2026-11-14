# AURUM · 金夜塔羅前端

React + Vite，透過 Docker 建置並由 Nginx 提供網頁。

## Docker 啟動

在專案根目錄執行：

```bash
docker compose up --build -d
```

開啟 http://localhost:8080。Nginx 會將 `/api/*` 代理至後端。停止服務使用 `docker compose down`。

後端未設定 `ANTHROPIC_API_KEY` 時仍可使用，頁面會標示為後端示範解讀；若要使用 AI，請只在 `backend/.env` 設定金鑰。

下載來源、連接埠與建置疑難排解請見[專案說明](../README.md)。

## API 與設定

- `GET /cards`：載入後端 78 張牌，每次隨機取出 22 張供扇形牌陣選取，三張牌不重複。目前延續正位抽牌。
- `POST /readings`：送出提問、三張實際牌卡 ID、`past/present/future` 位置與正逆位；顯示逐牌解讀、整體分析與反思建議。
- 提問最多 200 字。不填問題時會明確送出一般性指引請求，無法針對未提供的問題解讀。
- API 失敗時可重試；重試保留原本的問題和牌陣。重新開始會中止未完成的請求。

Docker 映像將 API 路徑設為 `/api`，由 Nginx 代理至 Compose 內的後端。根目錄 `.env` 可設定 `PORT` 與 `NPM_REGISTRY`，後端設定則放在 `backend/.env`。前端的 `.env` 不會打包進 Docker 映像。

後端尚無登入與歷史紀錄 API，因此登入仍為本機示範帳號。新紀錄在解讀成功後保存牌卡與完整後端回應至 localStorage，重讀不會重新呼叫 AI；保留舊版示範紀錄相容性。

## 程式結構

- `src/api/tarot.js`：API 呼叫、錯誤與逾時處理、資料格式轉換。
- `src/hooks/useTarot.js`：牌卡載入與占卜步驟、洗牌、選牌、翻牌。
- `src/hooks/useReading.js`：解讀請求、取消及重試。
- `src/hooks/useAccount.js`：本機示範帳號與紀錄儲存。
- `src/components/`：各個畫面與共用元件。
- `src/data/tarot.js`：問題分類與文案；舊版牌卡資料僅供歷史紀錄相容使用。
- `src/styles/`：依畫面拆分的黑金樣式。

```bash
npm test        # React 與 API 流程測試
npm run build   # 產生 dist/
```
