#version 300 es
uniform float maxValue;
uniform float minValue;
in vec2 vPosition;
out vec2 vValue;

void main()
{
  gl_Position = vec4(vPosition, 0.0, 1.0);
  vValue = 0.5 * (maxValue - minValue) * (vPosition + vec2 (1.0, 1.0))
    + vec2 (minValue, minValue);
}
