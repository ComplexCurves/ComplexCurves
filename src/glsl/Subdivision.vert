#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
in vec4 indexBarycentric;
in float indexOffsetIn;
in float indexOffsetOut;
out vec3 barycentric;
out vec2 texCoord[3];

void main (void) {
    float indexOut = indexBarycentric.x + indexOffsetOut;
    gl_Position = indexedPosition (indexOut);
    barycentric = indexBarycentric.yzw;
    texCoord[0] = uvPosition (indexOffsetIn);
    texCoord[1] = uvPosition (indexOffsetIn + 1.0);
    texCoord[2] = uvPosition (indexOffsetIn + 2.0);
}
