document.addEventListener('DOMContentLoaded', function() {
    const executeBtn = document.getElementById('executeBtn');
    const promptInput = document.getElementById('prompt-input');
    const resultBox = document.getElementById('result-box');
    const spinner = document.getElementById('spinner');
    const copyBtn = document.getElementById('copy-btn');

    // 백그라운드와 통신할 포트를 설정합니다.
    const port = chrome.runtime.connect({ name: "popup_channel" });

    // 백그라운드로부터 메시지를 받습니다.
    port.onMessage.addListener((msg) => {
        if (msg.status === "streaming") {
            spinner.style.display = 'none'; // 스트리밍 시작되면 스피너 숨김
            resultBox.textContent += msg.chunk; // 받은 데이터 조각을 결과창에 추가
        } else if (msg.status === "success") {
            spinner.style.display = 'none';
        } else if (msg.status === "error") {
            spinner.style.display = 'none';
            resultBox.textContent = "오류가 발생했습니다:\n" + msg.message;
        } else if (msg.status === "loading") {
            resultBox.textContent = ''; // 이전 결과 지우기
            spinner.style.display = 'block'; // 로딩 시작, 스피너 표시
        }
    });

    // 실행 버튼 클릭 이벤트
    executeBtn.addEventListener('click', () => {
        const userPrompt = promptInput.value;
        if (userPrompt) {
            port.postMessage({ action: "run_cli", prompt: userPrompt });
        } else {
            resultBox.textContent = "프롬프트를 입력해주세요.";
        }
    });

    // 복사 버튼 클릭 이벤트
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(resultBox.textContent)
            .then(() => {
                copyBtn.textContent = '✅';
                setTimeout(() => { copyBtn.textContent = '📋'; }, 1000);
            });
    });
});