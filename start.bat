cd /d %~dp0
if exist setpath.bat call setpath.bat
:boot
if exist now_restarting del now_restarting
node esncbe.cjs
if not exist now_restarting goto end
goto boot
:end
pause
