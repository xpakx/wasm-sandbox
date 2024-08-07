#include <string.h>
#include <stdlib.h>

#include <stdarg.h>
#include <stdio.h>
#include <math.h>

#define WIDTH 640
#define HEIGHT 480
#define LEFT 0
#define RIGHT 1
#define UP 2
#define DOWN 3

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
  int speedX;
  int speedY;
};

struct GameState state;
int color = 0x00F0F0FF;

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

void draw_square(uint8_t* buffer, int xPos, int yPos, int size, int color) {
	for (int y = yPos; y < yPos + size; y++) {
		for (int x = xPos; x < xPos + size; x++) {
			int index = (y * WIDTH + x) * 4;
			fillPixel(buffer, index, color);
		}
	}
}

void draw_circle(uint8_t* buffer, int xPos, int yPos, int size, int color) {
	int x0 = xPos+(int)(size/2);
	int y0 = yPos+(int)(size/2);
	int r = (int)(size/2);

	for (int y = -r; y <= r; ++y) {
		for (int x = -r; x <= r; ++x) {
			if (x*x + y*y <= r*r) {
				int px = x0 + x;
				int py = y0 + y;

				if (px >= 0 && px < WIDTH && py >= 0 && py < HEIGHT) {
					int index = (py * WIDTH + px) * 4;
					fillPixel(buffer, index, color);
				}
			}
		}
	}
}

void draw(uint8_t* buffer) {
	clearScreen(buffer);
	draw_square(buffer, state.xPos, state.yPos, 100, color);
}

void update() {
	state.xPos += state.speedX;
	state.yPos += state.speedY;
	int size = 100;
	if (state.xPos < 0 || state.xPos > WIDTH - size) {
		state.speedX = 0;
		state.xPos = state.xPos < 0 ? 0 : WIDTH - size;
	}
	if (state.yPos < 0 || state.yPos > HEIGHT - size) {
		state.speedY = 0;
		state.yPos = state.yPos < 0 ? 0 : HEIGHT - size;
	}
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

#ifdef DEVELOPMENT
int get_state() {
	jsprintf("Getting state");
	int x = floor(state.xPos);
	int y = floor(state.yPos);
	return (((x + y) * (x + y + 1)) / 2) + y; // TODO: would be better to pass struct, but i'll use cantor pairing function for now
}

int set_state(int x, int y) {
	jsprintf("Setting state (%d, %d)", x, y);
	pixel_data = (uint8_t*)malloc(WIDTH * HEIGHT * 4);
	if(pixel_data == NULL) {
		jsprintf("Couldn't allocate canvas.");
		return 1;
	}
	state.xPos = x*1.0;
	state.yPos = y*1.0;
}
#endif

void keyboard_action(uint8_t keyCode, int pressed) {
	switch (keyCode) {
		case LEFT:
			state.speedX = pressed == 0 ? 0 : -1;
			break;
		case RIGHT:
			state.speedX = pressed == 0 ? 0 : 1;
			break;
		case UP:
			state.speedY = pressed == 0 ? 0 : -1;
			break;
		case DOWN:
			state.speedY = pressed == 0 ? 0 : 1;
			break;
	}
}
