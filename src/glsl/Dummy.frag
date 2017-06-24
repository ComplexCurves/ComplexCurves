#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
out vec4 fColor;
void main(void) {
    fColor = vec4(1.0);
}
