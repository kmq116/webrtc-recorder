class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 8000;
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const inputData = input[0];

    if (!inputData) {
      return true;
    }


    if (sampleRate !== this.targetSampleRate) {
      const ratio = sampleRate / this.targetSampleRate;
      const newLength = Math.round(inputData.length / ratio);
      const result = new Int16Array(newLength);

      for (let i = 0; i < newLength; i++) {
        const index = Math.min(Math.round(i * ratio), inputData.length - 1);
        result[i] = Math.max(-32768, Math.min(32767, Math.round(inputData[index] * 32767)));
      }

      this.port.postMessage(result);
    } else {
      // If sample rate is already 48000Hz, just convert to Int16Array
      const result = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        result[i] = Math.max(-32768, Math.min(32767, Math.round(inputData[i] * 32767)));
      }
      this.port.postMessage(result);
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);