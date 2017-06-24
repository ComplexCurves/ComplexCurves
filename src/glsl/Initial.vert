#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
in vec2 pos;
out vec2 position;
out float delta;
out float subdivisionFlag;
out vec2 values[N];
void main (void) {
    position = clamp (pos, -5.0, 5.0);
    vec2 cs[N+1];
    f (position, cs);
    roots (sheets, cs, values);
    delta = Delta (position, values);
    subdivisionFlag = 1.0;
}
