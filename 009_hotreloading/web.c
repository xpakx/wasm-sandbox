#include <string.h>
#include <stdlib.h>

#include <stdarg.h>
#include <stdio.h>
#include <math.h>

#define WIDTH 640
#define HEIGHT 480

__attribute__((import_module("io_wasm"), import_name("jsprintf"))) 
void js_jsprintf(char* str);

__attribute__((import_module("io_wasm"), import_name("drawCanvas"))) 
void js_draw_canvas(uint32_t ptr, uint32_t length);

void jsprintf(const char* format, ...) {
	char buffer[1024];
	va_list args;
	va_start(args, format);
	vsnprintf(buffer, sizeof(buffer), format, args); 
	va_end(args);    
	js_jsprintf(buffer);
}

struct GameState {
  int xPos;
  int yPos;
};

struct GameState state;

uint8_t* pixel_data;

void fillPixel(uint8_t* buffer, int index, int color) {
	buffer[index] = (color >> 24) & 0xFF;
	buffer[index + 1] = (color >> 16) & 0xFF;
	buffer[index + 2] = (color >> 8) & 0xFF;
	buffer[index + 3] = color & 0xFF;
}

void clearScreen(uint8_t* buffer) {
	for (int y = 0; y < HEIGHT; y++) {
		for (int x = 0; x < WIDTH; x++) {
			int index = (y * WIDTH + x) * 4;
			fillPixel(buffer, index, 0X1E1E2EFF);
		}
	}
}

void draw(uint8_t* buffer) {
	clearScreen(buffer);
	for (int y = state.yPos; y < state.yPos + 100; y++) {
		for (int x = state.xPos; x < state.xPos + 100; x++) {
			int index = (y * WIDTH + x) * 4;
			fillPixel(buffer, index, 0xFF0000FF);
		}
	}
}

void update() {
}

void tick() {
	update();
	draw(pixel_data);
	js_draw_canvas((uint32_t)(uintptr_t)pixel_data, WIDTH * HEIGHT * 4);
}

int init() {
	jsprintf("WASM hotreloading");
	pixel_data = (uint8_t*)malloc(WIDTH * HEIGHT * 4);
	if(pixel_data == NULL) {
		jsprintf("Couldn't allocate canvas.");
		return 1;
	}
	state.xPos = 100;
	state.yPos = 100;
	return 0;
}
