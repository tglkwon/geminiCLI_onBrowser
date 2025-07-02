// content.js (Final Production Version)

console.log("geminiCLI_onBrowser: Content Script Initialized.");

// --- 설정 ---
const MAGIC_COMMAND = '/local';

// --- 백그라운드 스크립트와 통신 설정 ---
const backgroundPort = chrome.runtime.connect({ name: "content_to_background" });

// --- 백그라운드로부터 메시지 수신 로직 ---
backgroundPort.onMessage.addListener((msg) => {
    console.log("geminiCLI_onBrowser: Received from background:", msg);

    // 결과를 표시할 전용 div를 찾거나 생성합니다.
    let resultDiv = document.getElementById('local-gem-result-display');
    
    // 결과창이 없다면 새로 만듭니다.
    if (!resultDiv) {
        // 제미니의 답변이 표시되는 영역을 더 확실하게 찾습니다.
        // 최신 제미니 UI에서는 'response-container' 클래스를 가진 div가 일반적입니다.
        const responseContainer = document.querySelector('.response-container');
        
        if (responseContainer) {
            console.log("geminiCLI_onBrowser: Found the response container. Creating result div.");
            resultDiv = document.createElement('div');
            resultDiv.id = 'local-gem-result-display';
            // 결과창 스타일 설정
            Object.assign(resultDiv.style, {
                border: '2px solid #4285F4',
                borderRadius: '8px',
                padding: '15px',
                marginTop: '20px',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                textAlign: 'left',
                opacity: '0',
                transition: 'opacity 0.5s'
            });
            responseContainer.appendChild(resultDiv);
            // 부드럽게 나타나는 효과
            setTimeout(() => { resultDiv.style.opacity = '1'; }, 10);
        } else {
            console.error("geminiCLI_onBrowser: Could not find '.response-container' to display result.");
            return;
        }
    }

    // 상태에 따라 결과창의 내용을 업데이트합니다.
    if (msg.status === "streaming") {
         resultDiv.textContent += msg.chunk;
    } else if (msg.status === "success") {
         resultDiv.textContent += "\n\n--- Local Gem 분석 완료 ---";
    } else if (msg.status === "error") {
        resultDiv.textContent = `[오류 발생]:\n${msg.message}`;
        resultDiv.style.color = 'red';
        resultDiv.style.borderColor = 'red';
    }
});


// --- 입력창 감시 및 /local 명령어 처리 로직 ---
let observer = null;

function startObserver() {
    if (observer) observer.disconnect();

    const targetNode = document.querySelector('main');
    if (targetNode) {
        console.log("geminiCLI_onBrowser: MutationObserver is now watching for commands.");
        const config = { childList: true, subtree: true };

        const callback = function(mutationsList, observer) {
            for(const mutation of mutationsList) {
                if (mutation.addedNodes.length) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 && typeof node.querySelector === 'function') {
                            const promptElement = node.querySelector('.query-text');
                            if (promptElement && !promptElement.dataset.localGemProcessed) {
                                const promptText = promptElement.textContent.trim();

                                if (promptText.startsWith(MAGIC_COMMAND)) {
                                    console.log("geminiCLI_onBrowser: Magic command detected!", promptText);
                                    promptElement.dataset.localGemProcessed = 'true';
                                    const userPrompt = promptText.substring(MAGIC_COMMAND.length).trim();
                                    
                                    // 새 명령이 시작되면 이전 결과창을 지웁니다.
                                    const existingResultDiv = document.getElementById('local-gem-result-display');
                                    if (existingResultDiv) existingResultDiv.remove();

                                    backgroundPort.postMessage({ action: "run_cli", prompt: userPrompt });
                                    
                                    promptElement.style.color = '#1a73e8';
                                    promptElement.innerHTML = `[Local Gem] <i>"${userPrompt}"</i> 에 대한 작업을 로컬 PC에서 시작합니다...`;
                                }
                            }
                        }
                    }
                }
            }
        };
        observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    } else {
        setTimeout(startObserver, 1000);
    }
}

startObserver();