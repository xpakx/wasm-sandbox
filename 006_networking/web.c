#include <string.h>
#include <stdlib.h>

#include <stdarg.h>
#include <stdio.h>
#include <math.h>

__attribute__((optnone)) 
void* always_malloc(size_t size)
{
    return malloc(size);
}

__attribute__((import_module("io_wasm"), import_name("jsprintf"))) 
void js_jsprintf(char* str);

__attribute__((import_module("io_wasm"), import_name("get"))) 
void js_get();

__attribute__((import_module("io_wasm"), import_name("sleep"))) 
void js_sleep(int ms);

void jsprintf(const char* format, ...) {
	char buffer[1024];
	va_list args;
	va_start(args, format);
	vsnprintf(buffer, sizeof(buffer), format, args); 
	va_end(args);    
	js_jsprintf(buffer);
}

int main() {
	char *text = "WASM networking. Click buttons to get data from server.";
	jsprintf("Message from main(): %s", text ? text : "Allocation failed");
	return 0;
}

void on_get(char* ptr) {
	jsprintf("Message from on_get(): %s", ptr);
	free(ptr);
}

void click() {
	jsprintf("Message from click(): Button clicked.");
	js_get();
}

void click_sleep() {
	jsprintf("Message from click_sleep(): before sleep");
	js_sleep(5000);
}

void on_sleep_ended() {
	jsprintf("Message from on_sleep_ended(): after sleep");
}
