window.onload = () => {
	preparePlayer();
	init();
}

async function init() {

	const compiledWasm = await WebAssembly.compileStreaming(fetch('./web.wasm'));
	var audioContext = undefined;

	document.getElementById('audioFileInput').addEventListener('change', async function(event) {
		const file = event.target.files[0];
		if (file) {
			const audioPlayer = document.getElementById('audioPlayer');
			const fileURL = URL.createObjectURL(file);
			audioPlayer.src = fileURL;
			audioPlayer.play();

			if(!audioContext) {
				let audioContext = new AudioContext();
				let processor = await createAudioProcessor(audioContext);
				processor.port.onmessage = (e) => console.log(e.data);
				processor.port.postMessage({type: "wasm", wasm: compiledWasm});
			}
		}
	});

	// TODO: pass sound to AudioWorkletNode
	// TODO: add interface to change bitcrusher's arguments
}


async function createAudioProcessor(audioContext) {
	if (!audioContext) {
		return;
	}
	try {
		await audioContext.resume();
		await audioContext.audioWorklet.addModule("./processor.js");
	} catch (e) {
		console.log(e);
		return null;
	}

	return new AudioWorkletNode(audioContext, "wasm-processor");
}

function printToElem(value, selector) {
	const result = document.querySelector(selector);
	if(!result) {
		return;
	}
	result.textContent = value;
}

function preparePlayer() {
	const audio = document.getElementById('audioPlayer');
	const playPauseBtn = document.getElementById('play-pause');
	const fileBtn = document.getElementById('getFile');
	const fileChooser = document.getElementById('audioFileInput');
	const progress = document.getElementById('progress');
	const currentTimeElem = document.getElementById('current-time');
	const durationElem = document.getElementById('duration');

	var isPlaying = false;

	playPauseBtn.addEventListener('click', () => {
		if (isPlaying) {
			audio.pause();
		} else {
			audio.play();
		}
	});

	fileBtn.addEventListener('click', () => {
		fileChooser.click();
	});

	audio.addEventListener('play', () => {
		isPlaying = true;
		playPauseBtn.textContent = '⏸';
	});

	audio.addEventListener('pause', () => {
		isPlaying = false;
		playPauseBtn.textContent = '⏵';
	});

	audio.addEventListener('ended', () => {
		audio.play();
	});

	audio.addEventListener('timeupdate', () => {
		const { currentTime, duration } = audio;
		const progressPercent = (currentTime / duration) * 100;
		progress.style.width = `${progressPercent}%`;

		let minutes = Math.floor(currentTime / 60);
		let seconds = Math.floor(currentTime % 60);
		let secString = (seconds >= 10) ? `${seconds}` : `0${seconds}`;
		currentTimeElem.textContent = `${minutes}:${secString}`;

		if (duration) {
			let totalMinutes = Math.floor(duration / 60);
			let totalSeconds = Math.floor(duration % 60);
			let secString = (totalSeconds >= 10) ? `${totalSeconds}` : `0${totalSeconds}`;
			durationElem.textContent = `${totalMinutes}:${secString}`;
		}
	});
}
