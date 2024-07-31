let wasi = {};

// https://wasix.org/docs/api-reference/wasi/args_get
wasi.fd_close = function() { };
wasi.fd_seek = function() { };
wasi.fd_write = function() { };

let canvas = undefined;
let ctx = undefined;
let globalInstance = undefined;
let memory = undefined;
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

window.onload = () => {
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	canvas.width = 640;
	canvas.height = 480;
	init();
	setUpWs();
}

async function init() {
	memory = new WebAssembly.Memory({ initial: 2 });
	const { instance } = await WebAssembly.instantiateStreaming(
		fetch("./web.wasm"),
		{ env: { memory }, wasi_snapshot_preview1: wasi, io_wasm: io_wasm }
	);
	globalInstance = instance;

	const returnCode = globalInstance.exports.init();
	console.log("Return code:", returnCode);
	if(returnCode != 0) {
		return;
	}

	function render() {
		globalInstance.exports.tick();
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

	socket.addEventListener('message', async (event) => {
		const message = event.data;
		console.log('Message from HotReload server:', message);
		await reloadWasm();
	});

	socket.addEventListener('close', () => {
		console.log('Disconnected from HotReload server');
	});

	socket.addEventListener('error', (error) => {
		console.error('HotReload server error:', error);
	});
}

function decodeCoords(num) {
	var w = Math.floor((Math.sqrt(8 * num + 1) - 1) / 2);
	var t = Math.floor((Math.pow(w, 2) + w) / 2);
	var y = Math.floor(num - t);
	var x = Math.floor(w - y);
	return {x, y}
}

async function reloadWasm() {
	if(!globalInstance) {
		console.error("No WASM instance");
		return undefined;
	}

	let new_memory = new WebAssembly.Memory({ initial: 2 });
	const { instance } = await WebAssembly.instantiateStreaming(
		fetch("./web.wasm", { cache: "no-store" }),
		{ env: { memory: new_memory }, wasi_snapshot_preview1: wasi, io_wasm: io_wasm }
	);

	const previousState = globalInstance.exports.get_state();
	const state = decodeCoords(previousState);
	console.log(`Sending state (${state.x}, ${state.y})`);
	memory = new_memory;
	instance.exports.set_state(state.x, state.y);
	globalInstance = instance;
}
