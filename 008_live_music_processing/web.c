#include <string.h>
#include <stdlib.h>

#include <stdarg.h>
#include <stdio.h>
#include <math.h>

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

void apply_bitcrusher(float* audio, int length, int bit_depth, int sample_rate_reduction) {
	float total_q_levels = powf(2, bit_depth);
	for (int i = 0; i < length; i++) {
		if(sample_rate_reduction > 1 && i%sample_rate_reduction) {
			audio[i] = audio[i - i%sample_rate_reduction];
			continue;
		}

		float val = audio[i];
		float remainder = fmodf(val, 1/total_q_levels);

		audio[i] = val - remainder;
	}
}
