@echo off
echo Iniciando processo para gerar playlist...



:: Caminho do Node.js
set NODE_PATH="C:\Program Files\nodejs\node.exe"



:: Caminho para o script Node.js
set SCRIPT_PATH=C:\CBJR\gerarPlaylist.js



:: Navega até o diretório do projeto
cd /d C:\CBJR



:: Executa o script Node.js para gerar playlist.json
%NODE_PATH% %SCRIPT_PATH%



:: Se o script foi executado corretamente, continua com o commit
if %ERRORLEVEL% NEQ 0 (
    echo Ocorreu um erro ao gerar a playlist. Abortando o commit.
    pause
    exit /b
)



:: Adicionando e fazendo commit do arquivo playlist.json
git add playlist.json
git commit -m "Adicionando o arquivo playlist.json"
git push origin main



:: Finalizando
echo Processo concluído com sucesso!
pause
 