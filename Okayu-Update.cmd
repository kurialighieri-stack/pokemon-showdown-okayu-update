@echo off
setlocal
powershell.exe -NoProfile -Command "if (([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { exit 0 } else { exit 1 }" >nul 2>nul
if errorlevel 1 (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0okayu_update\windows-elevate.ps1" "%~f0" %*
  exit /b
)
set "PYTHONUTF8=1"
pushd "%~dp0"
if exist "%~dp0runtime\python.exe" (
  "%~dp0runtime\python.exe" -X utf8 -m okayu_update %*
) else (
  where py >nul 2>nul
  if errorlevel 1 (
    echo Se necesita Python 3.10 o posterior con el lanzador py.
    echo Descarga oficial: https://www.python.org/downloads/windows/
    echo En la instalacion de Python, incluye el lanzador py.
    pause
    popd
    exit /b 1
  )
  py -3 -X utf8 -m okayu_update %*
)
set "okayu_result=%ERRORLEVEL%"
popd
if not "%okayu_result%"=="0" pause
exit /b %okayu_result%
