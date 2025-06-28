@echo off
REM 1. 이 .bat 파일이 있는 폴더로 작업 위치를 강제 이동
cd /D "%~dp0"

REM 2. 가상환경(venv)을 활성화
call venv\Scripts\activate.bat

REM 3. 이제 가상환경의 파이썬으로 main.py를 실행
python main.py