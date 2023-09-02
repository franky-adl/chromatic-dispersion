uniform float uIorR;
uniform float uIorG;
uniform float uIorB;
uniform float uRefractPower;
uniform float uShininess;
uniform float uDiffuseness;
uniform vec3 uLight;
uniform vec2 u_resolution;
uniform sampler2D uTexture;

varying vec3 worldNormal;
varying vec3 eyeVector;

const int LOOP = 16;

float specular(vec3 light, float shininess, float diffuseness) {
  vec3 normal = worldNormal;
  vec3 lightVector = normalize(-light);
  vec3 halfVector = normalize(eyeVector + lightVector);

  float NdotL = dot(normal, lightVector);
  float NdotH =  dot(normal, halfVector);
  float kDiffuse = max(0.0, NdotL);
  float NdotH2 = NdotH * NdotH;

  float kSpecular = pow(NdotH2, shininess);
  return  kSpecular + kDiffuse * diffuseness;
}

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
	color.g += texture2D(uTexture, uv + refractVecG.xy * (uRefractPower + slide*1.5)).g;
	color.b += texture2D(uTexture, uv + refractVecB.xy * (uRefractPower + slide*2.0)).b;
  }
  // Divide by the number of layers to normalize colors (rgb values can be worth up to the value of LOOP)
  color /= float(LOOP);

  // Specular
  float specularLight = specular(uLight, uShininess, uDiffuseness);
  color += specularLight;

  gl_FragColor = vec4(color, 1.0);

  // transform color from linear colorSpace to sRGBColorSpace
  gl_FragColor = linearToOutputTexel( gl_FragColor );
}