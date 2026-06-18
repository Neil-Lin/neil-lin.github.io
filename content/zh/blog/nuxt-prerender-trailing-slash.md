---
title: 在 Netlify + Nuxt prerender 上處理尾斜線的坑
description: 為什麼在預渲染的靜態站上加尾斜線 301 會造成無限轉址迴圈，以及正確的解法。
date: 2026-06-01
tags:
  - nuxt
  - seo
  - netlify
draft: false
---

這是一篇示範文章（請替換成你自己的內容）。

## 問題

在 Netlify 上部署 Nuxt 預渲染站時，`/foo` 與 `/foo/` 由同一個實體 `index.html` 服務。

## 正確解法

重複網址交給 `rel="canonical"` 處理，**不要**在 `_redirects` 加尾斜線轉址。

```bash
# 不要這樣做
/*/  /:splat  301!
```

就這樣。
