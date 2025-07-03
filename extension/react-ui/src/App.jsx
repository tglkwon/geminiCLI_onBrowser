import { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import './index.css';

// --- 1. translations.js의 모든 내용을 App.jsx 안으로 가져옵니다 ---
const translations = {
  en: {
    sidepanel_title: "geminiCLI_onBrowser",
    prompt_placeholder: "Enter your prompt... (Shift+Enter for new line)",
    execute_button: "Execute Command",
    loading_text: "Executing...",
    history_title: "Recent Commands",
    history_empty: "No history yet.",
    copied_message: "Result copied to clipboard.",
    connecting_text: "Connecting to engine...",
    ready_text: "Connection successful. Please enter a command.",
    error_text: "An error occurred:",
    prompt_empty_error: "Please enter a prompt.",
    include_page_text_label: "Include current page text"
  },
  ko: {
    sidepanel_title: "geminiCLI_onBrowser",
    prompt_placeholder: "분석할 내용을 입력하세요... (Shift+Enter로 줄바꿈)",
    execute_button: "명령 실행",
    loading_text: "실행 중...",
    history_title: "최근 명령어",
    history_empty: "기록이 없습니다.",
    copied_message: "결과가 클립보드에 복사되었습니다.",
    connecting_text: "엔진과 연결 중입니다...",
    ready_text: "연결되었습니다. 명령을 입력하세요.",
    error_text: "오류가 발생했습니다:",
    prompt_empty_error: "프롬프트를 입력해주세요.",
    include_page_text_label: "현재 페이지 텍스트 포함"
  },
  ja: {
    sidepanel_title: "geminiCLI_onBrowser",
    prompt_placeholder: "分析したい内容を入力してください... (Shift+Enterで改行)",
    execute_button: "コマンド実行",
    loading_text: "実行中...",
    history_title: "最近のコマンド",
    history_empty: "履歴がありません。",
    copied_message: "結果がクリップボードにコピーされました。",
    connecting_text: "エンジンに接続しています...",
    ready_text: "接続しました。コマンドを入力してください。",
    error_text: "エラーが発生しました:",
    prompt_empty_error: "プロンプトを入力してください。",
    include_page_text_label: "現在ページテキストを含む"
  }
};

function getTranslations() {
  const language = chrome.i18n.getUILanguage();
  if (language.startsWith('ko')) return translations.ko;
  if (language.startsWith('ja')) return translations.ja;
  return translations.en;
}

const initialTranslations = getTranslations();

function App() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(initialTranslations.connecting_text);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [includePageText, setIncludePageText] = useState(false);
  const [i18n, setI18n] = useState(initialTranslations);
  
  const port = useRef(null);
  const resultRef = useRef(result);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    const newI18n = getTranslations();
    setI18n(newI18n);
    setResult(newI18n.connecting_text);

    port.current = chrome.runtime.connect({ name: "sidepanel_channel" });

    port.current.onMessage.addListener((msg) => {
      setIsLoading(false);
      if (msg.status === "ready") {
        setResult(newI18n.ready_text);
      } else if (msg.status === "streaming") {
        setResult(prev => (prev === newI18n.connecting_text || prev === newI18n.ready_text || prev.startsWith(newI18n.error_text) ? msg.chunk : prev + msg.chunk));
      } else if (msg.status === "success") {
        const finalResult = resultRef.current;
        if (finalResult && !finalResult.startsWith(newI18n.connecting_text) && !finalResult.startsWith(newI18n.ready_text)) {
            navigator.clipboard.writeText(finalResult).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
            }).catch(err => { console.error('클립보드 자동 복사 실패:', err); });
        }
      } else if (msg.status === "error") {
        setResult(newI18n.error_text + "\n" + msg.message);
      }
    });

    chrome.storage.local.get({ promptHistory: [] }, (data) => {
      setHistory(data.promptHistory);
    });

    return () => { if (port.current) port.current.disconnect(); };
  }, []);
  
  const handleExecute = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setResult(i18n.prompt_empty_error);
      return;
    }
    
    setHistory(prevHistory => {
      const newHistory = [trimmedPrompt, ...prevHistory.filter(item => item !== trimmedPrompt)].slice(0, 10);
      chrome.storage.local.set({ promptHistory: newHistory });
      return newHistory;
    });

    setResult(''); 
    setIsLoading(true);
    port.current.postMessage({ action: "run_cli", prompt: trimmedPrompt, includePageText: includePageText });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleExecute();
    }
  };

  return (
    <div className="p-4 bg-slate-100 min-h-screen font-sans antialiased flex flex-col gap-4">
      <div className="max-w-md mx-auto">
        {copied && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 transition-opacity duration-300">
            {i18n.copied_message}
          </div>
        )}

        <h3 className="text-lg font-bold text-slate-800 mb-2">{i18n.sidepanel_title}</h3>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <textarea
            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            rows="4"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={i18n.prompt_placeholder}
          />
          <div className="mt-2 flex items-center">
            <input
              type="checkbox"
              id="includePageText"
              checked={includePageText}
              onChange={(e) => setIncludePageText(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="includePageText" className="ml-2 block text-sm text-gray-900">
              {i18n.include_page_text_label}
            </label>
          </div>
          <button 
            onClick={handleExecute} 
            disabled={isLoading}
            className="w-full mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex justify-center items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>{i18n.loading_text}</span>
              </div>
            ) : i18n.execute_button}
          </button>
        </div>

        <div className="text-sm">
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              padding: '1rem',
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
          <h4 className="text-md font-semibold text-slate-700 mb-2">{i18n.history_title}</h4>
          <ul className="history-list-reset ...">
            {history.length > 0 ? history.map((item, index) => (
              <li 
                key={`${item}-${index}`} 
                onClick={() => setPrompt(item)} 
                title={item}
                className="p-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 border-b border-slate-200 truncate"
              >
                {item}
              </li>
            )) : <li className="p-3 text-sm text-slate-400">{i18n.history_empty}</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App;