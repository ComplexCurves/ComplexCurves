#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
attribute float index;
attribute vec2 position;
varying vec2 vPosition;
void main (void) {
    vPosition = position;
    const float w = 2048.0, h = 2048.0;
    float x = mod (index, w) / w;
    float y = floor (index / w) / h;
    gl_Position = vec4 (x * 2.0 - 1.0 + 1.0 / w, y * 2.0 - 1.0 + 1.0 / h, 0.0, 1.0);
}
