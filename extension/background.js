let nativePort = null;
let uiPort = null; // sidepanel 과의 통신 포트

function connectNative() {
    nativePort = chrome.runtime.connectNative("com.my_company.gemini_cli_on_browser");
    
    nativePort.onMessage.addListener((msg) => {
        if (uiPort) {
            uiPort.postMessage(msg); // 받은 메시지를 sidepanel로 전달
        }
    });

    nativePort.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
            if (uiPort) {
                uiPort.postMessage({ status: "error", message: `Native host disconnected: ${chrome.runtime.lastError.message}`});
            }
        }
        nativePort = null;
    });
}

// sidepanel 과의 채널 연결 관리
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "sidepanel_channel") {
        uiPort = port;
        port.onDisconnect.addListener(() => {
            uiPort = null;
        });

        // sidepanel로부터 메시지를 받으면 네이티브 앱으로 전달
        port.onMessage.addListener((msg) => {
            if (msg.action === "run_cli") {
                if (!nativePort) {
                    connectNative();
                }
                // 로딩 상태를 sidepanel에 즉시 알림
                uiPort.postMessage({ status: "loading" }); 
                nativePort.postMessage(msg);
            }
        });
    }
});

// 툴바의 확장 프로그램 아이콘을 클릭했을 때 실행될 리스너
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});