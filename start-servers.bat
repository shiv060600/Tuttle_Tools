@echo off
:: ============================================
::   Tuttle Customer Mapping - Start Servers
::   For use with Windows Task Scheduler
:: ============================================

:: Set working directory
cd /d H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

:: Get timestamp for log files
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set logdate=%datetime:~0,8%

:: Start Backend Server
echo [%date% %time%] Starting Backend Server...
start /B cmd /c "npm run server >> logs\backend_%logdate%.log 2>&1"

:: Wait for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Frontend Server
echo [%date% %time%] Starting Frontend Server...
start /B cmd /c "npm run dev >> logs\frontend_%logdate%.log 2>&1"

echo [%date% %time%] Servers started.
echo Backend:  http://tutpub2.tuttlepub.com:3001
echo Frontend: http://tutpub2.tuttlepub.com:3000
echo Logs: H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping\logs\
