import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { SphericalPolynomial } from '@babylonjs/core/Maths/sphericalPolynomial';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { RawCubeTexture } from '@babylonjs/core/Materials/Textures/rawCubeTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { Animation } from '@babylonjs/core/Animations/animation';
import { CubicEase, EasingFunction } from '@babylonjs/core/Animations/easing';
import '@babylonjs/core/Engines/Extensions/engine.rawTexture';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Animations/animatable';
import '@babylonjs/core/Materials/Textures/baseTexture.polynomial';
import '@babylonjs/core/Culling/ray';
import { ViewOptions3D } from '../types/powerSystem';

export type CameraPreset = 'home' | 'plant' | 'riser' | 'retail' | 'office' | 'roof' | 'basement';
export interface SceneCallbacks {
  onSelectEquipment: (tag: string | null) => void;
  onHoverEquipment: (tag: string | null) => void;
}
type Part = { mesh: Mesh; floor: number; role: string; tag?: string };
type Route = { mesh: Mesh; points: Vector3[]; markers: Mesh[]; kind: string; floor: number };
const LEVELS = [0, 4.8, 9.6, 13.8, 18, 22.2, 26.4];
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** Concept architecture: 50 x 40 m floors match the report's 2,000 m² allowance.
 * Floor heights, fitout, façade and plant positions are illustrative, not surveyed.
 * Electrical route geometry is explanatory; the report's cable lengths govern analysis.
 */
export class BuildingSceneManager {
  private engine!: Engine;
  private scene!: Scene;
  private camera!: ArcRotateCamera;
  private sun!: DirectionalLight;
  private ambient!: HemisphericLight;
  private shadows!: ShadowGenerator;
  private pipeline!: DefaultRenderingPipeline;
  private highlight!: HighlightLayer;
  private materials = new Map<string, PBRMaterial>();
  private floors: TransformNode[] = [];
  private parts: Part[] = [];
  private routes: Route[] = [];
  private labels: Mesh[] = [];
  private selectedTag: string | null = null;
  private disposed = false;
  private phase = 0;
  private options: ViewOptions3D;
  private sequence = 0;
  private framingScale = 1;
  private interiorLights: PointLight[] = [];

  constructor(private canvas: HTMLCanvasElement, private callbacks: SceneCallbacks, options: ViewOptions3D) {
    this.options = options;
  }

  public async init(): Promise<string> {
    this.engine = new Engine(this.canvas, true, { stencil: true, powerPreference: 'high-performance' });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = Color4.FromHexString('#e3e8e7ff');
    this.framingScale = this.getFramingScale();
    this.camera = new ArcRotateCamera('architectural-camera', -1.02, 1.16, 122 * this.framingScale, v(-1, 10, 0), this.scene);
    this.camera.attachControl(this.canvas, true);
    this.camera.lowerRadiusLimit = 5;
    // Tall, exploded models need additional distance in narrow portrait viewports.
    this.camera.upperRadiusLimit = 600;
    this.camera.lowerBetaLimit = 0.12;
    this.camera.upperBetaLimit = Math.PI / 2.02;
    this.camera.minZ = 0.15;
    this.camera.wheelDeltaPercentage = 0.012;
    this.camera.panningSensibility = 90;
    this.camera.inertia = 0.82;
    this.camera.fov = 0.68;
    this.ambient = new HemisphericLight('sky-fill', v(0, 1, 0), this.scene);
    this.ambient.groundColor = Color3.FromHexString('#9eaba5');
    this.sun = new DirectionalLight('afternoon-sun', v(-0.6, -1, 0.55), this.scene);
    this.sun.position = v(45, 70, -55);
    this.sun.shadowMinZ = 1;
    this.sun.shadowMaxZ = 180;
    this.shadows = new ShadowGenerator(2048, this.sun);
    this.shadows.usePercentageCloserFiltering = true;
    this.shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    this.shadows.bias = 0.0006;
    this.shadows.normalBias = 0.045;
    this.shadows.darkness = 0.08;
    this.createEnvironment();
    this.pipeline = new DefaultRenderingPipeline('architectural-finish', true, this.scene, [this.camera]);
    this.pipeline.fxaaEnabled = true;
    this.pipeline.bloomEnabled = true;
    this.pipeline.bloomThreshold = 1.15;
    this.pipeline.bloomWeight = 0.12;
    this.pipeline.bloomKernel = 48;
    this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    this.scene.imageProcessingConfiguration.contrast = 1.12;
    this.highlight = new HighlightLayer('equipment-selection', this.scene);
    this.highlight.innerGlow = false;
    this.createMaterials();
    for (let f = 0; f < LEVELS.length; f++) {
      const root = new TransformNode(`level-${f + 1}`, this.scene);
      root.position.y = LEVELS[f];
      this.floors.push(root);
    }
    this.buildSite();
    this.buildArchitecture();
    this.buildInteriors();
    this.buildRoof();
    this.buildPlant();
    this.mergeStaticGeometry();
    for (let floor = 0; floor < 6; floor++) {
      for (const x of [-10, 12]) {
        const light = new PointLight(`interior-${floor}-${x}`, v(x, 3, -8), this.scene);
        light.parent = this.floors[floor];
        light.diffuse = Color3.FromHexString('#ffe1ad');
        light.range = 35;
        light.includedOnlyMeshes = this.parts.filter(part => part.floor === floor).map(part => part.mesh);
        this.interiorLights.push(light);
      }
    }
    this.buildLabels();
    this.updateViewOptions(this.options);
    this.scene.onPointerObservable.add(info => {
      if (info.type !== PointerEventTypes.POINTERTAP && info.type !== PointerEventTypes.POINTERMOVE) return;
      const tag = info.pickInfo?.pickedMesh?.metadata?.tag ?? null;
      if (info.type === PointerEventTypes.POINTERTAP) this.callbacks.onSelectEquipment(tag);
      else {
        this.canvas.style.cursor = tag ? 'pointer' : 'grab';
        this.callbacks.onHoverEquipment(tag);
      }
    });
    this.resize();
    await this.scene.whenReadyAsync();
    if (this.disposed) return 'WebGL';
    this.engine.runRenderLoop(() => {
      if (this.disposed || document.hidden) return;
      const dt = Math.min(this.engine.getDeltaTime() / 1000, 0.06);
      if (this.options.autoRotate) this.camera.alpha += dt * 0.065;
      if (this.options.animateFlow) this.phase += dt * 0.12;
      for (const route of this.routes) {
        route.markers.forEach((marker, i) => {
          marker.position.copyFrom(this.pointAlong(route.points, (this.phase + i / 3) % 1));
          marker.isVisible = route.mesh.isVisible && this.options.animateFlow;
        });
      }
      this.scene.render();
    });
    return this.engine.webGLVersion === 2 ? 'WebGL 2' : 'WebGL';
  }

