# AURUM · 金夜塔羅

React 前端與 FastAPI 後端。

## Docker 啟動

需要 Docker Engine 與 Docker Compose 2.24 以上，或包含 Compose 的 Docker Desktop。

在專案根目錄執行：

```bash
docker compose up --build -d
```

首次建置需要下載基底映像與依賴。平常沒有修改程式碼時，可使用 `docker compose up -d`，不必每次要求建置。

開啟 http://localhost:8080 即可使用；API 文件：http://localhost:8080/api/docs；健康檢查：http://localhost:8080/api/health。

前端以多階段建置產生靜態檔，再由 Nginx 提供網頁並將 `/api/*` 代理至後端。後端只在 Compose 內部網路開放，不占用主機的 8000 埠。映像不包含 `.env`、本機虛擬環境或 `node_modules`。

未提供金鑰時，後端自動使用示範解讀。要啟用 AI，先複製 `backend/.env.example` 為 `backend/.env`，填入 `ANTHROPIC_API_KEY`，再啟動。此檔案會在容器執行時注入環境變數，不會打包進映像。

```bash
# 查看狀態與日誌
docker compose ps
docker compose logs -f

# 停止並移除服務容器
docker compose down

# 改用其他主機連接埠
PORT=8081 docker compose up --build -d
```

程式碼變更後再次執行 `docker compose up --build -d`；修改 `backend/.env` 後執行 `docker compose up -d --force-recreate backend`。登入及歷史紀錄目前仍儲存在瀏覽器 localStorage，不是容器或後端資料庫。

### 建置卡在 npm ci

先用逐步日誌確認停滯的位置：

```bash
docker compose --progress plain build
```

若卡在 `RUN npm ci` 且 npm registry 連線逾時，可複製根目錄 `.env.example` 為 `.env`，將 `NPM_REGISTRY` 改成 `https://registry.yarnpkg.com`，再執行原本的建置指令。根目錄 `.env` 是 Compose 設定，`backend/.env` 則是後端金鑰與服務設定。

前端建置會保留 npm 下載快取、顯示下載日誌，並限制每次下載的逾時與重試次數；`npm ci` 仍依照 lockfile 與完整性雜湊驗證套件。若有其他可用的 registry，也可透過 `NPM_REGISTRY` 指定。

詳細說明：[前端](frontend/README.md)、[後端](backend/README.md)。
