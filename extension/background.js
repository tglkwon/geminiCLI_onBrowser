let nativePort = null;
let sidepanelPort = null;

function connectNative() {
    nativePort = chrome.runtime.connectNative("com.my_company.gemini_cli_on_browser");
    
    // 파이썬으로부터 메시지를 받으면, 사이드 패널로 전달
    nativePort.onMessage.addListener((msg) => {
        if (sidepanelPort) sidepanelPort.postMessage(msg);
    });

    nativePort.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError && sidepanelPort) {
            sidepanelPort.postMessage({ status: "error", message: `Native host disconnected: ${chrome.runtime.lastError.message}`});
        }
        nativePort = null;
    });
}

// sidepanel.js로부터 연결 요청을 받는 리스너
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "sidepanel_channel") {
        sidepanelPort = port;

        // 사이드 패널이 연결되자마자 네이티브 연결 시작
        if (!nativePort) connectNative();

        // **핵심 변경:** 네이티브 앱과 연결이 되면 "ready" 신호를 보냄
        // 약간의 지연을 주어 안정적으로 연결되도록 함
        setTimeout(() => {
            if (nativePort) {
                sidepanelPort.postMessage({ status: "ready" });
            }
        }, 100);

        port.onMessage.addListener((msg) => {
            if (msg.action === "run_cli") {
                if (nativePort) {
                    sidepanelPort.postMessage({ status: "loading" }); 
                    nativePort.postMessage(msg);
                } else {
                    sidepanelPort.postMessage({ status: "error", message: "Native host is not connected." });
                }
            }
        });
        
        port.onDisconnect.addListener(() => { sidepanelPort = null; });
    }
});

// 툴바 아이콘 클릭 시 사이드 패널 열기
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});