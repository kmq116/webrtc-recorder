class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const inputData = input[0];

    // 重采样到 8000Hz
    const ratio = sampleRate / 8000;
    const newLength = Math.round(inputData.length / ratio);
    const result = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
      // 将 Float32 转换为 Int16
      result[i] = Math.max(-32768, Math.min(32767, Math.round(inputData[Math.round(i * ratio)] * 32767)));
    }

    this.port.postMessage(result);
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);