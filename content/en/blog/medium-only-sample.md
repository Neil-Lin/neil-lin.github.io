---
title: A Sample English-only Post
description: This English article has no Chinese counterpart, demonstrating single-language handling.
date: 2026-05-20
tags:
  - sample
  - frontend
draft: false
---

This is a sample article (replace with your own content).

## Single-language behaviour

This post exists only in English. There is no `translationKey`, so:

- it emits a self canonical and **no hreflang alternate**
- switching language sends the reader to the Chinese blog index (Option A)

```ts
const greeting = "hello world";
```
