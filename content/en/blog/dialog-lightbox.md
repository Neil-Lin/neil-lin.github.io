---
title: An Indexable Portfolio Lightbox with the dialog Element
description: Building a lightbox with the native dialog element that stays indexable and preserves list scroll position.
date: 2026-04-15
updatedAt: 2026-05-10
tags:
  - vue
  - nuxt
  - accessibility
translationKey: dialog-lightbox
draft: false
---

This is a sample article (the English counterpart of a translation pair — replace with your own content).

## Concept

Open the lightbox with the native `<dialog>` element's `showModal()`, change the URL without a full navigation, and remember `window.scrollY`.

```ts
const onOpen = () => {
  savedScrollY.value = window.scrollY;
  modalOpen.value = true;
};
```

Restore the scroll position on close.
