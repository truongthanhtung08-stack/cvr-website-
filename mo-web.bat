@echo off
title Coastal Land - Xem web tren localhost:3001
cd /d "C:\Users\X1 GEN 8\Projects\cvr-website\.claude\worktrees\admin-content-structure-edit-a5b099"
echo ==================================================================
echo   DANG KHOI DONG WEB... (lan dau doi khoang 30 - 60 giay)
echo.
echo   Khi thay dong:  - Local:  http://localhost:3001
echo   thi mo trinh duyet va vao:  http://localhost:3001
echo.
echo   DE TAT: dong cua so nay, hoac bam Ctrl + C
echo ==================================================================
echo.
call npm run dev -- -p 3001
echo.
echo (Neu thay loi mau do o tren, chup lai man hinh nay gui lai.)
pause
