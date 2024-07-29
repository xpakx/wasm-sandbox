all: web.wasm web.wat

web.ll: web.c
	clang --target=wasm32 -emit-llvm -c -S web.c

web.o: web.ll
	llc -march=wasm32 -filetype=obj web.ll

web.wasm: web.o
	wasm-ld --no-entry --export-all -o web.wasm web.o

web.wat: web.wasm
	wasm2wat web.wasm > web.wat
