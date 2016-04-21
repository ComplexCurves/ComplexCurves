#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform int computedRoots;
uniform sampler2D samplers[1 + N/2];
varying vec2 texCoord;
varying vec2 vPosition;
void main(void) {
    vec2 position = clamp (vPosition, -5.0, 5.0);
    vec2 values[N];
    vec2 cs[N+1];
    f (position, cs);
    vec2 cs_orig[N+1];
    for (int i = 0; i < N + 1; i++)
        cs_orig[i] = cs[i];

    for (int i = 0; i < N; i++) {
        if (i < computedRoots) {
            if (mod(float(i), 2.0) == 0.0)
                values[i] = texture2D (samplers[i], texCoord).xy;
            else
                values[i] = texture2D (samplers[i - 1], texCoord).zw;
            deflate (sheets, cs, values[i]);
        }
    }

    if (sheets - computedRoots == 2) {
        vec2 qroots[2];
        quadratic_roots (cs, qroots);
        gl_FragColor = vec4 (qroots[0], qroots[1]);
    } else if (computedRoots < sheets) {
        gl_FragColor.xy = laguerre (sheets - computedRoots, cs, vec2 (0.0, 0.0), 80);
        if (computedRoots + 1 < sheets) {
            deflate (sheets, cs, gl_FragColor.xy);
            gl_FragColor.zw = laguerre (sheets - computedRoots - 1, cs, vec2 (0.0, 0.0), 80);
        }
    } else {
        float delta = Delta (position, values);
        gl_FragColor = vec4 (position, delta, 1.0);
    }
}
