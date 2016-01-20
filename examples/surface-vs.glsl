#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform mat4 m;
uniform mat4 v;
uniform mat4 p;
uniform sampler2D sampler;
attribute float index;
varying vec2 v_value;
const float w = 2048.0, h = 2048.0;
vec2 uvPosition (in float w, in float h, in float i) {
    return vec2 (mod (i, w) / w + 0.5 / w, floor (i / w) / h + 0.5 / h);
}
void main (void)
{
    vec4 posValue = texture2D (sampler, uvPosition (w, h, index));
    v_value = posValue.zw;
    gl_Position = p * v * m * vec4 (posValue.xyz, 1.0);
}
