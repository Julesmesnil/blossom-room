uniform float uTime;
uniform float uProgress;
uniform sampler2D texture1;
uniform vec4 resolution;

varying vec2 vUv;
varying vec3 vPosition;

float PI = 3.141592653689793238;


void main(){
  
  gl_FragColor = vec4(vUv, 0.0, 1.0);
  // gl_FragColor = vec4(vPosition, 1.0);

  // // add voronoi2d
  // float f = voronoi2d(vUv * uProgress * 5.0);
  // vec3 color = vec3(f);

  // gl_FragColor = vec4(color, 1.0);
}
