#extension GL_EXT_draw_buffers : require
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vPosition;
void main(void) {
    vec2 position = clamp (vPosition, -5.0, 5.0);
    vec2 values[N];
    vec2 cs[N+1];
    f (position, cs);
    weierstrass (cs, values);
    float delta = Delta (position, values);
    gl_FragData[0] = vec4 (position, delta, 1.0);
    const vec2 zero = vec2 (0.0, 0.0);
    gl_FragData[1].xy = sheets > 0 ? values[0] : zero;
    gl_FragData[1].zw = sheets > 1 ? values[1] : zero;
    gl_FragData[2].xy = sheets > 2 ? values[2] : zero;
    gl_FragData[2].zw = sheets > 3 ? values[3] : zero;
    gl_FragData[3].xy = sheets > 4 ? values[4] : zero;
    gl_FragData[3].zw = sheets > 5 ? values[5] : zero;
    gl_FragData[4].xy = sheets > 6 ? values[6] : zero;
    gl_FragData[4].zw = sheets > 7 ? values[7] : zero;
}
