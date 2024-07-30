all: web.wasm web.wat

web.wasm: web.c
	clang --target=wasm32-unknown-wasi -O3 -flto --sysroot /opt/wasi-libc -nodefaultlibs -lc -nostartfiles -Wl,--import-memory -Wl,--no-entry -Wl,--export=main -Wl,--export=malloc -Wl,--export=on_get -Wl,--export=click -Wl,--export=click_sleep -Wl,--export=on_sleep_ended -Wl,--export=click_post -Wl,--export=on_post -Wl,--lto-O3 -o web.wasm web.c

web.wat: web.wasm
	wasm2wat web.wasm > web.wat
