all: web.wasm web.wat

web.wasm: web.c
	clang --target=wasm32 -O3 -flto -nostdlib -Wl,--no-entry -Wl,--export-all -Wl,--lto-O3 -o web.wasm web.c

web.wat: web.wasm
	wasm2wat web.wasm > web.wat
