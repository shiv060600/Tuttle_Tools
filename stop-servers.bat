@echo off
:: ============================================
::   Tuttle Customer Mapping - Stop Servers
::   For use with Windows Task Scheduler
:: ============================================

echo [%date% %time%] Stopping Tuttle Customer Mapping servers...

:: Find and kill node processes running our server
:: Uses WMIC to find node processes with our path
for /f "tokens=2" %%i in ('wmic process where "name='node.exe' and commandline like '%%Tuttle_Customer_Mapping%%'" get processid 2^>nul ^| findstr /r "[0-9]"') do (
    echo Killing process %%i
    taskkill /F /PID %%i 2>nul
)

:: Also try to kill by port (backup method)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

echo [%date% %time%] Servers stopped.
