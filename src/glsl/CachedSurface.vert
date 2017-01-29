#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
in vec4 position;
uniform mat4 m, v, p;
out vec4 vPos;
out vec2 vValue;
void main (void)
{
    vPos = vec4 (position.xyz, 1.0);
    vValue = position.zw;
    gl_Position = p * v * m * vPos;
}
