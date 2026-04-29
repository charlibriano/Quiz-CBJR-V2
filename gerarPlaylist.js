const fs = require('fs');
const path = require('path');



// Caminho da pasta onde estão as músicas
const musicFolder = path.join(__dirname, 'musicas'); // Verifique se a pasta 'musicas' está no mesmo diretório que este arquivo
const playlist = [];



// Função para obter a lista de arquivos .mp3
fs.readdir(musicFolder, (err, files) => {
    if (err) {
        console.error('Erro ao ler o diretório de músicas:', err);
        process.exit(1);
    }



    // Filtrando apenas os arquivos .mp3
    files.filter(file => file.endsWith('.mp3')).forEach(file => {
        const musicUrl = `https://github.com/charlibriano/Quiz-CBJR/raw/main/musicas/${file}`;
        playlist.push({
            title: path.basename(file, '.mp3'),
            url: musicUrl
        });
    });



    // Criando o arquivo playlist.json
    fs.writeFile('playlist.json', JSON.stringify(playlist, null, 2), err => {
        if (err) {
            console.error('Erro ao salvar o arquivo playlist.json:', err);
        } else {
            console.log('Arquivo playlist.json gerado com sucesso!');
        }
    });
});
 