let wasi = {};

// https://wasix.org/docs/api-reference/wasi/args_get
wasi.args_get = function() { };
wasi.args_sizes_get = function() { };
wasi.environ_get = function() { };
wasi.environ_sizes_get = function() { };
wasi.clock_res_get = function() { };
wasi.clock_time_get = function() { };
wasi.fd_advise = function() { };
wasi.fd_allocate = function() { };
wasi.fd_close = function() { };
wasi.fd_datasync = function() { };
wasi.fd_fdstat_get = function() { };
wasi.fd_fdstat_set_flags = function() { };
wasi.fd_fdstat_set_rights = function() { };
wasi.fd_filestat_get = function() { };
wasi.fd_filestat_set_size = function() { };
wasi.fd_filestat_set_times = function() { };
wasi.fd_pread = function() { };
wasi.fd_prestat_get = function() { };
wasi.fd_prestat_dir_name = function() { };
wasi.fd_pwrite = function() { };
wasi.fd_read = function() { };
wasi.fd_readdir = function() { };
wasi.fd_renumber = function() { };
wasi.fd_seek = function() { };
wasi.fd_sync = function() { };
wasi.fd_tell = function() { };
wasi.fd_write = function() { };
wasi.path_create_directory = function() { };
wasi.path_filestat_get = function() { };
wasi.path_filestat_set_times = function() { };
wasi.path_link = function() { };
wasi.path_open = function() { };
wasi.path_readlink = function() { };
wasi.path_remove_directory = function() { };
wasi.path_rename = function() { };
wasi.path_symlink = function() { };
wasi.path_unlink_file = function() { };
wasi.poll_oneoff = function() { };
wasi.proc_exit = function() { };
wasi.proc_raise = function() { };
wasi.sched_yield = function() { };
wasi.random_get = function() { };
wasi.sock_accept = function() { };
wasi.sock_recv = function() { };
wasi.sock_send = function() { };
wasi.sock_shutdown = function() { };

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
