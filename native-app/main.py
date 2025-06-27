import subprocess

def execute_gemini_command(prompt_text):
    """
    주어진 프롬프트를 사용하여 gemini-cli를 실행하고 결과를 반환하는 함수.
    """
    print(f"Gemini CLI에 다음 프롬프트를 전달합니다: '{prompt_text}'")
    
    try:
        # 윈도우 환경에서는 'gemini'가 아니라 'gemini.cmd'를 직접 호출합니다.
        # 이렇게 하면 셸을 통하지 않고도 명령어를 정확히 찾을 수 있습니다.
        command = [
            'gemini.cmd',  # <-- 'gemini'를 'gemini.cmd'로 변경했습니다!
            '-a',
            '-p',
            prompt_text
        ]

        # subprocess.run으로 명령어를 리스트 형태로 안전하게 실행합니다.
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True,
            encoding='utf-8'
        )
        
        return result.stdout

    except FileNotFoundError:
        # 이 오류는 이제 발생하지 않아야 합니다.
        return "오류: 'gemini.cmd' 명령어를 찾을 수 없습니다. Gemini CLI가 전역으로 올바르게 설치되었는지, PATH가 정확한지 확인해주세요."
    except subprocess.CalledProcessError as e:
        # 이 오류는 이제 발생하지 않아야 합니다.
        return f"Gemini CLI 실행 중 오류가 발생했습니다:\n{e.stderr}"

# 이 스크립트를 터미널에서 직접 실행했을 때만 아래 코드가 동작합니다.
if __name__ == "__main__":
    # 테스트용 프롬프트를 정의합니다.
    test_prompt = "이 디렉토리에 있는 파일들의 목록과 간단한 설명을 표로 만들어줘."
    
    # 함수를 호출하여 결과를 받습니다.
    cli_output = execute_gemini_command(test_prompt)
    
    # 최종 결과를 화면에 출력합니다.
    print("\n--- Gemini CLI 실행 결과 ---")
    print(cli_output)
    print("--------------------------")