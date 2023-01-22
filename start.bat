cd /d %~dp0
if exist setpath.bat call setpath.bat
call npm update
node proxy.js
pause
