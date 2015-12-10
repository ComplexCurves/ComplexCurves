#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
attribute vec4 position;
uniform mat4 m, v, p;
varying vec2 vValue;
void main (void)
{
    vValue = position.zw;
    gl_Position = p * v * m * vec4 (position.xyz, 1.0);
}