  // A self-contained sky reflection map: no remote HDRI, model or texture requests.
  private createEnvironment() {
    const size = 64;
    const faces: Uint8Array[] = [];
    for (let face = 0; face < 6; face++) {
      const data = new Uint8Array(size * size * 4);
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const t = face === 2 ? 0 : face === 3 ? 1 : y / size;
        const sky = [139, 174, 194], horizon = [226, 224, 211], ground = [100, 117, 110];
        const a = t < 0.52 ? sky : horizon, b = t < 0.52 ? horizon : ground;
        const blend = t < 0.52 ? t / 0.52 : (t - 0.52) / 0.48;
        for (let c = 0; c < 3; c++) data[(y * size + x) * 4 + c] = a[c] + (b[c] - a[c]) * blend;
        data[(y * size + x) * 4 + 3] = 255;
      }
      faces.push(data);
    }
    const env = new RawCubeTexture(this.scene, faces, size, Engine.TEXTUREFORMAT_RGBA, Engine.TEXTURETYPE_UNSIGNED_BYTE, true, false, Texture.TRILINEAR_SAMPLINGMODE);
    env.name = 'procedural-sky-reflections';
    env.coordinatesMode = Texture.CUBIC_MODE;
    // Explicit diffuse irradiance avoids a GPU readback racing scene disposal in StrictMode.
    const irradiance = new SphericalPolynomial();
    irradiance.xx.set(0.2, 0.23, 0.25);
    irradiance.yy.set(0.3, 0.33, 0.36);
    irradiance.zz.set(0.2, 0.23, 0.25);
    env.sphericalPolynomial = irradiance;
    this.scene.environmentTexture = env;
  }

  private mat(name: string, color: string, roughness = 0.65, metal = 0): PBRMaterial {
    const material = new PBRMaterial(name, this.scene);
    material.albedoColor = Color3.FromHexString(color);
    material.roughness = roughness;
    material.metallic = metal;
    this.materials.set(name, material);
    return material;
  }

  private createMaterials() {
    this.mat('stone', '#d9d6ca', 0.82);
    this.mat('concrete', '#b6beb8', 0.9);
    this.mat('paving', '#b9bdb5', 0.95);
    this.mat('road', '#444b4b', 0.98);
    this.mat('white', '#edece2', 0.64);
    this.mat('metal', '#45524f', 0.3, 0.75);
    this.mat('dark', '#243533', 0.55, 0.35);
    this.mat('bronze', '#aa8760', 0.35, 0.65);
    this.mat('wood', '#a98156', 0.78);
    this.mat('carpet', '#677c76', 0.98);
    this.mat('soil', '#554e3b', 1);
    this.mat('leaf', '#536f4b', 0.94);
    this.mat('leaf-light', '#7d905b', 0.94);
    this.mat('bark', '#796446', 1);
    this.mat('water', '#608b8b', 0.12, 0.35);
    this.mat('copper', '#c77f4d', 0.3, 0.8);
    this.mat('red', '#b85142', 0.48, 0.2);
    this.mat('blue', '#518092', 0.48, 0.3);
    this.mat('green', '#4c8772', 0.48, 0.3);
    this.mat('yellow', '#cda64e', 0.5, 0.2);
    const glass = this.mat('glass', '#547a7e', 0.16, 0.25);
    glass.alpha = 0.67;
    glass.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    glass.backFaceCulling = false;
    glass.environmentIntensity = 1.4;
    glass.clearCoat.isEnabled = true;
    glass.clearCoat.intensity = 0.8;
    const inner = this.mat('inner-glass', '#b5d1c9', 0.15, 0.05);
    inner.alpha = 0.2;
    inner.backFaceCulling = false;
    const lamp = this.mat('lamp', '#fff1d3', 0.45);
    lamp.emissiveColor = Color3.FromHexString('#ffdba0').scale(1.5);
    const screen = this.mat('screen', '#214b48', 0.25);
    screen.emissiveColor = Color3.FromHexString('#68b5a1').scale(0.45);
    // Fine seeded grain prevents perfectly flat concrete without external assets.
    const texture = new DynamicTexture('concrete-grain', 256, this.scene, true);
    const ctx = texture.getContext();
    let seed = 97;
    const noise = new ImageData(256, 256);
    for (let i = 0; i < noise.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      const value = 218 + seed % 30;
      noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = value;
      noise.data[i + 3] = 255;
    }
    ctx.putImageData(noise, 0, 0);
    texture.update();
    texture.uScale = texture.vScale = 4;
    this.materials.get('concrete')!.albedoTexture = texture;
    this.materials.get('stone')!.albedoTexture = texture;
    this.materials.get('paving')!.albedoTexture = texture;
  }

  private attach(mesh: Mesh, material: string, floor: number, role: string, tag?: string) {
    mesh.material = this.materials.get(material)!;
    if (floor >= 0) mesh.parent = this.floors[floor];
    mesh.isPickable = Boolean(tag);
    mesh.metadata = { tag };
    mesh.receiveShadows = true;
    this.parts.push({ mesh, floor, role, tag });
    return mesh;
  }

  private box(name: string, size: number[], pos: number[], material: string, floor = -1, role = 'structure', tag?: string) {
    const mesh = MeshBuilder.CreateBox(`${name}-${this.sequence++}`, { width: size[0], height: size[1], depth: size[2] }, this.scene);
    mesh.position.set(pos[0], pos[1], pos[2]);
    return this.attach(mesh, material, floor, role, tag);
  }

  private cylinder(name: string, diameter: number, height: number, pos: number[], material: string, floor = -1, role = 'detail', tag?: string) {
    const mesh = MeshBuilder.CreateCylinder(`${name}-${this.sequence++}`, { diameter, height, tessellation: 16 }, this.scene);
    mesh.position.set(pos[0], pos[1], pos[2]);
    return this.attach(mesh, material, floor, role, tag);
  }

  private tree(x: number, z: number, scale = 1) {
    this.box('tree-planter', [3.5, 0.5, 3.5], [x, 0.22, z], 'stone', -1, 'site');
    this.box('soil', [3.2, 0.06, 3.2], [x, 0.5, z], 'soil', -1, 'site');
    this.cylinder('trunk', 0.3 * scale, 3.2 * scale, [x, 1.6 * scale + 0.5, z], 'bark', -1, 'site');
    for (let i = 0; i < 22; i++) {
      const crown = MeshBuilder.CreateSphere('canopy', { diameter: (0.9 + (i % 4) * 0.25) * scale, segments: 6 }, this.scene);
      const spread = Math.sqrt((i + 1) / 22) * 1.65 * scale;
      crown.position.set(x + Math.sin(i * 2.4) * spread, 4.15 * scale + Math.cos(i * 1.5) * 0.8 - spread * 0.2, z + Math.cos(i * 2.4) * spread);
      crown.scaling.set(1, 1.15 + (i % 3) * 0.12, 0.9);
      this.attach(crown, i % 2 ? 'leaf' : 'leaf-light', -1, 'site');
    }
  }

  private buildSite() {
    this.box('infinite-ground', [900, 0.2, 900], [0, -0.9, 0], 'paving', -1, 'ground');
    this.box('site-foundation', [80, 0.65, 68], [-1, -0.4, 0], 'concrete', -1, 'site');
    this.box('sidewalk', [80, 0.18, 68], [-1, -0.02, 0], 'stone', -1, 'site');
    this.box('street', [115, 0.04, 11], [0, -0.7, -41], 'road', -1, 'site');
    for (let x = -54; x < 55; x += 8) this.box('lane-mark', [3.4, 0.012, 0.13], [x, -0.672, -41], 'white', -1, 'site');
    for (let x = -37; x <= 37; x += 4) this.box('paving-joint', [0.025, 0.01, 12], [x, 0.08, -27], 'concrete', -1, 'site');
    for (let z = -33; z < -20; z += 4) this.box('paving-joint', [77, 0.01, 0.025], [0, 0.08, z], 'concrete', -1, 'site');
    for (const x of [-33, -22, 22, 33]) this.tree(x, -28, x === 22 ? 1.1 : 0.9);
    for (const z of [-12, 5, 22]) this.tree(32, z, 1.1);
    for (const x of [-17, 0, 17]) this.tree(x, 27, 1);
    for (const x of [-16, 16]) {
      this.box('bench-plinth', [4, 0.4, 1.1], [x, 0.3, -27], 'dark', -1, 'site');
      for (let i = 0; i < 6; i++) this.box('bench-slat', [4.1, 0.09, 0.14], [x, 0.55, -27.43 + i * 0.17], 'wood', -1, 'site');
    }
    for (const x of [-27, -10, 10, 27]) {
      this.cylinder('bollard', 0.16, 0.9, [x, 0.53, -24], 'dark', -1, 'site');
      this.cylinder('bollard-light', 0.17, 0.16, [x, 0.83, -24], 'lamp', -1, 'site');
    }
    // Two cars establish human scale and a discreet service parking area.
    for (let i = 0; i < 2; i++) {
      const x = 31, z = 12 + i * 6;
      this.box('car-body', [2, 0.55, 4.3], [x, 0.67, z], i ? 'dark' : 'white', -1, 'site');
      this.box('car-cabin', [1.72, 0.65, 2.3], [x, 1.18, z - 0.12], 'glass', -1, 'site');
      for (const dx of [-1, 1]) for (const dz of [-1.35, 1.35]) {
        const wheel = this.cylinder('car-wheel', 0.65, 0.22, [x + dx, 0.4, z + dz], 'dark', -1, 'site');
        wheel.rotation.z = Math.PI / 2;
      }
    }
    // Simplified neighboring massing sits beyond the modeled site.
    for (const [x, z, w, d, h] of [[-65, 38, 22, 18, 16], [52, 54, 24, 20, 22], [-17, 65, 28, 16, 12]]) {
      this.box('urban-context', [w, h, d], [x, h / 2 - 0.8, z], 'concrete', -1, 'context');
    }
  }

  private buildArchitecture() {
    for (let f = 0; f <= 6; f++) {
      if (f === 1) {
        // Actual opening around the two escalators; no solid slab across the upper landing.
        this.box('floor-slab-west', [21, 0.3, 40], [-14.5, -0.05, 0], 'stone', f, 'slab');
        this.box('floor-slab-east', [21, 0.3, 40], [14.5, -0.05, 0], 'stone', f, 'slab');
        this.box('floor-slab-front', [8, 0.3, 18], [0, -0.05, -11], 'stone', f, 'slab');
        this.box('floor-slab-back', [8, 0.3, 11], [0, -0.05, 14.5], 'stone', f, 'slab');
        for (const x of [-4, 4]) {
          this.box('atrium-guard', [0.05, 1.05, 11], [x, 0.67, 3.5], 'inner-glass', f, 'interior');
          this.box('atrium-handrail', [0.06, 0.06, 11], [x, 1.2, 3.5], 'metal', f, 'interior');
        }
      } else this.box('floor-slab', [50, 0.3, 40], [0, -0.05, 0], 'stone', f, 'slab');
      if (f === 6) break;
      const h = LEVELS[f + 1] - LEVELS[f];
      for (const x of [-24, -12, 0, 12, 24]) for (const z of [-19, 0, 19]) {
        this.box('concrete-column', [0.5, h, 0.5], [x, h / 2, z], 'concrete', f);
      }
      for (const z of [-19, 0, 19]) this.box('beam', [49, 0.45, 0.45], [0, h - 0.3, z], 'concrete', f);
      // Lift core and stair enclosure, with two brushed-metal elevator doors.
      this.box('core-rear', [8, h, 0.3], [-16, h / 2, 8], 'stone', f);
      this.box('core-side', [0.3, h, 9], [-20, h / 2, 3.5], 'stone', f);
      this.box('core-front', [8, h, 0.24], [-16, h / 2, -1], 'stone', f);
      for (const x of [-18, -14]) {
        this.box('lift-frame', [2.5, 2.8, 0.13], [x, 1.55, -1.16], 'dark', f);
        this.box('lift-door', [2.12, 2.5, 0.08], [x, 1.4, -1.25], 'metal', f);
        this.box('lift-seam', [0.025, 2.5, 0.01], [x, 1.4, -1.3], 'dark', f);
        this.box('lift-indicator', [0.4, 0.13, 0.02], [x, 2.72, -1.3], 'screen', f);
      }
      for (let s = 0; s < 16; s++) this.box('stair', [2.6, 0.17, 0.44], [-16, s * h / 16 + 0.15, 0.5 + s * 0.43], 'concrete', f);
      // Every façade bay is modeled separately, including corners, spandrels and fins.
      for (const side of ['front', 'back', 'east', 'west']) {
        const longitudinal = side === 'front' || side === 'back';
        const length = longitudinal ? 50 : 40;
        const sign = side === 'front' || side === 'west' ? -1 : 1;
        const bays = longitudinal ? 20 : 16;
        const role = `facade-${side}`;
        for (let b = 0; b < bays; b++) {
          const along = -length / 2 + (b + 0.5) * 2.5;
          const pos = longitudinal ? [along, h / 2, sign * 20] : [sign * 25, h / 2, along];
          const size = longitudinal ? [2.4, h - 0.85, 0.06] : [0.06, h - 0.85, 2.4];
          this.box('vision-glass', size, pos, 'glass', f, role);
          const mullion = longitudinal ? [along - 1.25, h / 2, sign * 20.04] : [sign * 25.04, h / 2, along - 1.25];
          this.box('mullion', longitudinal ? [0.065, h, 0.14] : [0.14, h, 0.065], mullion, 'dark', f, role);
          if (f >= 2 && b % 2 === 0) {
            const fin = longitudinal ? [along - 1.25, h / 2, sign * 20.3] : [sign * 25.3, h / 2, along - 1.25];
            this.box('solar-fin', longitudinal ? [0.13, h - 0.1, 0.68] : [0.68, h - 0.1, 0.13], fin, 'bronze', f, role);
          }
        }
        for (const y of [0.3, h - 0.2]) {
          this.box('spandrel', longitudinal ? [50.2, 0.48, 0.25] : [0.25, 0.48, 40.2], longitudinal ? [0, y, sign * 20.03] : [sign * 25.03, y, 0], f < 2 ? 'dark' : 'stone', f, role);
        }
      }
      if (f < 2) for (const x of [-25, -12.5, 12.5, 25]) this.box('retail-pier', [0.75, h, 0.85], [x, h / 2, -20.1], 'stone', f, 'facade-front');
    }
    this.box('entrance-canopy', [15, 0.3, 4.7], [0, 4, -21.2], 'dark', 0, 'facade-front');
    this.box('canopy-soffit', [14.5, 0.06, 4.3], [0, 3.82, -21.2], 'wood', 0, 'facade-front');
    for (const x of [-5, 0, 5]) this.box('canopy-strip', [3.4, 0.03, 0.08], [x, 3.77, -22.5], 'lamp', 0, 'facade-front');
    for (const x of [-3.3, -1.1, 1.1, 3.3]) {
      this.box('entrance-door', [2.1, 3.4, 0.1], [x, 1.8, -20.2], 'inner-glass', 0, 'facade-front');
      this.box('door-pull', [0.04, 0.85, 0.08], [x + 0.8, 1.5, -20.3], 'bronze', 0, 'facade-front');
    }
    this.sign('COMMERCE  /  01', [0, 4.47, -20.25], 10, 0.7, 0, 'facade-front');
    this.sign('RETAIL GALLERY', [-13, 3.7, -20.26], 6, 0.45, 0, 'facade-front');
    this.sign('WORKPLACE & CO.', [15, 3.7, -20.26], 6, 0.45, 0, 'facade-front');
  }

  private buildInteriors() {
    for (let f = 0; f < 6; f++) {
      const h = LEVELS[f + 1] - LEVELS[f];
      for (const x of [-9, 3, 15]) for (const z of [-12, 0, 12]) {
        this.box('linear-light', [6, 0.035, 0.1], [x, h - 0.48, z], 'lamp', f, 'interior');
      }
      if (f < 2) {
        for (const x of [-12, 12]) for (const z of [-9, 4, 13]) {
          this.box('retail-rug', [9, 0.018, 6.5], [x, 0.115, z], 'carpet', f, 'interior');
          for (const dx of [-2.4, 2.4]) {
            this.box('display-island', [2.7, 0.75, 1.2], [x + dx, 0.5, z], 'wood', f, 'interior');
            this.box('display-top', [2.8, 0.08, 1.3], [x + dx, 0.9, z], 'stone', f, 'interior');
            for (let i = 0; i < 3; i++) this.box('merchandise', [0.5, 0.25 + i * 0.1, 0.6], [x + dx - 0.7 + i * 0.65, 1.07, z], i % 2 ? 'white' : 'bronze', f, 'interior');
          }
          this.box('shop-partition', [9, 2.8, 0.12], [x, 1.55, z + 3.8], 'white', f, 'interior');
          for (let i = 0; i < 4; i++) this.box('shop-shelf', [8, 0.09, 0.65], [x, 0.55 + i * 0.65, z + 3.4], 'wood', f, 'interior');
        }
        this.box('reception', [5, 1.1, 1.4], [0, 0.7, -13], 'stone', f, 'interior');
        this.box('reception-inlay', [4.8, 0.72, 0.06], [0, 0.7, -13.73], 'wood', f, 'interior');
      } else {
        for (const x of [-5, 6, 17]) for (const z of [-12, -5, 3, 11]) {
          this.box('workstation-rug', [8, 0.025, 5.7], [x, 0.12, z], 'carpet', f, 'interior');
          this.box('shared-desk', [6.6, 0.08, 1.65], [x, 0.88, z], 'wood', f, 'interior');
          for (const dx of [-2.7, 2.7]) this.box('desk-leg', [0.08, 0.7, 1.5], [x + dx, 0.49, z], 'white', f, 'interior');
          this.box('desk-divider', [6.5, 0.35, 0.06], [x, 1.1, z], 'carpet', f, 'interior');
          for (const dx of [-2.2, 0, 2.2]) for (const side of [-1, 1]) {
            this.box('monitor', [0.72, 0.42, 0.055], [x + dx, 1.18, z + side * 0.3], 'dark', f, 'interior');
            this.box('monitor-face', [0.66, 0.35, 0.015], [x + dx, 1.18, z + side * 0.34], 'screen', f, 'interior');
            this.cylinder('chair-stem', 0.1, 0.4, [x + dx, 0.33, z + side * 1.35], 'metal', f, 'interior');
            this.box('chair-seat', [0.65, 0.12, 0.62], [x + dx, 0.57, z + side * 1.35], 'dark', f, 'interior');
            this.box('chair-back', [0.65, 0.55, 0.08], [x + dx, 0.88, z + side * 1.64], 'dark', f, 'interior');
          }
        }
        this.box('meeting-glass', [0.05, 3.1, 10], [-10.8, 1.7, 12.5], 'inner-glass', f, 'interior');
        this.box('meeting-table', [5.5, 0.15, 2], [-17, 0.87, 13], 'wood', f, 'interior');
        for (const x of [-19, -17, -15]) for (const z of [11.5, 14.5]) this.box('meeting-chair', [0.65, 0.8, 0.7], [x, 0.53, z], 'dark', f, 'interior');
      }
      // Dedicated radial floor panel adjacent to the service shaft.
      this.cabinet(`P-F${f + 1}`, -22.3, 1.15, -6, 1.1, 1.8, 'blue', f);
      for (const x of [-8, 9, 21]) {
        this.cylinder('indoor-planter', 0.7, 0.55, [x, 0.4, -17.4], 'white', f, 'interior');
        const foliage = MeshBuilder.CreateSphere('indoor-foliage', { diameter: 1.15, segments: 6 }, this.scene);
        foliage.position.set(x, 1.1, -17.4);
        foliage.scaling.y = 1.3;
        this.attach(foliage, 'leaf', f, 'interior');
      }
    }
    // Paired escalators in an illustrative central retail circulation zone.
    for (const x of [-2, 2]) {
      const stair = this.box('escalator-truss', [1.5, 0.45, 9.8], [x, 2.5, 4], 'metal', 0, 'interior');
      stair.rotation.x = -0.51;
      for (let i = 0; i < 24; i++) this.box('escalator-tread', [1.1, 0.12, 0.38], [x, 0.22 + i * 0.2, -0.2 + i * 0.36], 'dark', 0, 'interior');
      for (const dx of [-0.76, 0.76]) {
        const rail = this.box('escalator-rail', [0.1, 0.8, 9.8], [x + dx, 3.05, 4], 'inner-glass', 0, 'interior');
        rail.rotation.x = -0.51;
      }
    }
  }

  private buildRoof() {
    for (const z of [-20, 20]) {
      this.box('roof-parapet', [50.3, 0.85, 0.3], [0, 0.5, z], 'stone', 6);
      this.box('parapet-cap', [50.5, 0.08, 0.45], [0, 0.97, z], 'metal', 6);
    }
    for (const x of [-25, 25]) this.box('roof-parapet', [0.3, 0.85, 40], [x, 0.5, 0], 'stone', 6);
    this.box('lift-penthouse', [8.5, 3.2, 9], [-16, 1.7, 3.5], 'stone', 6, 'load', 'LIFT-MOTOR');
    this.box('penthouse-cap', [9, 0.2, 9.5], [-16, 3.4, 3.5], 'dark', 6, 'load', 'LIFT-MOTOR');
    for (let i = 0; i < 8; i++) this.box('penthouse-louver', [3, 0.12, 0.18], [-16, 1 + i * 0.23, -1.06], 'metal', 6, 'load', 'LIFT-MOTOR');
    // The report specifies 36 VRF outdoor units; all 36 are represented.
    for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) {
      const x = -5 + col * 4.1, z = -13 + row * 5.2;
      this.box('vrf-plinth', [2.1, 0.2, 1.5], [x, 0.24, z], 'concrete', 6, 'load', 'HVAC-LOAD');
      this.box('vrf-unit', [1.7, 1.35, 1.15], [x, 0.99, z], 'white', 6, 'load', 'HVAC-LOAD');
      this.box('vrf-grille', [1.4, 0.8, 0.025], [x, 1, z - 0.59], 'metal', 6, 'load', 'HVAC-LOAD');
      for (let l = 0; l < 7; l++) this.box('grille-fin', [1.4, 0.025, 0.04], [x, 0.67 + l * 0.1, z - 0.62], 'white', 6, 'load', 'HVAC-LOAD');
      for (const dx of [-0.43, 0.43]) {
        this.cylinder('fan-well', 0.68, 0.05, [x + dx, 1.69, z], 'dark', 6, 'load', 'HVAC-LOAD');
        this.cylinder('fan-hub', 0.17, 0.07, [x + dx, 1.73, z], 'metal', 6, 'load', 'HVAC-LOAD');
        for (let a = 0; a < 3; a++) {
          const blade = this.box('fan-blade', [0.59, 0.018, 0.09], [x + dx, 1.73, z], 'metal', 6, 'load', 'HVAC-LOAD');
          blade.rotation.y = a * Math.PI / 3;
        }
      }
    }
    for (const x of [-8, 19]) this.box('roof-cable-tray', [0.45, 0.16, 32], [x, 0.3, 0], 'metal', 6, 'load', 'HVAC-LOAD');
    for (let i = 0; i < 12; i++) this.box('walkway-paver', [2.2, 0.08, 1.2], [-10, 0.17, -16 + i * 2.8], 'concrete', 6);
  }

  private cabinet(tag: string, x: number, y: number, z: number, width: number, height: number, accent: string, floor = -1) {
    this.box('cabinet-plinth', [width + 0.14, 0.18, 0.95], [x, y - height / 2, z], 'concrete', floor, 'equipment', tag);
    this.box('cabinet-case', [width, height, 0.8], [x, y, z], 'white', floor, 'equipment', tag);
    this.box('cabinet-door', [width - 0.09, height - 0.12, 0.035], [x, y, z - 0.42], 'metal', floor, 'equipment', tag);
    this.box('cabinet-header', [width - 0.12, 0.2, 0.04], [x, y + height / 2 - 0.2, z - 0.45], accent, floor, 'equipment', tag);
    this.box('cabinet-display', [width * 0.35, 0.24, 0.03], [x - width * 0.15, y + 0.3, z - 0.45], 'screen', floor, 'equipment', tag);
    this.box('cabinet-handle', [0.045, 0.3, 0.07], [x + width * 0.33, y, z - 0.47], 'dark', floor, 'equipment', tag);
    for (let i = 0; i < 5; i++) this.box('cabinet-vent', [width * 0.7, 0.018, 0.015], [x, y - height * 0.3 + i * 0.055, z - 0.45], 'dark', floor, 'equipment', tag);
  }

  private buildPlant() {
    // 10 x 6 m electrical annex = 60 m² plant allowance, separately accessible.
    this.box('plant-platform', [11, 0.28, 7], [-31, 0.17, -8], 'concrete', -1, 'plant');
    this.box('plant-rear-wall', [10.5, 3.8, 0.25], [-31, 2, -4.5], 'stone', -1, 'plant');
    this.box('plant-west-wall', [0.2, 3.8, 6.5], [-36.25, 2, -7.8], 'stone', -1, 'plant');
    this.sign('ELECTRICAL PLANT  /  13.8 kV', [-31, 3.3, -4.66], 8, 0.5);
    this.cabinet('HV-01', -34.5, 1.6, -6.2, 1.25, 2.45, 'red');
    this.cabinet('METER', -35.3, 1.4, -9.5, 0.65, 1.6, 'red');
    const tx = -31.5, tz = -6.7;
    this.box('transformer-plinth', [2.8, 0.24, 2.5], [tx, 0.42, tz], 'concrete', -1, 'equipment', 'T1');
    this.box('transformer-tank', [2, 1.6, 1.6], [tx, 1.42, tz], 'green', -1, 'equipment', 'T1');
    for (const side of [-1, 1]) for (let i = 0; i < 12; i++) this.box('radiator-fin', [0.34, 1.45, 0.06], [tx + side * 1.12, 1.42, tz - 0.72 + i * 0.13], 'metal', -1, 'equipment', 'T1');
    this.box('transformer-lid', [2.25, 0.12, 1.85], [tx, 2.3, tz], 'metal', -1, 'equipment', 'T1');
    for (let i = 0; i < 3; i++) {
      this.cylinder('bushing', 0.18, 0.65, [tx - 0.65 + i * 0.65, 2.64, tz], 'wood', -1, 'equipment', 'T1');
      for (let j = 0; j < 5; j++) this.cylinder('bushing-rib', 0.28, 0.055, [tx - 0.65 + i * 0.65, 2.38 + j * 0.11, tz], 'wood', -1, 'equipment', 'T1');
    }
    const conservator = this.cylinder('conservator', 0.55, 1.7, [tx, 2.77, tz + 0.7], 'green', -1, 'equipment', 'T1');
    conservator.rotation.z = Math.PI / 2;
    for (let i = 0; i < 3; i++) this.cabinet('MDB-A', -28.9 + i * 0.9, 1.45, -6.2, 0.88, 2.2, 'blue');
    this.cabinet('Q0', -28.9, 1.42, -6.8, 0.5, 0.75, 'blue');
    this.cabinet('C1', -28, 1.4, -9.5, 1.8, 2.1, 'green');
    this.cabinet('QC', -29.5, 1.3, -9.5, 0.6, 1.8, 'green');
    for (let i = 0; i < 9; i++) this.box('safety-stripe', [0.35, 0.02, 0.35], [-34.5 + i * 0.85, 0.325, -11.25], 'yellow', -1, 'plant');
    // Generator and dedicated pump compound on the rear service court.
    this.box('generator-plinth', [5.4, 0.28, 2.8], [-31, 0.24, 4], 'concrete', -1, 'equipment', 'GEN-1');
    this.box('generator-skid', [4.8, 0.4, 2.2], [-31, 0.58, 4], 'dark', -1, 'equipment', 'GEN-1');
    this.box('generator-canopy', [4.5, 2.1, 2], [-31, 1.75, 4], 'green', -1, 'equipment', 'GEN-1');
    for (let i = 0; i < 13; i++) this.box('generator-louver', [1.1, 0.055, 0.045], [-32.3, 1 + i * 0.12, 2.97], 'dark', -1, 'equipment', 'GEN-1');
    this.box('generator-door', [1.5, 1.75, 0.03], [-30.2, 1.75, 2.97], 'metal', -1, 'equipment', 'GEN-1');
    this.box('generator-display', [0.5, 0.3, 0.04], [-30.2, 1.95, 2.93], 'screen', -1, 'equipment', 'GEN-1');
    const exhaust = this.cylinder('exhaust-silencer', 0.42, 2.5, [-31, 3.05, 4], 'metal', -1, 'equipment', 'GEN-1');
    exhaust.rotation.z = Math.PI / 2;
    this.cylinder('exhaust-stack', 0.18, 1.2, [-29.8, 3.6, 4], 'metal', -1, 'equipment', 'GEN-1');
    this.cabinet('ATS-E', -27.5, 1.25, 3.8, 1.1, 2, 'yellow');
    this.cabinet('EDB', -23, 1.25, -1.7, 1.1, 2, 'yellow', 0);
    this.cabinet('MDP', -23, 1.25, 1.5, 1.1, 2, 'blue', 0);
    this.cabinet('FP-ATS', -34, 1.25, 12, 1.1, 2, 'red');
    this.box('pump-pad', [7.5, 0.24, 3.7], [-31, 0.23, 12], 'concrete', -1, 'plant');
    for (let i = 0; i < 3; i++) {
      const x = -31 + i * 1.5, tag = i === 0 ? 'FP-MOTOR' : 'WP-MOTOR', mat = i === 0 ? 'red' : 'blue';
      const motor = this.cylinder('pump-motor', 0.66, 1.15, [x, 0.8, 12], mat, -1, 'equipment', tag);
      motor.rotation.x = Math.PI / 2;
      this.cylinder('pump-casing', 0.75, 0.6, [x, 0.8, 11.15], mat, -1, 'equipment', tag);
      this.cylinder('pump-riser', 0.16, 1.7, [x, 1.3, 10.9], mat, -1, 'equipment', tag);
      for (let j = 0; j < 7; j++) {
        const fin = this.cylinder('motor-fin', 0.72, 0.03, [x, 0.8, 11.6 + j * 0.13], mat, -1, 'equipment', tag);
        fin.rotation.x = Math.PI / 2;
      }
    }
    for (let f = 0; f < 6; f++) {
      const h = LEVELS[f + 1] - LEVELS[f];
      for (const x of [-23.8, -22.8]) this.box('riser-rail', [0.055, h, 0.08], [x, h / 2, -4], 'metal', f, 'equipment', 'RISER');
      for (let y = 0.2; y < h; y += 0.4) this.box('riser-rung', [1.05, 0.035, 0.06], [-23.3, y, -4], 'metal', f, 'equipment', 'RISER');
    }
  }

  private sign(text: string, pos: number[], width: number, height: number, floor = -1, role = 'plant') {
    const tex = new DynamicTexture(`sign-${text}`, { width: 1024, height: 128 }, this.scene, true);
    tex.drawText(text, null, 82, '600 50px Arial', '#f3ede0', '#253c37', true);
    const mat = new StandardMaterial(`sign-${text}`, this.scene);
    mat.diffuseTexture = tex;
    mat.emissiveColor = new Color3(0.25, 0.25, 0.25);
    const plane = MeshBuilder.CreatePlane('sign', { width, height }, this.scene);
    plane.position.set(pos[0], pos[1], pos[2]);
    this.attach(plane, 'dark', floor, role);
    plane.material = mat;
  }

  private mergeStaticGeometry() {
    const groups = new Map<string, Part[]>();
    for (const part of this.parts) {
      const key = `${part.floor}|${part.role}|${part.tag ?? ''}|${part.mesh.material?.uniqueId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(part);
    }
    const merged: Part[] = [];
    for (const parts of groups.values()) {
      const first = parts[0];
      const parent = first.mesh.parent;
      // Merge in floor-local coordinates so exploded offsets move every detail together.
      for (const part of parts) { part.mesh.parent = null; part.mesh.computeWorldMatrix(true); }
      const mesh = parts.length > 1 ? Mesh.MergeMeshes(parts.map(p => p.mesh), true, true, undefined, false, false) : first.mesh;
      if (!mesh) continue;
      mesh.parent = parent;
      mesh.isPickable = Boolean(first.tag);
      mesh.metadata = { tag: first.tag };
      mesh.receiveShadows = true;
      mesh.name = `${first.role}-${first.tag ?? first.floor}-${mesh.material?.name}`;
      merged.push({ ...first, mesh });
      if (mesh.material?.alpha === 1 && first.role !== 'ground' && first.role !== 'context') this.shadows.addShadowCaster(mesh);
    }
    this.parts = merged;
  }

  private buildLabels() {
    for (const [tag, x, y, z, floor] of [
      ['T1 · 1,250 kVA', -31.5, 4, -6.7, -1], ['MDB · 2,500 A', -27, 3.6, -6, -1],
      ['GEN · 400 kVA', -31, 4.5, 4, -1], ['36 × VRF', 8, 3.5, 0, 6],
      ...LEVELS.slice(0, 6).map((_, i) => [`L${i + 1} · ${i < 2 ? 'RETAIL' : 'OFFICE'}`, 26, 2, -20, i])
    ] as [string, number, number, number, number][]) {
      const tex = new DynamicTexture(`label-${tag}`, { width: 512, height: 96 }, this.scene, true);
      tex.drawText(tag, null, 63, '600 36px Arial', '#ecf7f1', '#24483e', true);
      const material = new StandardMaterial(`label-${tag}`, this.scene);
      material.diffuseTexture = tex;
      material.disableLighting = true;
      material.emissiveColor = Color3.White();
      const mesh = MeshBuilder.CreatePlane(tag, { width: 6, height: 1.12 }, this.scene);
      mesh.material = material;
      mesh.position.set(x, y, z);
      mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
      mesh.isPickable = false;
      if (floor >= 0) mesh.parent = this.floors[floor];
      mesh.metadata = { floor };
      this.labels.push(mesh);
    }
  }

  private rebuildRoutes() {
    for (const route of this.routes) { route.mesh.dispose(); route.markers.forEach(m => m.dispose()); }
    this.routes = [];
    const y = (floor: number) => LEVELS[floor] + floor * this.options.explodedOffset * 5;
    const add = (kind: string, points: Vector3[], floor = -1) => {
      const materialName = `route-${kind}`;
      let material = this.materials.get(materialName);
      if (!material) {
        const color = kind === 'emergency' ? '#e8b14e' : kind === 'fire' || kind === 'hv' ? '#df6954' : '#51bca3';
        material = this.mat(materialName, color, 0.35, 0.15);
        material.emissiveColor = Color3.FromHexString(color).scale(0.7);
      }
      const mesh = MeshBuilder.CreateTube(`cable-${kind}`, { path: points, radius: 0.075, tessellation: 6 }, this.scene);
      mesh.material = material;
      mesh.isPickable = false;
      const markers = Array.from({ length: 3 }, () => {
        const dot = MeshBuilder.CreateSphere('power-pulse', { diameter: 0.27, segments: 6 }, this.scene);
        dot.material = this.materials.get('lamp')!;
        dot.isPickable = false;
        return dot;
      });
      this.routes.push({ mesh, points, markers, kind, floor });
    };
    add('hv', [v(-38, 0.55, -18), v(-34.5, 0.55, -18), v(-34.5, 2.9, -6.2), v(-31.5, 2.9, -6.7)]);
    add('normal', [v(-31.5, 2.4, -6.7), v(-31.5, 3.1, -8.3), v(-28, 3.1, -8.3), v(-28, 2.5, -6.2)]);
    for (let f = 0; f < 6; f++) {
      const x = -23.7 + f * 0.13;
      add('feeder', [v(-28, 2.8, -6.2), v(x, 2.8, -4.4), v(x, y(f) + 3.2, -4.4), v(-22.3, y(f) + 3.2, -6), v(-22.3, y(f) + 2, -6)], f);
    }
    add('apfc', [v(-28, 2.4, -6.2), v(-27.1, 2.8, -6.2), v(-27.1, 2.8, -9.5), v(-28, 2.4, -9.5)]);
    add('emergency', [v(-31, 2.3, 4), v(-31, 3.2, 1), v(-27.5, 3.2, 1), v(-27.5, 2.3, 3.8), v(-23, 2.3, -1.7)]);
    add('emergency', [v(-31, 2.3, 4), v(-35, 3.2, 4), v(-35, 3.2, 12), v(-34, 2.2, 12), v(-31, 1.7, 11)]);
    add('normal', [v(-28, 2.8, -6.2), v(-26, 2.8, -6.2), v(-26, 2.8, 3.8), v(-27.5, 2.3, 3.8), v(-23, 2.3, -1.7)]);
    add('normal', [v(-28, 2.8, -6.2), v(-25.7, 2.8, -6.2), v(-25.7, 2.8, 1.5), v(-23, 2.3, 1.5)]);
    // The dedicated fire feeder starts at the transformer side, before the main breaker.
    add('fire', [v(-31.5, 2.5, -6.7), v(-35, 3.1, -6.7), v(-35, 3.1, 12), v(-34, 2.2, 12), v(-31, 1.7, 11)]);
    this.setRouteVisibility();
  }

  private setRouteVisibility() {
    const o = this.options;
    for (const route of this.routes) {
      const mode = o.showPowerPath;
      const category = route.kind === 'hv' ? o.showHV : route.kind === 'feeder' ? o.showFeeders : route.kind === 'apfc' ? o.showAPFC && o.apfcEnergized : route.kind === 'emergency' || route.kind === 'fire' ? o.showEmergency : o.showLV;
      const active = mode === 'normal' ? ['hv', 'normal', 'feeder', 'apfc'].includes(route.kind) : route.kind === mode;
      route.mesh.isVisible = category && active && (o.isolatedFloor === null || route.floor < 0 || route.floor === o.isolatedFloor);
      route.markers.forEach(m => { m.isVisible = route.mesh.isVisible && o.animateFlow; });
    }
  }

  private pointAlong(points: Vector3[], fraction: number): Vector3 {
    let total = 0;
    for (let i = 1; i < points.length; i++) total += Vector3.Distance(points[i - 1], points[i]);
    let distance = fraction * total;
    for (let i = 1; i < points.length; i++) {
      const length = Vector3.Distance(points[i - 1], points[i]);
      if (distance <= length) return Vector3.Lerp(points[i - 1], points[i], length ? distance / length : 0);
      distance -= length;
    }
    return points[points.length - 1];
  }

  public updateViewOptions(options: ViewOptions3D) {
    const previous = this.options;
    this.options = options;
    if (!this.scene || !this.pipeline) return;
    const o = options;
    this.floors.forEach((floor, i) => {
      floor.position.y = LEVELS[i] + i * o.explodedOffset * 5;
      floor.setEnabled(o.isolatedFloor === null || o.isolatedFloor === i);
    });
    for (const part of this.parts) {
      const facade = part.role.startsWith('facade');
      let visible = true;
      if (facade) visible = o.shellMode !== 'hidden' && !(o.shellMode === 'cutaway' && ['facade-front', 'facade-east'].includes(part.role));
      if (part.role === 'context') visible = o.shellMode === 'normal' && o.isolatedFloor === null;
      const tag = part.tag;
      if (tag === 'HV-01' || tag === 'METER') visible = o.showHV;
      if (tag === 'T1') visible = o.showTransformer;
      if (['MDB-A', 'Q0', 'EDB', 'MDP'].includes(tag ?? '')) visible = o.showLV;
      if (tag?.startsWith('P-F') || tag === 'RISER') visible = o.showFeeders;
      if (tag === 'C1' || tag === 'QC') visible = o.showAPFC;
      if (['GEN-1', 'ATS-E', 'FP-ATS', 'FP-MOTOR'].includes(tag ?? '')) visible = o.showEmergency;
      if (['HVAC-LOAD', 'LIFT-MOTOR', 'WP-MOTOR'].includes(tag ?? '')) visible = o.showLoads;
      part.mesh.isVisible = visible;
    }
    this.materials.get('glass')!.alpha = o.shellOpacity;
    this.labels.forEach(label => { label.isVisible = o.showLabels; });
    const dusk = o.lighting === 'dusk';
    this.interiorLights.forEach(light => { light.intensity = dusk ? 90 : 5; });
    this.materials.get('glass')!.emissiveColor = dusk ? new Color3(0.055, 0.033, 0.01) : Color3.Black();
    this.sun.intensity = dusk ? 1.4 : 3.2;
    this.sun.diffuse = Color3.FromHexString(dusk ? '#ffb677' : '#fff0d4');
    this.sun.direction = dusk ? v(-0.8, -0.35, 0.6) : v(-0.6, -1, 0.55);
    this.ambient.intensity = dusk ? 0.18 : 0.32;
    this.ambient.diffuse = Color3.FromHexString(dusk ? '#b2c4e9' : '#d4e3e8');
    this.scene.environmentIntensity = dusk ? 0.4 : 0.7;
    this.scene.clearColor = Color4.FromHexString(dusk ? '#687987ff' : '#e3e8e7ff');
    this.scene.imageProcessingConfiguration.exposure = dusk ? 0.9 : 0.88;
    this.materials.get('lamp')!.emissiveColor = Color3.FromHexString('#ffdba0').scale(dusk ? 3 : 1.1);
    this.pipeline.bloomWeight = dusk ? 0.25 : 0.1;
    const high = o.quality === 'high';
    this.pipeline.samples = high ? Math.min(4, this.engine.getCaps().maxMSAASamples) : 1;
    this.engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, high ? 2 : 1.25));
    this.shadows.filteringQuality = high ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_LOW;
    if (!this.routes.length || previous.explodedOffset !== o.explodedOffset) this.rebuildRoutes();
    else this.setRouteVisibility();
  }

  public selectEquipment(tag: string | null) {
    this.selectedTag = tag;
    if (!this.highlight) return;
    this.highlight.removeAllMeshes();
    for (const part of this.parts) if (tag && part.tag === tag) this.highlight.addMesh(part.mesh, Color3.FromHexString('#75e7bf'));
  }

  public focusEquipment(tag: string) {
    const parts = this.parts.filter(part => part.tag === tag);
    if (!parts.length) return;
    const target = Vector3.Zero();
    for (const part of parts) { part.mesh.computeWorldMatrix(true); target.addInPlace(part.mesh.getBoundingInfo().boundingBox.centerWorld); }
    target.scaleInPlace(1 / parts.length);
    this.moveCamera(target, tag === 'HVAC-LOAD' ? 45 : 14, -1.35, 1.08);
  }

  public setCameraPreset(preset: CameraPreset) {
    const expansion = this.options.explodedOffset * 5;
    const presets: Record<CameraPreset, [Vector3, number, number, number]> = {
      home: [v(-1, 10 + expansion * 3, 0), 122 + expansion * 7, -1.02, 1.16],
      plant: [v(-31, 1.6, -7), 19, -1.45, 1.04],
      riser: [v(-23, 12 + expansion * 3, -4), 43 + expansion * 4, -0.8, 1.22],
      retail: [v(0, 3.5 + expansion, -3), 66, -1.03, 1.14],
      office: [v(2, 15.2 + expansion * 3, -4), 65, -1.02, 1.05],
      roof: [v(0, 27 + expansion * 6, 0), 64, -0.9, 0.55],
      basement: [v(-31, 1.3, 10), 23, -1.1, 0.85]
    };
    this.moveCamera(...presets[preset]);
  }

  private moveCamera(target: Vector3, radius: number, alpha: number, beta: number) {
    if (!this.camera) return;
    radius *= this.framingScale;
    this.scene.stopAnimation(this.camera);
    this.camera.inertialAlphaOffset = this.camera.inertialBetaOffset = this.camera.inertialRadiusOffset = 0;
    this.camera.inertialPanningX = this.camera.inertialPanningY = 0;
    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    const delta = Math.atan2(Math.sin(alpha - this.camera.alpha), Math.cos(alpha - this.camera.alpha));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const [property, from, to] of [
      ['alpha', this.camera.alpha, this.camera.alpha + delta], ['beta', this.camera.beta, beta],
      ['radius', this.camera.radius, radius], ['target', this.camera.target.clone(), target]
    ] as const) Animation.CreateAndStartAnimation(`camera-${property}`, this.camera, property, 60, reduced ? 1 : 45, from, to, Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  }

  public focusFloor(floor: number) {
    const y = LEVELS[floor] + floor * this.options.explodedOffset * 5;
    this.moveCamera(v(0, y + 1, 0), 78, -1.02, 0.85);
  }

  private getFramingScale() {
    const aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
    return Math.max(1, 0.95 / Math.max(aspect, 0.3));
  }

  public resize() {
    if (this.disposed) return;
    this.engine?.resize();
    if (this.camera) {
      const next = this.getFramingScale();
      // A running preset animation must not overwrite portrait reframing.
      if (Math.abs(next - this.framingScale) > 0.001) this.scene.stopAnimation(this.camera);
      this.camera.radius *= next / this.framingScale;
      this.framingScale = next;
    }
  }
  public dispose() {
    this.disposed = true;
    this.engine?.stopRenderLoop();
    this.scene?.dispose();
    this.engine?.dispose();
  }
}
