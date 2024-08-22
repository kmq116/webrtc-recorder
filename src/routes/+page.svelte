<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let audioContext: AudioContext;
	let sourceNode: MediaStreamAudioSourceNode;
	let mediaRecorder: MediaRecorder;
	let audioChunks: Blob[] = [];
	let devices: MediaDeviceInfo[] = [];
	let selectedDeviceId: string = '';

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
