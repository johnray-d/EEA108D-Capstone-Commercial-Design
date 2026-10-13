import{S as e}from"./View3DBuilding-C8SDN0zv.js";import"./helperFunctions-D27t_cjp.js";import"./index-TKETOfWI.js";const r="extractHighlightsPixelShader",o=`#include<helperFunctions>
varying vec2 vUV;uniform sampler2D textureSampler;uniform float threshold;uniform float exposure;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);float luma=dot(LuminanceEncodeApprox,gl_FragColor.rgb*exposure);gl_FragColor.rgb=step(threshold,luma)*gl_FragColor.rgb;}`;e.ShadersStore[r]||(e.ShadersStore[r]=o);const i={name:r,shader:o};export{i as extractHighlightsPixelShader};
