@echo off
set "APP_DIR=%~dp0"
set "APP_FILE=%APP_DIR%GTranscritor.html"
set "APP_URL=file:///%APP_FILE:\=/%"

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%APP_URL%"
  exit /b
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%APP_URL%"
  exit /b
)

start "" "%APP_FILE%"
