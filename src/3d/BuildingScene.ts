import {
  Engine,
  WebGPUEngine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  Mesh,
  ActionManager,
  ExecuteCodeAction,
  Animation,
  CubicEase,
  EasingFunction
} from '@babylonjs/core';
import { ViewOptions3D } from '../types/powerSystem';

export interface SceneCallbacks {
  onSelectEquipment: (tag: string | null) => void;
  onHoverEquipment: (tag: string | null) => void;
}

export class BuildingSceneManager {
  private engine!: Engine | WebGPUEngine;
  private scene!: Scene;
  private camera!: ArcRotateCamera;
  private canvas: HTMLCanvasElement;
  private callbacks: SceneCallbacks;

  // Meshes collections
  private equipmentMeshes: Map<string, Mesh[]> = new Map();
  private floorMeshes: Mesh[] = [];
  private shellMeshes: Mesh[] = [];
  private facadeMullionMeshes: Mesh[] = [];
  private cableMeshes: Map<string, Mesh[]> = new Map();

  // Default positions for exploded view
  private originalPositions: Map<Mesh, Vector3> = new Map();
  private explodedOffsets: Map<Mesh, Vector3> = new Map();

  private selectedTag: string | null = null;
  private isDisposed = false;
  private currentOptions: ViewOptions3D;

