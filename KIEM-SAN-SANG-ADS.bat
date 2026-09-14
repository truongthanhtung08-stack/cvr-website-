@echo off
chcp 65001 >nul
cd /d "%~dp0"
node scripts/kiem-san-sang-ads.mjs
pause
