document.addEventListener('DOMContentLoaded', function() {
  const executeBtn = document.getElementById('executeBtn');
  const promptInput = document.getElementById('prompt-input');
  const resultBox = document.getElementById('result-box');
  
  // 팝업이 열릴 때마다 '게시판(storage)'을 확인하여 최신 결과를 표시하는 함수
  function displayLastResult() {
    chrome.storage.local.get("last_result", (data) => {
      if (data.last_result) {
        const msg = data.last_result;
        if (msg.status === "loading") {
          resultBox.textContent = "명령을 전달했습니다. 백그라운드에서 실행 중입니다...";
        } else if (msg.status === "success") {
          resultBox.textContent = msg.result;
        } else {
          resultBox.textContent = "오류가 발생했습니다:\n" + msg.message;
        }
      }
    });
  }

  // 버튼 클릭 이벤트: 백그라운드에 작업 요청만 보냄
  executeBtn.addEventListener('click', function() {
    const userPrompt = promptInput.value;
    if (userPrompt) {
      const message = { action: "run_cli", prompt: userPrompt };
      chrome.runtime.sendMessage({action: "run_cli", message: message});
      resultBox.textContent = "명령을 백그라운드로 전달했습니다. 잠시 후 팝업을 다시 열어 결과를 확인하세요.";
      // 1초 후 팝업을 자동으로 닫아 사용자 편의성 증대
      setTimeout(() => window.close(), 1000);
    } else {
      resultBox.textContent = "프롬프트를 입력해주세요.";
    }
  });

  // 팝업이 열릴 때 바로 최신 결과를 표시
  displayLastResult();
});