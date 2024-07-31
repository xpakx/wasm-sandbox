let wasi = {};

// https://wasix.org/docs/api-reference/wasi/args_get
wasi.fd_close = function() { };
wasi.fd_seek = function() { };
wasi.fd_write = function() { };

class WASMAudioProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.sendMsg("msg", "Hello from AudioWorklet");
		console.log("Um");
		this.port.onmessage = (e) => this.processMessage(e.data);
	}

	process(_inputs, _outputs, _parameters) {
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

	initWasm(wasm) {
		const memory = new WebAssembly.Memory({ initial: 50 });
		let io_wasm = {};
		io_wasm.jsprintf = function(base) {
			const view = new Uint8Array(memory.buffer);
			const text = decode(view, base);
			console.log(text);
		}

		WebAssembly.instantiate(wasm,
			{ env: { memory }, wasi_snapshot_preview1: wasi, io_wasm: io_wasm }
		);
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
