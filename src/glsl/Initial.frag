#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform int computedRoots;
in vec2 vPosition;
out vec4 fColor;
void main(void) {
    vec2 position = clamp (vPosition, -5.0, 5.0);
    vec2 values[N];
    vec2 cs[N+1];
    f (position, cs);
    roots (sheets, cs, values);

    if (computedRoots < sheets) {
        for (int i = 0; i < N; i += 2) {
            if (i == computedRoots)
                if (computedRoots + 1 < sheets)
                    fColor = vec4(values[i], values[i + 1]);
                else
                    fColor = vec4(values[i], vec2 (0.0, 0.0));
        }
    } else {
        float delta = Delta (position, values);
        fColor = vec4 (position, delta, 1.0);
    }
}
