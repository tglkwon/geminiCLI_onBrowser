import sys
import json
import struct
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# --- 로그 및 메시지 함수 (수정 없음) ---
log_file_path = os.path.join(os.path.expanduser("~"), "gemini_cli_log.txt")
def log_message(message):
    with open(log_file_path, "a", encoding="utf-8") as f:
        f.write(f"{message}\n")

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

# --- Gemini API 직접 호출 함수 (수정 없음) ---
def call_gemini_api(full_prompt_text):
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"status": "error", "message": "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다."}
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        response = model.generate_content(full_prompt_text)
        
        return {"status": "success", "result": response.text}
    except Exception as e:
        log_message(f"API Error: {e}")
        return {"status": "error", "message": f"Gemini API 호출 중 오류가 발생했습니다: {str(e)}"}

# --- 메인 루프 (파일 읽기 오류 처리 강화) ---
log_message("--- Native host script started (Robust File Handling Version) ---")
while True:
    try:
        received_message = read_message()
        log_message(f"Received message: {received_message}")
        
        if received_message and received_message.get("action") == "run_cli":
            user_prompt = received_message.get("prompt", "")
            final_prompt = user_prompt
            
            # 파일 읽기 과정을 별도의 try-except로 감싸 안정성 확보
            try:
                context_files_content = ""
                # .py와 .txt 파일만 읽도록 제한
                for filename in os.listdir('.'):
                    if filename.endswith('.py') or filename.endswith('.txt'):
                        # errors='ignore' 옵션으로 인코딩 오류 방지
                        with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
                            file_content = f.read()
                            context_files_content += f"--- 파일명: {filename} ---\n{file_content}\n\n"
                
                if context_files_content:
                    final_prompt = f"""
                    현재 디렉토리의 파일 내용은 아래와 같습니다.
                    {context_files_content}
                    ---
                    위 파일 내용을 바탕으로, 아래 요청에 답변해주세요.
                    요청: {user_prompt}
                    """
                log_message(f"Final prompt generated successfully.")

            except Exception as e:
                log_message(f"File reading error: {e}")
                # 파일 읽기에 실패하더라도, 사용자 프롬프트만으로 API 호출 시도
                final_prompt = user_prompt
            
            response = call_gemini_api(final_prompt)
            send_message(response)
            log_message(f"Sent response for prompt: {user_prompt}")

    except Exception as e:
        log_message(f"Fatal error in main loop: {e}")
        break