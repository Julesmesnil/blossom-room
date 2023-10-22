uniform float time;
uniform vec2 pixels;
uniform float uProgress;
uniform float uHeight;


varying vec2 vUv;
varying vec3 vPosition;

float PI = 3.141592653689793238;


void main() {
  // Varyings
  vUv = uv;
  vPosition = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}
