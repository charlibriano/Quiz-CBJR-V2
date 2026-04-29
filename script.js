const musicas = [
    { nome: 'I Feel So Good Today', arquivo: 'musicas/i-feel-so-good-today.mp3' },
    { nome: 'Como Tudo Deve Ser', arquivo: 'musicas/como-tudo-deve-ser.mp3' },
    { nome: 'Lugar ao Sol', arquivo: 'musicas/lugar-ao-sol.mp3' },
    { nome: 'Tamo ai na Atividade', arquivo: 'musicas/tamo-ai-na-atividade.mp3' },
    { nome: 'Uma Criança com Seu Olhar', arquivo: 'musicas/uma-criança-com-seu-olhar.mp3' },
    { nome: 'Não Deixe o Mar Te Engolir', arquivo: 'musicas/nao-deixe-o-mar-te-engolir.mp3' }
  ];
  
  let musicIndex = 0;
  const music = document.getElementById('bg-music');
  const musicTitle = document.getElementById('current-music');
  const canvas = document.getElementById('visualizer');
  const ctx = canvas.getContext('2d');
  
  let audioCtx, analyser, source, dataArray, bufferLength;
  
  // Atualiza a música no player
  function updateMusic() {
    music.src = musicas[musicIndex].arquivo;
    musicTitle.textContent = `Tocando agora: ${musicas[musicIndex].nome}`;
    music.play();
  }
  
  // Função para dar play/pause
  function playPause() {
    if (music.paused) {
      music.play();
      document.querySelector('.play-btn i').classList.replace('fa-play', 'fa-pause');
    } else {
      music.pause();
      document.querySelector('.play-btn i').classList.replace('fa-pause', 'fa-play');
    }
  }
  
  // Função para avançar para a próxima música
  function nextMusic() {
    musicIndex = (musicIndex + 1) % musicas.length;
    updateMusic();
  }
  
  // Função para voltar para a música anterior
  function previousMusic() {
    musicIndex = (musicIndex - 1 + musicas.length) % musicas.length;
    updateMusic();
  }
  
  // Configuração do visualizador gráfico
  function setupVisualizer() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      source = audioCtx.createMediaElementSource(music);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyser.fftSize = 64;
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }
    draw();
  }
  
  // Função que desenha no canvas
  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    const barWidth = (canvas.width / bufferLength) * 1.5;
    let x = 0;
  
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      const r = 255;
      const g = 204;
      const b = 0;
  
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  
  // Inicia a visualização quando a música começa a tocar
  audio.addEventListener('play', () => {
    setupVisualizer();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });
  
  updateMusic();
  
  // Definição das perguntas e respostas do quiz
  const perguntas = [
    {
      pergunta: "Qual o nome do vocalista do Charlie Brown Jr.?",
      respostas: ["Chorão", "Champignon", "Marcão", "Renato Russo"],
      correta: 'Chorão'
    },
    {
      pergunta: "Qual álbum tem a música 'Zóio de Lula'?",
      respostas: ["Nadando com os Tubarões", "Preço Curto... Prazo Longo", "Tamo Aí na Atividade", "Imunidade Musical"],
      correta: 1
    },
    {
      pergunta: "Em que cidade surgiu a banda Charlie Brown Jr.?",
      respostas: ["São Paulo", "Rio de Janeiro", "Santos", "Curitiba"],
      correta: 2
    }
  ];
  
  let currentQuestion = 0;
  let acertos = 0;
  let erros = 0;
  
  // Função para iniciar o quiz
  function startQuiz() {
    document.getElementById("start-btn").style.display = "none";
    document.getElementById("restart-btn").style.display = "none";
    currentQuestion = 0;
    acertos = 0;
    erros = 0;
    atualizarScore();
    document.getElementById("medalha").textContent = "";
    mostrarPergunta();
  }
  
  // Função para exibir a pergunta do quiz
  function mostrarPergunta() {
    const q = perguntas[currentQuestion];
    document.getElementById("question").textContent = q.pergunta;
    const answersDiv = document.getElementById("answers");
    answersDiv.innerHTML = "";
    q.respostas.forEach((resposta, index) => {
      const btn = document.createElement("button");
      btn.textContent = resposta;
      btn.onclick = () => verificarResposta(index);
      answersDiv.appendChild(btn);
    });
  }
  
  // Função para verificar a resposta
  function verificarResposta(index) {
    const q = perguntas[currentQuestion];
    const botoes = document.querySelectorAll("#answers button");
    botoes.forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correta) {
        btn.classList.add("correto");
      } else if (i === index) {
        btn.classList.add("errado");
      }
    });
  
    if (index === q.correta) {
      document.getElementById("feedback").textContent = "Resposta correta!";
      acertos++;
    } else {
      document.getElementById("feedback").textContent = "Resposta errada.";
      erros++;
    }
  
    atualizarScore();
  
    setTimeout(() => {
      document.getElementById("feedback").textContent = "";
      currentQuestion++;
      if (currentQuestion < perguntas.length) {
        mostrarPergunta();
      } else {
        mostrarResultado();
      }
    }, 1000);
  }
  
  // Função para atualizar o placar
  function atualizarScore() {
    document.getElementById("score").textContent = `Acertos: ${acertos} | Erros: ${erros}`;
  }
  
  // Função para exibir o resultado final
  function mostrarResultado() {
    document.getElementById("question").textContent = "Quiz finalizado!";
    document.getElementById("answers").innerHTML = "";
    document.getElementById("restart-btn").style.display = "inline-block";
    atualizarScore();
  
    const medalha = document.getElementById("medalha");
    if (acertos === perguntas.length) {
      medalha.textContent = "🏅 Ouro! Você é um fã raiz do CBJR!";
    } else if (acertos >= perguntas.length / 2) {
      medalha.textContent = "🥈 Prata! Mandou bem!";
    } else {
      medalha.textContent = "🥉 Bronze! Dá pra melhorar!";
    }
  }
  
  // Função para reiniciar o quiz
  function restartQuiz() {
    startQuiz();
  }
  