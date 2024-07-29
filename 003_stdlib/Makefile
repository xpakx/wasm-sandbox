all: web.wasm web.wat

web.wasm: web.c
	clang --target=wasm32-unknown-wasi -O3 -flto --sysroot /opt/wasi-libc -nodefaultlibs -lc -nostartfiles -Wl,--import-memory -Wl,--no-entry -Wl,--export=malloc_copy -Wl,--export=malloc -Wl,--export=add -Wl,--export=hello -Wl,--lto-O3 -o web.wasm web.c

web.wat: web.wasm
	wasm2wat web.wasm > web.wat
