import{S as r}from"./View3DBuilding-C8SDN0zv.js";import"./helperFunctions-D27t_cjp.js";import"./index-TKETOfWI.js";const e="rgbdDecodePixelShader",o=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=vec4(fromRGBD(texture2D(textureSampler,vUV)),1.0);}`;r.ShadersStore[e]||(r.ShadersStore[e]=o);const i={name:e,shader:o};export{i as rgbdDecodePixelShader};
