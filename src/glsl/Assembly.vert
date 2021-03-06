#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
in float index;
uniform float numIndices;
uniform sampler2D samplers[1 + N/2];
uniform float sheet;
out vec4 posValue;
vec2 texCoord[3];

#define W 2048.0
#define H 2048.0
vec2 uvPosition (in float i) {
    return vec2 (mod (i, W) / W + 0.5 / W, floor (i / W) / H + 0.5 / H);
}

void readTex (out vec2 pos[3], out float delta[3], out vec2 values[3*N]) {
    vec4 s;
    for (int i = 0; i < 3; i++) {
        s = texture (samplers[0], texCoord[i]);
        pos[i] = s.xy;
        delta[i] = s.z;
        for (int j = 1; j < N/2; j++) {
            s = texture (samplers[j], texCoord[i]);
            values[i*N+2*j-2] = s.xy;
            values[i*N+2*j-1] = s.zw;
        }
    }
}

bool valid (in vec2 position[3], in float delta[3]) {
    return distance (position[0], position[1]) < min (delta[0], delta[1])
    && distance (position[1], position[2]) < min (delta[1], delta[2])
    && distance (position[2], position[0]) < min (delta[2], delta[0]);
}

void main(void) {
    float which = mod (index, 3.0);
    texCoord[0] = uvPosition (index - which);
    texCoord[1] = uvPosition (index - which + 1.0);
    texCoord[2] = uvPosition (index - which + 2.0);

    int isheet = int(sheet);
    if (isheet < sheets) {
        vec2 pos[3];
        float delta[3];
        vec2 values[3*N];
        readTex (pos, delta, values);
        if (valid (pos, delta)) {
            for (int s = 0; s < sheets; s++) {
                if (s == isheet) {
                    vec2 valueA = values[s];
                    int iwhich = int(which);
                    for (int w = 0; w < 3; w++) {
                        if (w == iwhich) {
                            vec2 valueWhich = values[w*N];
                            float dist, minDist = distance (valueA, valueWhich);
                            for (int i = 1; i < sheets; i++) {
                                dist = distance (valueA, values[w*N+i]);
                                if (dist < minDist)
                                {
                                    valueWhich = values[w*N+i];
                                    minDist = dist;
                                }
                            }
                            posValue = vec4(pos[w], valueWhich);
                        }
                    }
                }
            }
        return;
        }
    }
    posValue = vec4(-10.0, -10.0, -10.0, 1.0);
}
