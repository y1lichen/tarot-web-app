# AURUM · 金夜塔羅前端

使用 React 與 Vite。需 Node.js 22.12 以上。

```bash
cd frontend
npm install
npm run dev
```

開啟終端顯示的網址（預設 http://localhost:5173）。

```bash
npm test        # 執行 React 流程整合測試
npm run build   # 產生 dist/
npm run preview # 預覽正式建置
```

## 程式結構

- `src/App.jsx`：組合畫面、對話框與占卜紀錄儲存。
- `src/components/`：導覽、標題、提問、洗牌牌堆、選牌與翻牌、解讀、登入和歷史紀錄。
- `src/hooks/useTarot.js`：占卜步驟、洗牌進度、抽牌與翻牌狀態。
- `src/hooks/useAccount.js`：示範帳號、localStorage 紀錄與舊版紀錄格式相容處理。
- `src/hooks/useViewport.js`：視窗尺寸與響應式牌陣。
- `src/data/tarot.js`：22 張大阿爾克那、問題類型與範例文案。
- `src/styles/`：原有黑金視覺與 React 互動樣式。
- `assets/card-back.png`：牌背圖片，由 Vite 管理輸出路徑。

目前維持原型的本機資料流程：登入使用示範帳號，紀錄保存在當前瀏覽器；解讀為示意內容，尚未串接後端或 Google OAuth。不會自動建立假的歷史紀錄。長按牌堆或按住空白鍵／Enter 至少兩秒即可完成洗牌；選三張牌後可逐張翻開。
