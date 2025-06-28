import subprocess
import os

def analyze_file_with_gemini(file_path):
    """
    주어진 파일 하나의 '내용'을 읽어 Gemini CLI의 표준 입력으로 전달하여 분석을 요청하는 함수.
    """
    prompt_text = f"아래 제공되는 코드의 내용이 어떤 역할을 하는지, 그리고 코드의 구조에 대해 자세히 설명해줘."
    print(f"\n===== '{file_path}' 파일 분석 시작 =====")
    print(f"프롬프트: {prompt_text}")

    try:
        # 1. 먼저 파이썬으로 파일 내용을 읽습니다.
        with open(file_path, 'r', encoding='utf-8') as f:
            file_content = f.read()

        # 2. Gemini CLI에 전달할 명령어를 구성합니다.
        #    이제 파일 경로는 인수로 전달하지 않습니다.
        command = [
            'gemini.cmd',
            '-p',
            prompt_text
        ]

        # 3. subprocess를 실행하며 'input' 파라미터로 파일 내용을 전달합니다.
        result = subprocess.run(
            command,
            input=file_content,  # <-- 이 부분이 핵심적인 변경점입니다!
            capture_output=True,
            text=True,
            check=True,
            encoding='utf-8'
        )
        
        print("\n--- 분석 결과 ---")
        print(result.stdout)
        print("==========================")
        return True

    except subprocess.CalledProcessError as e:
        print(f"--- 오류 발생 ---")
        print(f"'{file_path}' 파일 분석 중 Gemini CLI가 오류를 반환했습니다 (Exit Code: {e.returncode}).")
        print("\n[Gemini CLI가 출력한 오류 내용 (stderr)]: ")
        print(e.stderr)
        print("==========================")
        return False
    except FileNotFoundError:
        print("오류: 'gemini.cmd' 명령어를 찾을 수 없습니다. PATH 설정을 확인해주세요.")
        return False
    except Exception as e:
        print(f"알 수 없는 오류가 발생했습니다: {e}")
        return False

# 이 스크립트를 터미널에서 직접 실행했을 때만 아래 코드가 동작합니다.
if __name__ == "__main__":
    # 현재 디렉토리에서 .py 확장자를 가진 파일을 찾습니다.
    found_files = False
    for filename in os.listdir('.'):
        if filename.endswith('.py'):
            found_files = True
            analyze_file_with_gemini(filename)
    
    if not found_files:
        print("분석할 파이썬(.py) 파일이 현재 디렉토리에 없습니다.")