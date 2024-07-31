let wasi = {};

// https://wasix.org/docs/api-reference/wasi/args_get
wasi.fd_close = function() { };
wasi.fd_seek = function() { };
wasi.fd_write = function() { };

let canvas = undefined;
let ctx = undefined;

window.onload = () => {
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	canvas.width = 640;
	canvas.height = 480;
	init();
	setUpWs();
}

async function init() {
	const memory = new WebAssembly.Memory({ initial: 2 });
	let io_wasm = {};
	io_wasm.jsprintf = function(base) {
		const view = new Uint8Array(memory.buffer);
		const text = decode(view, base);
		console.log(text);
	}
	io_wasm.drawCanvas = function(ptr, length) {
		const imageData = new Uint8ClampedArray(memory.buffer, ptr, length);
		const data = new ImageData(imageData, 640, 480);
		ctx.putImageData(data, 0, 0);
	}
	const { instance } = await WebAssembly.instantiateStreaming(
		fetch("./web.wasm"),
		{ env: { memory }, wasi_snapshot_preview1: wasi, io_wasm: io_wasm }
	);

	const returnCode = instance.exports.init();
	console.log("Return code:", returnCode);
	if(returnCode != 0) {
		return;
	}

	function render() {
		instance.exports.tick();
		window.requestAnimationFrame(render);
	}

	render();
}

function printToElem(value, selector) {
	const result = document.querySelector(selector);
	if(!result) {
		return;
	}
	result.textContent = value;
}


function encode(memory, base, string) {
	for (let i = 0; i < string.length; i++) {
		memory[base + i] = string.charCodeAt(i);
	}

	memory[base + string.length] = 0;
};

function decode(memory, base) {
	let cursor = base;
	let result = '';

	while (memory[cursor] !== 0) {
		result += String.fromCharCode(memory[cursor++]);
	}

	return result;
};


function setUpWs() {
	const url = 'ws://localhost:8765';
	const socket = new WebSocket(url);
	socket.addEventListener('open', () => {
		console.log('Connected to HotReload server');
	});

	socket.addEventListener('message', (event) => {
		const message = event.data;
		console.log('Message from HotReload server:', message);
	});

	socket.addEventListener('close', () => {
		console.log('Disconnected from HotReload server');
	});

	socket.addEventListener('error', (error) => {
		console.error('HotReload server error:', error);
	});
}
