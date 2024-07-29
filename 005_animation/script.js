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
	const { instance } = await WebAssembly.instantiateStreaming(
		fetch("./web.wasm"),
		{ env: { memory }, wasi_snapshot_preview1: wasi, io_wasm: io_wasm }
	);

	const returnCode = instance.exports.init();
	console.log("Return code:", returnCode);
	if(returnCode != 0) {
		return;
	}

	document.addEventListener('keydown', function(event) {
		switch (event.key) {
			case 'ArrowLeft': case 'h':
				instance.exports.keyboard_action(0);
			break;
			case 'ArrowRight': case 'l':
				instance.exports.keyboard_action(1);
			break;
			case 'ArrowUp': case 'k':
				instance.exports.keyboard_action(2);
			break;
			case 'ArrowDown': case 'j':
				instance.exports.keyboard_action(3);
			break;
		}
	});


	canvas.addEventListener("click", (event) => {
		const rect = canvas.getBoundingClientRect();

		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		instance.exports.click(mouseX, mouseY);
	});

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
