#include <string.h>
#include <stdlib.h>

#include <stdarg.h>
#include <stdio.h>

char* malloc_copy(char *input)
{
    char *result = malloc(1024);
    strncpy(result, input, strlen(input));
    return result;
}

int add(int a, int b) {
  return a + b;
}

char* hello() {
	char *text = malloc(1024);
	text = "Hello from WASM!";
	return text;
}
