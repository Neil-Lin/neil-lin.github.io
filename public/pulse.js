/**
 * Accesserty Pulse Monitor SDK v2.0 (5-in-1 Edition)
 * 專注於偵測無障礙操作挫折與流失行為
 * 包含：憤怒連擊、幽靈操作、焦點迷路、逃脫失敗、版面溢出
 */
(function () {
  "use strict";

  // ==========================================
  // 1. 設定區 (請務必修改這裡)
  // ==========================================

  // ⚠️ 請填入你的 Google Apps Script 部署網址 (網頁應用程式 URL)
  // 記得：Apps Script 部署權限要設為 "Anyone (所有人)"
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyEoOvocw7plN1corA7HO1xdBuOhn9NnqN99OrjJvDvccPkXt9ilCnF--kFdGDxCU4Zeg/exec";

  // 偵測參數設定
  const CONFIG = {
    rageClickThreshold: 5, // 1秒內點擊幾次算憤怒
    rageTimeWindow: 1000, // 憤怒時間窗口 (ms)
    uTurnTimeWindow: 2000, // 焦點迷路判定時間 (ms)
    escapeThreshold: 3, // 2秒內按幾次 Esc 算逃脫失敗
    escapeTimeWindow: 2000, // 逃脫失敗時間窗口 (ms)
    throttleTime: 5000, // 防止重複發送同一錯誤的冷卻時間 (ms)
  };

  // ==========================================
  // 2. 初始化與狀態管理
  // ==========================================

  // 取得客戶 ID
  const currentScript =
    document.currentScript || document.querySelector('script[src*="pulse.js"]');
  const CLIENT_ID = currentScript
    ? currentScript.getAttribute("data-client-id")
    : "unknown_client";

  // 產生或讀取 Session ID
  let sessionId = sessionStorage.getItem("pulse_sid");
  if (!sessionId) {
    sessionId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem("pulse_sid", sessionId);
  }

  // 狀態暫存器
  let state = {
    rage: { count: 0, target: null, timer: null },
    escape: { count: 0, timer: null },
    focus: { history: [], lastTime: 0 },
    lastSentError: {},
    hasReportedOverflow: false, // 避免捲動時一直發送
  };

  // 效能優化：不阻塞主執行緒
  const runOnIdle =
    window.requestIdleCallback ||
    function (cb) {
      setTimeout(cb, 1);
    };

  // ==========================================
  // 3. 五大核心偵測邏輯
  // ==========================================

  /**
   * 1. 憤怒連擊 (Rage Interaction)
   * 情境：使用者覺得按鈕壞了，狂點滑鼠。
   */
  document.addEventListener(
    "click",
    (e) => {
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
   * 2. 幽靈操作 (Dead Interaction) & 4. 逃脫失敗 (Escape Failure)
   * 這裡合併監聽 keydown 以節省資源
   */
  document.addEventListener(
    "keydown",
    (e) => {
      // --- 偵測 2: 幽靈操作 (Enter/Space on div) ---
      if ((e.key === "Enter" || e.key === " ") && document.activeElement) {
        const target = document.activeElement;
        if (target === document.body) return;

        const interactiveTags = [
          "A",
          "BUTTON",
          "INPUT",
          "SELECT",
          "TEXTAREA",
          "SUMMARY",
          "DETAILS",
        ];
        const hasRole =
          target.hasAttribute("role") || target.getAttribute("tabindex");

        if (!interactiveTags.includes(target.tagName) && !hasRole) {
          runOnIdle(() => {
            reportEvent("DEAD_INTERACTION", target, { key: e.key });
          });
        }
      }

      // --- 偵測 4: 逃脫失敗 (Repeated Escape) ---
      // 情境：彈窗關不掉，使用者狂按 Esc
      if (e.key === "Escape") {
        state.escape.count++;
        clearTimeout(state.escape.timer);

        state.escape.timer = setTimeout(() => {
          if (state.escape.count >= CONFIG.escapeThreshold) {
            // 回報當前 focus 的元素或是 body (代表全域被困住)
            const trapElement = document.activeElement || document.body;
            reportEvent("ESCAPE_FAILURE", trapElement, {
              count: state.escape.count,
            });
          }
          state.escape.count = 0;
        }, CONFIG.escapeTimeWindow);
      }
    },
    { passive: true }
  );

  /**
   * 3. 焦點迷路 (Focus U-Turn)
   * 情境：使用者找不到路，快速在兩個元件間來回 Tab
   */
  document.addEventListener(
    "focusin",
    (e) => {
      const now = Date.now();
      state.focus.history.push({ el: e.target, time: now });
      if (state.focus.history.length > 3) state.focus.history.shift();

      const history = state.focus.history;
      if (history.length === 3) {
        const [step1, step2, step3] = history;
        // 邏輯：A -> B -> A
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

  /**
   * 5. 版面溢出 (Layout Overflow / Horizontal Scroll)
   * 情境：手機版網頁破圖，需要左右滑動才能看，違反 WCAG Reflow
   */
  let scrollTimer = null;
  window.addEventListener(
    "scroll",
    () => {
      // 只有在手機版 (寬度 < 768px) 且尚未回報過時才偵測
      if (window.innerWidth >= 768 || state.hasReportedOverflow) return;

      // 節流 (Throttle) 避免 scroll 事件觸發太頻繁
      if (scrollTimer) return;

      scrollTimer = setTimeout(() => {
        const scrollLeft =
          document.documentElement.scrollLeft || document.body.scrollLeft;

        // 如果發現有橫向捲動 (scrollLeft > 0)
        if (scrollLeft > 0) {
          // 為了避免誤判 (有些 slide menu 是故意的)，我們檢查是否持續了一小段距離
          if (scrollLeft > 10) {
            reportEvent("LAYOUT_OVERFLOW", document.body, {
              scrollLeft: Math.round(scrollLeft),
            });
            state.hasReportedOverflow = true; // 此 Session 只回報一次，避免洗頻
          }
        }
        scrollTimer = null;
      }, 500); // 每 0.5 秒檢查一次
    },
    { passive: true }
  );

  // ==========================================
  // 4. 資料傳送與輔助函式
  // ==========================================

  function reportEvent(type, element, metadata = {}) {
    const selector = getUniqueSelector(element);
    const pageUrl = window.location.origin + window.location.pathname;

    // 防止重複發送 (Key: 類型+路徑+頁面)
    const errorKey = `${type}|${selector}|${window.location.pathname}`;
    const lastTime = state.lastSentError[errorKey] || 0;
    if (Date.now() - lastTime < CONFIG.throttleTime) return;
    state.lastSentError[errorKey] = Date.now();

    // 產生 Deep Link (如果有 ID)
    let deepLink = "";
    if (selector.startsWith("#")) {
      const simpleId = selector.split(" > ")[0];
      deepLink = pageUrl.split("#")[0] + simpleId;
    }

    const payload = {
      clientId: CLIENT_ID,
      sessionId: sessionId,
      type: type,
      selector: selector,
      url: pageUrl,
      deepLink: deepLink,
      note: formatNote(type, metadata),
    };

    // 發送
    fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    }).catch((err) => {});
  }

  function formatNote(type, meta) {
    switch (type) {
      case "RAGE_INTERACTION":
        return `連點 ${meta.count} 次`;
      case "DEAD_INTERACTION":
        return `按鍵: ${meta.key}`;
      case "FOCUS_U_TURN":
        return `迷路耗時: ${meta.duration}ms`;
      case "ESCAPE_FAILURE":
        return `狂按 Esc ${meta.count} 次`;
      case "LAYOUT_OVERFLOW":
        return `手機版橫向溢出 (Scroll: ${meta.scrollLeft}px)`;
      default:
        return "";
    }
  }

  // 產生絕對路徑 Selector
  function getUniqueSelector(el) {
    if (!el) return "unknown";
    if (el === document.body) return "body";
    if (el.id) return "#" + el.id;

    let path = [];
    while (el && el.tagName !== "HTML") {
      let selector = el.tagName.toLowerCase();
      if (el.id) {
        selector = "#" + el.id;
        path.unshift(selector);
        break;
      } else {
        let sibling = el;
        let nth = 1;
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
