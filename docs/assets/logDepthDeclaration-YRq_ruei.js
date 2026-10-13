import{S as e}from"./View3DBuilding-BnjxJdAu.js";const a="mainUVVaryingDeclaration",r=`#ifdef MAINUV{X}
varying vec2 vMainUV{X};
#endif
`;e.IncludesShadersStore[a]||(e.IncludesShadersStore[a]=r);const n="logDepthDeclaration",t=`#ifdef LOGARITHMICDEPTH
uniform float logarithmicDepthConstant;varying float vFragmentDepth;
#endif
`;e.IncludesShadersStore[n]||(e.IncludesShadersStore[n]=t);
