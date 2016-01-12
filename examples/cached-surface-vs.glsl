#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
attribute vec4 position;
uniform mat4 m, v, p;
varying vec4 vPos;
varying vec2 vValue;
void main (void)
{
    vValue = position.zw;
    vPos = vec4 (position.xyz, 1.0);
    gl_Position = p * v * m * vPos;
}
