#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
in float index;
in vec2 position;
out vec2 vPosition;
void main (void) {
    vPosition = position;
    gl_Position = indexedPosition (index);
}
