@echo off
rem Lich Windows "CoastalLand-NopLichSuGia" goi tep nay moi gio: may tu nop lich su gia Cowork giao (xem nop-lich-su-gia.mjs).
cd /d "%~dp0.."
node scripts\nop-lich-su-gia.mjs >> "%TEMP%\coastalland-nop-lich-su-gia.log" 2>&1
