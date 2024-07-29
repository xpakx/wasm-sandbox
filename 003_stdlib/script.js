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



async function init() {
	const memory = new WebAssembly.Memory({ initial: 2 });
	const { instance } = await WebAssembly.instantiateStreaming(
		fetch("./web.wasm"),
		{ env: { memory }, wasi_snapshot_preview1: wasi }
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
