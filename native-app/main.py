import sys
import json
import struct
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# --- 로그 및 메시지 함수 (수정 없음) ---
# ... (이전과 동일) ...
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
        response = model.generate_content(full_prompt_text, stream=True)
        
         for response in responses:
            # 오류가 없는 경우에만 청크를 전송합니다.
            if not response.prompt_feedback.block_reason:
                send_message({"status": "streaming", "chunk": response.text})
            # 만약 안전 설정 등으로 응답이 블락되면, 그 정보를 전송합니다.
            else:
                 send_message({"status": "error", "message": f"Stream blocked due to: {response.prompt_feedback.block_reason.name}"})

        # 모든 스트리밍이 끝났음을 알립니다.
        return {"status": "success", "result": "Stream completed."}
    except Exception as e:
        log_message(f"API Error: {e}")
        return {"status": "error", "message": f"Gemini API 호출 중 오류가 발생했습니다: {str(e)}"}


# --- 메인 루프 (파일 읽기 기능 추가) ---
log_message("--- Native host script started (File-reading Version) ---")
while True:
    try:
        received_message = read_message()
        if received_message and received_message.get("action") == "run_cli":
            user_prompt = received_message.get("prompt", "")
            
            # --- 이 부분이 핵심적인 추가 로직입니다 ---
            final_prompt = user_prompt
            
            # 1. 현재 디렉토리의 모든 파일 내용을 읽어서 하나의 문자열로 합칩니다.
            #    (실제 서비스에서는 파일 종류, 크기 등을 고려해야 합니다.)
            try:
                context_files = []
                for filename in os.listdir('.'):
                    # .py 파일만 대상으로 합니다.
                    if filename.endswith('.py'):
                        with open(filename, 'r', encoding='utf-8') as f:
                            file_content = f.read()
                            # 프롬프트에 파일 정보 추가
                            context_files.append(f"--- 파일명: {filename} ---\n{file_content}")
                
                if context_files:
                    # 파일 내용과 원래 프롬프트를 조합하여 최종 프롬프트를 만듭니다.
                    final_prompt = f"""
                    현재 디렉토리의 파일 내용은 아래와 같습니다.
                    
                    {''.join(context_files)}
                    
                    ---
                    위 파일 내용을 바탕으로, 아래 요청에 답변해주세요.
                    요청: {user_prompt}
                    """
            except Exception as e:
                log_message(f"File reading error: {e}")
            # --- 여기까지가 추가된 로직입니다 ---

            # API 직접 호출 함수에 최종 프롬프트를 전달합니다.
            response = call_gemini_api(final_prompt)
            send_message(response)
            
    except Exception as e:
        log_message(f"Main loop error: {e}")
        break