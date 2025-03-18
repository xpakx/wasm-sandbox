.PHONY: all clean

all: web.wasm

web.wasm: web.odin
	../../odin/odin/odin build web.odin  -file -target:freestanding_wasm32

clean:
	rm -f web.wasm
