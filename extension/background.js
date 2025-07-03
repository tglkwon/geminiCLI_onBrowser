// background.js (Refactored)

// 네이티브 앱(파이썬)과의 통신을 담당하는 포트
let nativePort = null;
// UI(사이드 패널)와의 통신을 담당하는 포트
let uiPort = null;

/**
 * 네이티브 앱(main.py)과의 연결을 생성하고 리스너를 설정합니다.
 */
function connectNative() {
    const hostName = "com.my_company.gemini_cli_on_browser";
    nativePort = chrome.runtime.connectNative(hostName);
    
    // 파이썬으로부터 메시지를 받으면, UI로 전달합니다.
    nativePort.onMessage.addListener((msg) => {
        if (uiPort) {
            uiPort.postMessage(msg);
        }
    });

    // 파이썬과의 연결이 끊겼을 때 처리합니다.
    nativePort.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError && uiPort) {
            uiPort.postMessage({ status: "error", message: `Native host disconnected: ${chrome.runtime.lastError.message}`});
        }
        nativePort = null;
    });
}

/**
 * UI(sidepanel.js)로부터의 연결 요청을 처리합니다.
 */
chrome.runtime.onConnect.addListener((port) => {
    // 이 포트가 사이드 패널에서 온 것인지 확인합니다.
    if (port.name === "sidepanel_channel") {
        uiPort = port;

        // 사이드 패널이 연결되자마자 네이티브 연결을 시도하고,
        // 준비 완료 메시지를 보냅니다.
        if (!nativePort) {
            connectNative();
        }
        // 약간의 지연 후 ready 메시지를 보내 연결 안정성을 높입니다.
        setTimeout(() => {
            if (nativePort) {
                uiPort.postMessage({ status: "ready" });
            }
        }, 100);

        // UI로부터 메시지가 오면 처리합니다.
        port.onMessage.addListener((msg) => {
            if (msg.action === "run_cli") {
                if (nativePort) {
                    uiPort.postMessage({ status: "loading" }); 
                    nativePort.postMessage(msg); // 메시지를 파이썬으로 전달
                } else {
                    uiPort.postMessage({ status: "error", message: "Native host is not connected." });
                }
            }
        });
        
        // UI와의 연결이 끊기면 포트 변수를 초기화합니다.
        port.onDisconnect.addListener(() => {
            uiPort = null;
        });
    }
});

/**
 * 툴바 아이콘 클릭 시 사이드 패널을 열어줍니다.
 */
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});