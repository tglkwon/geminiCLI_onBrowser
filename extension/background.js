let nativePort = null;
let popupPort = null;

function connectNative() {
    nativePort = chrome.runtime.connectNative("com.my_company.gemini_cli_on_browser");
    
    nativePort.onMessage.addListener((msg) => {
        if (popupPort) {
            popupPort.postMessage(msg); // 받은 메시지를 팝업으로 전달
        }
    });

    nativePort.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
            if (popupPort) {
                popupPort.postMessage({ status: "error", message: `Native host disconnected: ${chrome.runtime.lastError.message}`});
            }
        }
        nativePort = null;
    });
}

// 팝업과의 채널 연결 관리
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "popup_channel") {
        popupPort = port;
        port.onDisconnect.addListener(() => {
            popupPort = null;
        });

        // 팝업으로부터 메시지를 받으면 네이티브 앱으로 전달
        port.onMessage.addListener((msg) => {
            if (msg.action === "run_cli") {
                if (!nativePort) {
                    connectNative();
                }
                // 로딩 상태를 팝업에 즉시 알림
                popupPort.postMessage({ status: "loading" }); 
                nativePort.postMessage(msg);
            }
        });
    }
});