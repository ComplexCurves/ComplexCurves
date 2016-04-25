#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform int computedRoots;
uniform sampler2D oldSamplers[1 + N/2];
uniform sampler2D samplers[N/2];
varying vec3 barycentric;
varying vec2 texCoord[3];
varying vec2 texCoordOut;

void main(void) {
    if (barycentric == vec3 (1.0, 0.0, 0.0)) {
        if (computedRoots == sheets) {
            gl_FragColor = texture2D (oldSamplers[0], texCoord[0]);
        } else {
            int i = computedRoots / 2 + 1;
            for (int j = 1; j < 1 + N/2; j++)
                if (j == i)
                    gl_FragColor = texture2D (oldSamplers[j], texCoord[0]);
        }
    } else if (barycentric == vec3 (0.0, 1.0, 0.0)) {
        if (computedRoots == sheets) {
            gl_FragColor = texture2D (oldSamplers[0], texCoord[1]);
        } else {
            int i = computedRoots / 2 + 1;
            for (int j = 1; j < 1 + N/2; j++)
                if (j == i)
                    gl_FragColor = texture2D (oldSamplers[j], texCoord[1]);
        }
    } else if (barycentric == vec3 (0.0, 0.0, 1.0)) {
        if (computedRoots == sheets) {
            gl_FragColor = texture2D (oldSamplers[0], texCoord[2]);
        } else {
            int i = computedRoots / 2 + 1;
            for (int j = 1; j < 1 + N/2; j++)
                if (j == i)
                    gl_FragColor = texture2D (oldSamplers[j], texCoord[2]);
        }
    } else {
        vec2 values[N];
        vec2 position = barycentric.x * texture2D (oldSamplers[0], texCoord[0]).xy
                      + barycentric.y * texture2D (oldSamplers[0], texCoord[1]).xy
                      + barycentric.z * texture2D (oldSamplers[0], texCoord[2]).xy;
        vec2 cs[N+1];
        f (position, cs);

        for (int i = 0; i < N; i += 2) {
            if (i < computedRoots) {
                values[i] = texture2D (samplers[i], texCoordOut).xy;
                deflate (sheets - i, cs, values[i]);
            }
            if (i + 1 < computedRoots) {
                values[i + 1] = texture2D (samplers[i], texCoordOut).zw;
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
            } else {
                gl_FragColor.zw = vec2 (0.0, 0.0);
            }
        } else {
            float delta = Delta (position, values);
            gl_FragColor = vec4 (position, delta, 1.0);
        }
    }
}
