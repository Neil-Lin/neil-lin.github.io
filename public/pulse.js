/**
 * Accesserty Pulse Monitor SDK v1.2 (DeepLink Edition)
 * 專注於偵測無障礙操作挫折與流失行為
 */
(function () {
  "use strict";

  // ==========================================
  // 1. 設定區 (請修改這裡)
  // ==========================================

  // ⚠️ 請填入你的 Google Apps Script 部署網址 (網頁應用程式 URL)
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbx-ROlbI5iUulqvxJUZASNZ852R4EZPum6ocSNzhrci5mj-8OFDjfEleILq5LX8CG1IFA/exec";

  // 偵測閾值設定
  const CONFIG = {
    rageClickThreshold: 5, // 1秒內點擊幾次算憤怒
    rageTimeWindow: 1000, // 憤怒時間窗口 (ms)
    uTurnTimeWindow: 2000, // 焦點迷路判定時間 (ms)
    throttleTime: 5000, // 防止重複發送同一錯誤的冷卻時間 (ms)
  };

  // ==========================================
  // 2. 初始化與狀態管理
  // ==========================================

  // 取得客戶 ID (從 script tag 讀取)
  // 優先嘗試 document.currentScript (標準)，如果失敗則 querySelector
  const currentScript =
    document.currentScript || document.querySelector('script[src*="pulse.js"]');
  const CLIENT_ID = currentScript
    ? currentScript.getAttribute("data-client-id")
    : "unknown_client";

  // 產生或讀取 Session ID (用來追蹤單次訪問)
  let sessionId = sessionStorage.getItem("pulse_sid");
  if (!sessionId) {
    sessionId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem("pulse_sid", sessionId);
  }

  // 狀態暫存
  let state = {
    rage: { count: 0, target: null, timer: null },
    focus: { history: [], lastTime: 0 },
    lastSentError: {}, // 用來防止短時間重複發送一樣的 log
  };

  // 效能優化：確保不阻塞主執行緒
  const runOnIdle =
    window.requestIdleCallback ||
    function (cb) {
      setTimeout(cb, 1);
    };

  // ==========================================
  // 3. 核心偵測邏輯
  // ==========================================

  /**
   * 偵測 1: 憤怒連擊 (Rage Interaction)
   */
  document.addEventListener(
    "click",
    (e) => {
      // 排除輸入框
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (e.target === state.rage.target) {
        state.rage.count++;
      } else {
        state.rage.count = 1;
        state.rage.target = e.target;
      }

      clearTimeout(state.rage.timer);

      state.rage.timer = setTimeout(() => {
        if (state.rage.count >= CONFIG.rageClickThreshold) {
          reportEvent("RAGE_INTERACTION", e.target, {
            count: state.rage.count,
          });
        }
        state.rage.count = 0;
        state.rage.target = null;
      }, CONFIG.rageTimeWindow);
    },
    { passive: true }
  );

  /**
   * 偵測 2: 幽靈操作 / 無效互動 (Dead Interaction)
   */
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;

      const target = document.activeElement;
      if (!target || target === document.body) return;

      const interactiveTags = [
        "A",
        "BUTTON",
        "INPUT",
        "SELECT",
        "TEXTAREA",
        "SUMMARY",
        "DETAILS",
      ];
      const isInteractiveTag = interactiveTags.includes(target.tagName);
      const hasRole = target.hasAttribute("role");

      // 如果不是互動標籤，也沒有 role，卻被 focus 並按下按鍵 -> 判定為幽靈操作
      if (!isInteractiveTag && !hasRole) {
        runOnIdle(() => {
          reportEvent("DEAD_INTERACTION", target, { key: e.key });
        });
      }
    },
    { passive: true }
  );

  /**
   * 偵測 3: 焦點迷路 / 迴圈 (Focus U-Turn)
   */
  document.addEventListener(
    "focusin",
    (e) => {
      const now = Date.now();
      const target = e.target;

      state.focus.history.push({ el: target, time: now });
      if (state.focus.history.length > 3) state.focus.history.shift();

      const history = state.focus.history;

      if (history.length === 3) {
        const [step1, step2, step3] = history;
        // A -> B -> A 且時間很短
        if (step1.el === step3.el && step1.el !== step2.el) {
          const duration = step3.time - step1.time;
          if (duration < CONFIG.uTurnTimeWindow) {
            reportEvent("FOCUS_U_TURN", step2.el, { duration: duration });
            state.focus.history = [];
          }
        }
      }
    },
    { passive: true }
  );

  // ==========================================
  // 4. 資料傳送與輔助函式
  // ==========================================

  /**
   * 打包並發送數據
   */
  function reportEvent(type, element, metadata = {}) {
    const selector = getUniqueSelector(element);
    const pageUrl = window.location.href;

    // 防止洗頻
    const errorKey = `${type}|${selector}|${window.location.pathname}`;
    const lastTime = state.lastSentError[errorKey] || 0;
    if (Date.now() - lastTime < CONFIG.throttleTime) return;

    state.lastSentError[errorKey] = Date.now();

    // 產生 Deep Link (如果 selector 是以 # 開頭)
    let deepLink = "";
    if (selector.startsWith("#")) {
      // 移除可能存在的子層級，只取 ID 部分 (e.g. "#my-id > div" -> "#my-id")
      const simpleId = selector.split(" > ")[0];
      // 組合目前的 URL (去除原本的 hash) + ID
      deepLink = pageUrl.split("#")[0] + simpleId;
    }

    const payload = {
      clientId: CLIENT_ID,
      sessionId: sessionId,
      type: type,
      selector: selector,
      url: pageUrl,
      deepLink: deepLink,
      note: metadata.count
        ? `連點 ${metadata.count} 次`
        : metadata.key
          ? `按了 ${metadata.key} 鍵`
          : metadata.duration
            ? `迷路耗時 ${metadata.duration}ms`
            : "",
    };

    // 發送給 Google Apps Script
    fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    }).catch((err) => {
      // 靜默失敗
    });
  }

  /**
   * 產生完整的 CSS Selector 路徑
   * 例如: #main-content > div:nth-of-type(2) > button
   */
  function getUniqueSelector(el) {
    if (!el) return "unknown";

    // 1. 如果有 ID，直接回傳
    if (el.id) return "#" + el.id;

    let path = [];

    // 往上找，直到 body 或是找到有 ID 的父層為止
    while (el && el.tagName !== "HTML") {
      let selector = el.tagName.toLowerCase();

      // 如果父層有 ID，就用父層 ID 當起點，停止往上找
      if (el.id) {
        selector = "#" + el.id;
        path.unshift(selector);
        break;
      } else {
        // 如果有兄弟姊妹，就要標示我是「第幾個」(nth-of-type)
        let sibling = el;
        let nth = 1;
        // 計算前面有幾個跟自己一樣 tag 的兄弟
        while ((sibling = sibling.previousElementSibling)) {
          if (sibling.tagName.toLowerCase() == selector) nth++;
        }
        if (nth > 1) selector += ":nth-of-type(" + nth + ")";
      }

      path.unshift(selector);
      el = el.parentElement;
    }

    return path.join(" > ");
  }
})();
