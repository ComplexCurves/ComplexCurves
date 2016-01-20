#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
attribute float index;
varying vec2 texCoord[2];

vec2 uvPosition (in float w, in float h, in float i) {
    return vec2 (mod (i, w) / w + 0.5 / w, floor (i / w) / h + 0.5 / h);
}

vec2 indexedPosition (in float w, in float h, in float i) {
    float x = mod (i, w) / w;
    float y = floor (i / w) / h;
    return vec2 (x * 2.0 - 1.0 + 1.0 / w, y * 2.0 - 1.0 + 1.0 / h);
}

void main (void) {
    const float w = 2048.0, h = 2048.0;
    gl_Position = vec4 (indexedPosition (w, h, index), 0.0, 1.0);
    float j = 1.0;
    if (mod (index, 3.0) > 1.0)
        j = -2.0;
    texCoord[0] = uvPosition (w, h, index);
    texCoord[1] = uvPosition (w, h, index + j);
}