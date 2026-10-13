import{S as e}from"./View3DBuilding-BnjxJdAu.js";import"./helperFunctions-3BMWbNyX.js";import"./main-Cef_d299.js";const r="grainPixelShader",a=`#include<helperFunctions>
uniform sampler2D textureSampler; 
uniform float intensity;uniform float animatedSeed;varying vec2 vUV;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{gl_FragColor=texture2D(textureSampler,vUV);vec2 seed=vUV*(animatedSeed);float grain=dither(seed,intensity);float lum=getLuminance(gl_FragColor.rgb);float grainAmount=(cos(-PI+(lum*PI*2.))+1.)/2.;gl_FragColor.rgb+=grain*grainAmount;gl_FragColor.rgb=max(gl_FragColor.rgb,0.0);}`;e.ShadersStore[r]||(e.ShadersStore[r]=a);const n={name:r,shader:a};export{n as grainPixelShader};
