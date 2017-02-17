#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform mat4 m;
uniform mat4 v;
uniform mat4 p;
in vec4 posValue;
out vec4 vPos;
out vec2 v_value;
void main (void)
{
    vPos = vec4 (posValue.xyz, 1.0);
    v_value = posValue.zw;
    gl_Position = p * v * m * vPos;
}
