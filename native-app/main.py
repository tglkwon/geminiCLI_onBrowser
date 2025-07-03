import sys
import json
import struct
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# --- 로그 및 메시지 함수 ---
log_file_path = os.path.join(os.path.expanduser("~"), "gemini_cli_log.txt")
def log_message(message):
    with open(log_file_path, "a", encoding="utf-8") as f:
        f.write(f"[{os.getpid()}] {message}\n")

# --- 네이티브 메시징 프로토콜 함수 ---
def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        sys.exit(0)
    message_length = struct.unpack('@I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode("utf-8")
    return json.loads(message)

def send_message(message_content):
    encoded_content = json.dumps(message_content).encode("utf-8")
    message_length = struct.pack('@I', len(encoded_content))
    sys.stdout.buffer.write(message_length)
    sys.stdout.buffer.write(encoded_content)
    sys.stdout.buffer.flush()

# --- Gemini API 직접 호출 함수 ---
def call_gemini_api(full_prompt_text):
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"status": "error", "message": "GEMINI_API_KEY 환경 변수를 찾을 수 없습니다."}
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        response = model.generate_content(full_prompt_text, stream=True)
        
        for chunk in response:
            if not chunk.prompt_feedback.block_reason:
                send_message({"status": "streaming", "chunk": chunk.text})
        
        return {"status": "success", "result": "스트리밍이 완료되었습니다."}
    except Exception as e:
        log_message(f"API Error: {e}")
        return {"status": "error", "message": f"Gemini API 호출 중 오류: {str(e)}"}

# --- 메인 루프 ---
log_message("--- Native host started (Final Production Version) ---")
while True:
    try:
        received_message = read_message()
        log_message(f"Received: {received_message}")
        
        if received_message and received_message.get("action") == "run_cli":
            user_prompt = received_message.get("prompt", "")
            
            # 파일 읽기 및 프롬프트 조합 로직 (이전과 동일)
            final_prompt = user_prompt
            try:
                context_files_content = ""
                for filename in os.listdir('.'):
                    if filename.endswith(('.py', '.js', '.txt', '.md')):
                        with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
                            context_files_content += f"--- FILENAME: {filename} ---\n{f.read()}\n\n"
                
                if context_files_content:
                    final_prompt = f"""CONTEXT:\n{context_files_content}\n---\n\nBased on the context above, please answer the following request:\nREQUEST: {user_prompt}"""
                log_message("Prompt generation successful.")
            except Exception as e:
                log_message(f"File reading error: {e}")

            # API 호출
            final_response = call_gemini_api(final_prompt)
            
            # 결과 전송
            send_message(final_response)

    except Exception as e:
        log_message(f"Main loop error: {e}")
        break