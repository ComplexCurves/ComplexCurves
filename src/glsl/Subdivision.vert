#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
in vec4 indexBarycentric;
in float indexOffsetIn;
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
    vec2 texCoord[3];
    texCoord[0] = uvPosition (indexOffsetIn);
    texCoord[1] = uvPosition (indexOffsetIn + 1.0);
    texCoord[2] = uvPosition (indexOffsetIn + 2.0);
    vec3 barycentric = indexBarycentric.yzw;
    vec4 tmp;

    if (barycentric == vec3 (1.0, 0.0, 0.0)) {
        tmp = texture (samplers[0], texCoord[0]);
        position = tmp.xy;
        delta = tmp.z;
        subdivisionFlag = tmp.w;
        for (int j = 1; j < 1 + N/2; j++) {
            tmp = texture (samplers[j], texCoord[0]);
            values[2 * j - 2] = tmp.xy;
            values[2 * j - 1] = tmp.zw;
        }
    } else if (barycentric == vec3 (0.0, 1.0, 0.0)) {
        tmp = texture (samplers[0], texCoord[1]);
        position = tmp.xy;
        delta = tmp.z;
        subdivisionFlag = tmp.w;
        for (int j = 1; j < 1 + N/2; j++) {
            tmp = texture (samplers[j], texCoord[1]);
            values[2 * j - 2] = tmp.xy;
            values[2 * j - 1] = tmp.zw;
        }
    } else if (barycentric == vec3 (0.0, 0.0, 1.0)) {
        tmp = texture (samplers[0], texCoord[2]);
        position = tmp.xy;
        delta = tmp.z;
        subdivisionFlag = tmp.w;
        for (int j = 1; j < 1 + N/2; j++) {
            tmp = texture (samplers[j], texCoord[2]);
            values[2 * j - 2] = tmp.xy;
            values[2 * j - 1] = tmp.zw;
        }
    } else {
        position = barycentric.x * texture (samplers[0], texCoord[0]).xy
                 + barycentric.y * texture (samplers[0], texCoord[1]).xy
                 + barycentric.z * texture (samplers[0], texCoord[2]).xy;
        vec2 cs[N+1];
        f (position, cs);
        roots (sheets, cs, values);
        delta = Delta (position, values);
        subdivisionFlag = 1.0;
    }
}
