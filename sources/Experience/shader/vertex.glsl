uniform float time;
uniform vec2 pixels;
uniform float uProgress;
uniform float uHeight;
uniform float uStep;
uniform vec3 uColor1;
uniform vec3 uColor2;


varying vec2 vUv;
varying vec3 vPosition;
varying float vStep;
varying vec3 vColor1;
varying vec3 vColor2;

float PI = 3.141592653689793238;


void main() {
  // Varyings
  vUv = uv;
  vPosition = position;
  vStep = uStep;
  vColor1 = uColor1;
  vColor2 = uColor2;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}
