let wasi = {};

// https://wasix.org/docs/api-reference/wasi/args_get
wasi.fd_close = function() { };
wasi.fd_fdstat_get = function() { };
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
}

function setPixel(x, y, color) {
	const imageData = ctx.createImageData(1, 1);
	const data = imageData.data;

	data[0] = (color >> 24) & 0xFF; // R
	data[1] = (color >> 16) & 0xFF; // G
	data[2] = (color >> 8) & 0xFF;  // B
	data[3] = color & 0xFF;         // A
	ctx.putImageData(imageData, x, y);
}

async function init() {
	const memory = new WebAssembly.Memory({ initial: 2 });
	let io_wasm = {};
	io_wasm.jsprintf = function(base) {
		const view = new Uint8Array(memory.buffer);
		const text = decode(view, base);
		console.log(text);
		printToElem(text, "#result");
	}
	io_wasm.drawCanvas = function(ptr, length) {
		const imageData = new Uint8ClampedArray(memory.buffer, ptr, length);
		const data = new ImageData(imageData, 640, 480);
		ctx.putImageData(data, 0, 0);
	}
	io_wasm.setPixel = setPixel;
	const { instance } = await WebAssembly.instantiateStreaming(
		fetch("./web.wasm"),
		{ env: { memory }, wasi_snapshot_preview1: wasi, io_wasm: io_wasm }
	);

	const returnCode = instance.exports.main();
	console.log(returnCode);
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
