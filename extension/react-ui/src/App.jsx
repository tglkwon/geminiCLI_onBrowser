import { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './index.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('엔진과 연결 중입니다...');
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const port = useRef(null);

  // --- 컴포넌트가 처음 로드될 때 실행 ---
  useEffect(() => {
    // 1. 백그라운드와 연결
    port.current = chrome.runtime.connect({ name: "sidepanel_channel" });

    // 2. 메시지 수신 리스너 설정
    port.current.onMessage.addListener((msg) => {
      setIsLoading(false);
      if (msg.status === "ready") {
        setResult("연결되었습니다. 명령을 입력하세요.");
      } else if (msg.status === "streaming") {
        setResult(prev => (prev.startsWith('엔진과') || prev.startsWith('연결') || prev.startsWith('오류') ? msg.chunk : prev + msg.chunk));
      } else if (msg.status === "error") {
        setResult("오류가 발생했습니다:\n" + msg.message);
      }
    });

    // 3. 저장소에서 히스토리 불러오기 (최초 1회)
    chrome.storage.local.get({ promptHistory: [] }, (data) => {
      console.log("최초 히스토리 로드:", data.promptHistory);
      setHistory(data.promptHistory);
    });

    return () => { if (port.current) port.current.disconnect(); };
  }, []);

  // --- 버튼 클릭 시 실행되는 함수 ---
  const handleExecute = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setResult("프롬프트를 입력해주세요.");
      return;
    }
    
    // '함수형 업데이트' 방식으로 setHistory를 호출합니다.
    setHistory(prevHistory => {
      const newHistory = [trimmedPrompt, ...prevHistory.filter(item => item !== trimmedPrompt)].slice(0, 10);
      
      // 이 안에서 storage 저장까지 함께 처리합니다.
      chrome.storage.local.set({ promptHistory: newHistory });
      
      return newHistory; // 새로운 히스토리 배열을 반환하여 상태를 업데이트합니다.
    });

    // 4. 백그라운드로 작업을 요청합니다.
    setResult(''); 
    setIsLoading(true);
    port.current.postMessage({ action: "run_cli", prompt: trimmedPrompt });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleExecute();
    }
  };

  console.log("리액트 렌더링. 현재 history 상태:", history);

  return (
    // 전체 배경과 폰트를 부드럽게 설정
    <div className="p-4 bg-slate-100 min-h-screen font-sans antialiased flex flex-col gap-4">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-bold text-slate-800 mb-2">geminiCLI_onBrowser</h3>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <textarea
            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            rows="4"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="분석할 내용을 입력하세요... (Shift+Enter로 줄바꿈)"
          />
          <button 
            onClick={handleExecute} 
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex justify-center items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>실행 중...</span>
              </div>
            ) : 'Execute Command'}
          </button>
        </div>

        {/* 결과창 */}
        <div className="text-sm">
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem', // 8px
              padding: '1rem', // 16px
              minHeight: '200px',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            }}
            wrapLines={true}
            wrapLongLines={true}
            codeTagProps={{ style: { fontFamily: 'monospace' } }}
          >
            {result}
          </SyntaxHighlighter>
        </div>

        <div className="text-left">
          <h4 className="text-md font-semibold text-slate-700 mb-2">최근 명령어</h4>
          <ul className="history-list-reset border border-slate-200 rounded-md max-h-40 overflow-y-auto">
            {history.length > 0 ? history.map((item, index) => (
              <li 
                key={`${item}-${index}`} 
                onClick={() => setPrompt(item)} 
                title={item}
                className="p-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 border-b border-slate-200 truncate"
              >
                {item}
              </li>
            )) : <li className="p-3 text-sm text-slate-400">기록이 없습니다.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App