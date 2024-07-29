all: web.wasm web.wat

web.wasm: web.c
	clang --target=wasm32-unknown-wasi -O3 -flto --sysroot /opt/wasi-libc -nodefaultlibs -lc -nostartfiles -Wl,--import-memory -Wl,--no-entry -Wl,--export=init -Wl,--export=tick -Wl,--export=keyboard_action -Wl,--export=click -Wl,--lto-O3 -o web.wasm web.c

web.wat: web.wasm
	wasm2wat web.wasm > web.wat
