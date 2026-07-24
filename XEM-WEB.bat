@echo off
title XEM WEB - Coastal Land (localhost:3001)
cd /d "C:\Users\X1 GEN 8\Projects\cvr-website\.claude\worktrees\admin-content-structure-edit-a5b099"
echo ================================================================
echo    XEM WEB DE KIEM TRA
echo ================================================================
echo.
echo    Dang khoi dong... (lan dau doi ~30-60 giay)
echo.
echo    Khi thay dong:   Local:  http://localhost:3001
echo    -^> Mo trinh duyet va vao:  http://localhost:3001
echo.
echo    DE TAT: dong cua so nay (hoac bam Ctrl + C)
echo ================================================================
echo.
call npx next dev -p 3001
echo.
echo (Neu co chu mau do o tren, chup man hinh nay gui lai.)
pause
