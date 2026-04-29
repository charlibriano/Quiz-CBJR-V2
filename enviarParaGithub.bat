@echo off



echo Configurando o diretório C:/ como seguro para o Git...
git config --global --add safe.directory C:/



echo Adicionando o arquivo playlist.json ao Git...
git add playlist.json



echo Fazendo commit do arquivo...
git commit -m "Adicionando playlist.json"



echo Enviando o arquivo para o GitHub...
git push origin main



echo Processo concluído!
pause
 