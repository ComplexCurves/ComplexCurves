#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
attribute float index;
uniform float numIndices;
varying float sheet;
varying vec2 texCoord[3];
varying float which;

void main (void) {
    gl_Position = indexedPosition (index);
    sheet = floor (index / numIndices);
    which = mod (index, 3.0);
    texCoord[0] = uvPosition (mod (index - which, numIndices));
    texCoord[1] = uvPosition (mod (index - which + 1.0, numIndices));
    texCoord[2] = uvPosition (mod (index - which + 2.0, numIndices));
}
