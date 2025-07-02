import { useState, useEffect, useRef } from 'react'
import './index.css'

function App() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('엔진과 연결 중입니다...');
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  
  // 통신 포트는 리렌더링 되어도 유지되도록 useRef를 사용합니다.
  const port = useRef(null);

  // 컴포넌트가 처음 화면에 표시될 때 한 번만 실행되는 로직입니다.
  useEffect(() => {
    // 1. 백그라운드 스크립트와 '전용 전화선(port)'을 연결합니다.
    port.current = chrome.runtime.connect({ name: "sidepanel_channel" });

    // 2. 이 전화선을 통해 백그라운드로부터 메시지가 오면 처리할 내용을 정의합니다.
    port.current.onMessage.addListener((msg) => {
      setIsLoading(false); // 어떤 메시지든 받으면 로딩 상태는 해제합니다.
      
      if (msg.status === "ready") {
        setResult("연결되었습니다. 명령을 입력하세요.");
      } else if (msg.status === "streaming") {
        // '로딩' 메시지를 지우고 첫 데이터 조각부터 받기 시작합니다.
        setResult(prev => (prev.startsWith('명령') || prev.startsWith('오류') || prev.startsWith('연결') ? msg.chunk : prev + msg.chunk));
      } else if (msg.status === "error") {
        setResult("오류가 발생했습니다:\n" + msg.message);
      }
    });

    // 3. 컴포넌트가 처음 로드될 때, 저장된 히스토리를 불러옵니다.
    loadHistory();

    // 4. 컴포넌트가 사라질 때(예: 사이드 패널이 닫힐 때) 연결을 해제합니다.
    return () => {
      if (port.current) {
        port.current.disconnect();
      }
    };
  }, []); // 빈 배열[]은 이 useEffect가 처음 한 번만 실행되도록 보장합니다.

  // 저장소에서 히스토리를 불러와 화면 상태(state)를 업데이트하는 함수
  const loadHistory = () => {
    chrome.storage.local.get({ promptHistory: [] }, (data) => {
      setHistory(data.promptHistory);
    });
  };

  // 새 프롬프트를 저장소와 화면 상태에 모두 업데이트하는 함수
  const saveToHistory = (newPrompt) => {
    const newHistory = [newPrompt, ...history.filter(item => item !== newPrompt)].slice(0, 10);
    setHistory(newHistory);
    chrome.storage.local.set({ promptHistory: newHistory });
  };

  // 'Execute' 버튼을 클릭했을 때의 동작
  const handleExecute = () => {
    if (prompt.trim()) {
      saveToHistory(prompt.trim());
      setResult(''); // 이전 결과 지우기
      setIsLoading(true); // 로딩 상태 시작
      port.current.postMessage({ action: "run_cli", prompt: prompt.trim() });
    } else {
      setResult("프롬프트를 입력해주세요.");
    }
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans">
      <h3 className="text-lg font-bold text-slate-800 mb-4">geminiCLI_onBrowser</h3>
      
      <textarea
        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        rows="4"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="분석할 내용을 입력하세요..."
      />
      <button 
        onClick={handleExecute} 
        disabled={isLoading}
        className="w-full mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
      >
        {isLoading ? '실행 중...' : 'Execute Command'}
      </button>

      <div className="relative mt-4">
        <pre className="w-full p-3 bg-slate-100 border border-slate-200 rounded-md text-sm text-left text-slate-800 whitespace-pre-wrap break-words min-h-[200px] overflow-y-auto">
          {isLoading && result.startsWith('엔진') && <div className="absolute top-2 left-2 w-5 h-5 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>}
          {result}
        </pre>
      </div>

      <div className="mt-5 text-left">
        <h4 className="text-md font-semibold text-slate-700 mb-2">최근 명령어</h4>
        <ul className="border border-slate-200 rounded-md max-h-40 overflow-y-auto">
          {history.length > 0 ? history.map((item, index) => (
            <li 
              key={index} 
              onClick={() => setPrompt(item)} 
              title={item}
              className="p-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-100 border-b border-slate-200 truncate"
            >
              {item}
            </li>
          )) : <li className="p-2 text-xs text-slate-400">기록이 없습니다.</li>}
        </ul>
      </div>
    </div>
  )
}

export default App