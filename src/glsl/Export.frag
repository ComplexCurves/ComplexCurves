#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
in vec2 vValue;
out vec4 fColor;
vec3 hue_to_rgb (in float hue)
{
    hue = mod (degrees (hue), 360.0) / 60.0;
    int h = int (floor (hue));
    float f = fract (hue);
    if (h == 0)
        return vec3 (1.0, f, 0.0);
    else if (h == 1)
        return vec3 (1.0 - f, 1.0, 0.0);
    else if (h == 2)
        return vec3 (0.0, 1.0, f);
    else if (h == 3)
        return vec3 (0.0, 1.0 - f, 1.0);
    else if (h == 4)
        return vec3 (f, 0.0, 1.0);
    else if (h == 5)
        return vec3 (1.0, 0.0, 1.0 - f);
}
float sawfct (float x, float dx, float a, float b)
{
    return a + (b - a) * fract (x / dx);
}
void main (void)
{
    float PI = acos (-1.0);
    float angle = atan (vValue.y, vValue.x);
    float blackp = sawfct (angle / (2.0 * PI), 0.05, 0.7, 1.0);
    float blackm = sawfct (log (length (vValue)), 0.1 * PI, 0.7, 1.0);
    float black = blackp * blackm;
    fColor = vec4 (black * hue_to_rgb(angle), 1.0);
}
