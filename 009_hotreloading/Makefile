EXPORTS = -Wl,--export=init -Wl,--export=tick -Wl,--export=keyboard_action
ifdef DEV
    EXPORTS += -Wl,--export=get_state -Wl,--export=set_state
endif
CFLAGS = --target=wasm32-unknown-wasi -O3 -flto --sysroot /opt/wasi-libc -nodefaultlibs -lc -nostartfiles -Wl,--import-memory -Wl,--no-entry -Wl,--lto-O3 $(EXPORTS)
ifdef DEV
    CFLAGS += -DDEVELOPMENT
endif

all: web.wasm web.wat

web.wasm: web.c
	clang $(CFLAGS) -o web.wasm web.c

web.wat: web.wasm
	wasm2wat web.wasm > web.wat
