# Neil's Portfolio

Neil Lin 的個人作品集（[neillin.com](https://neillin.com)）。
Nuxt 4 + Vue 3 + TypeScript，SSR + Prerender，部署於 Netlify。
雙語（繁體中文 / 英文 `/en`），以無障礙（a11y）與 SEO 為核心。

## 開發

```bash
npm install
npm run dev        # 開發伺服器 http://localhost:3000
npm run lint       # ESLint 檢查
npm run lint:fix   # ESLint 自動修復
npm run format     # Prettier 格式化
```

環境變數請參考 `.env.example` 複製為 `.env`。

## 建置與部署

```bash
npm run generate   # 預渲染靜態輸出至 .output/public
npm run preview    # 本地預覽建置結果
```

推送到 `master` 後由 Netlify 自動建置部署。

## 專案結構

- `app/` — Nuxt 4 srcDir（pages、components、composables、layouts、assets）
- `data/` — 內容資料（products / projects / vocus 文章 fallback，純 TS、具型別、一律 named export）
- `i18n/` — 雙語字典（`zh-Hant-TW` 預設、`en`）
- `server/api/` — Medium / 方格子 文章 API（含 1 小時快取）與自訂 sitemap 來源
- `netlify/edge-functions/` — `Accept: text/markdown` 內容協商（給 LLM 爬蟲）
- `public/f0c3fd55914c4ba9b6021d25692e138a.txt` — IndexNow 金鑰檔，**勿刪**

## ⚠️ 重要警告：絕對不要加尾斜線轉址

**不要**在 `public/_redirects` 加入任何尾斜線正規化規則（如 `/:path/ → /:path` 或 `/*/ → /:splat`）。

在「Netlify + Nuxt prerender」架構下，`/foo` 與 `/foo/` 由同一個實體 `index.html` 服務，
尾斜線 301 會與 Netlify 的目錄索引解析互相打架，造成**無限轉址迴圈**（已踩雷三次：
commits `eb0711a8`、`7be0c8b8`、`cbde1894` 等）。

重複網址問題已由 `rel=canonical` 正確處理（`/foo/` 的 canonical 指向 `/foo`），
這是 Google 官方建議的做法。`netlify.toml` 的 `pretty_urls = false` 也必須保留。

## 技術備註

- `package.json` 的 `overrides: { "vue-router": "5.0.7" }` 為相依性釘版，
  升級 Nuxt 時請測試後再評估是否移除。
- robots.txt 含 `Content-Signal: ai-train=no, search=yes, ai-input=yes`
  （允許搜尋與 AI 輸入，拒絕模型訓練），由 `server/plugins/robots-content-signal.ts` 注入。
