const audioContext = new AudioContext();
const audioBuffer = await fetch("./test.mp3")
  .then((response) => response.arrayBuffer())
  .then((arrayBuffer) => {
    console.log(arrayBuffer);
    audioContext
      .decodeAudioData(arrayBuffer)
      .then((audioBuffer) => {
        console.log(audioBuffer);
      })
      .catch((error) => {
        console.warn(error);
      });
  });

const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

const canvas = document.getElementById("waveform");
const canvasCtx = canvas.getContext("2d");

function draw() {
  requestAnimationFrame(draw);

  analyser.getByteTimeDomainData(dataArray);

  canvasCtx.fillStyle = "rgb(200, 200, 200)";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "rgb(0, 0, 0)";

  canvasCtx.beginPath();

  const sliceWidth = (canvas.width * 1.0) / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();
}

draw();

const source = audioContext.createBufferSource();
source.buffer = audioBuffer;
source.connect(analyser);
analyser.connect(audioContext.destination);
source.start();
