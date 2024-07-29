#include <string.h>
#include <stdlib.h>

#include <stdarg.h>
#include <stdio.h>


#define WIDTH 640
#define HEIGHT 480

__attribute__((optnone)) 
void* always_malloc(size_t size)
{
    return malloc(size);
}

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

void make_gradient() {
	uint8_t* pixel_data;
	pixel_data = (uint8_t*)malloc(WIDTH * HEIGHT * 4);

	if (pixel_data == NULL) {
		printf("Memory allocation failed!\n");
		return;
	}

	for (int y = 0; y < HEIGHT; y++) {
		for (int x = 0; x < WIDTH; x++) {
			int index = (y * WIDTH + x) * 4;
			float horizontal_interp = (float)x / (WIDTH - 1);
			float vertical_interp = (float)y / (HEIGHT - 1);

			uint8_t r = (uint8_t)(horizontal_interp * 255);
			uint8_t g = (uint8_t)(vertical_interp * 255);

			pixel_data[index] = r;
			pixel_data[index + 1] = g;
			pixel_data[index + 2] = 128;
			pixel_data[index + 3] = 255;
		}
	}

	js_draw_canvas((uint32_t)(uintptr_t)pixel_data, WIDTH * HEIGHT * 4);
	free(pixel_data);
}

int main() {
	char *text = "WASM gradient";
	jsprintf(text);
	jsprintf("Message from main(): %s", text ? text : "Allocation failed");

	for (int i = 1; i <= 100; i++) {
		for (int j = 1; j <= 100; j++) {
			js_set_pixel(i, j, 0xFF0000FF);
		}
	}
	make_gradient();
	return 0;
}
