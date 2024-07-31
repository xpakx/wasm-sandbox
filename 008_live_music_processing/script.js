window.onload = () => {
	preparePlayer();
	init();
}

let audioContext = undefined;
let workletNode = undefined;

async function init() {

	const compiledWasm = await WebAssembly.compileStreaming(fetch('./web.wasm'));

	document.getElementById('audioFileInput').addEventListener('change', async function(event) {
		const file = event.target.files[0];
		if (file) {
			const audioPlayer = document.getElementById('audioPlayer');
			const fileURL = URL.createObjectURL(file);
			audioPlayer.src = fileURL;
			audioPlayer.play();

			if(!audioContext) {
				audioContext = new AudioContext();
				workletNode = await createAudioProcessor(audioContext);
				workletNode.port.onmessage = (e) => console.log(e.data);
				workletNode.port.postMessage({type: "wasm", wasm: compiledWasm});
				const sourceNode = audioContext.createMediaElementSource(audioPlayer);
				sourceNode.connect(workletNode);
				workletNode.connect(audioContext.destination);
			}
		}
	});

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

	const bitSlider = document.getElementById('bit-depth-slider');
	const rateSlider = document.getElementById('rate-reduction-slider');
	const bitButton = document.getElementById('bit-crusher-button');

	var isPlaying = false;
	var activeEffect = true;

	playPauseBtn.addEventListener('click', () => {
		if (isPlaying) {
			audio.pause();
		} else {
			audio.play();
		}
	});

	bitButton.addEventListener('click', () => {
		if(!workletNode) {
			return;
		}
		activeEffect = !activeEffect;
		workletNode.port.postMessage({type: "active", value: activeEffect});
	});

	bitSlider.addEventListener('input', (event) => {
		console.log(`Slider value: ${event.target.value}`);
		if(!workletNode) {
			return;
		}
		workletNode.port.postMessage({type: "depth", value: Number(event.target.value)});
	});
	rateSlider.addEventListener('input', (event) => {
		console.log(`Slider value: ${event.target.value}`);
		if(!workletNode) {
			return;
		}
		workletNode.port.postMessage({type: "reduction", value: Number(event.target.value)});
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
