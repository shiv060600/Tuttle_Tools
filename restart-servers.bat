@echo off
:: ============================================
::   Tuttle Customer Mapping - Restart Servers
::   For use with Windows Task Scheduler
:: ============================================

echo [%date% %time%] Restarting Tuttle Customer Mapping servers...

:: Stop servers first
call "H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping\stop-servers.bat"

:: Wait a moment
timeout /t 2 /nobreak > nul

:: Start servers
call "H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping\start-servers.bat"

echo [%date% %time%] Restart complete.

