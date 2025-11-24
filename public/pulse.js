/**
 * Accesserty Pulse Monitor SDK v1.0
 * 專注於偵測無障礙操作挫折與流失行為
 */
(function () {
  "use strict";

  // ==========================================
  // 1. 設定區 (請修改這裡)
  // ==========================================

  // 請填入你的 Google Apps Script 部署網址 (網頁應用程式 URL)
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbw7Jm--67IUnwNWdY8BSLR8hvijZDbIGORcq4aNhejvuXyssTyeQiWUacArJtFUY9MObA/exec";

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
   * 定義：短時間內對同一元素進行多次無效點擊
   */
  document.addEventListener(
    "click",
    (e) => {
      // 排除輸入框 (避免把選取文字當成憤怒點擊)
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
        // 重置
        state.rage.count = 0;
        state.rage.target = null;
      }, CONFIG.rageTimeWindow);
    },
    { passive: true }
  );

  /**
   * 偵測 2: 幽靈操作 / 無效互動 (Dead Interaction)
   * 定義：鍵盤使用者對非互動元素 (div, span) 按下 Enter/Space，且沒有任何語意角色
   */
  document.addEventListener(
    "keydown",
    (e) => {
      // 只監聽 Enter (13) 和 Space (32)
      if (e.key !== "Enter" && e.key !== " ") return;

      const target = document.activeElement;
      if (!target || target === document.body) return;

      // 檢查是否為原生互動元素
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

      // 檢查是否有 ARIA Role
      const hasRole = target.hasAttribute("role"); // 簡單檢查，嚴格來說要檢查 role="button" 等

      // 如果不是互動標籤，也沒有 role，卻被 focus 並按下按鍵 -> 判定為幽靈操作
      // 這通常代表工程師用 div 做了按鈕但忘了加 accessibility
      if (!isInteractiveTag && !hasRole) {
        // 稍微延遲確認頁面是否發生變化 (避免誤判)
        runOnIdle(() => {
          reportEvent("DEAD_INTERACTION", target, { key: e.key });
        });
      }
    },
    { passive: true }
  );

  /**
   * 偵測 3: 焦點迷路 / 迴圈 (Focus U-Turn)
   * 定義：使用者 Focus A -> Focus B -> 立刻 Shift+Tab 回到 Focus A
   * 代表使用者對 B 感到困惑，或者 B 不是他要的，或者不小心按錯
   */
  document.addEventListener(
    "focusin",
    (e) => {
      const now = Date.now();
      const target = e.target;

      // 更新歷史紀錄 (只留最近 3 筆)
      state.focus.history.push({ el: target, time: now });
      if (state.focus.history.length > 3) state.focus.history.shift();

      const history = state.focus.history;

      // 至少要有 3 步才能判斷迴圈 (A -> B -> A)
      if (history.length === 3) {
        const [step1, step2, step3] = history;

        // 判斷邏輯：
        // 1. 第三步回到第一步的元素 (A -> B -> A)
        // 2. 整個過程非常快 (代表不是閱讀後返回，而是迷路)
        if (step1.el === step3.el && step1.el !== step2.el) {
          const duration = step3.time - step1.time;
          if (duration < CONFIG.uTurnTimeWindow) {
            reportEvent("FOCUS_U_TURN", step2.el, { duration: duration }); // 回報中間那個讓人困惑的 B 元素
            state.focus.history = []; // 清空避免重複觸發
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
   * @param {string} type - 錯誤類型
   * @param {HTMLElement} element - 發生問題的元素
   * @param {object} metadata - 額外資訊 (次數、按鍵等)
   */
  function reportEvent(type, element, metadata = {}) {
    const selector = getSelector(element);
    const pageUrl = window.location.pathname;

    // 簡單的防止洗頻機制 (同一頁、同一元素、同一錯誤，5秒內不重送)
    const errorKey = `${type}|${selector}|${pageUrl}`;
    const lastTime = state.lastSentError[errorKey] || 0;
    if (Date.now() - lastTime < CONFIG.throttleTime) return;

    state.lastSentError[errorKey] = Date.now();

    const payload = {
      clientId: CLIENT_ID,
      sessionId: sessionId,
      type: type,
      selector: selector,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      metadata: JSON.stringify(metadata),
      // 這是給你看的：簡單描述
      note: metadata.count
        ? `連點 ${metadata.count} 次`
        : metadata.key
          ? `按了 ${metadata.key} 鍵`
          : metadata.duration
            ? `迷路耗時 ${metadata.duration}ms`
            : "",
    };

    // 使用 Beacon 或 Fetch 發送
    // Google Script 跨域限制多，使用 no-cors 模式 (只求送出，不求回應)
    // 為了確保資料格式正確，我們使用 POST 並將資料轉為 JSON string

    // 優先嘗試 sendBeacon (在頁面關閉時較穩)
    // 但 sendBeacon 對 Content-Type 限制較多，Apps Script 有時讀不到
    // 故使用 fetch 做主要傳輸手段

    fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // 關鍵：避開 CORS 錯誤
      headers: {
        "Content-Type": "text/plain", // 關鍵：Apps Script 對 application/json 支援不穩
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      // 靜默失敗，不干擾客戶網站
      // console.error('Pulse Report Failed', err);
    });
  }

  /**
   * 產生可讀性高的 CSS Selector
   * 優先級：ID > Class > Tag + Attribute
   */
  // 請替換掉原本 pulse.js 裡面的 getSelector 函式

  function getSelector(el) {
    if (!el) return "unknown";

    // 1. 如果有 ID，這是最棒的，直接回傳 (因為 ID 在頁面上是唯一的)
    if (el.id) return "#" + el.id;

    // 2. 如果沒有 ID，我們就開始組裝「麵包屑」路徑
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
        // 如果有兄弟姊妹，就要標示我是「第幾個」(nth-child)
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
