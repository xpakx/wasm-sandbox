async function init() {
	const memory = new WebAssembly.Memory({ initial: 2 });
	const { instance } = await WebAssembly.instantiateStreaming(
		fetch("./web.wasm"),
		{ env: { memory } }
	);

	print(instance.exports.add(4, 1), 1);

	const text = 'Hello from JavaScript!';
	const pInput = instance.exports.malloc(1024);
	const view = new Uint8Array(memory.buffer);
	encode(view, pInput, text);
	const pOutput = instance.exports.malloc_copy(pInput, text.length);
	const res =  decode(view, pOutput);
	print(res, 2);


	const next = instance.exports.hello();
	const newView = new Uint8Array(memory.buffer);
	const nextResult =  decode(newView, next);
	print(nextResult, 3);
}

init();


function print(value, targetId) {
	const name = `result${targetId}`;
	const result = document.getElementById(name);
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
