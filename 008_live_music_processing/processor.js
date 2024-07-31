class WASMAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(_inputs, _outputs, _parameters) {
    return true;
  }
}
registerProcessor("wasm-processor", WASMAudioProcessor);
