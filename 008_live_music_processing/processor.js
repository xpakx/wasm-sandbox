let wasi = {};

// https://wasix.org/docs/api-reference/wasi/args_get
wasi.fd_close = function() { };
wasi.fd_seek = function() { };
wasi.fd_write = function() { };

class WASMAudioProcessor extends AudioWorkletProcessor {
        ptr = undefined;
	instance = undefined;
	memory = new WebAssembly.Memory({ initial: 50 });

	constructor() {
		super();
		this.sendMsg("msg", "Hello from AudioWorklet");
		console.log("Um");
		this.port.onmessage = (e) => this.processMessage(e.data);
	}

	process(inputs, outputs, _parameters) {
		const input = inputs[0];
		const output = outputs[0];
		if(!input[0] || !output[0] || !this.ptr) {
			return false;
		}

		const data_len = 128;
		// const packetLen = input[0].length; 
		// https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
		// TODO: currently it's 128 always, but we should check and realloc memory if necessary to
		// future proof this

		for (let channel = 0; channel < output.length; ++channel) {
			const view = new Float32Array(this.memory.buffer);
			this.moveSoundToMemory(view, this.ptr, input[channel]);
			this.instance.exports.apply_bitcrusher(this.ptr, data_len, 8, 50);
			var out = this.getSoundFromMemory(this.memory, this.ptr, data_len);
			output[channel].set(out);
		}
		return true;

	}

	sendMsg(type, msg) {
		this.port.postMessage({type:type, content: msg});
	}

	processMessage(msg) {
		this.log(msg);
		if(!msg.type) {
			return;
		}
		if(msg.type == "wasm") {
			this.initWasm(msg.wasm);
		}
		this.sendMsg("msg", "pong");
	}

	async initWasm(wasm) {
		let io_wasm = {};
		io_wasm.jsprintf = function(base) {
			const view = new Uint8Array(memory.buffer);
			const text = decode(view, base);
			console.log(text);
		}

		const memory = this.memory;
		WebAssembly.instantiate(wasm,
			{ env: { memory }, wasi_snapshot_preview1: wasi, io_wasm: io_wasm }
		).then(instance => {
			this.instance = instance;
			console.log(this.instance);
			this.ptr = this.instance.exports.malloc(128 * Float32Array.BYTES_PER_ELEMENT); // TODO
		}).catch(error => console.error(error));
	}

	log(msg) {
		console.log("Message inside WorkletProcessor:", msg);
	}

	moveSoundToMemory(memory, base, data) {
		memory.set(data, base / Float32Array.BYTES_PER_ELEMENT);
	};

	getSoundFromMemory(memory, base, data_len) {
		return new Float32Array(memory.buffer, base, data_len);
	}

	decode(memory, base) {
		let cursor = base;
		let result = '';

		while (memory[cursor] !== 0) {
			result += String.fromCharCode(memory[cursor++]);
		}

		return result;
	};

}
registerProcessor("wasm-processor", WASMAudioProcessor);
