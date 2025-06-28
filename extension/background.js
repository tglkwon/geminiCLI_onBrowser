// 네이티브 앱과 연결하는 로직은 이제 백그라운드에서 처리합니다.
const hostName = "com.my_company.gemini_cli_on_browser";
let port = chrome.runtime.connectNative(hostName);

port.onMessage.addListener((msg) => {
  console.log("Received from native host:", msg);

  if (msg.status === "ready") {
    console.log("Handshake successful! Native host is ready.");
    // 준비 완료 메시지는 UI에 표시할 필요가 없으므로 여기서 처리 종료
    return;
  }

  // 실제 결과 메시지를 '게시판(storage)'에 저장합니다.
  chrome.storage.local.set({ last_result: msg });
});

port.onDisconnect.addListener(() => {
  if (chrome.runtime.lastError) {
    console.error("Disconnected due to an error:", chrome.runtime.lastError.message);
  }
  // 필요시 재연결 로직 추가
});

// 팝업(popup.js)으로부터 메시지를 수신하는 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "run_cli") {
        console.log("Message from popup, sending to native host:", request.message);
        // 작업 시작 전에 이전 결과를 초기화하고 '로딩' 상태를 저장합니다.
        chrome.storage.local.set({ last_result: { status: "loading" } });
        port.postMessage(request.message);
    }
});