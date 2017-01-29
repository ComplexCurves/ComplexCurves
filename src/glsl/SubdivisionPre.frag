#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D sampler;
in vec2 texCoord[2];
out vec4 fColor;

bool validOutgoingEdge () {
    vec3 next = texture (sampler, texCoord[1]).xyz;
    return distance (fColor.xy, next.xy) < min (fColor.z, next.z);
}

void main(void) {
    fColor = texture (sampler, texCoord[0]);
    if (fColor.w == 1.0 && validOutgoingEdge ())
        fColor.w = 0.0;
}
