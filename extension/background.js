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
    
    nativePort.onMessage.addListener((msg) => {
        if (uiPort) {
            uiPort.postMessage(msg);
        }
    });

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
    if (port.name === "sidepanel_channel") {
        uiPort = port;

        if (!nativePort) {
            connectNative();
        }
        setTimeout(() => {
            if (nativePort) {
                uiPort.postMessage({ status: "ready" });
            }
        }, 100);

        // --- ⭐️ UI로부터 메시지가 오면 처리하는 핵심 로직 ---
        port.onMessage.addListener((msg) => {
    if (msg.action === "run_cli") {
        if (!nativePort) {
            uiPort.postMessage({ status: "error", message: "Native host is not connected." });
            return;
        }

        if (msg.includePageText) {
            // 1. 현재 활성 탭을 가져옵니다.
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length === 0) {
                    uiPort.postMessage({ status: "error", message: "활성 탭을 찾을 수 없습니다." });
                    return;
                }
                const activeTabId = tabs[0].id;

                // 2. ⭐️ scripting.executeScript를 사용해 페이지 텍스트를 직접 가져옵니다.
                chrome.scripting.executeScript({
                    target: { tabId: activeTabId },
                    func: () => document.body.innerText
                }, (injectionResults) => {
                    if (chrome.runtime.lastError || !injectionResults || injectionResults.length === 0) {
                        uiPort.postMessage({ status: "error", message: "현재 페이지의 텍스트를 가져올 수 없습니다. 권한을 확인하거나 다른 페이지에서 시도하세요." });
                        return;
                    }
                    
                    const pageText = injectionResults[0].result;
                    const combinedPrompt = `CONTEXT (Current Page Text):\n${pageText}\n---\n\nREQUEST: ${msg.prompt}`;
                    nativePort.postMessage({ action: "run_cli", prompt: combinedPrompt });
                });
            });
        } else {
            // 체크박스가 선택되지 않았다면 원래대로 프롬프트만 전송
            nativePort.postMessage(msg);
        }
    }
        });
        
        port.onDisconnect.addListener(() => {
            uiPort = null;
        });
    }
});

// 툴바 아이콘 클릭 시 사이드 패널 열기
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});