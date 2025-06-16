uniform float uTime;
uniform float uProgress;
uniform float uHeight;
uniform sampler2D texture1;
uniform vec4 resolution;

varying vec2 vUv;
varying vec3 vPosition;
varying float vStep;
varying vec3 vColor1;
varying vec3 vColor2;

// Includes Three.js pour le fog
#include <fog_pars_fragment>

float PI = 3.141592653689793238;

vec3 getGradient(vec4 c1, vec4 c2, float value_) {
  float blend1 = smoothstep(c1.w, c2.w, value_);
  vec3 col = mix(c1.rgb, c2.rgb, blend1);
  return col;
}

void main() {

  vec3 col = getGradient(
              vec4(vec3(vColor1), 0.0),
              vec4(vec3(vColor2), .4),
					    vUv.y
				    );

  gl_FragColor = vec4( col, 1.0 );

  // Application du fog
  #include <fog_fragment>

}
