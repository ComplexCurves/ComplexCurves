precision highp float;
attribute vec4 indexBarycentric;
uniform float indexOffsetIn;
uniform float indexOffsetOut;
varying vec3 barycentric;
varying vec2 texCoord[3];

vec2 uvPosition (in float w, in float h, in float i) {
    return vec2 (mod (i, w) / w + 0.5 / w, floor (i / w) / h + 0.5 / h);
}

vec2 indexedPosition (in float w, in float h, in float i) {
    float x = mod (i, w) / w;
    float y = floor (i / w) / h;
    return vec2 (x * 2.0 - 1.0 + 1.0 / w, y * 2.0 - 1.0 + 1.0 / h);
}

void main (void) {
    float indexOut = indexBarycentric.x + indexOffsetOut;
    const float w = 2048.0, h = 2048.0;
    gl_Position = vec4 (indexedPosition (w, h, indexOut), 0.0, 1.0);
    barycentric = indexBarycentric.yzw;
    texCoord[0] = uvPosition (w, h, indexOffsetIn);
    texCoord[1] = uvPosition (w, h, indexOffsetIn + 1.0);
    texCoord[2] = uvPosition (w, h, indexOffsetIn + 2.0);
}
