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
		this.sendMsg("msg", "pong");
	}

	log(msg) {
		console.log("Message inside WorkletProcessor:", msg);
	}
}
registerProcessor("wasm-processor", WASMAudioProcessor);
