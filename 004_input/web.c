#include <string.h>
#include <stdlib.h>

#include <stdarg.h>
#include <stdio.h>


__attribute__((optnone)) 
void* always_malloc(size_t size)
{
    return malloc(size);
}

__attribute__((import_module("io_wasm"), import_name("jsprintf"))) 
void js_jsprintf(char* str);

__attribute__((import_module("io_wasm"), import_name("setPixel"))) 
void js_set_pixel(int x, int y, uint32_t color);

void jsprintf(const char* format, ...) {
	char buffer[1024];
	va_list args;
	va_start(args, format);
	vsnprintf(buffer, sizeof(buffer), format, args); 
	va_end(args);    
	js_jsprintf(buffer);
}

int main() {
	char *text = "WASM canvas";
	jsprintf(text);
	jsprintf("Message from main(): %s", text ? text : "Allocation failed");

	for (int i = 1; i <= 100; i++) {
		for (int j = 1; j <= 100; j++) {
			js_set_pixel(i, j, 0xFF0000FF);
		}
	}
	return 0;
}
