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
                .then(response => response.text())
                .then(data => {
                    document.getElementById('result').innerText = data;
                })
                .catch(error => console.error('Error fetching data:', error));
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

        document.getElementById('get').addEventListener('click', () => {
		io_wasm.get();
	});

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
