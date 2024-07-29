#include <string.h>
#include <stdlib.h>

#include <stdarg.h>
#include <stdio.h>

#define WIDTH 640
#define HEIGHT 480
#define LEFT 0
#define RIGHT 1
#define UP 2
#define DOWN 3

__attribute__((import_module("io_wasm"), import_name("jsprintf"))) 
void js_jsprintf(char* str);

__attribute__((import_module("io_wasm"), import_name("setPixel"))) 
void js_set_pixel(int x, int y, uint32_t color);

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

float ball_x = 100.0f;
float ball_y = 100.0f;
float ball_radius = 30.0f;
float ball_speed_x = 2.0f;
float ball_speed_y = 1.5f;

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

void draw_ball(uint8_t* buffer) {
	int x0 = (int)ball_x;
	int y0 = (int)ball_y;
	int r = (int)ball_radius;

	for (int y = -r; y <= r; ++y) {
		for (int x = -r; x <= r; ++x) {
			if (x*x + y*y <= r*r) {
				int px = x0 + x;
				int py = y0 + y;

				if (px >= 0 && px < WIDTH && py >= 0 && py < HEIGHT) {
					int index = (py * WIDTH + px) * 4;
					fillPixel(buffer, index, 0X9399B2FF);
				}
			}
		}
	}
}

void update_ball_position() {
	ball_x += ball_speed_x;
	ball_y += ball_speed_y;

	if (ball_x < ball_radius || ball_x > WIDTH - ball_radius) {
		ball_speed_x = -ball_speed_x;
	}
	if (ball_y < ball_radius || ball_y > HEIGHT - ball_radius) {
		ball_speed_y = -ball_speed_y;
	}
}

void tick() {
	update_ball_position();
	clearScreen(pixel_data);
	draw_ball(pixel_data);
	js_draw_canvas((uint32_t)(uintptr_t)pixel_data, WIDTH * HEIGHT * 4);
}

int init() {
	char *text = "WASM animation";
	jsprintf("Message from main(): %s", text ? text : "Allocation failed");
	pixel_data = (uint8_t*)malloc(WIDTH * HEIGHT * 4);
	if(pixel_data == NULL) {
		return 1;
	}
	return 0;
}

void keyboard_action(uint8_t keyCode) {
	switch (keyCode) {
		case LEFT:
			if(ball_speed_x > 0) {
				ball_speed_x = -ball_speed_x;
			}
			break;
		case RIGHT:
			if(ball_speed_x < 0) {
				ball_speed_x = -ball_speed_x;
			}
			break;
		case UP:
			if(ball_speed_y > 0) {
				ball_speed_y = -ball_speed_y;
			}
			break;
		case DOWN:
			if(ball_speed_y < 0) {
				ball_speed_y = -ball_speed_y;
			}
			break;
	}
}
