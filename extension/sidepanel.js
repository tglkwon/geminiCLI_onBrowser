document.addEventListener('DOMContentLoaded', function() {
    const executeBtn = document.getElementById('executeBtn');
    const promptInput = document.getElementById('prompt-input');
    const resultBox = document.getElementById('result-box');
    const historyList = document.getElementById('history-list'); // 히스토리 UI

    // --- 새로운 함수: 히스토리 저장 (수정 없음) ---
    function saveToHistory(promptText) {
        chrome.storage.local.get({ promptHistory: [] }, (data) => {
            let history = data.promptHistory;
            history = history.filter(item => item !== promptText);
            history.unshift(promptText);
            if (history.length > 10) history = history.slice(0, 10);
            chrome.storage.local.set({ promptHistory: history }, () => {
                loadHistory();
            });
        });
    }

    // --- 새로운 함수: 히스토리 로드 및 표시 (수정 없음) ---
    function loadHistory() {
        historyList.innerHTML = '';
        chrome.storage.local.get({ promptHistory: [] }, (data) => {
            data.promptHistory.forEach(prompt => {
                const li = document.createElement('li');
                li.textContent = prompt;
                li.title = prompt;
                li.addEventListener('click', () => {
                    promptInput.value = prompt;
                });
                historyList.appendChild(li);
            });
        });
    }

    // --- 실행 버튼 클릭 이벤트 (수정된 부분) ---
    executeBtn.addEventListener('click', () => {
        const userPrompt = promptInput.value.trim();
        if (userPrompt) {
            // **이 줄이 다시 추가되었습니다!**
            saveToHistory(userPrompt); 
            
            // 이하 코드는 이전과 동일
            resultBox.textContent = ''; 
            port.postMessage({ 
                action: "run_cli", 
                prompt: userPrompt 
            });
        } else {
            resultBox.textContent = "프롬프트를 입력해주세요.";
        }
    });
    
    // 초반에는 버튼을 비활성화
    executeBtn.disabled = true;
    resultBox.textContent = "엔진과 연결 중입니다...";

    const port = chrome.runtime.connect({ name: "sidepanel_channel" });

    port.onMessage.addListener((msg) => {
        // **핵심 변경:** 'ready' 신호를 받으면 버튼을 활성화
        if (msg.status === "ready") {
            executeBtn.disabled = false;
            resultBox.textContent = "연결되었습니다. 명령을 입력하세요.";
            return;
        }

        // 이하 결과 처리 로직은 동일
        if (msg.status === "streaming") {
            resultBox.textContent += msg.chunk;
        } else if (msg.status === "success") {
            resultBox.textContent += "\n\n--- 분석 완료 ---";
        } else if (msg.status === "error") {
            resultBox.textContent = "오류가 발생했습니다:\n" + msg.message;
        } else if (msg.status === "loading") {
            resultBox.textContent = '';
        }
    });

    executeBtn.addEventListener('click', () => {
        const userPrompt = promptInput.value.trim();
        if (userPrompt) {
            resultBox.textContent = '명령을 전달했습니다. 잠시만 기다려주세요...';
            port.postMessage({ action: "run_cli", prompt: userPrompt });
        }
    });
});