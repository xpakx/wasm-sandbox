#include <string.h>
#include <stdlib.h>

#include <stdarg.h>
#include <stdio.h>


__attribute__((import_module("io_wasm"), import_name("jsprintf"))) 
void js_jsprintf(char* str);


void jsprintf(const char* format, ...) {
	char buffer[1024];
	va_list args;
	va_start(args, format);
	vsnprintf(buffer, sizeof(buffer), format, args); 
	va_end(args);    
	js_jsprintf(buffer);
}

int main() {
	char *text = "Hello from WASM";
	jsprintf(text);
	jsprintf("Message from main(): %s", text ? text : "Allocation failed");
	return 0;
}
