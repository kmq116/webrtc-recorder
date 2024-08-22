let audioContext: AudioContext;
let sourceNode: MediaStreamAudioSourceNode;
let mediaRecorder: MediaRecorder;
let audioChunks: Blob[] = [];

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
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
      },
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("获取麦克风音频流成功");
    return stream;
  } catch (error) {
    console.error("获取麦克风音频流失败:", error);
  }
}

// 开始录音和播放
async function startRecordAndPlay() {
  audioChunks = [];
  try {
    const stream = await getMicrophoneStream();
    if (!stream) return;

    audioContext = new AudioContext();
    sourceNode = audioContext.createMediaStreamSource(stream);

    // 创建一个延迟节点，用于模拟回声效果
    const delayNode = audioContext.createDelay(0.1);
    delayNode.delayTime.value = 0.1; // 100毫秒延迟

    // 创建一个增益节点来控制音量
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5; // 设置音量为50%，可以根据需要调整

    // 连接节点：源节点 -> 延迟节点 -> 增益节点 -> 输出
    sourceNode.connect(delayNode);
    delayNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 创建MediaRecorder对象
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log("录音结束，音频URL：", audioUrl);
    };

    // 开始录音
    mediaRecorder.start(100); // 每100毫秒生成一个数据块
    console.log("开始录音和播放");
  } catch (error) {
    console.error("启动录音和播放失败:", error);
  }
}

// 停止录音和播放
function stopRecordAndPlay() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    console.log("停止录音");
  }

  if (sourceNode) {
    sourceNode.disconnect();
  }

  if (audioContext) {
    audioContext.close();
  }

  console.log("停止播放");
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
