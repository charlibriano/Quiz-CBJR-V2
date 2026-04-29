window.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("bg-music");

    if (document.getElementById("visualizer")) return;

    const canvas = document.createElement("canvas");
    canvas.id = "visualizer";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    Object.assign(canvas.style, {
        position: "fixed",
        bottom: "0",
        left: "0",
        width: "100%",
        height: "150px",
        zIndex: "0",
        pointerEvents: "none",
        filter: "brightness(1.2) saturate(1.5)"
    });

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = 150;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(audio);
    const analyser = audioCtx.createAnalyser();

    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256; // Menor resolução para um efeito mais fluido
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Ajustar o número de barras do equalizador
    const barWidth = canvas.width / bufferLength;
    const barHeight = canvas.height;

    // Função de desenho
    function draw() {
        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let x = 0;

        // Desenha as barras do equalizador
        for (let i = 0; i < bufferLength; i++) {
            const value = dataArray[i];
            const barHeight = value / 2; // Controla o "pulo" da barra

            // Estilo das barras
            const intensity = value / 255;
            const hue = (i * 3 + performance.now() / 20) % 360; // Cor dinâmica
            const saturation = 100;
            const lightness = 50 + intensity * 30;

            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight); // Desenha a barra

            x += barWidth + 1; // Espaçamento entre as barras
        }
    }

    draw();

    document.body.addEventListener("click", () => {
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
    });
});
