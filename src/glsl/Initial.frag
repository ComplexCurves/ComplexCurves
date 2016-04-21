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

    for (int i = 0; i < N; i += 2) {
        if (i < computedRoots) {
            values[i] = texture2D (samplers[i], texCoord).xy;
            deflate (sheets - i, cs, values[i]);
        }
        if (i + 1 < computedRoots) {
            values[i + 1] = texture2D (samplers[i], texCoord).zw;
            deflate (sheets - (i + 1), cs, values[i + 1]);
        }
    }

    if (computedRoots == sheets - 2) {
        vec2 qroots[2];
        quadratic_roots (cs, qroots);
        gl_FragColor = vec4 (qroots[0], qroots[1]);
    } else if (computedRoots < sheets) {
        gl_FragColor.xy = laguerre (sheets - computedRoots, cs, vec2 (0.0, 0.0), 80);
        if (computedRoots + 1 < sheets) {
            deflate (sheets - computedRoots, cs, gl_FragColor.xy);
            gl_FragColor.zw = laguerre (sheets - computedRoots - 1, cs, vec2 (0.0, 0.0), 80);
        }
    } else {
        float delta = Delta (position, values);
        gl_FragColor = vec4 (position, delta, 1.0);
    }
}
