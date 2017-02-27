#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
in float index;
uniform sampler2D samplers[1 + N/2];
vec2 texCoord[2];
out vec2 position;
out float delta;
out float subdivisionFlag;
out vec2 values[N];

#define W 2048.0
#define H 2048.0
vec2 uvPosition (in float i) {
    return vec2 (mod (i, W) / W + 0.5 / W, floor (i / W) / H + 0.5 / H);
}

bool validOutgoingEdge () {
    vec3 next = texture (samplers[0], texCoord[1]).xyz;
    return distance (position, next.xy) < min (delta, next.z);
}

void main (void) {
    float j = 1.0;
    if (mod (index, 3.0) > 1.0)
        j = -2.0;
    texCoord[0] = uvPosition (index);
    texCoord[1] = uvPosition (index + j);
    vec4 s = texture (samplers[0], texCoord[0]);
    position = s.xy;
    delta = s.z;
    subdivisionFlag = s.w;
    if (subdivisionFlag == 1.0 && validOutgoingEdge ())
        subdivisionFlag = 0.0;
    for (int i = 1; i < N/2; i++) {
        s = texture (samplers[i], texCoord[0]);
        values[2*i-2] = s.xy;
        values[2*i-1] = s.zw;
    }
}
