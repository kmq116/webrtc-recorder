<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let audioContext: AudioContext;
	let sourceNode: MediaStreamAudioSourceNode;
	let mediaRecorder: MediaRecorder;
	let audioChunks: Blob[] = [];
	let devices: MediaDeviceInfo[] = [];
	let selectedDeviceId: string = '';
	let recorder: AudioWorkletNode;
	let isRecording: boolean = false;
	let rawAudioChunks: Int16Array[] = [];

	async function getAudioInputDevices() {
		if (browser) {
			const allDevices = await navigator.mediaDevices.enumerateDevices();
			devices = allDevices.filter((device) => device.kind === 'audioinput');
			if (devices.length > 0) {
				selectedDeviceId = devices[0].deviceId;
			}
		}
	}

	async function getMicrophoneStream() {
		if (browser) {
			try {
				const constraints = {
					audio: {
						deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
						noiseSuppression: true,
						echoCancellation: true,
						autoGainControl: true
					}
				};
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				console.log('获取麦克风音频流成功');
				return stream;
			} catch (error) {
				console.error('获取麦克风音频流失败:', error);
			}
		}
	}

	async function startRecordAndPlay() {
		audioChunks = [];
		try {
			const stream = await getMicrophoneStream();
			if (!stream) return;

			audioContext = new AudioContext();
			sourceNode = audioContext.createMediaStreamSource(stream);

			const delayNode = audioContext.createDelay(0.1);
			delayNode.delayTime.value = 0.1;

			const gainNode = audioContext.createGain();
			gainNode.gain.value = 0.5;

			sourceNode.connect(delayNode);
			delayNode.connect(gainNode);
			gainNode.connect(audioContext.destination);

			mediaRecorder = new MediaRecorder(stream);

			mediaRecorder.ondataavailable = (event) => {
				audioChunks.push(event.data);
			};

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
				const audioUrl = URL.createObjectURL(audioBlob);
				console.log('录音结束，音频URL：', audioUrl);
			};

			mediaRecorder.start(100);
			console.log('开始录音和播放');
		} catch (error) {
			console.error('启动录音和播放失败:', error);
		}
	}

	function stopRecordAndPlay() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			console.log('停止录音');
		}

		if (sourceNode) {
			sourceNode.disconnect();
		}

		if (audioContext) {
			audioContext.close();
		}

		console.log('停止播放');
	}

	onMount(async () => {
		if (browser) {
			await getAudioInputDevices();
		}
	});

	async function startRecordRaw() {
		if (!browser) return;

		const stream = await getMicrophoneStream();
		if (!stream) return;

		audioContext = new AudioContext();
		sourceNode = audioContext.createMediaStreamSource(stream);

		await audioContext.audioWorklet.addModule('/audioProcessor.js');
		recorder = new AudioWorkletNode(audioContext, 'audio-processor');
		sourceNode.connect(recorder);
		recorder.connect(audioContext.destination);

		isRecording = true;
		rawAudioChunks = [];

		recorder.port.onmessage = (event) => {
			if (!isRecording) return;
			console.log('开始录制 raw 文件', event.data);

			rawAudioChunks.push(event.data);
		};

		console.log('开始录制 raw 文件');
	}

	function stopRecordRaw() {
		if (!isRecording) return;

		isRecording = false;

		if (recorder) {
			recorder.disconnect();
		}

		if (sourceNode) {
			sourceNode.disconnect();
		}

		if (audioContext) {
			audioContext.close();
		}

		saveRawFile();
	}

	function saveRawFile() {
		const rawData = concatenateInt16Arrays(rawAudioChunks);
		const buffer = rawData.buffer;

		const blob = new Blob([buffer], { type: 'application/octet-stream' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = 'audio_8000hz_mono_16bit.raw';
		a.click();

		URL.revokeObjectURL(url);
	}

	function concatenateInt16Arrays(arrays: Int16Array[]): Int16Array {
		const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
		const result = new Int16Array(totalLength);
		let offset = 0;
		for (const arr of arrays) {
			result.set(arr, offset);
			offset += arr.length;
		}
		return result;
	}
</script>

<select bind:value={selectedDeviceId}>
	{#each devices as device}
		<option value={device.deviceId}>
			{device.label || `麦克风 ${devices.indexOf(device) + 1}`}
		</option>
	{/each}
</select>

<button on:click={startRecordAndPlay}>开始录音和播放</button>
<button on:click={stopRecordAndPlay}>停止录音和播放</button>

<button on:click={startRecordRaw}>录制 raw 文件</button>
<button on:click={stopRecordRaw}>停止录制 raw 文件</button>
