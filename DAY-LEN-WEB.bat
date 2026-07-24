@echo off
title DAY LEN WEB - Coastal Land
echo ================================================================
echo    DAY THAY DOI LEN WEB THAT (coastalland.vn)
echo ================================================================
echo.

echo [1/5] Luu thay doi (commit)...
cd /d "C:\Users\X1 GEN 8\Projects\cvr-website\.claude\worktrees\admin-content-structure-edit-a5b099"
git add -A
git commit -m "Cap nhat noi dung web"

echo.
echo [2/5] Chuyen sang nhanh chinh (main)...
cd /d "C:\Users\X1 GEN 8\Projects\cvr-website"
git checkout main

echo.
echo [3/5] Lay ban moi nhat (pull)...
git pull origin main

echo.
echo [4/5] Gop thay doi vao main (merge)...
git merge claude/admin-content-structure-edit-a5b099 --no-edit

echo.
echo [5/5] Day len GitHub (push)...
git push origin main

echo.
echo ================================================================
echo    XONG! Vercel se tu cap nhat coastalland.vn trong ~2-3 phut.
echo.
echo    LUU Y: neu thay chu "CONFLICT" hoac chu mau do o tren,
echo    hay CHUP MAN HINH nay gui lai - DUNG lam tiep.
echo ================================================================
pause
