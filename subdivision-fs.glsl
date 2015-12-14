#extension GL_EXT_draw_buffers : require
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D samplers[1 + N/2];
varying vec3 barycentric;
varying vec2 texCoord[3];

void main(void) {
    vec4 posDeltaX;
    vec2 values[N];

    if (barycentric == vec3 (1.0, 0.0, 0.0)) {
        posDeltaX = texture2D (samplers[0], texCoord[0]);
        for (int j = 1; j < 1 + N/2; j++) {
            vec4 s = texture2D (samplers[j], texCoord[0]);
            values[2*j-2] = s.xy;
            values[2*j-1] = s.zw;
        }
    } else if (barycentric == vec3 (0.0, 1.0, 0.0)) {
        posDeltaX = texture2D (samplers[0], texCoord[1]);
        for (int j = 1; j < 1 + N/2; j++) {
            vec4 s = texture2D (samplers[j], texCoord[1]);
            values[2*j-2] = s.xy;
            values[2*j-1] = s.zw;
        }
    } else if (barycentric == vec3 (0.0, 0.0, 1.0)) {
        posDeltaX = texture2D (samplers[0], texCoord[2]);
        for (int j = 1; j < 1 + N/2; j++) {
            vec4 s = texture2D (samplers[j], texCoord[2]);
            values[2*j-2] = s.xy;
            values[2*j-1] = s.zw;
        }
    } else {
        vec2 position = barycentric.x * texture2D (samplers[0], texCoord[0]).xy
                      + barycentric.y * texture2D (samplers[0], texCoord[1]).xy
                      + barycentric.z * texture2D (samplers[0], texCoord[2]).xy;
        vec2 cs[N+1];
        f (position, cs);
        weierstrass (cs, values);
        float delta = Delta (position, values);
        posDeltaX = vec4 (position, delta, 1.0);
    }

    gl_FragData[0] = posDeltaX;
    const vec2 zero = vec2 (0.0, 0.0);
    gl_FragData[1].xy = sheets > 0 ? values[0] : zero;
    gl_FragData[1].zw = sheets > 1 ? values[1] : zero;
    gl_FragData[2].xy = sheets > 2 ? values[2] : zero;
    gl_FragData[2].zw = sheets > 3 ? values[3] : zero;
    gl_FragData[3].xy = sheets > 4 ? values[4] : zero;
    gl_FragData[3].zw = sheets > 5 ? values[5] : zero;
    gl_FragData[4].xy = sheets > 6 ? values[6] : zero;
    gl_FragData[4].zw = sheets > 7 ? values[7] : zero;
}

