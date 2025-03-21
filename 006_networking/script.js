let wasi = {};

wasi.fd_close = function() { };
wasi.fd_seek = function() { };
wasi.fd_write = function() { };

window.onload = () => {
	init();
}

async function init() {
	const memory = new WebAssembly.Memory({ initial: 2 });
	let io_wasm = {};
	io_wasm.get = function() {
		fetch('http://localhost:8001')
                .then(response => response.arrayBuffer())
		.then(data => saveData(data))
		.then(pointer => notifyWasm(pointer))
                .catch(error => console.error('Error fetching data:', error));
	}
	io_wasm.post = function(pointer) {
		const view = new Uint8Array(memory.buffer);
		const data = decode(view, pointer);
		fetch('http://localhost:8001', { 'method' : 'POST', body: data })
                .then(response => response.arrayBuffer())
		.then(data => saveData(data))
		.then(pointer => notifyWasmPost(pointer))
                .catch(error => console.error('Error fetching data:', error));
	}
	io_wasm.sleep = function sleep(ms) {
		console.log(ms);
		new Promise(resolve => setTimeout(resolve, ms))
		.then(() => instance.exports.on_sleep_ended());
	}
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

	document.getElementById("get").addEventListener("click", () => {
		instance.exports.click();
	});

	document.getElementById("sleep").addEventListener("click", () => {
		instance.exports.click_sleep();
	});

	document.getElementById("post").addEventListener("click", () => {
		instance.exports.click_post();
	});

	function saveData(buffer) {
		let data = new Uint8Array(buffer);
		console.log(data);
		const pInput = instance.exports.malloc(data.length);
		const view = new Uint8Array(memory.buffer);
		encode(view, pInput, data);
		return pInput
	}

	function notifyWasm(pointer) {
		instance.exports.on_get(pointer);
	}

	function notifyWasmPost(pointer) {
		instance.exports.on_post(pointer);
	}
	const returnCode = instance.exports.main();
	console.log("Return code:", returnCode);
	if(returnCode != 0) {
		return;
	}

}

function printToElem(value, selector) {
	const result = document.querySelector(selector);
	if(!result) {
		return;
	}
	result.textContent = value;
}

function encode(memory, base, data) {
	for (let i = 0; i < data.length; i++) {
		memory[base + i] = data[i];
	}
	memory[base + data.length] = 0;
};

function decode(memory, base) {
	let cursor = base;
	let result = '';

	while (memory[cursor] !== 0) {
		result += String.fromCharCode(memory[cursor++]);
	}

	return result;
};