  constructor(canvas: HTMLCanvasElement, callbacks: SceneCallbacks, initialOptions: ViewOptions3D) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.currentOptions = initialOptions;
  }

  public async init(): Promise<string> {
    let engineType = 'WebGL2';
    try {
      const hasGlslang = typeof (window as any).glslang !== 'undefined';
      if (hasGlslang && (await WebGPUEngine.IsSupportedAsync)) {
        try {
          const webgpu = new WebGPUEngine(this.canvas, {
            stencil: true,
            antialias: true
          });
          await Promise.race([
            webgpu.initAsync(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('WebGPU init timeout')), 1500))
          ]);
          this.engine = webgpu;
          engineType = 'WebGPU (Hardware Accelerated)';
        } catch (gpuErr) {
          console.warn('WebGPU init unavailable, using WebGL2:', gpuErr);
          this.engine = new Engine(this.canvas, true, {
            stencil: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance'
          });
          engineType = 'WebGL2 (Hardware Accelerated)';
        }
      } else {
        this.engine = new Engine(this.canvas, true, {
          stencil: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance'
        });
        engineType = 'WebGL2 (Hardware Accelerated)';
      }
    } catch (e) {
      console.warn('Standard engine init error, falling back to basic WebGL:', e);
      this.engine = new Engine(this.canvas, true);
      engineType = 'WebGL2';
    }

    this.scene = new Scene(this.engine);
    // Crisp architectural engineering light background
    this.scene.clearColor = new Color4(0.95, 0.96, 0.98, 1.0);

    this.setupCamera();
    this.setupLights();

    // Comprehensive Architectural Commercial Structure
    this.buildBuildingShell();
    this.buildStructuralFrameAndCore();
    this.buildCurtainWallFacade();
    this.buildRetailFitout();
    this.buildOfficeFitout();
    this.buildRooftopPlantDeck();
    this.buildBasementCivil();

    // Realistic Power Engineering Equipment & Distribution
    this.buildElectricalPlantRoom();
    this.buildEmergencyAndFireSystem();
    this.buildCableFeedersAndRiser();

    this.engine.resize();

    this.engine.runRenderLoop(() => {
      if (!this.isDisposed && this.scene) {
        this.scene.render();
      }
    });

    window.addEventListener('resize', this.onResize);
    return engineType;
  }

  public resize(): void {
    if (this.engine) {
      this.engine.resize();
    }
  }

  private onResize = () => {
    this.resize();
  };

  private setupCamera() {
    this.camera = new ArcRotateCamera(
      'mainCamera',
      -Math.PI / 3,
      Math.PI / 3,
      38,
      new Vector3(0, 9, 0),
      this.scene
    );
    this.camera.attachControl(this.canvas, true);
    this.camera.lowerRadiusLimit = 4;
    this.camera.upperRadiusLimit = 85;
    this.camera.wheelPrecision = 20;
    this.camera.inertia = 0.65;
    this.camera.panningSensibility = 50;
  }

  private setupLights() {
    const ambient = new HemisphericLight('ambientLight', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.88;
    ambient.diffuse = new Color3(1.0, 1.0, 1.0);
    ambient.groundColor = new Color3(0.78, 0.82, 0.88);

    const dirLight1 = new DirectionalLight('dirLight1', new Vector3(-1, -2, -1).normalize(), this.scene);
    dirLight1.position = new Vector3(35, 55, 35);
    dirLight1.intensity = 1.05;
    dirLight1.diffuse = new Color3(1.0, 0.98, 0.95);

    const dirLight2 = new DirectionalLight('dirLight2', new Vector3(1, -1.2, 1).normalize(), this.scene);
    dirLight2.position = new Vector3(-35, 35, -35);
    dirLight2.intensity = 0.52;
    dirLight2.diffuse = new Color3(0.85, 0.92, 1.0);
  }

  private createMaterial(name: string, diffuse: Color3, specular = 0.35, roughness = 32, alpha = 1.0, emissive = Color3.Black()): StandardMaterial {
    const mat = new StandardMaterial(name, this.scene);
    mat.diffuseColor = diffuse;
    mat.specularColor = new Color3(specular, specular, specular);
    mat.specularPower = roughness;
    mat.alpha = alpha;
    mat.emissiveColor = emissive;
    return mat;
  }

  /**
   * 1. Architectural Floor Slabs & Ground Plinth
   */
  private buildBuildingShell() {
    const floorWidth = 14;
    const floorDepth = 10;
    const floorHeight = 2.8;
    const numFloors = 6;

    // Ground site plinth (Y = 0)
    const groundMat = this.createMaterial('groundMat', new Color3(0.88, 0.90, 0.94), 0.2, 16);
    const groundSlab = MeshBuilder.CreateBox('groundSlab', {
      width: floorWidth + 9,
      height: 0.4,
      depth: floorDepth + 9
    }, this.scene);
    groundSlab.position = new Vector3(0, -0.2, 0);
    groundSlab.material = groundMat;

    // Site perimeter road / curbs
    const roadMat = this.createMaterial('roadMat', new Color3(0.78, 0.81, 0.86));
    const curb = MeshBuilder.CreateBox('curb', {
      width: floorWidth + 9.4,
      height: 0.15,
      depth: floorDepth + 9.4
    }, this.scene);
    curb.position = new Vector3(0, -0.05, 0);
    curb.material = roadMat;

    // Post-tensioned concrete floor slabs (L1 to L6 and Roof)
    const slabMat = this.createMaterial('slabMat', new Color3(0.82, 0.85, 0.89), 0.3, 28);
    const trimMat = this.createMaterial('slabTrimMat', new Color3(0.70, 0.74, 0.80), 0.4, 32);

    for (let i = 1; i <= numFloors + 1; i++) {
      const slab = MeshBuilder.CreateBox(`slab_L${i}`, {
        width: floorWidth,
        height: 0.26,
        depth: floorDepth
      }, this.scene);
      const yPos = i * floorHeight;
      slab.position = new Vector3(0, yPos, 0);
      slab.material = slabMat;
      this.floorMeshes.push(slab);

      // Architectural facade slab-edge trim band
      const frontTrim = MeshBuilder.CreateBox(`slabTrim_L${i}`, {
        width: floorWidth + 0.08,
        height: 0.28,
        depth: 0.08
      }, this.scene);
      frontTrim.position = new Vector3(0, yPos, floorDepth / 2 + 0.03);
      frontTrim.material = trimMat;
      this.floorMeshes.push(frontTrim);

      // Store exploded anchors
      this.originalPositions.set(slab, slab.position.clone());
      this.explodedOffsets.set(slab, new Vector3(0, i * 2.2, 0));
      this.originalPositions.set(frontTrim, frontTrim.position.clone());
      this.explodedOffsets.set(frontTrim, new Vector3(0, i * 2.2, 0));
    }
  }

  /**
   * 2. Structural Frame, Concrete Columns & Central Core Shear Walls
   */
  private buildStructuralFrameAndCore() {
    const floorWidth = 14;
    const floorDepth = 10;
    const floorHeight = 2.8;
    const numFloors = 6;
    const totalHeight = (numFloors + 1) * floorHeight;

    const colMat = this.createMaterial('colMat', new Color3(0.72, 0.76, 0.82), 0.25, 20);

    // Structural reinforced concrete perimeter & interior columns
    const colCoords = [
      new Vector3(-floorWidth / 2 + 0.4, totalHeight / 2, -floorDepth / 2 + 0.4),
      new Vector3(floorWidth / 2 - 0.4, totalHeight / 2, -floorDepth / 2 + 0.4),
      new Vector3(-floorWidth / 2 + 0.4, totalHeight / 2, floorDepth / 2 - 0.4),
      new Vector3(floorWidth / 2 - 0.4, totalHeight / 2, floorDepth / 2 - 0.4),
      // Mid-span columns
      new Vector3(0, totalHeight / 2, -floorDepth / 2 + 0.4),
      new Vector3(0, totalHeight / 2, floorDepth / 2 - 0.4),
      new Vector3(-floorWidth / 2 + 0.4, totalHeight / 2, 0),
      new Vector3(floorWidth / 2 - 0.4, totalHeight / 2, 0)
    ];

    colCoords.forEach((pos, idx) => {
      const col = MeshBuilder.CreateBox(`structCol_${idx}`, {
        width: 0.55,
        height: totalHeight,
        depth: 0.55
      }, this.scene);
      col.position = pos;
      col.material = colMat;
      this.shellMeshes.push(col);
    });

    // Central Reinforced Concrete Core (Shear Walls enclosing Riser & Elevator Hoistway)
    const coreMat = this.createMaterial('coreMat', new Color3(0.76, 0.80, 0.86), 0.25, 24);
    const coreWallBack = MeshBuilder.CreateBox('core_wall_back', {
      width: 3.2,
      height: totalHeight,
      depth: 0.2
    }, this.scene);
    coreWallBack.position = new Vector3(-2.5, totalHeight / 2, -1.2);
    coreWallBack.material = coreMat;
    this.shellMeshes.push(coreWallBack);

    const coreWallSide = MeshBuilder.CreateBox('core_wall_side', {
      width: 0.2,
      height: totalHeight,
      depth: 2.2
    }, this.scene);
    coreWallSide.position = new Vector3(-4.1, totalHeight / 2, -0.1);
    coreWallSide.material = coreMat;
    this.shellMeshes.push(coreWallSide);
  }

  /**
   * 3. Curtain Wall Glazing, Aluminum Mullions & Spandrel Panels
   */
  private buildCurtainWallFacade() {
    const floorWidth = 14;
    const floorDepth = 10;
    const floorHeight = 2.8;
    const numFloors = 6;
    const totalHeight = (numFloors + 1) * floorHeight;

    // Architectural Low-E vision glass
    const glassMat = this.createMaterial('glassShellMat', new Color3(0.68, 0.85, 0.98), 0.85, 64, this.currentOptions.shellOpacity);
    glassMat.backFaceCulling = false;

    // Cutaway Back & Side Walls
    const backWall = MeshBuilder.CreateBox('backWall', { width: floorWidth, height: totalHeight, depth: 0.08 }, this.scene);
    backWall.position = new Vector3(0, totalHeight / 2, -floorDepth / 2);
    backWall.material = glassMat;
    this.shellMeshes.push(backWall);

    const leftWall = MeshBuilder.CreateBox('leftWall', { width: 0.08, height: totalHeight, depth: floorDepth }, this.scene);
    leftWall.position = new Vector3(-floorWidth / 2, totalHeight / 2, 0);
    leftWall.material = glassMat;
    this.shellMeshes.push(leftWall);

    const rightWall = MeshBuilder.CreateBox('rightWall', { width: 0.08, height: totalHeight, depth: floorDepth }, this.scene);
    rightWall.position = new Vector3(floorWidth / 2, totalHeight / 2, 0);
    rightWall.material = glassMat;
    this.shellMeshes.push(rightWall);

    // Front Wall (Toggleable normal vs cutaway)
    const frontWall = MeshBuilder.CreateBox('frontWall', { width: floorWidth, height: totalHeight, depth: 0.08 }, this.scene);
    frontWall.position = new Vector3(0, totalHeight / 2, floorDepth / 2);
    frontWall.material = glassMat;
    frontWall.isVisible = this.currentOptions.shellMode === 'normal';
    this.shellMeshes.push(frontWall);

    // Architectural Aluminum Mullion Grid (Frames)
    const mullionMat = this.createMaterial('mullionMat', new Color3(0.35, 0.38, 0.44), 0.6, 40);

    // Vertical facade mullions on rear and sides
    const numVertMullions = 6;
    for (let m = 0; m <= numVertMullions; m++) {
      const x = -floorWidth / 2 + (m * floorWidth) / numVertMullions;
      const vMullion = MeshBuilder.CreateBox(`mullion_v_${m}`, { width: 0.06, height: totalHeight, depth: 0.12 }, this.scene);
      vMullion.position = new Vector3(x, totalHeight / 2, -floorDepth / 2);
      vMullion.material = mullionMat;
      this.facadeMullionMeshes.push(vMullion);
      this.shellMeshes.push(vMullion);
    }

    // Ground Floor Double-Height Storefront Entrance Portal
    const entranceFrame = MeshBuilder.CreateBox('storefront_portal', { width: 4.5, height: 2.8, depth: 0.2 }, this.scene);
    entranceFrame.position = new Vector3(0, 1.4, floorDepth / 2 + 0.05);
    entranceFrame.material = this.createMaterial('mat_portal', new Color3(0.2, 0.22, 0.26), 0.6, 40);
    this.shellMeshes.push(entranceFrame);
  }

  /**
   * 4. Retail Floors (L1 & L2) - Display Islands, Shelving, Suspended Track Lighting & Escalator Void
   */
  private buildRetailFitout() {
    const floorHeight = 2.8;

    for (let f = 1; f <= 2; f++) {
      const y = f * floorHeight + 0.05;

      // Surface-mounted industrial track lighting rails flush under ceiling
      const trackMat = this.createMaterial(`trackMat_L${f}`, new Color3(0.22, 0.24, 0.28));
      const track1 = MeshBuilder.CreateBox(`track1_L${f}`, { width: 7.0, height: 0.04, depth: 0.05 }, this.scene);
      track1.position = new Vector3(0, y + 2.68, -1.5);
      track1.material = trackMat;
      this.floorMeshes.push(track1);

      const track2 = MeshBuilder.CreateBox(`track2_L${f}`, { width: 7.0, height: 0.04, depth: 0.05 }, this.scene);
      track2.position = new Vector3(0, y + 2.68, 1.5);
      track2.material = trackMat;
      this.floorMeshes.push(track2);

      // Track spotlights along the rails
      for (let s = -2.5; s <= 2.5; s += 1.25) {
        const spot = MeshBuilder.CreateCylinder(`spot_L${f}_${s}`, { diameter: 0.12, height: 0.15 }, this.scene);
        spot.position = new Vector3(s, y + 2.58, 1.5);
        spot.material = this.createMaterial(`mat_spot_${f}_${s}`, new Color3(0.9, 0.85, 0.4), 0.8, 48, 1.0, new Color3(0.25, 0.22, 0.08));
        this.floorMeshes.push(spot);
      }

      // Retail Checkout / Cash Wrap Counter
      const cashier = MeshBuilder.CreateBox(`cashier_L${f}`, { width: 2.4, height: 0.9, depth: 1.0 }, this.scene);
      cashier.position = new Vector3(-3.8, y + 0.45, 2.8);
      cashier.material = this.createMaterial(`mat_cashier_L${f}`, new Color3(0.88, 0.90, 0.94));
      this.floorMeshes.push(cashier);

      // Save for exploded offsets
      [track1, track2, cashier].forEach((mesh) => {
        this.originalPositions.set(mesh, mesh.position.clone());
        this.explodedOffsets.set(mesh, new Vector3(0, f * 2.2, 0));
      });
    }

    // Escalator structural truss connecting Level 1 (Retail) to Level 2 (Retail)
    const escAngle = -Math.PI / 6;
    const escMat = this.createMaterial('escMat', new Color3(0.3, 0.33, 0.38), 0.6, 40);
    const escalatorTruss = MeshBuilder.CreateBox('escalator_truss', { width: 1.2, height: 0.35, depth: 4.8 }, this.scene);
    escalatorTruss.position = new Vector3(3.2, 4.2, 0);
    escalatorTruss.rotation.x = escAngle;
    escalatorTruss.material = escMat;
    this.floorMeshes.push(escalatorTruss);

    // Glass balustrades on escalator
    const escGlass = MeshBuilder.CreateBox('escalator_glass', { width: 1.25, height: 0.7, depth: 4.8 }, this.scene);
    escGlass.position = new Vector3(3.2, 4.6, 0);
    escGlass.rotation.x = escAngle;
    escGlass.material = this.createMaterial('mat_esc_glass', new Color3(0.75, 0.88, 0.98), 0.8, 64, 0.4);
    this.floorMeshes.push(escGlass);
    
    [escalatorTruss, escGlass].forEach((mesh) => {
      this.originalPositions.set(mesh, mesh.position.clone());
      this.explodedOffsets.set(mesh, new Vector3(0, 1.5 * 2.2, 0));
    });
  }

  /**
   * 5. Office Floors (L3 to L6) - Acoustic Ceiling Grid, Workstations & Glazed Conference Rooms
   */
  private buildOfficeFitout() {
    const floorHeight = 2.8;

    for (let f = 3; f <= 6; f++) {
      const y = f * floorHeight + 0.05;

      // Suspended 600x600 Lay-In Ceiling Tiles with LED Troffers
      const ceilingMat = this.createMaterial(`ceilingMat_L${f}`, new Color3(0.88, 0.90, 0.92));
      for (let tx = -4; tx <= 4; tx += 2.8) {
        for (let tz = -2.5; tz <= 2.5; tz += 2.5) {
          const troffer = MeshBuilder.CreateBox(`troffer_L${f}_${tx}_${tz}`, { width: 1.4, height: 0.04, depth: 0.7 }, this.scene);
          troffer.position = new Vector3(tx, y + 2.65, tz);
          troffer.material = this.createMaterial(`mat_troff_${f}_${tx}`, new Color3(1.0, 1.0, 1.0), 0.9, 64, 1.0, new Color3(0.25, 0.25, 0.25));
          this.floorMeshes.push(troffer);

          this.originalPositions.set(troffer, troffer.position.clone());
          this.explodedOffsets.set(troffer, new Vector3(0, f * 2.2, 0));
        }
      }

      // Glazed Corner Executive Conference Room
      const confGlass = MeshBuilder.CreateBox(`conf_glass_L${f}`, { width: 3.5, height: 2.4, depth: 0.06 }, this.scene);
      confGlass.position = new Vector3(4.8, y + 1.2, -2.8);
      confGlass.material = this.createMaterial(`mat_conf_glass_${f}`, new Color3(0.72, 0.85, 0.95), 0.8, 64, 0.35);
      this.floorMeshes.push(confGlass);

      const confTable = MeshBuilder.CreateBox(`conf_table_L${f}`, { width: 2.2, height: 0.75, depth: 1.1 }, this.scene);
      confTable.position = new Vector3(5.2, y + 0.38, -3.8);
      confTable.material = this.createMaterial(`mat_conf_tab_${f}`, new Color3(0.4, 0.28, 0.2));
      this.floorMeshes.push(confTable);

      [confGlass, confTable].forEach((mesh) => {
        this.originalPositions.set(mesh, mesh.position.clone());
        this.explodedOffsets.set(mesh, new Vector3(0, f * 2.2, 0));
      });
    }
  }

  /**
   * 6. Rooftop Plant Deck - Parapet Walls, Dunnage Framing & Catwalks
   */
  private buildRooftopPlantDeck() {
    const floorWidth = 14;
    const floorDepth = 10;
    const floorHeight = 2.8;
    const roofY = 7 * floorHeight;

    // Perimeter safety parapet concrete wall
    const parapetMat = this.createMaterial('parapetMat', new Color3(0.78, 0.81, 0.86), 0.3, 24);
    const parapetBack = MeshBuilder.CreateBox('parapet_back', { width: floorWidth + 0.1, height: 1.1, depth: 0.25 }, this.scene);
    parapetBack.position = new Vector3(0, roofY + 0.55, -floorDepth / 2);
    parapetBack.material = parapetMat;
    this.floorMeshes.push(parapetBack);

    const parapetFront = MeshBuilder.CreateBox('parapet_front', { width: floorWidth + 0.1, height: 1.1, depth: 0.25 }, this.scene);
    parapetFront.position = new Vector3(0, roofY + 0.55, floorDepth / 2);
    parapetFront.material = parapetMat;
    this.floorMeshes.push(parapetFront);

    const parapetL = MeshBuilder.CreateBox('parapet_L', { width: 0.25, height: 1.1, depth: floorDepth }, this.scene);
    parapetL.position = new Vector3(-floorWidth / 2, roofY + 0.55, 0);
    parapetL.material = parapetMat;
    this.floorMeshes.push(parapetL);

    const parapetR = MeshBuilder.CreateBox('parapet_R', { width: 0.25, height: 1.1, depth: floorDepth }, this.scene);
    parapetR.position = new Vector3(floorWidth / 2, roofY + 0.55, 0);
    parapetR.material = parapetMat;
    this.floorMeshes.push(parapetR);

    // Structural steel dunnage frame (I-beams) elevating VRF condensing units
    const dunnageMat = this.createMaterial('dunnageMat', new Color3(0.3, 0.35, 0.4), 0.6, 40);
    const dunnageBeam1 = MeshBuilder.CreateBox('dunnage_beam1', { width: 7.2, height: 0.2, depth: 0.15 }, this.scene);
    dunnageBeam1.position = new Vector3(3.8, roofY + 0.1, 1.0);
    dunnageBeam1.material = dunnageMat;
    this.floorMeshes.push(dunnageBeam1);

    const dunnageBeam2 = MeshBuilder.CreateBox('dunnage_beam2', { width: 7.2, height: 0.2, depth: 0.15 }, this.scene);
    dunnageBeam2.position = new Vector3(3.8, roofY + 0.1, 2.0);
    dunnageBeam2.material = dunnageMat;
    this.floorMeshes.push(dunnageBeam2);

    [parapetBack, parapetFront, parapetL, parapetR, dunnageBeam1, dunnageBeam2].forEach((mesh) => {
      this.originalPositions.set(mesh, mesh.position.clone());
      this.explodedOffsets.set(mesh, new Vector3(0, 7 * 2.2, 0));
    });
  }

  /**
   * 7. Basement Civil - Retaining Walls & Cable Trenches
   */
  private buildBasementCivil() {
    const basementY = -2.5;
    const retainMat = this.createMaterial('retainMat', new Color3(0.74, 0.77, 0.82), 0.2, 16);

    // Board-formed concrete retaining walls
    const retWall1 = MeshBuilder.CreateBox('retWall_back', { width: 8.5, height: 2.8, depth: 0.3 }, this.scene);
    retWall1.position = new Vector3(5.0, basementY + 1.4, -1.0);
    retWall1.material = retainMat;
    this.floorMeshes.push(retWall1);

    const retWall2 = MeshBuilder.CreateBox('retWall_side', { width: 0.3, height: 2.8, depth: 7.0 }, this.scene);
    retWall2.position = new Vector3(9.2, basementY + 1.4, 2.5);
    retWall2.material = retainMat;
    this.floorMeshes.push(retWall2);

    // Galvanized steel checkered trench covers for sump/cable trenches
    const trenchMat = this.createMaterial('trenchMat', new Color3(0.45, 0.48, 0.52), 0.5, 36);
    const trenchCover = MeshBuilder.CreateBox('trench_cover_bsmt', { width: 1.2, height: 0.05, depth: 5.5 }, this.scene);
    trenchCover.position = new Vector3(4.0, basementY + 0.02, 2.2);
    trenchCover.material = trenchMat;
    this.floorMeshes.push(trenchCover);
  }

  /**
   * 8. Detailed Electrical Plant Room Equipment:
   * - Concrete Plinths with Yellow/Black safety borders
   * - Overhead Monorail Hoist Crane Beam
   * - High-Voltage Safety Mesh Barrier Cage & "DANGER 13.8 kV" Sign
   * - 13.8 kV Vacuum Switchgear (HV-01) with protection relay & drawout VCB
   * - Revenue Metering Point (METER) with digital display & test blocks
   * - 1,250 kVA Dyn11 Oil Transformer (T1) with radiator flutes, conservator, Buchholz relay, & bushings
   * - 2,500 A Main Switchboard (MDB-A) with ACB Q0, busbar window & feeder handles
   * - 400 kVAr Detuned APFC Bank (C1 & QC) with capacitor cans, detuned reactors & controller
   */
  private buildElectricalPlantRoom() {
    const groundY = 0.05;
    const plinthMat = this.createMaterial('mat_plinth', new Color3(0.78, 0.81, 0.86), 0.25, 16);

    // Overhead Yellow Monorail Crane Beam for transformer/switchgear service
    const craneMat = this.createMaterial('craneMat', new Color3(0.95, 0.75, 0.1), 0.5, 40);
    const craneBeam = MeshBuilder.CreateBox('crane_monorail', { width: 12.0, height: 0.28, depth: 0.18 }, this.scene);
    craneBeam.position = new Vector3(-4.0, 2.65, -2.5);
    craneBeam.material = craneMat;
    this.floorMeshes.push(craneBeam);

    // Hoist trolley on beam
    const hoistTrolley = MeshBuilder.CreateBox('hoist_trolley', { width: 0.6, height: 0.4, depth: 0.35 }, this.scene);
    hoistTrolley.position = new Vector3(-5.5, 2.4, -2.5);
    hoistTrolley.material = this.createMaterial('mat_hoist', new Color3(0.25, 0.28, 0.32));
    this.floorMeshes.push(hoistTrolley);

    // High-Voltage Safety Mesh Barrier Cage (protecting 13.8 kV transformer bay)
    const cageMat = this.createMaterial('cageMat', new Color3(0.85, 0.88, 0.92), 0.6, 48, 0.4);
    const hvCage = MeshBuilder.CreateBox('HV_safety_cage', { width: 7.0, height: 2.2, depth: 0.08 }, this.scene);
    hvCage.position = new Vector3(-7.0, groundY + 1.1, -1.0);
    hvCage.material = cageMat;
    this.shellMeshes.push(hvCage);

    // "DANGER: HIGH VOLTAGE 13.8 kV" Warning Plaque on cage
    const hvSign = MeshBuilder.CreatePlane('HV_danger_sign', { width: 0.9, height: 0.4 }, this.scene);
    hvSign.position = new Vector3(-7.0, groundY + 1.4, -0.95);
    hvSign.material = this.createMaterial('mat_hv_sign', new Color3(0.95, 0.85, 0.1), 0.3, 16, 1.0, new Color3(0.3, 0.25, 0.05));
    this.shellMeshes.push(hvSign);

    // -------------------------------------------------------------
    // 1. HV Switchgear & Breaker (HV-01 - 17.5 kV / 25 kA Metal-Clad)
    // -------------------------------------------------------------
    const hvPlinth = MeshBuilder.CreateBox('HV_plinth', { width: 1.6, height: 0.15, depth: 1.4 }, this.scene);
    hvPlinth.position = new Vector3(-8.5, groundY + 0.075, -2.5);
    hvPlinth.material = plinthMat;

    const hvCubicle = MeshBuilder.CreateBox('HV-01_body', { width: 1.3, height: 2.3, depth: 1.1 }, this.scene);
    hvCubicle.position = new Vector3(-8.5, groundY + 1.25, -2.5);
    hvCubicle.material = this.createMaterial('mat_HV_body', new Color3(0.85, 0.22, 0.22), 0.45, 48);

    // Numerical Protection Relay (SEL/REF style) with LCD screen
    const relayDoor = MeshBuilder.CreateBox('HV-01_relayDoor', { width: 1.15, height: 0.72, depth: 0.08 }, this.scene);
    relayDoor.position = new Vector3(-8.5, groundY + 2.0, -1.94);
    relayDoor.material = this.createMaterial('mat_HV_panel', new Color3(0.2, 0.22, 0.26));

    const relayLcd = MeshBuilder.CreatePlane('HV-01_lcd', { width: 0.48, height: 0.26 }, this.scene);
    relayLcd.position = new Vector3(-8.7, groundY + 2.05, -1.89);
    relayLcd.material = this.createMaterial('mat_HV_lcd', new Color3(0.12, 0.95, 0.75), 0.8, 64, 1.0, new Color3(0.1, 0.4, 0.3));

    // Vacuum Circuit Breaker drawout carriage & Trip/Close buttons
    const vcbWindow = MeshBuilder.CreateBox('HV-01_vcbWindow', { width: 0.42, height: 0.45, depth: 0.06 }, this.scene);
    vcbWindow.position = new Vector3(-8.5, groundY + 1.2, -1.94);
    vcbWindow.material = this.createMaterial('mat_glass_dark', new Color3(0.15, 0.3, 0.4), 0.9, 64, 0.75);

    const btnTrip = MeshBuilder.CreateCylinder('HV-01_btnTrip', { diameter: 0.09, height: 0.06 }, this.scene);
    btnTrip.rotation.x = Math.PI / 2;
    btnTrip.position = new Vector3(-8.15, groundY + 1.28, -1.92);
    btnTrip.material = this.createMaterial('mat_redBtn', new Color3(0.95, 0.1, 0.1));

    const btnClose = MeshBuilder.CreateCylinder('HV-01_btnClose', { diameter: 0.09, height: 0.06 }, this.scene);
    btnClose.rotation.x = Math.PI / 2;
    btnClose.position = new Vector3(-8.15, groundY + 1.12, -1.92);
    btnClose.material = this.createMaterial('mat_greenBtn', new Color3(0.1, 0.85, 0.2));

    const hvGland = MeshBuilder.CreateCylinder('HV-01_gland', { diameter: 0.25, height: 0.3 }, this.scene);
    hvGland.position = new Vector3(-8.5, groundY + 0.15, -2.5);
    hvGland.material = this.createMaterial('mat_brass', new Color3(0.75, 0.6, 0.2));

    this.registerEquipment('HV-01', [hvCubicle, hvPlinth, relayDoor, relayLcd, vcbWindow, btnTrip, btnClose, hvGland], new Vector3(-2, 0, -1));

    // -------------------------------------------------------------
    // 2. Revenue Metering Cubicle (METER)
    // -------------------------------------------------------------
    const meterPlinth = MeshBuilder.CreateBox('METER_plinth', { width: 1.1, height: 0.15, depth: 1.0 }, this.scene);
    meterPlinth.position = new Vector3(-10.2, groundY + 0.075, -2.5);
    meterPlinth.material = plinthMat;

    const meterCubicle = MeshBuilder.CreateBox('METER_body', { width: 0.95, height: 1.9, depth: 0.85 }, this.scene);
    meterCubicle.position = new Vector3(-10.2, groundY + 1.05, -2.5);
    meterCubicle.material = this.createMaterial('mat_Meter_body', new Color3(0.92, 0.55, 0.12), 0.4, 32);

    const meterDisplayWindow = MeshBuilder.CreateBox('METER_displayWindow', { width: 0.55, height: 0.5, depth: 0.05 }, this.scene);
    meterDisplayWindow.position = new Vector3(-10.2, groundY + 1.35, -2.06);
    meterDisplayWindow.material = this.createMaterial('mat_meter_window', new Color3(0.1, 0.2, 0.3), 0.8, 64, 0.7);

    const meterLcd = MeshBuilder.CreatePlane('METER_lcd', { width: 0.42, height: 0.24 }, this.scene);
    meterLcd.position = new Vector3(-10.2, groundY + 1.38, -2.03);
    meterLcd.material = this.createMaterial('mat_meter_screen', new Color3(0.15, 0.88, 0.98), 0.8, 64, 1.0, new Color3(0.1, 0.35, 0.4));

    const testBlock = MeshBuilder.CreateBox('METER_testBlock', { width: 0.45, height: 0.22, depth: 0.08 }, this.scene);
    testBlock.position = new Vector3(-10.2, groundY + 0.85, -2.06);
    testBlock.material = this.createMaterial('mat_testBlock', new Color3(0.18, 0.18, 0.2));

    this.registerEquipment('METER', [meterCubicle, meterPlinth, meterDisplayWindow, meterLcd, testBlock], new Vector3(-3, 0, -1));

    // -------------------------------------------------------------
    // 3. 1,250 kVA Dyn11 Oil Transformer (T1 - Alternative 1)
    // -------------------------------------------------------------
    const t1Plinth = MeshBuilder.CreateBox('T1_plinth', { width: 3.4, height: 0.15, depth: 2.8 }, this.scene);
    t1Plinth.position = new Vector3(-5.5, groundY + 0.075, -2.5);
    t1Plinth.material = plinthMat;

    // Steel base skid channels with transport rollers
    const skidL = MeshBuilder.CreateBox('T1_skidL', { width: 0.16, height: 0.18, depth: 2.5 }, this.scene);
    skidL.position = new Vector3(-6.3, groundY + 0.2, -2.5);
    skidL.material = this.createMaterial('mat_steel', new Color3(0.3, 0.35, 0.4), 0.6, 40);

    const skidR = MeshBuilder.CreateBox('T1_skidR', { width: 0.16, height: 0.18, depth: 2.5 }, this.scene);
    skidR.position = new Vector3(-4.7, groundY + 0.2, -2.5);
    skidR.material = skidL.material;

    // Corrugated transformer steel tank
    const trTank = MeshBuilder.CreateBox('T1_tank', { width: 1.9, height: 1.85, depth: 1.7 }, this.scene);
    trTank.position = new Vector3(-5.5, groundY + 1.15, -2.5);
    trTank.material = this.createMaterial('mat_T1_tank', new Color3(0.25, 0.55, 0.85), 0.5, 48);

    const coverPlate = MeshBuilder.CreateBox('T1_cover', { width: 2.05, height: 0.1, depth: 1.85 }, this.scene);
    coverPlate.position = new Vector3(-5.5, groundY + 2.1, -2.5);
    coverPlate.material = trTank.material;

    // Dual Radiator Cooling Banks with individual cooling flutes
    const finMat = this.createMaterial('mat_T1_fins', new Color3(0.2, 0.45, 0.75), 0.4, 32);
    const radiatorMeshes: Mesh[] = [];

    for (let f = 0; f < 6; f++) {
      const finL = MeshBuilder.CreateBox(`T1_finL_${f}`, { width: 0.04, height: 1.5, depth: 1.4 }, this.scene);
      finL.position = new Vector3(-6.55 - f * 0.08, groundY + 1.15, -2.5);
      finL.material = finMat;

      const finR = MeshBuilder.CreateBox(`T1_finR_${f}`, { width: 0.04, height: 1.5, depth: 1.4 }, this.scene);
      finR.position = new Vector3(-4.45 + f * 0.08, groundY + 1.15, -2.5);
      finR.material = finMat;

      radiatorMeshes.push(finL, finR);
    }

    // Cylindrical Oil Conservator Drum & Buchholz Relay
    const conservator = MeshBuilder.CreateCylinder('T1_conservator', { diameter: 0.55, height: 1.6 }, this.scene);
    conservator.rotation.z = Math.PI / 2;
    conservator.position = new Vector3(-5.5, groundY + 2.45, -2.2);
    conservator.material = trTank.material;

    const buchholzPipe = MeshBuilder.CreateCylinder('T1_buchholz', { diameter: 0.12, height: 0.45 }, this.scene);
    buchholzPipe.position = new Vector3(-5.5, groundY + 2.25, -2.2);
    buchholzPipe.material = this.createMaterial('mat_buchholz', new Color3(0.85, 0.7, 0.1));

    const breatherPipe = MeshBuilder.CreateCylinder('T1_breather', { diameter: 0.08, height: 1.4 }, this.scene);
    breatherPipe.position = new Vector3(-6.2, groundY + 1.7, -1.65);
    breatherPipe.material = this.createMaterial('mat_pipe', new Color3(0.6, 0.65, 0.7));

    // 3 High Voltage (13.8 kV) Ribbed Porcelain Bushings
    const hvBushingMeshes: Mesh[] = [];
    const hvBushMat = this.createMaterial('mat_hvBush', new Color3(0.85, 0.18, 0.18), 0.6, 48);
    for (let b = 0; b < 3; b++) {
      const bush = MeshBuilder.CreateCylinder(`T1_hvBush_${b}`, { diameter: 0.16, height: 0.5 }, this.scene);
      bush.position = new Vector3(-6.0 + b * 0.5, groundY + 2.35, -3.15);
      bush.material = hvBushMat;

      const stud = MeshBuilder.CreateCylinder(`T1_hvStud_${b}`, { diameter: 0.06, height: 0.15 }, this.scene);
      stud.position = new Vector3(-6.0 + b * 0.5, groundY + 2.65, -3.15);
      stud.material = this.createMaterial('mat_brass_stud', new Color3(0.8, 0.65, 0.2));
      hvBushingMeshes.push(bush, stud);
    }

    // 4 Low Voltage (400 V) Copper Flag Bushings (X1, X2, X3, X0)
    const lvBushingMeshes: Mesh[] = [];
    const lvBushMat = this.createMaterial('mat_lvBush', new Color3(0.2, 0.75, 0.85), 0.5, 48);
    const copperMat = this.createMaterial('mat_copper', new Color3(0.88, 0.52, 0.22), 0.7, 48);
    for (let b = 0; b < 4; b++) {
      const bush = MeshBuilder.CreateCylinder(`T1_lvBush_${b}`, { diameter: 0.14, height: 0.35 }, this.scene);
      bush.position = new Vector3(-6.1 + b * 0.4, groundY + 2.25, -1.8);
      bush.material = lvBushMat;

      const spade = MeshBuilder.CreateBox(`T1_lvSpade_${b}`, { width: 0.12, height: 0.15, depth: 0.03 }, this.scene);
      spade.position = new Vector3(-6.1 + b * 0.4, groundY + 2.45, -1.8);
      spade.material = copperMat;
      lvBushingMeshes.push(bush, spade);
    }

    const nameplate = MeshBuilder.CreatePlane('T1_nameplate', { width: 0.5, height: 0.3 }, this.scene);
    nameplate.position = new Vector3(-5.5, groundY + 1.2, -1.64);
    nameplate.material = this.createMaterial('mat_t1_plate', new Color3(0.9, 0.9, 0.92));

    this.registerEquipment('T1', [
      trTank, t1Plinth, skidL, skidR, coverPlate, conservator, buchholzPipe, breatherPipe, nameplate,
      ...radiatorMeshes, ...hvBushingMeshes, ...lvBushingMeshes
    ], new Vector3(-1, 0, -1));

    // -------------------------------------------------------------
    // 4. Main Distribution Board (MDB-A - 2,500 A Form 4b) & ACB Q0
    // -------------------------------------------------------------
    const mdbPlinth = MeshBuilder.CreateBox('MDB_plinth', { width: 3.8, height: 0.15, depth: 1.3 }, this.scene);
    mdbPlinth.position = new Vector3(-1.5, groundY + 0.075, -2.5);
    mdbPlinth.material = plinthMat;

    const mdbBody = MeshBuilder.CreateBox('MDB-A_body', { width: 3.5, height: 2.3, depth: 1.05 }, this.scene);
    mdbBody.position = new Vector3(-1.5, groundY + 1.25, -2.5);
    mdbBody.material = this.createMaterial('mat_MDB_body', new Color3(0.12, 0.48, 0.78), 0.45, 40);

    // Main ACB Q0 drawout compartment & Electronic Trip Unit
    const q0Box = MeshBuilder.CreateBox('Q0_body', { width: 0.95, height: 0.95, depth: 0.45 }, this.scene);
    q0Box.position = new Vector3(-2.4, groundY + 1.25, -1.85);
    q0Box.material = this.createMaterial('mat_Q0_body', new Color3(0.08, 0.32, 0.58), 0.5, 48);

    const q0Screen = MeshBuilder.CreatePlane('Q0_screen', { width: 0.35, height: 0.22 }, this.scene);
    q0Screen.position = new Vector3(-2.4, groundY + 1.45, -1.61);
    q0Screen.material = this.createMaterial('mat_q0_lcd', new Color3(0.2, 0.95, 0.4), 0.8, 64, 1.0, new Color3(0.05, 0.3, 0.1));

    const q0Handle = MeshBuilder.CreateBox('Q0_handle', { width: 0.35, height: 0.06, depth: 0.08 }, this.scene);
    q0Handle.position = new Vector3(-2.4, groundY + 1.05, -1.61);
    q0Handle.material = this.createMaterial('mat_q0_handle', new Color3(0.8, 0.8, 0.85));

    // Transparent Polycarbonate Busbar Window showing L1, L2, L3, N copper busbars
    const busWindow = MeshBuilder.CreateBox('MDB_buswindow', { width: 3.1, height: 0.42, depth: 0.05 }, this.scene);
    busWindow.position = new Vector3(-1.5, groundY + 2.05, -1.95);
    busWindow.material = this.createMaterial('mat_bus_window', new Color3(0.2, 0.3, 0.4), 0.8, 64, 0.65);

    const busbarMeshes: Mesh[] = [];
    const busColors = [
      new Color3(0.85, 0.2, 0.2),  // Phase A - Red
      new Color3(0.9, 0.75, 0.1),  // Phase B - Yellow
      new Color3(0.15, 0.4, 0.9),  // Phase C - Blue
      new Color3(0.2, 0.8, 0.9)    // Neutral - Cyan
    ];
    for (let b = 0; b < 4; b++) {
      const bus = MeshBuilder.CreateBox(`MDB_bus_${b}`, { width: 3.0, height: 0.04, depth: 0.03 }, this.scene);
      bus.position = new Vector3(-1.5, groundY + 2.18 - b * 0.08, -2.05);
      bus.material = this.createMaterial(`mat_bus_${b}`, busColors[b]);
      busbarMeshes.push(bus);
    }

    // Outgoing Feeder breaker compartments & rotary handles
    const feederDoors: Mesh[] = [];
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 2; row++) {
        const door = MeshBuilder.CreateBox(`MDB_door_${col}_${row}`, { width: 0.65, height: 0.45, depth: 0.04 }, this.scene);
        door.position = new Vector3(-1.3 + col * 0.75, groundY + 1.45 - row * 0.52, -1.95);
        door.material = this.createMaterial(`mat_mdb_door_${col}_${row}`, new Color3(0.18, 0.22, 0.28));

        const rotHandle = MeshBuilder.CreateCylinder(`MDB_rot_${col}_${row}`, { diameter: 0.09, height: 0.06 }, this.scene);
        rotHandle.rotation.x = Math.PI / 2;
        rotHandle.position = new Vector3(-1.3 + col * 0.75, groundY + 1.45 - row * 0.52, -1.91);
        rotHandle.material = this.createMaterial(`mat_rot_${col}_${row}`, new Color3(0.85, 0.15, 0.15));

        feederDoors.push(door, rotHandle);
      }
    }

    this.registerEquipment('MDB-A', [mdbBody, mdbPlinth, busWindow, ...busbarMeshes, ...feederDoors], new Vector3(0, 0, -1));
    this.registerEquipment('Q0', [q0Box, q0Screen, q0Handle], new Vector3(0, 0, -0.8));

    // -------------------------------------------------------------
    // 5. APFC Capacitor Bank & Detuned Reactors (C1 & QC - 400 kVAr)
    // -------------------------------------------------------------
    const apfcPlinth = MeshBuilder.CreateBox('APFC_plinth', { width: 2.1, height: 0.15, depth: 1.3 }, this.scene);
    apfcPlinth.position = new Vector3(1.6, groundY + 0.075, -2.5);
    apfcPlinth.material = plinthMat;

    const apfcBody = MeshBuilder.CreateBox('C1_body', { width: 1.85, height: 2.3, depth: 1.05 }, this.scene);
    apfcBody.position = new Vector3(1.6, groundY + 1.25, -2.5);
    apfcBody.material = this.createMaterial('mat_APFC_body', new Color3(0.12, 0.68, 0.45), 0.45, 40);

    const reactorChamber = MeshBuilder.CreateBox('C1_reactors', { width: 1.65, height: 0.75, depth: 0.85 }, this.scene);
    reactorChamber.position = new Vector3(1.6, groundY + 0.5, -2.4);
    reactorChamber.material = this.createMaterial('mat_reactors_box', new Color3(0.1, 0.48, 0.32));

    // 16 Cylindrical Aluminum Capacitor Cans
    const capacitorCans: Mesh[] = [];
    const canMat = this.createMaterial('mat_cap_can', new Color3(0.85, 0.88, 0.92), 0.7, 50);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 8; c++) {
        const can = MeshBuilder.CreateCylinder(`C1_can_${r}_${c}`, { diameter: 0.12, height: 0.45 }, this.scene);
        can.position = new Vector3(1.0 + c * 0.16, groundY + 1.65 - r * 0.35, -2.3);
        can.material = canMat;
        capacitorCans.push(can);
      }
    }

    // Microprocessor Controller on Door
    const controllerPanel = MeshBuilder.CreateBox('C1_controller', { width: 0.6, height: 0.4, depth: 0.05 }, this.scene);
    controllerPanel.position = new Vector3(1.2, groundY + 1.85, -1.95);
    controllerPanel.material = this.createMaterial('mat_controller_face', new Color3(0.15, 0.18, 0.22));

    const controllerLcd = MeshBuilder.CreatePlane('C1_lcd', { width: 0.35, height: 0.16 }, this.scene);
    controllerLcd.position = new Vector3(1.2, groundY + 1.92, -1.91);
    controllerLcd.material = this.createMaterial('mat_apfc_lcd', new Color3(0.15, 0.95, 0.5), 0.8, 64, 1.0, new Color3(0.05, 0.35, 0.15));

    // QC incoming isolator switch
    const qcBox = MeshBuilder.CreateBox('QC_body', { width: 0.45, height: 0.45, depth: 0.2 }, this.scene);
    qcBox.position = new Vector3(2.1, groundY + 1.5, -1.93);
    qcBox.material = this.createMaterial('mat_QC_switch', new Color3(0.08, 0.45, 0.28));

    const qcHandle = MeshBuilder.CreateCylinder('QC_handle', { diameter: 0.08, height: 0.15 }, this.scene);
    qcHandle.rotation.x = Math.PI / 2;
    qcHandle.position = new Vector3(2.1, groundY + 1.5, -1.8);
    qcHandle.material = this.createMaterial('mat_qc_red', new Color3(0.9, 0.15, 0.15));

    this.registerEquipment('C1', [apfcBody, apfcPlinth, reactorChamber, controllerPanel, controllerLcd, ...capacitorCans], new Vector3(1.5, 0, -1));
    this.registerEquipment('QC', [qcBox, qcHandle], new Vector3(1.5, 0, -0.8));
  }

  /**
   * 9. Emergency Infrastructure & Dedicated Fire Protection:
   * - 400 kVA Standby Generator (GEN-1) with sound-attenuated acoustic canopy
   * - Sub-base fuel tank with fuel filler cap & level gauge
   * - Rooftop exhaust silencer / muffler with rain cap
   * - Essential ATS (ATS-E)
   * - Dedicated Fire Pump Controller (FP-ATS) in safety red
   * - 37 kW Fire Pump Motor & Centrifugal Pump (FP-MOTOR)
   */
  private buildEmergencyAndFireSystem() {
    const groundY = 0.05;
    const plinthMat = this.createMaterial('mat_plinth_gen', new Color3(0.78, 0.81, 0.86), 0.25, 16);

    // 1. Standby Diesel Generator (GEN-1 - 400 kVA / 320 kW)
    const genPlinth = MeshBuilder.CreateBox('GEN_plinth', { width: 4.2, height: 0.2, depth: 2.2 }, this.scene);
    genPlinth.position = new Vector3(8.5, groundY + 0.1, -2.5);
    genPlinth.material = plinthMat;

    const genCanopy = MeshBuilder.CreateBox('GEN-1_canopy', { width: 3.6, height: 2.2, depth: 1.7 }, this.scene);
    genCanopy.position = new Vector3(8.5, groundY + 1.3, -2.5);
    genCanopy.material = this.createMaterial('mat_GEN_canopy', new Color3(0.95, 0.65, 0.12), 0.5, 48);

    const fuelSkid = MeshBuilder.CreateBox('GEN-1_skid', { width: 3.75, height: 0.35, depth: 1.8 }, this.scene);
    fuelSkid.position = new Vector3(8.5, groundY + 0.35, -2.5);
    fuelSkid.material = this.createMaterial('mat_gen_skid', new Color3(0.25, 0.28, 0.32));

    const intakeLouver = MeshBuilder.CreateBox('GEN-1_intake', { width: 0.1, height: 1.4, depth: 1.3 }, this.scene);
    intakeLouver.position = new Vector3(6.65, groundY + 1.4, -2.5);
    intakeLouver.material = this.createMaterial('mat_louver', new Color3(0.18, 0.2, 0.25));

    const muffler = MeshBuilder.CreateCylinder('GEN-1_exhaust', { diameter: 0.45, height: 1.9 }, this.scene);
    muffler.rotation.z = Math.PI / 2;
    muffler.position = new Vector3(8.5, groundY + 2.65, -2.5);
    muffler.material = this.createMaterial('mat_muffler', new Color3(0.3, 0.32, 0.35), 0.6, 32);

    const exhaustPipe = MeshBuilder.CreateCylinder('GEN-1_pipe', { diameter: 0.22, height: 0.9 }, this.scene);
    exhaustPipe.position = new Vector3(9.3, groundY + 3.0, -2.5);
    exhaustPipe.material = muffler.material;

    const genController = MeshBuilder.CreatePlane('GEN-1_lcd', { width: 0.45, height: 0.3 }, this.scene);
    genController.position = new Vector3(8.5, groundY + 1.5, -1.64);
    genController.material = this.createMaterial('mat_gen_lcd', new Color3(0.15, 0.95, 0.85), 0.8, 64, 1.0, new Color3(0.05, 0.35, 0.3));

    const estopBtn = MeshBuilder.CreateCylinder('GEN-1_estop', { diameter: 0.12, height: 0.08 }, this.scene);
    estopBtn.rotation.x = Math.PI / 2;
    estopBtn.position = new Vector3(9.1, groundY + 1.3, -1.63);
    estopBtn.material = this.createMaterial('mat_estop', new Color3(0.95, 0.1, 0.1));

    const qgBox = MeshBuilder.CreateBox('QG_body', { width: 0.65, height: 0.75, depth: 0.35 }, this.scene);
    qgBox.position = new Vector3(6.9, groundY + 1.3, -1.9);
    qgBox.material = this.createMaterial('mat_QG', new Color3(0.78, 0.48, 0.08));

    this.registerEquipment('GEN-1', [genCanopy, genPlinth, fuelSkid, intakeLouver, muffler, exhaustPipe, genController, estopBtn], new Vector3(3, 0, -1));
    this.registerEquipment('QG', [qgBox], new Vector3(2.5, 0, -0.8));

    // 2. Essential ATS (ATS-E - 400 A 4-Pole Dual Motorized Switch)
    const atsePlinth = MeshBuilder.CreateBox('ATSE_plinth', { width: 1.3, height: 0.15, depth: 0.8 }, this.scene);
    atsePlinth.position = new Vector3(4.0, groundY + 0.075, -2.5);
    atsePlinth.material = plinthMat;

    const atseBox = MeshBuilder.CreateBox('ATS-E_box', { width: 1.15, height: 1.7, depth: 0.65 }, this.scene);
    atseBox.position = new Vector3(4.0, groundY + 1.2, -2.5);
    atseBox.material = this.createMaterial('mat_ATSE', new Color3(0.9, 0.55, 0.15), 0.45, 36);

    const normalLed = MeshBuilder.CreateSphere('ATSE_normalLed', { diameter: 0.08 }, this.scene);
    normalLed.position = new Vector3(3.8, groundY + 1.6, -2.16);
    normalLed.material = this.createMaterial('mat_atse_norm', new Color3(0.1, 0.9, 0.2));

    const emerLed = MeshBuilder.CreateSphere('ATSE_emerLed', { diameter: 0.08 }, this.scene);
    emerLed.position = new Vector3(4.2, groundY + 1.6, -2.16);
    emerLed.material = this.createMaterial('mat_atse_emer', new Color3(0.95, 0.7, 0.1));

    this.registerEquipment('ATS-E', [atseBox, atsePlinth, normalLed, emerLed], new Vector3(2, 0, -1));

    // 3. Dedicated Fire Pump Controller & ATS (FP-ATS) - In Basement
    const basementY = -2.5 + 0.05;
    const fpAtsBox = MeshBuilder.CreateBox('FP-ATS_box', { width: 1.25, height: 1.75, depth: 0.65 }, this.scene);
    fpAtsBox.position = new Vector3(2.5, basementY + 1.25, -1.5);
    fpAtsBox.material = this.createMaterial('mat_FPATS', new Color3(0.95, 0.18, 0.18), 0.5, 48);

    const fpHandle = MeshBuilder.CreateCylinder('FPATS_handle', { diameter: 0.1, height: 0.15 }, this.scene);
    fpHandle.rotation.x = Math.PI / 2;
    fpHandle.position = new Vector3(2.5, basementY + 1.3, -1.16);
    fpHandle.material = this.createMaterial('mat_fphandle', new Color3(0.15, 0.15, 0.15));

    // 4. Fire Pump Motor (FP-MOTOR - 37 kW / 50 HP) & Centrifugal Pump
    const motorMat = this.createMaterial('mat_FPMotor', new Color3(0.88, 0.15, 0.15), 0.5, 48);
    const fpMotor = MeshBuilder.CreateCylinder('FP_motor', { diameter: 0.75, height: 1.3 }, this.scene);
    fpMotor.rotation.z = Math.PI / 2;
    fpMotor.position = new Vector3(5.0, basementY + 0.55, -1.5);
    fpMotor.material = motorMat;

    const fpPump = MeshBuilder.CreateCylinder('FP_casing', { diameter: 0.95, height: 0.75 }, this.scene);
    fpPump.position = new Vector3(6.1, basementY + 0.55, -1.5);
    fpPump.material = motorMat;

    const fpPipe = MeshBuilder.CreateCylinder('FP_riser_pipe', { diameter: 0.28, height: 2.3 }, this.scene);
    fpPipe.position = new Vector3(6.1, basementY + 1.7, -1.5);
    fpPipe.material = motorMat;

    this.registerEquipment('FP-ATS', [fpAtsBox, fpHandle], new Vector3(1, -1, 0));
    this.registerEquipment('FP-MOTOR', [fpMotor, fpPump, fpPipe], new Vector3(2, -1, 0));

    // 5. Basement Water Booster Pumps (WP-MOTOR) & Mechanical Board (MDP)
    const mdpPanel = MeshBuilder.CreateBox('MDP_box', { width: 1.15, height: 1.55, depth: 0.45 }, this.scene);
    mdpPanel.position = new Vector3(3.0, basementY + 1.25, 1.5);
    mdpPanel.material = this.createMaterial('mat_MDP', new Color3(0.22, 0.48, 0.88), 0.45, 36);

    const wpMat = this.createMaterial('mat_WP', new Color3(0.15, 0.55, 0.85), 0.5, 40);
    const pump1 = MeshBuilder.CreateCylinder('WP_pump1', { diameter: 0.65, height: 0.95 }, this.scene);
    pump1.position = new Vector3(5.0, basementY + 0.48, 1.0);
    pump1.material = wpMat;

    const pump2 = MeshBuilder.CreateCylinder('WP_pump2', { diameter: 0.65, height: 0.95 }, this.scene);
    pump2.position = new Vector3(5.0, basementY + 0.48, 2.5);
    pump2.material = wpMat;

    const wpTank = MeshBuilder.CreateCylinder('WP_tank', { diameter: 0.8, height: 1.5 }, this.scene);
    wpTank.position = new Vector3(6.5, basementY + 0.75, 1.8);
    wpTank.material = this.createMaterial('mat_wp_tank', new Color3(0.2, 0.65, 0.9));

    this.registerEquipment('MDP', [mdpPanel], new Vector3(1, -1, 0));
    this.registerEquipment('WP-MOTOR', [pump1, pump2, wpTank], new Vector3(2, -1, 0));

    // 6. Rooftop Elevator Motor & VRF Condenser Units
    const floorHeight = 2.8;
    const roofY = 7 * floorHeight + 0.05;

    const liftBox = MeshBuilder.CreateBox('LIFT_penthouse', { width: 3.2, height: 2.3, depth: 2.6 }, this.scene);
    liftBox.position = new Vector3(-2.5, roofY + 1.15, -1.5);
    liftBox.material = this.createMaterial('mat_lift_penthouse', new Color3(0.78, 0.82, 0.86));

    const liftMotor = MeshBuilder.CreateCylinder('LIFT_motor', { diameter: 0.85, height: 1.3 }, this.scene);
    liftMotor.rotation.z = Math.PI / 2;
    liftMotor.position = new Vector3(-2.5, roofY + 1.25, -1.5);
    liftMotor.material = this.createMaterial('mat_lift_motor', new Color3(0.28, 0.52, 0.92));

    this.registerEquipment('LIFT-MOTOR', [liftBox, liftMotor], new Vector3(-1, 7 * 2.2, 0));

    const vrfMeshes: Mesh[] = [];
    const vrfMat = this.createMaterial('mat_VRF', new Color3(0.22, 0.65, 0.85), 0.4, 32);
    for (let i = 0; i < 4; i++) {
      const vrfUnit = MeshBuilder.CreateBox(`VRF_unit_${i}`, { width: 1.25, height: 1.55, depth: 0.95 }, this.scene);
      vrfUnit.position = new Vector3(1.5 + i * 1.5, roofY + 0.78, 1.5);
      vrfUnit.material = vrfMat;

      const fanGrille = MeshBuilder.CreateCylinder(`VRF_fan_${i}`, { diameter: 0.7, height: 0.08 }, this.scene);
      fanGrille.position = new Vector3(1.5 + i * 1.5, roofY + 1.58, 1.5);
      fanGrille.material = this.createMaterial(`mat_vrf_fan_${i}`, new Color3(0.2, 0.25, 0.3));

      vrfMeshes.push(vrfUnit, fanGrille);
    }
    this.registerEquipment('HVAC-LOAD', vrfMeshes, new Vector3(2, 7 * 2.2, 0));
  }

  /**
   * 10. Cable Feeders, Vertical Ladder Riser & Busway Trunking
   */
  private buildCableFeedersAndRiser() {
    const floorHeight = 2.8;

    // Vertical Riser Shaft Cable Ladder (Galvanized Steel)
    const riserMat = this.createMaterial('mat_riser', new Color3(0.52, 0.56, 0.62), 0.4, 28);
    const riserHeight = 7 * floorHeight + 2.5;

    // Cable ladder side rails: width = 0.8m, centered at x = -2.5, z = -0.2
    const railL = MeshBuilder.CreateBox('RISER_railL', { width: 0.06, height: riserHeight, depth: 0.08 }, this.scene);
    railL.position = new Vector3(-2.9, riserHeight / 2 - 2.5, -0.2);
    railL.material = riserMat;

    const railR = MeshBuilder.CreateBox('RISER_railR', { width: 0.06, height: riserHeight, depth: 0.08 }, this.scene);
    railR.position = new Vector3(-2.1, riserHeight / 2 - 2.5, -0.2);
    railR.material = riserMat;

    this.shellMeshes.push(railL, railR);

    // Cable ladder rungs spaced every 0.5m
    for (let ry = 0.5; ry < riserHeight; ry += 0.5) {
      const rung = MeshBuilder.CreateBox(`RISER_rung_${Math.round(ry * 10)}`, { width: 0.8, height: 0.03, depth: 0.03 }, this.scene);
      rung.position = new Vector3(-2.5, ry, -0.2);
      rung.material = riserMat;
      this.shellMeshes.push(rung);
    }

    // Overhead Cable Tray from MDB to Riser (Galvanized perforated tray)
    const trayMat = this.createMaterial('mat_tray', new Color3(0.55, 0.60, 0.66), 0.4, 30);
    // Tray along X from MDB (x = -1.5) to Riser (x = -2.5) at y = 2.52, z = -2.2
    const trayX = MeshBuilder.CreateBox('TRAY_MDB_X', { width: 1.2, height: 0.08, depth: 0.35 }, this.scene);
    trayX.position = new Vector3(-2.0, 2.52, -2.2);
    trayX.material = trayMat;
    // Tray along Z from z = -2.2 to riser at z = -0.2
    const trayZ = MeshBuilder.CreateBox('TRAY_MDB_Z', { width: 0.35, height: 0.08, depth: 2.1 }, this.scene);
    trayZ.position = new Vector3(-2.5, 2.52, -1.2);
    trayZ.material = trayMat;
    this.shellMeshes.push(trayX, trayZ);

    // Floor Distribution Panels (P-F1 to P-F6) mounted on columns next to riser
    for (let f = 1; f <= 6; f++) {
      const y = f * floorHeight + 0.05;
      const isRetail = f <= 2;
      const tag = `P-F${f}`;

      const panelColor = isRetail ? new Color3(0.1, 0.65, 0.75) : new Color3(0.12, 0.52, 0.85);
      const panel = MeshBuilder.CreateBox(`${tag}_box`, { width: 0.95, height: 1.35, depth: 0.35 }, this.scene);
      panel.position = new Vector3(-2.5, y + 1.25, 0.4);
      panel.material = this.createMaterial(`mat_${tag}`, panelColor, 0.4, 32);

      const subMeter = MeshBuilder.CreatePlane(`${tag}_meter`, { width: 0.35, height: 0.2 }, this.scene);
      subMeter.position = new Vector3(-2.5, y + 1.6, 0.58);
      subMeter.material = this.createMaterial(`mat_${tag}_meter`, new Color3(0.1, 0.9, 0.85), 0.8, 64, 1.0, new Color3(0.05, 0.3, 0.28));

      this.registerEquipment(tag, [panel, subMeter], new Vector3(0, f * 2.2, 0));
    }

    // Essential Distribution Panel (EDB) - Level 2
    const edbY = 2 * floorHeight + 0.05;
    const edbPanel = MeshBuilder.CreateBox('EDB_box', { width: 1.05, height: 1.45, depth: 0.45 }, this.scene);
    edbPanel.position = new Vector3(-2.5, edbY + 1.25, -2.0);
    edbPanel.material = this.createMaterial('mat_EDB', new Color3(0.92, 0.52, 0.12), 0.45, 36);

    const itRackMat = this.createMaterial('mat_IT_rack', new Color3(0.2, 0.24, 0.28), 0.5, 40);
    const itRack1 = MeshBuilder.CreateBox('IT_rack_1', { width: 0.9, height: 2.05, depth: 1.0 }, this.scene);
    itRack1.position = new Vector3(-1.0, edbY + 1.05, -2.0);
    itRack1.material = itRackMat;

    const itRack2 = MeshBuilder.CreateBox('IT_rack_2', { width: 0.9, height: 2.05, depth: 1.0 }, this.scene);
    itRack2.position = new Vector3(0.1, edbY + 1.05, -2.0);
    itRack2.material = itRackMat;

    this.registerEquipment('EDB', [edbPanel, itRack1, itRack2], new Vector3(-2, 2 * 2.2, 0));

    // High Voltage 13.8 kV Feeder Path (Red Conduit) - Orthogonal 90° Routing
    const hvTube = MeshBuilder.CreateTube('CABLE_HV', {
      path: [
        new Vector3(-10.2, 0.5, -2.5),
        new Vector3(-8.5, 0.5, -2.5),
        new Vector3(-8.5, 2.4, -2.5),
        new Vector3(-8.5, 2.4, -2.8),
        new Vector3(-6.0, 2.4, -2.8),
        new Vector3(-6.0, 2.2, -2.8)
      ],
      radius: 0.08
    }, this.scene);
    hvTube.material = this.createMaterial('mat_cable_HV', new Color3(0.9, 0.2, 0.2), 0.6, 40);
    this.cableMeshes.set('HV', [hvTube]);

    // Copper Busway Trunking (Transformer to MDB-A)
    const busduct = MeshBuilder.CreateBox('BUSDUCT_T1_MDB', { width: 3.2, height: 0.35, depth: 0.35 }, this.scene);
    busduct.position = new Vector3(-3.5, 2.45, -2.5);
    busduct.material = this.createMaterial('mat_busduct', new Color3(0.85, 0.55, 0.25), 0.6, 40);
    this.cableMeshes.set('LV_MAIN', [busduct]);

    // Floor Feeder Cables - Clean Orthogonal BIM Routing
    // Feeders emerge from MDB top -> enter overhead tray -> turn into riser shaft -> climb strictly vertically on ladder -> branch 90° into panel
    const feederMat = this.createMaterial('mat_feeder_cable', new Color3(0.12, 0.50, 0.92), 0.5, 40);

    for (let f = 1; f <= 6; f++) {
      const y = f * floorHeight;
      const targetPanelY = y + 1.25;
      // Evenly space the 6 cables side-by-side across the cable ladder (-2.8 to -2.2)
      const cableX = -2.8 + (f - 1) * 0.12;

      const feederTube = MeshBuilder.CreateTube(`CABLE_F${f}`, {
        path: [
          // 1. Exit top of MDB breaker compartment
          new Vector3(-1.8 + (f - 1) * 0.1, 2.35, -2.2),
          // 2. Rise vertically into overhead horizontal cable tray
          new Vector3(-1.8 + (f - 1) * 0.1, 2.52, -2.2),
          // 3. Run horizontally along tray towards riser shaft (along X)
          new Vector3(cableX, 2.52, -2.2),
          // 4. Turn 90° horizontally along Z into riser shaft entrance
          new Vector3(cableX, 2.52, -0.2),
          // 5. Rise STRICTLY VERTICAL along the cable ladder directly to target floor
          new Vector3(cableX, targetPanelY + 0.3, -0.2),
          // 6. Branch 90° horizontal forward (along Z) out of the riser towards the panel
          new Vector3(cableX, targetPanelY + 0.3, 0.4),
          // 7. Drop 90° into top of floor distribution panel
          new Vector3(-2.5, targetPanelY + 0.65, 0.4)
        ],
        radius: 0.032
      }, this.scene);
      feederTube.material = feederMat;
      this.cableMeshes.set(`F${f}`, [feederTube]);
    }

    // Emergency Feeder Path (Generator to ATS) - Orthogonal 90° Routing
    const genTube = MeshBuilder.CreateTube('CABLE_GEN_ATS', {
      path: [
        new Vector3(7.0, 1.3, -1.9),
        new Vector3(5.5, 1.3, -1.9),
        new Vector3(5.5, 1.3, -2.2),
        new Vector3(4.0, 1.3, -2.2)
      ],
      radius: 0.06
    }, this.scene);
    genTube.material = this.createMaterial('mat_cable_EMER', new Color3(0.95, 0.6, 0.12), 0.6, 40);
    this.cableMeshes.set('GEN', [genTube]);
  }

  private registerEquipment(tag: string, meshes: Mesh[], explodeOffset: Vector3) {
    this.equipmentMeshes.set(tag, meshes);

    meshes.forEach((mesh) => {
      this.originalPositions.set(mesh, mesh.position.clone());
      this.explodedOffsets.set(mesh, explodeOffset);

      mesh.isPickable = true;
      mesh.actionManager = new ActionManager(this.scene);

      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          this.selectEquipment(tag);
        })
      );

      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
          this.callbacks.onHoverEquipment(tag);
        })
      );
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
          this.callbacks.onHoverEquipment(null);
        })
      );
    });
  }

  public selectEquipment(tag: string | null) {
    if (this.selectedTag === tag && tag !== null) {
      this.selectedTag = null;
      this.callbacks.onSelectEquipment(null);
      this.updateHighlighting();
      return;
    }

    this.selectedTag = tag;
    this.callbacks.onSelectEquipment(tag);
    this.updateHighlighting();
  }

  private updateHighlighting() {
    this.equipmentMeshes.forEach((meshes, tag) => {
      const isSelected = tag === this.selectedTag;
      meshes.forEach((mesh) => {
        const mat = mesh.material as StandardMaterial;
        if (mat) {
          if (isSelected) {
            mat.emissiveColor = new Color3(0.2, 0.45, 0.85);
          } else {
            mat.emissiveColor = new Color3(0, 0, 0);
          }
        }
      });
    });

    // Also highlight corresponding feeder/path cables when equipment is selected
    this.cableMeshes.forEach((cables, key) => {
      const isMatched = !!(
        this.selectedTag &&
        (key === this.selectedTag ||
          (this.selectedTag.startsWith('P-F') && key === this.selectedTag.replace('P-', '')) ||
          (this.selectedTag === 'T1' && key === 'LV_MAIN') ||
          (this.selectedTag === 'HV-01' && key === 'HV') ||
          (this.selectedTag === 'GEN-1' && key === 'GEN'))
      );
      cables.forEach((cable) => {
        const mat = cable.material as StandardMaterial;
        if (mat) {
          if (isMatched) {
            mat.emissiveColor = new Color3(0.3, 0.85, 1.0);
          } else {
            mat.emissiveColor = new Color3(0, 0, 0);
          }
        }
      });
    });
  }

  public updateViewOptions(options: ViewOptions3D) {
    this.currentOptions = options;

    this.shellMeshes.forEach((mesh) => {
      if (options.shellMode === 'hidden') {
        mesh.isVisible = false;
      } else if (options.shellMode === 'cutaway') {
        mesh.isVisible = mesh.name !== 'frontWall';
      } else {
        mesh.isVisible = true;
      }

      if (mesh.material && mesh.name.includes('Wall')) {
        mesh.material.alpha = options.shellOpacity;
      }
    });

    this.updateExplodedOffset(options.explodedOffset);

    this.setCategoryVisibility('HV-01', options.showHV);
    this.setCategoryVisibility('METER', options.showHV);
    const hvCables = this.cableMeshes.get('HV');
    if (hvCables) hvCables.forEach((c) => (c.isVisible = options.showHV));

    this.setCategoryVisibility('T1', options.showTransformer);
    this.setCategoryVisibility('MDB-A', options.showLV);
    this.setCategoryVisibility('Q0', options.showLV);
    const lvMain = this.cableMeshes.get('LV_MAIN');
    if (lvMain) lvMain.forEach((c) => (c.isVisible = options.showLV));

    this.setCategoryVisibility('C1', options.showAPFC);
    this.setCategoryVisibility('QC', options.showAPFC);

    for (let f = 1; f <= 6; f++) {
      this.setCategoryVisibility(`P-F${f}`, options.showFeeders);
      const feederCables = this.cableMeshes.get(`F${f}`);
      if (feederCables) feederCables.forEach((c) => (c.isVisible = options.showFeeders));
    }

    this.setCategoryVisibility('GEN-1', options.showEmergency);
    this.setCategoryVisibility('QG', options.showEmergency);
    this.setCategoryVisibility('ATS-E', options.showEmergency);
    this.setCategoryVisibility('FP-ATS', options.showEmergency);
    this.setCategoryVisibility('FP-MOTOR', options.showEmergency);
    const genCables = this.cableMeshes.get('GEN');
    if (genCables) genCables.forEach((c) => (c.isVisible = options.showEmergency));

    this.setCategoryVisibility('EDB', options.showLV);
    this.setCategoryVisibility('MDP', options.showLV);
    this.setCategoryVisibility('HVAC-LOAD', options.showLoads);
    this.setCategoryVisibility('LIFT-MOTOR', options.showLoads);
    this.setCategoryVisibility('WP-MOTOR', options.showLoads);
  }

  private setCategoryVisibility(tag: string, visible: boolean) {
    const meshes = this.equipmentMeshes.get(tag);
    if (meshes) {
      meshes.forEach((m) => (m.isVisible = visible));
    }
  }

  private updateExplodedOffset(factor: number) {
    this.explodedOffsets.forEach((offset, mesh) => {
      const orig = this.originalPositions.get(mesh);
      if (orig) {
        mesh.position.x = orig.x + offset.x * factor;
        mesh.position.y = orig.y + offset.y * factor;
        mesh.position.z = orig.z + offset.z * factor;
      }
    });
  }

  public setCameraPreset(preset: 'home' | 'plant' | 'riser' | 'retail' | 'office' | 'roof' | 'basement') {
    if (!this.camera) return;

    let targetAlpha = -Math.PI / 3;
    let targetBeta = Math.PI / 3;
    let targetRadius = 38;
    let targetLook = new Vector3(0, 9, 0);

    switch (preset) {
      case 'home':
        targetAlpha = -Math.PI / 3;
        targetBeta = Math.PI / 3;
        targetRadius = 38;
        targetLook = new Vector3(0, 9, 0);
        break;
      case 'plant':
        targetAlpha = -Math.PI / 2.5;
        targetBeta = Math.PI / 2.8;
        targetRadius = 12;
        targetLook = new Vector3(-2, 1.4, -2.5);
        break;
      case 'riser':
        targetAlpha = -Math.PI / 1.8;
        targetBeta = Math.PI / 2.3;
        targetRadius = 20;
        targetLook = new Vector3(-2.5, 9.5, 0);
        break;
      case 'retail':
        targetAlpha = -Math.PI / 3;
        targetBeta = Math.PI / 2.6;
        targetRadius = 17;
        targetLook = new Vector3(0, 3.8, 0);
        break;
      case 'office':
        targetAlpha = -Math.PI / 3;
        targetBeta = Math.PI / 2.6;
        targetRadius = 20;
        targetLook = new Vector3(0, 12.0, 0);
        break;
      case 'roof':
        targetAlpha = -Math.PI / 4;
        targetBeta = Math.PI / 4.5;
        targetRadius = 15;
        targetLook = new Vector3(0, 20.0, 0);
        break;
      case 'basement':
        targetAlpha = -Math.PI / 3;
        targetBeta = Math.PI / 2.5;
        targetRadius = 13;
        targetLook = new Vector3(4, -1.2, 0);
        break;
    }

    this.scene.stopAnimation(this.camera);

    this.camera.inertialAlphaOffset = 0;
    this.camera.inertialBetaOffset = 0;
    this.camera.inertialRadiusOffset = 0;
    this.camera.inertialPanningX = 0;
    this.camera.inertialPanningY = 0;

    const twoPi = Math.PI * 2;
    let diff = (targetAlpha - this.camera.alpha) % twoPi;
    if (diff > Math.PI) diff -= twoPi;
    if (diff < -Math.PI) diff += twoPi;
    const finalAlpha = this.camera.alpha + diff;

    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    Animation.CreateAndStartAnimation('camAlpha', this.camera, 'alpha', 60, 35, this.camera.alpha, finalAlpha, Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
    Animation.CreateAndStartAnimation('camBeta', this.camera, 'beta', 60, 35, this.camera.beta, targetBeta, Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
    Animation.CreateAndStartAnimation('camRadius', this.camera, 'radius', 60, 35, this.camera.radius, targetRadius, Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
    Animation.CreateAndStartAnimation('camTarget', this.camera, 'target', 60, 35, this.camera.target.clone(), targetLook, Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  }

  public dispose() {
    this.isDisposed = true;
    window.removeEventListener('resize', this.onResize);
    if (this.scene) {
      this.scene.dispose();
    }
    if (this.engine) {
      this.engine.dispose();
    }
  }
}
