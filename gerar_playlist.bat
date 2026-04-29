@echo off
echo Iniciando processo para gerar playlist...



REM Caminho do Node.js
SET NODE_PATH="C:\Program Files\nodejs\node.exe"



REM Caminho do script JS
SET SCRIPT_PATH=%~dp0gerarPlaylist.js



REM Navega até a pasta do projeto
cd /d %~dp0



echo Executando script Node.js...
%NODE_PATH% %SCRIPT_PATH%



echo.
echo Processo finalizado.
pause
 