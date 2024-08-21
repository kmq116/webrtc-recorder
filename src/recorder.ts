let mediaRecorder;
let audioChunks = [];
let audioStream;

// 获取可用的音频输入设备
async function getAudioInputDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "audioinput");
}

// 显示设备选择界面
async function showDeviceSelection() {
  const devices = await getAudioInputDevices();
  const deviceList = document.getElementById("deviceList");
  deviceList.innerHTML = "";

  devices.forEach((device) => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.text = device.label || `麦克风 ${deviceList.length + 1}`;
    deviceList.appendChild(option);
  });
}

// 获取麦克风音频流
async function getMicrophoneStream() {
  try {
    const deviceId = (
      document.getElementById("deviceList") as HTMLSelectElement
    ).value;
    const constraints = {
      audio: { deviceId: deviceId ? { exact: deviceId } : undefined },
    };
    audioStream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("获取麦克风音频流成功");
    return audioStream;
  } catch (error) {
    console.error("获取麦克风音频流失败:", error);
  }
}

// 开始录音和播放
async function startRecordAndPlay() {
  const stream = await getMicrophoneStream();
  console.log("stream", stream);
  if (!stream) return;

  // 创建MediaRecorder对象
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
    console.log("收到音频数据块，大小：", event.data.size);
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const audioUrl = URL.createObjectURL(audioBlob);
    console.log("录音结束，音频URL：", audioUrl);

    // 创建音频元素并播放
    const audio = new Audio(audioUrl);
    audio
      .play()
      .then(() => {
        console.log("开始播放录音");
      })
      .catch((error) => {
        console.error("播放录音失败：", error);
      });
  };

  // 开始录音
  mediaRecorder.start();
  console.log("开始录音");
}

// 停止录音和播放
function stopRecordAndPlay() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    console.log("停止录音");
  }

  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop());
    console.log("停止音频流");
  }
}

// 初始化
async function init() {
  await showDeviceSelection();
  // 获取按钮元素
  const playButton = document.getElementById("play") as HTMLButtonElement;
  const stopButton = document.getElementById("stop") as HTMLButtonElement;

  // 为按钮添加事件监听器
  playButton.addEventListener("click", startRecordAndPlay);
  stopButton.addEventListener("click", stopRecordAndPlay);
}

// 调用初始化函数
init();
