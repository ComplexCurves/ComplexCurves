#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
in float index;
uniform sampler2D samplers[1 + N/2];
out vec2 position;
out float delta;
out float subdivisionFlag;
out vec2 values[N];

#define W 2048.0
#define H 2048.0
vec2 uvPosition (in float i) {
    return vec2 (mod (i, W) / W + 0.5 / W, floor (i / W) / H + 0.5 / H);
}

void main (void) {
    float which = mod (index, 3.0);
    vec2 texCoordWhich = uvPosition (index);
    vec2 texCoord[3];
    texCoord[0] = uvPosition (index - which);
    texCoord[1] = uvPosition (index - which + 1.0);
    texCoord[2] = uvPosition (index - which + 2.0);
    vec4 s = texture (samplers[0], texCoordWhich);
    position = s.xy;
    delta = s.z;
    subdivisionFlag = 0.0;
    vec3 positionDelta[3];
    positionDelta[0] = texture (samplers[0], texCoord[0]).xyz;
    positionDelta[1] = texture (samplers[0], texCoord[1]).xyz;
    positionDelta[2] = texture (samplers[0], texCoord[2]).xyz;
    if (distance (positionDelta[0].xy, positionDelta[1].xy) >= min (positionDelta[0].z, positionDelta[1].z))
        subdivisionFlag += 4.0;
    if (distance (positionDelta[1].xy, positionDelta[2].xy) >= min (positionDelta[1].z, positionDelta[2].z))
        subdivisionFlag += 2.0;
    if (distance (positionDelta[2].xy, positionDelta[0].xy) >= min (positionDelta[2].z, positionDelta[0].z))
        subdivisionFlag += 1.0;
    if (subdivisionFlag == 3.0 && distance (positionDelta[0].xy, 0.5 * (positionDelta[1].xy + positionDelta[2].xy)) < distance (positionDelta[1].xy, 0.5 * (positionDelta[0].xy + positionDelta[2].xy)))
        subdivisionFlag = 8.0;
    if (subdivisionFlag == 5.0 && distance (positionDelta[1].xy, 0.5 * (positionDelta[0].xy + positionDelta[2].xy)) < distance (positionDelta[2].xy, 0.5 * (positionDelta[0].xy + positionDelta[1].xy)))
        subdivisionFlag = 9.0;
    if (subdivisionFlag == 6.0 && distance (positionDelta[2].xy, 0.5 * (positionDelta[0].xy + positionDelta[1].xy)) < distance (positionDelta[0].xy, 0.5 * (positionDelta[1].xy + positionDelta[2].xy)))
        subdivisionFlag = 10.0;
    for (int i = 1; i < N/2; i++) {
        s = texture (samplers[i], texCoordWhich);
        values[2*i-2] = s.xy;
        values[2*i-1] = s.zw;
    }
}
