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
// #include <fog_pars_fragment>

float PI = 3.141592653689793238;

vec3 getGradient(vec3 c1, vec3 c2, float value_) {
  // Utiliser directement mix pour un dégradé simple et visible
  vec3 col = mix(c1, c2, value_);
  return col;
}

void main() {

  // SKYBOX SPHÉRIQUE : Dégradé du centre (sol) vers le haut uniquement
  // Normaliser la position Y entre 0 et 1 (de Y=0 au centre jusqu'à Y=+3.9 au sommet)
  float normalizedY = vPosition.y / 3.9;
  // Clamper pour éviter les valeurs négatives (partie sous le sol)
  normalizedY = clamp(normalizedY, 0.0, 1.0);
  
  // Accélérer légèrement la transition vers la couleur2 pour un dégradé plus naturel
  float acceleratedY = pow(normalizedY, 0.7);

  vec3 col = getGradient(
              vColor1,
              vColor2,
					    acceleratedY
				    );

  gl_FragColor = vec4( col, 1.0 );

  // Application du fog
  // #include <fog_fragment>

}
