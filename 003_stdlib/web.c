#include <string.h>
#include <stdlib.h>

#include <stdarg.h>
#include <stdio.h>

int add(int a, int b) {
  return a + b;
}

char* hello() {
	char *text = malloc(1024);
	text = "Hello from WASM!";
	return text;
}
