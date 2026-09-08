@echo off
setlocal
title Atualizar GApps no GitHub
cd /d "%~dp0"

set "GIT_EXE="
where git.exe >nul 2>&1
if not errorlevel 1 set "GIT_EXE=git.exe"

if not defined GIT_EXE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" set "GIT_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
if not defined GIT_EXE if exist "%ProgramFiles%\Git\cmd\git.exe" set "GIT_EXE=%ProgramFiles%\Git\cmd\git.exe"

if not defined GIT_EXE (
  echo Nao foi possivel encontrar o Git neste computador.
  echo Instale o Git para Windows e tente novamente.
  pause
  exit /b 1
)

echo Preparando os arquivos...
"%GIT_EXE%" config user.name "gustavocarvalho96-lang"
"%GIT_EXE%" config user.email "gustavocarvalho96@hotmail.com.br"
"%GIT_EXE%" add --all
if errorlevel 1 goto :erro

"%GIT_EXE%" diff --cached --quiet
if not errorlevel 1 (
  echo.
  echo Nenhuma alteracao nova para enviar.
  pause
  exit /b 0
)

"%GIT_EXE%" commit -m "Atualiza GApps"
if errorlevel 1 goto :erro

echo.
echo Enviando ao GitHub...
"%GIT_EXE%" push origin main
if errorlevel 1 goto :erro

echo.
echo Atualizacao enviada com sucesso.
echo O GitHub Pages pode levar alguns minutos para atualizar o site.
pause
exit /b 0

:erro
echo.
echo A atualizacao nao foi concluida. Copie a mensagem acima e envie para o suporte.
pause
exit /b 1
