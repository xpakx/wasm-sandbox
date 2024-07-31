let wasi = {};

// https://wasix.org/docs/api-reference/wasi/args_get
wasi.fd_close = function() { };
wasi.fd_seek = function() { };
wasi.fd_write = function() { };

window.onload = () => {
	preparePlayer();
	init();
}

async function init() {
	const memory = new WebAssembly.Memory({ initial: 50 });
	let io_wasm = {};
	io_wasm.jsprintf = function(base) {
		const view = new Uint8Array(memory.buffer);
		const text = decode(view, base);
		console.log(text);
		printToElem(text, "#result");
	}

	const { instance } = await WebAssembly.instantiateStreaming(
		fetch("./web.wasm"),
		{ env: { memory }, wasi_snapshot_preview1: wasi, io_wasm: io_wasm }
	);

	document.getElementById('audioFileInput').addEventListener('change', function(event) {
		const file = event.target.files[0];
		if (file) {
			const audioPlayer = document.getElementById('audioPlayer');
			const fileURL = URL.createObjectURL(file);
			audioPlayer.src = fileURL;
			audioPlayer.play();
		}
	});

	// TODO: create an AudioWorkletNode
	// TODO: pass wasm module to AudioWorkletNode
	// TODO: pass sound to AudioWorkletNode
	// TODO: add interface to change bitcrusher's arguments
}

function printToElem(value, selector) {
	const result = document.querySelector(selector);
	if(!result) {
		return;
	}
	result.textContent = value;
}

function moveSoundToMemory(memory, base, data) {
	memory.set(data, base / Float32Array.BYTES_PER_ELEMENT);
};

function decode(memory, base) {
	let cursor = base;
	let result = '';

	while (memory[cursor] !== 0) {
		result += String.fromCharCode(memory[cursor++]);
	}

	return result;
};

function getSoundFromMemory(memory, base, data_len) {
    return new Float32Array(memory.buffer, base, data_len);
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
