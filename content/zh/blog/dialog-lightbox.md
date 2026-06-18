---
title: 用 dialog 做作品集燈箱並保留捲動位置
description: 以原生 dialog 元素打造可被搜尋引擎索引、又能保留列表捲動位置的燈箱。
date: 2026-04-15
updatedAt: 2026-05-10
tags:
  - vue
  - nuxt
  - accessibility
translationKey: dialog-lightbox
draft: false
---

這是一篇示範文章（中英對照版，請替換成你自己的內容）。

## 概念

用原生 `<dialog>` 的 `showModal()` 開燈箱，URL 改變但不刷新頁面，並記住 `window.scrollY`。

```ts
const onOpen = () => {
  savedScrollY.value = window.scrollY;
  modalOpen.value = true;
};
```

關閉時還原捲動位置即可。
