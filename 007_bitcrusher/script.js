let wasi = {};

// https://wasix.org/docs/api-reference/wasi/args_get
wasi.fd_close = function() { };
wasi.fd_seek = function() { };
wasi.fd_write = function() { };


window.onload = () => {
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
	var context = new window.AudioContext;
	var audioBuffer = undefined;
	var audioDataCrushed = undefined;
	var originalRate = 44100;
	document.getElementById('audioFileInput').addEventListener('change', function(event) {
		const file = event.target.files[0];
		if (file) {
			const audioPlayer = document.getElementById('audioPlayer');
			const fileURL = URL.createObjectURL(file);
			audioPlayer.src = fileURL;
			audioPlayer.play();

			document.getElementById('button').disabled = true;

			const reader = new FileReader();
			reader.onload = function(e) {
				const arrayBuffer = e.target.result;
				context.decodeAudioData(arrayBuffer, function(buffer) {
					audioBuffer = buffer;
					originalRate = audioBuffer.sampleRate;
					document.getElementById('button').disabled = false;
				}, function(error) {
					console.error('Error decoding audio data:', error);
				});
			};
			reader.readAsArrayBuffer(file);
		}
	});


	document.getElementById("button").addEventListener("click", (event) => {
		const buffer = audioBuffer.getChannelData(0);
		console.log(buffer);
		const data_len = 10000;
		const ptr = instance.exports.malloc(data_len * Float32Array.BYTES_PER_ELEMENT);
		const view = new Float32Array(memory.buffer);
		console.log("memory len", view.length);
		console.log("data len", data_len * Float32Array.BYTES_PER_ELEMENT);
		console.log("pointer", ptr);
		let sli = buffer.slice(0, data_len);
		view.set(sli, ptr);
		moveSoundToMemory(view, ptr, buffer.slice(0, data_len));
		console.log('Data in WASM memory:', new Float32Array(view.buffer, ptr, data_len));
		instance.exports.apply_bitcrusher(ptr, data_len, 8, 4);
		var newView = getSoundFromMemory(memory, ptr, data_len);
		console.log('Data in WASM memory:', new Float32Array(view.buffer, ptr, data_len));
		console.log(newView.length);
		audioDataCrushed = new Float32Array(newView);
		console.log(newView);
		instance.exports.free(ptr);
	});

	document.getElementById('playCrushed').addEventListener('click', function() {
		const audioPlayer = document.getElementById('audioPlayer');
		audioPlayer.pause();

		const sampleRate = originalRate;

		context.close();
		context = new window.AudioContext;

		const audioBuffer = context.createBuffer(1, audioDataCrushed.length, sampleRate);
		audioBuffer.getChannelData(0).set(audioDataCrushed);

		const source = context.createBufferSource();
		source.buffer = audioBuffer;

		source.connect(context.destination);
		source.start();
	});

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
