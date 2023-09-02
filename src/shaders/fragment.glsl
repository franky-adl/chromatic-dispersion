uniform float uIorR;
uniform float uIorG;
uniform float uIorB;
uniform float uRefractPower;
uniform vec2 u_resolution;
uniform sampler2D uTexture;

varying vec3 worldNormal;
varying vec3 eyeVector;

const int LOOP = 16;

void main() {
  float iorRatioRed = 1.0/uIorR;
  float iorRatioGreen = 1.0/uIorG;
  float iorRatioBlue = 1.0/uIorB;

  vec3 color = vec3(0.0);

  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec3 normal = worldNormal;

  vec3 refractVecR = refract(eyeVector, normal, iorRatioRed);
  vec3 refractVecG = refract(eyeVector, normal, iorRatioGreen);
  vec3 refractVecB = refract(eyeVector, normal, iorRatioBlue);
  
  for ( int i = 0; i < LOOP; i ++ ) {
    float slide = float(i) / float(LOOP) * 0.05;
	color.r += texture2D(uTexture, uv + refractVecR.xy * (uRefractPower + slide)).r;
	color.g += texture2D(uTexture, uv + refractVecG.xy * (uRefractPower + slide)).g;
	color.b += texture2D(uTexture, uv + refractVecB.xy * (uRefractPower + slide)).b;
  }
  // Divide by the number of layers to normalize colors (rgb values can be worth up to the value of LOOP)
  color /= float(LOOP);

  gl_FragColor = vec4(color, 1.0);

  // transform color from linear colorSpace to sRGBColorSpace
  gl_FragColor = linearToOutputTexel( gl_FragColor );
}