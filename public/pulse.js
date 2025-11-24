// pulse.js (極簡版)

(function() {
  // 設定你的 Google Script 網址
  const ENDPOINT = "https://script.google.com/macros/s/你的_SCRIPT_ID/exec";

  // 1. 簡單的 Rage Click 偵測 (範例)
  let clickCount = 0;
  let lastClickTarget = null;
  let clickTimer = null;

  document.addEventListener('click', (e) => {
    if (e.target === lastClickTarget) {
      clickCount++;
    } else {
      clickCount = 1;
      lastClickTarget = e.target;
    }

    clearTimeout(clickTimer);

    // 1秒後結算
    clickTimer = setTimeout(() => {
      if (clickCount >= 5) { // 門檻：5次
        sendData({
          type: "RAGE_CLICK",
          selector: getSelector(e.target), // 寫個簡單函數抓 class/id
          count: clickCount,
          url: window.location.pathname
        });
      }
      clickCount = 0;
      lastClickTarget = null;
    }, 1000);
  }, true);

  // ... 這裡可以加入 Dead Interaction 和 U-Turn 的偵測 ...

  // 傳送資料給 Google Sheet
  function sendData(payload) {
    // 補上 Session ID (簡單隨機數即可)
    payload.sessionId = sessionStorage.getItem('pulse_sid') || Math.random().toString(36).substr(2);
    sessionStorage.setItem('pulse_sid', payload.sessionId);

    // 使用 beacon 或是 fetch (Google Script 需要設定 CORS，用 no-cors 模式最簡單)
    fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors", // 重要：Google Script 跨域需要這個
      headers: {
        "Content-Type": "text/plain" // Google Script 對 application/json 支援度有時怪怪的，用 text/plain 較穩
      },
      body: JSON.stringify(payload)
    }).catch(err => console.log('Pulse Error'));
  }
  
  // 簡單抓取 Selector 的輔助函式
  function getSelector(el) {
    if (el.id) return '#' + el.id;
    if (el.className) return '.' + el.className.split(' ').join('.');
    return el.tagName.toLowerCase();
  }

})();