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
- `data/` — 內容資料（純 TS、具型別、一律 named export）
  - `data/products/` — 一檔一作品，由 `data/productsData.ts` 聚合
  - `data/career.ts` — 年資起算年份（文案中的年資自動計算，不會過期）
- `scripts/checkData.ts` — 內容資料驗證（slug 重複、媒體路徑存在性），由
  `nuxt.config.ts` 載入時自動執行，資料有誤時 build 直接失敗
- `i18n/` — 雙語字典（`zh-Hant-TW` 預設、`en`）
- `content/` — 自建部落格文章（Nuxt Content），見下方「部落格」
- `server/api/__sitemap__/` — 自訂 sitemap 來源（產品 + 文章，lastmod 取自真實更新時間）
- `server/routes/` — RSS feed（`/rss.xml`、`/en/rss.xml`）
- `netlify/edge-functions/` — `Accept: text/markdown` 內容協商（給 LLM 爬蟲）
- `public/f0c3fd55914c4ba9b6021d25692e138a.txt` — IndexNow 金鑰檔，**勿刪**

## 部落格（Nuxt Content）

文章自建於本站（不再連外部平台）。採「模型 B」：中英文各自獨立，不必互為翻譯。

- **新增文章**：在 `content/zh/blog/` 或 `content/en/blog/` 放 `.md`，檔名即 slug。
- **Frontmatter**：`title`、`description`、`date`（必填）；`updatedAt`、`tags`、`ogImage`、`translationKey`、`draft`（選填）。schema 由 `content.config.ts` 用 zod 驗證。
- **中英對照版**：只有當兩篇互為翻譯時，才在兩邊填**相同的 `translationKey`**——這會啟用 hreflang 互指與語言切換鈕的精確對應。
- **單語言文章**：不填 `translationKey` 即可。會輸出 self-canonical、**不發 hreflang**；切換語言時導向另一語言的 blog 首頁（Option A，邏輯在 `composables/useLocaleSwitchTarget.ts`）。
- **draft**：`draft: true` 開發看得到、build 時排除（不預渲染、不進 sitemap）。
- 文章路由、SEO、`BlogPosting` schema、OG 圖、相關文章、Shiki 程式碼highlight 皆自動處理。
- 需要原生模組 `better-sqlite3`（Content 建置期用）。

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
