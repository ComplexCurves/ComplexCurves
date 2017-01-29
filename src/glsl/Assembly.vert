#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
in float index;
uniform float numIndices;
uniform float sheet;
out vec2 texCoord[3];
out float which;

void main (void) {
    gl_Position = indexedPosition (sheet * numIndices + index);
    which = mod (index, 3.0);
    texCoord[0] = uvPosition (index - which);
    texCoord[1] = uvPosition (index - which + 1.0);
    texCoord[2] = uvPosition (index - which + 2.0);
}
