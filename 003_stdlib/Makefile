all: web.wasm web.wat

web.wasm: web.c
	clang --target=wasm32-unknown-wasi -O3 -flto --sysroot /opt/wasi-libc -nodefaultlibs -lc -nostartfiles -Wl,--import-memory -Wl,--no-entry -Wl,--export-all -Wl,--lto-O3 -o web.wasm web.c

# web.wasm: web-unopt.wasm
# 	wasm-opt -O web-unopt.wasm -o web.wasm
# clang uses wasm-opt automatically if detected, but it seems that --no-wasm-opt flag would be available in the next release

web.wat: web.wasm
	wasm2wat web.wasm > web.wat

# changes: 1. wasi target and sysroot 2. -nodefaultlibs to not load libclang_rt.builtins-wasm32.a 3. -lc to load libc
