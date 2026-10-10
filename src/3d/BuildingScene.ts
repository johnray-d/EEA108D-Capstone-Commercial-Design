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
  private cableMeshes: Map<string, Mesh[]> = new Map();
  private flowParticles: Mesh[] = [];

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
      // Check if WebGPU is supported AND glslang is loaded (needed for StandardMaterial GLSL transpilation)
      const hasGlslang = typeof (window as any).glslang !== 'undefined';
      if (hasGlslang && (await WebGPUEngine.IsSupportedAsync)) {
        try {
          const webgpu = new WebGPUEngine(this.canvas, {
            stencil: true,
            antialias: true
          });
          // Timeout WebGPU init so it never hangs
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
        // Direct, instant, high-performance WebGL2 engine
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
    // Crisp architectural engineering light background (Slate-100 / Off-white)
    this.scene.clearColor = new Color4(0.95, 0.96, 0.98, 1.0);

    this.setupCamera();
    this.setupLights();
    this.buildBuildingShell();
    this.buildElectricalPlantRoom();
    this.buildFloorDistribution();
    this.buildEmergencyAndFireSystem();
    this.buildCableFeedersAndRiser();

    // Ensure immediate resize so drawing buffer matches canvas client dimensions
    this.engine.resize();

    // Render loop
    this.engine.runRenderLoop(() => {
      if (!this.isDisposed && this.scene) {
        this.scene.render();
      }
    });

    // Resize handler
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
    this.camera.upperRadiusLimit = 80;
    this.camera.wheelPrecision = 20;
    this.camera.inertia = 0.65;
    this.camera.panningSensibility = 50;
  }

  private setupLights() {
    // Ambient hemispheric sky & ground light
    const ambient = new HemisphericLight('ambientLight', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.85;
    ambient.diffuse = new Color3(1.0, 1.0, 1.0);
    ambient.groundColor = new Color3(0.78, 0.82, 0.88);

    // Primary sunlight with soft highlights
    const dirLight1 = new DirectionalLight('dirLight1', new Vector3(-1, -2, -1).normalize(), this.scene);
    dirLight1.position = new Vector3(30, 50, 30);
    dirLight1.intensity = 1.0;
    dirLight1.diffuse = new Color3(1.0, 0.98, 0.95);

    // Secondary fill light for shadows
    const dirLight2 = new DirectionalLight('dirLight2', new Vector3(1, -1.2, 1).normalize(), this.scene);
    dirLight2.position = new Vector3(-30, 35, -30);
    dirLight2.intensity = 0.5;
    dirLight2.diffuse = new Color3(0.85, 0.90, 1.0);
  }

  /**
   * Helper to create realistic standard materials with specular response
   */
  private createMaterial(name: string, diffuse: Color3, specular = 0.35, roughness = 32, alpha = 1.0): StandardMaterial {
    const mat = new StandardMaterial(name, this.scene);
    mat.diffuseColor = diffuse;
    mat.specularColor = new Color3(specular, specular, specular);
    mat.specularPower = roughness;
    mat.alpha = alpha;
    return mat;
  }

  /**
   * Builds the 6-storey building architectural skeleton with light mode finishes
   */
  private buildBuildingShell() {
    const floorWidth = 14;
    const floorDepth = 10;
    const floorHeight = 2.8;
    const numFloors = 6;

    // Ground floor site plinth (Y = 0)
    const groundMat = this.createMaterial('groundMat', new Color3(0.88, 0.90, 0.93), 0.2, 20);
    const groundSlab = MeshBuilder.CreateBox('groundSlab', {
      width: floorWidth + 8,
      height: 0.4,
      depth: floorDepth + 8
    }, this.scene);
    groundSlab.position = new Vector3(0, -0.2, 0);
    groundSlab.material = groundMat;

    // Basement pit
    const basementSlab = MeshBuilder.CreateBox('basementSlab', {
      width: 7.5,
      height: 0.3,
      depth: 6.5
    }, this.scene);
    basementSlab.position = new Vector3(5, -2.5, 2);
    basementSlab.material = groundMat;

    // Floor slabs (L1 to L6 and Roof) - Clean structural concrete
    const slabMat = this.createMaterial('slabMat', new Color3(0.82, 0.85, 0.89), 0.25, 24);

    for (let i = 1; i <= numFloors + 1; i++) {
      const slab = MeshBuilder.CreateBox(`slab_L${i}`, {
        width: floorWidth,
        height: 0.25,
        depth: floorDepth
      }, this.scene);
      const yPos = i * floorHeight;
      slab.position = new Vector3(0, yPos, 0);
      slab.material = slabMat;
      this.floorMeshes.push(slab);

      // Floor edge trim / slab band
      const trimMat = this.createMaterial(`slabTrim_L${i}`, new Color3(0.72, 0.76, 0.82));
      const frontTrim = MeshBuilder.CreateBox(`slabFrontTrim_L${i}`, {
        width: floorWidth + 0.05,
        height: 0.28,
        depth: 0.08
      }, this.scene);
      frontTrim.position = new Vector3(0, yPos, floorDepth / 2 + 0.02);
      frontTrim.material = trimMat;
      this.floorMeshes.push(frontTrim);

      // Save for exploded offsets
      this.originalPositions.set(slab, slab.position.clone());
      this.explodedOffsets.set(slab, new Vector3(0, i * 2.2, 0));
      this.originalPositions.set(frontTrim, frontTrim.position.clone());
      this.explodedOffsets.set(frontTrim, new Vector3(0, i * 2.2, 0));
    }

    // Glass building shell (cutaway view) - Crisp architectural glass with light cyan tint
    const glassMat = this.createMaterial('glassShellMat', new Color3(0.65, 0.82, 0.95), 0.8, 64, this.currentOptions.shellOpacity);
    glassMat.backFaceCulling = false;

    // We build 3 walls leaving front open (cutaway by default)
    const backWall = MeshBuilder.CreateBox('backWall', {
      width: floorWidth,
      height: (numFloors + 1) * floorHeight,
      depth: 0.1
    }, this.scene);
    backWall.position = new Vector3(0, ((numFloors + 1) * floorHeight) / 2, -floorDepth / 2);
    backWall.material = glassMat;
    this.shellMeshes.push(backWall);

    const leftWall = MeshBuilder.CreateBox('leftWall', {
      width: 0.1,
      height: (numFloors + 1) * floorHeight,
      depth: floorDepth
    }, this.scene);
    leftWall.position = new Vector3(-floorWidth / 2, ((numFloors + 1) * floorHeight) / 2, 0);
    leftWall.material = glassMat;
    this.shellMeshes.push(leftWall);

    const rightWall = MeshBuilder.CreateBox('rightWall', {
      width: 0.1,
      height: (numFloors + 1) * floorHeight,
      depth: floorDepth
    }, this.scene);
    rightWall.position = new Vector3(floorWidth / 2, ((numFloors + 1) * floorHeight) / 2, 0);
    rightWall.material = glassMat;
    this.shellMeshes.push(rightWall);

    // Front wall (toggleable)
    const frontWall = MeshBuilder.CreateBox('frontWall', {
      width: floorWidth,
      height: (numFloors + 1) * floorHeight,
      depth: 0.1
    }, this.scene);
    frontWall.position = new Vector3(0, ((numFloors + 1) * floorHeight) / 2, floorDepth / 2);
    frontWall.material = glassMat;
    frontWall.isVisible = this.currentOptions.shellMode === 'normal';
    this.shellMeshes.push(frontWall);

    // Structural reinforced concrete perimeter columns
    const colMat = this.createMaterial('colMat', new Color3(0.70, 0.75, 0.80), 0.2, 16);
    const colPositions = [
      new Vector3(-floorWidth / 2 + 0.3, ((numFloors + 1) * floorHeight) / 2, -floorDepth / 2 + 0.3),
      new Vector3(floorWidth / 2 - 0.3, ((numFloors + 1) * floorHeight) / 2, -floorDepth / 2 + 0.3),
      new Vector3(-floorWidth / 2 + 0.3, ((numFloors + 1) * floorHeight) / 2, floorDepth / 2 - 0.3),
      new Vector3(floorWidth / 2 - 0.3, ((numFloors + 1) * floorHeight) / 2, floorDepth / 2 - 0.3)
    ];

    colPositions.forEach((pos, idx) => {
      const col = MeshBuilder.CreateBox(`col_${idx}`, {
        width: 0.5,
        height: (numFloors + 1) * floorHeight,
        depth: 0.5
      }, this.scene);
      col.position = pos;
      col.material = colMat;
      this.shellMeshes.push(col);
    });
  }

  /**
   * Builds the Ground Floor Electrical Plant Room with Highly Detailed Equipment:
   * - 13.8 kV Intake & HV Switchgear (HV-01) with protection relays & drawout breakers
   * - Revenue Metering Point (METER) with digital display & CT/VT test block
   * - 1,250 kVA Oil Transformer (T1) with radiator banks, conservator, Buchholz relay, & bushings
   * - 2,500 A Main Distribution Board (MDB-A) with ACB Q0, copper busbars & feeder cubicles
   * - 400 kVAr Detuned APFC Bank (C1 & QC) with capacitor cans, detuned reactors & controller
   */
  private buildElectricalPlantRoom() {
    const groundY = 0.05;

    // Concrete Housekeeping Plinths under major equipment
    const plinthMat = this.createMaterial('mat_plinth', new Color3(0.76, 0.79, 0.84), 0.25, 16);

    // 1. HV Switchgear & Breaker (HV-01 - 17.5 kV / 25 kA Metal-Clad Vacuum Switchgear)
    const hvPlinth = MeshBuilder.CreateBox('HV_plinth', { width: 1.6, height: 0.15, depth: 1.4 }, this.scene);
    hvPlinth.position = new Vector3(-8.5, groundY + 0.075, -2.5);
    hvPlinth.material = plinthMat;

    const hvBodyMat = this.createMaterial('mat_HV_body', new Color3(0.85, 0.22, 0.22), 0.45, 48); // Industrial safety red
    const hvCubicle = MeshBuilder.CreateBox('HV-01_body', { width: 1.3, height: 2.3, depth: 1.1 }, this.scene);
    hvCubicle.position = new Vector3(-8.5, groundY + 1.25, -2.5);
    hvCubicle.material = hvBodyMat;

    // Protection Relay compartment door (top)
    const relayDoor = MeshBuilder.CreateBox('HV-01_relayDoor', { width: 1.15, height: 0.7, depth: 0.08 }, this.scene);
    relayDoor.position = new Vector3(-8.5, groundY + 2.0, -1.94);
    relayDoor.material = this.createMaterial('mat_HV_panel', new Color3(0.2, 0.22, 0.26));

    // Digital Numerical Protection Relay Screen (SEL/REF style)
    const relayLcd = MeshBuilder.CreatePlane('HV-01_lcd', { width: 0.45, height: 0.25 }, this.scene);
    relayLcd.position = new Vector3(-8.7, groundY + 2.05, -1.89);
    relayLcd.material = this.createMaterial('mat_HV_lcd', new Color3(0.1, 0.9, 0.7));

    // Circuit Breaker view window & Trip/Close pushbuttons
    const vcbWindow = MeshBuilder.CreateBox('HV-01_vcbWindow', { width: 0.35, height: 0.4, depth: 0.05 }, this.scene);
    vcbWindow.position = new Vector3(-8.5, groundY + 1.2, -1.94);
    vcbWindow.material = this.createMaterial('mat_glass_dark', new Color3(0.15, 0.3, 0.4), 0.9, 64, 0.75);

    const btnTrip = MeshBuilder.CreateCylinder('HV-01_btnTrip', { diameter: 0.08, height: 0.05 }, this.scene);
    btnTrip.rotation.x = Math.PI / 2;
    btnTrip.position = new Vector3(-8.2, groundY + 1.25, -1.92);
    btnTrip.material = this.createMaterial('mat_redBtn', new Color3(0.9, 0.1, 0.1));

    const btnClose = MeshBuilder.CreateCylinder('HV-01_btnClose', { diameter: 0.08, height: 0.05 }, this.scene);
    btnClose.rotation.x = Math.PI / 2;
    btnClose.position = new Vector3(-8.2, groundY + 1.15, -1.92);
    btnClose.material = this.createMaterial('mat_greenBtn', new Color3(0.1, 0.85, 0.2));

    // Cable entry gland at base
    const hvGland = MeshBuilder.CreateCylinder('HV-01_gland', { diameter: 0.25, height: 0.3 }, this.scene);
    hvGland.position = new Vector3(-8.5, groundY + 0.15, -2.5);
    hvGland.material = this.createMaterial('mat_brass', new Color3(0.75, 0.6, 0.2));

    this.registerEquipment('HV-01', [hvCubicle, hvPlinth, relayDoor, relayLcd, vcbWindow, btnTrip, btnClose, hvGland], new Vector3(-2, 0, -1));

    // 2. Revenue Metering Cubicle (METER)
    const meterPlinth = MeshBuilder.CreateBox('METER_plinth', { width: 1.1, height: 0.15, depth: 1.0 }, this.scene);
    meterPlinth.position = new Vector3(-10.2, groundY + 0.075, -2.5);
    meterPlinth.material = plinthMat;

    const meterCubicle = MeshBuilder.CreateBox('METER_body', { width: 0.95, height: 1.9, depth: 0.85 }, this.scene);
    meterCubicle.position = new Vector3(-10.2, groundY + 1.05, -2.5);
    meterCubicle.material = this.createMaterial('mat_Meter_body', new Color3(0.92, 0.55, 0.12), 0.4, 32);

    // Metering Glass Display Window & Digital Energy Meter
    const meterDisplayWindow = MeshBuilder.CreateBox('METER_displayWindow', { width: 0.55, height: 0.5, depth: 0.05 }, this.scene);
    meterDisplayWindow.position = new Vector3(-10.2, groundY + 1.35, -2.06);
    meterDisplayWindow.material = this.createMaterial('mat_meter_window', new Color3(0.1, 0.2, 0.3), 0.8, 64, 0.7);

    const meterLcd = MeshBuilder.CreatePlane('METER_lcd', { width: 0.4, height: 0.22 }, this.scene);
    meterLcd.position = new Vector3(-10.2, groundY + 1.38, -2.03);
    meterLcd.material = this.createMaterial('mat_meter_screen', new Color3(0.15, 0.85, 0.95));

    // CT/VT Test Switch Block
    const testBlock = MeshBuilder.CreateBox('METER_testBlock', { width: 0.45, height: 0.22, depth: 0.08 }, this.scene);
    testBlock.position = new Vector3(-10.2, groundY + 0.85, -2.06);
    testBlock.material = this.createMaterial('mat_testBlock', new Color3(0.18, 0.18, 0.2));

    this.registerEquipment('METER', [meterCubicle, meterPlinth, meterDisplayWindow, meterLcd, testBlock], new Vector3(-3, 0, -1));

    // 3. 1,250 kVA Dyn11 Oil Transformer (T1 - Alternative 1)
    const t1Plinth = MeshBuilder.CreateBox('T1_plinth', { width: 3.4, height: 0.15, depth: 2.8 }, this.scene);
    t1Plinth.position = new Vector3(-5.5, groundY + 0.075, -2.5);
    t1Plinth.material = plinthMat;

    // Steel base skid channels with transport rollers
    const skidL = MeshBuilder.CreateBox('T1_skidL', { width: 0.15, height: 0.18, depth: 2.4 }, this.scene);
    skidL.position = new Vector3(-6.3, groundY + 0.2, -2.5);
    skidL.material = this.createMaterial('mat_steel', new Color3(0.3, 0.35, 0.4), 0.6, 40);

    const skidR = MeshBuilder.CreateBox('T1_skidR', { width: 0.15, height: 0.18, depth: 2.4 }, this.scene);
    skidR.position = new Vector3(-4.7, groundY + 0.2, -2.5);
    skidR.material = skidL.material;

    // Main transformer corrugated tank
    const trMat = this.createMaterial('mat_T1_tank', new Color3(0.25, 0.55, 0.85), 0.5, 48);
    const trTank = MeshBuilder.CreateBox('T1_tank', { width: 1.9, height: 1.85, depth: 1.7 }, this.scene);
    trTank.position = new Vector3(-5.5, groundY + 1.15, -2.5);
    trTank.material = trMat;

    // Tank top cover plate with bolted flange
    const coverPlate = MeshBuilder.CreateBox('T1_cover', { width: 2.05, height: 0.1, depth: 1.85 }, this.scene);
    coverPlate.position = new Vector3(-5.5, groundY + 2.1, -2.5);
    coverPlate.material = trMat;

    // Realistic Radiator Cooling Fin Banks (Left and Right)
    const finMat = this.createMaterial('mat_T1_fins', new Color3(0.2, 0.45, 0.75), 0.4, 32);
    const radiatorMeshes: Mesh[] = [];

    // Left radiator bank
    for (let f = 0; f < 6; f++) {
      const fin = MeshBuilder.CreateBox(`T1_finL_${f}`, { width: 0.04, height: 1.5, depth: 1.4 }, this.scene);
      fin.position = new Vector3(-6.55 - f * 0.08, groundY + 1.15, -2.5);
      fin.material = finMat;
      radiatorMeshes.push(fin);
    }
    // Right radiator bank
    for (let f = 0; f < 6; f++) {
      const fin = MeshBuilder.CreateBox(`T1_finR_${f}`, { width: 0.04, height: 1.5, depth: 1.4 }, this.scene);
      fin.position = new Vector3(-4.45 + f * 0.08, groundY + 1.15, -2.5);
      fin.material = finMat;
      radiatorMeshes.push(fin);
    }

    // Cylindrical Oil Conservator Drum on Top
    const conservator = MeshBuilder.CreateCylinder('T1_conservator', { diameter: 0.55, height: 1.6 }, this.scene);
    conservator.rotation.z = Math.PI / 2;
    conservator.position = new Vector3(-5.5, groundY + 2.45, -2.2);
    conservator.material = trMat;

    // Buchholz relay pipe connecting conservator to tank cover
    const buchholzPipe = MeshBuilder.CreateCylinder('T1_buchholz', { diameter: 0.12, height: 0.45 }, this.scene);
    buchholzPipe.position = new Vector3(-5.5, groundY + 2.25, -2.2);
    buchholzPipe.material = this.createMaterial('mat_buchholz', new Color3(0.85, 0.7, 0.1));

    // Silica gel breather pipe descending down side of tank
    const breatherPipe = MeshBuilder.CreateCylinder('T1_breather', { diameter: 0.08, height: 1.4 }, this.scene);
    breatherPipe.position = new Vector3(-6.2, groundY + 1.7, -1.65);
    breatherPipe.material = this.createMaterial('mat_pipe', new Color3(0.6, 0.65, 0.7));

    // 3 High Voltage (13.8 kV) Ribbed Porcelain Bushings (Red ceramic sheds)
    const hvBushingMeshes: Mesh[] = [];
    const hvBushMat = this.createMaterial('mat_hvBush', new Color3(0.85, 0.18, 0.18), 0.6, 48);
    for (let b = 0; b < 3; b++) {
      const bush = MeshBuilder.CreateCylinder(`T1_hvBush_${b}`, { diameter: 0.16, height: 0.5 }, this.scene);
      bush.position = new Vector3(-6.0 + b * 0.5, groundY + 2.35, -3.15);
      bush.material = hvBushMat;

      // Brass terminal stud
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

      // Heavy copper spade flag
      const spade = MeshBuilder.CreateBox(`T1_lvSpade_${b}`, { width: 0.12, height: 0.15, depth: 0.03 }, this.scene);
      spade.position = new Vector3(-6.1 + b * 0.4, groundY + 2.45, -1.8);
      spade.material = copperMat;
      lvBushingMeshes.push(bush, spade);
    }

    // Transformer Nameplate & Danger Decal
    const nameplate = MeshBuilder.CreatePlane('T1_nameplate', { width: 0.5, height: 0.3 }, this.scene);
    nameplate.position = new Vector3(-5.5, groundY + 1.2, -1.64);
    nameplate.material = this.createMaterial('mat_t1_plate', new Color3(0.9, 0.9, 0.92));

    this.registerEquipment('T1', [
      trTank, t1Plinth, skidL, skidR, coverPlate, conservator, buchholzPipe, breatherPipe, nameplate,
      ...radiatorMeshes, ...hvBushingMeshes, ...lvBushingMeshes
    ], new Vector3(-1, 0, -1));

    // 4. Main Distribution Board (MDB-A - 2,500 A Form 4b) & Main ACB Q0
    const mdbPlinth = MeshBuilder.CreateBox('MDB_plinth', { width: 3.8, height: 0.15, depth: 1.3 }, this.scene);
    mdbPlinth.position = new Vector3(-1.5, groundY + 0.075, -2.5);
    mdbPlinth.material = plinthMat;

    const mdbBodyMat = this.createMaterial('mat_MDB_body', new Color3(0.12, 0.48, 0.78), 0.45, 40);
    const mdbBody = MeshBuilder.CreateBox('MDB-A_body', { width: 3.5, height: 2.3, depth: 1.05 }, this.scene);
    mdbBody.position = new Vector3(-1.5, groundY + 1.25, -2.5);
    mdbBody.material = mdbBodyMat;

    // Main ACB Q0 drawout compartment (left section)
    const q0BodyMat = this.createMaterial('mat_Q0_body', new Color3(0.08, 0.32, 0.58), 0.5, 48);
    const q0Box = MeshBuilder.CreateBox('Q0_body', { width: 0.95, height: 0.95, depth: 0.45 }, this.scene);
    q0Box.position = new Vector3(-2.4, groundY + 1.25, -1.85);
    q0Box.material = q0BodyMat;

    // ACB Trip Unit Display & Manual Charging Handle
    const q0Screen = MeshBuilder.CreatePlane('Q0_screen', { width: 0.35, height: 0.22 }, this.scene);
    q0Screen.position = new Vector3(-2.4, groundY + 1.45, -1.61);
    q0Screen.material = this.createMaterial('mat_q0_lcd', new Color3(0.2, 0.95, 0.4));

    const q0Handle = MeshBuilder.CreateBox('Q0_handle', { width: 0.35, height: 0.06, depth: 0.08 }, this.scene);
    q0Handle.position = new Vector3(-2.4, groundY + 1.05, -1.61);
    q0Handle.material = this.createMaterial('mat_q0_handle', new Color3(0.8, 0.8, 0.85));

    // Transparent Polycarbonate Busbar Window showing L1, L2, L3, N copper busbars
    const busWindow = MeshBuilder.CreateBox('MDB_buswindow', { width: 3.1, height: 0.42, depth: 0.05 }, this.scene);
    busWindow.position = new Vector3(-1.5, groundY + 2.05, -1.95);
    busWindow.material = this.createMaterial('mat_bus_window', new Color3(0.2, 0.3, 0.4), 0.8, 64, 0.65);

    // Visible copper busbars inside window
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

    // 5. APFC Capacitor Bank & Detuned Reactors (C1 & QC - 400 kVAr Net at 400 V)
    const apfcPlinth = MeshBuilder.CreateBox('APFC_plinth', { width: 2.1, height: 0.15, depth: 1.3 }, this.scene);
    apfcPlinth.position = new Vector3(1.6, groundY + 0.075, -2.5);
    apfcPlinth.material = plinthMat;

    const apfcBodyMat = this.createMaterial('mat_APFC_body', new Color3(0.12, 0.68, 0.45), 0.45, 40);
    const apfcBody = MeshBuilder.CreateBox('C1_body', { width: 1.85, height: 2.3, depth: 1.05 }, this.scene);
    apfcBody.position = new Vector3(1.6, groundY + 1.25, -2.5);
    apfcBody.material = apfcBodyMat;

    // Lower tier Detuned Filter Reactor compartment (7% iron core detuned reactors)
    const reactorChamber = MeshBuilder.CreateBox('C1_reactors', { width: 1.65, height: 0.75, depth: 0.85 }, this.scene);
    reactorChamber.position = new Vector3(1.6, groundY + 0.5, -2.4);
    reactorChamber.material = this.createMaterial('mat_reactors_box', new Color3(0.1, 0.48, 0.32));

    // Cylindrical Aluminum Capacitor Cans (16 Steps) visible in upper tier
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

    // Microprocessor APFC Controller on door with 16-step active LED matrix
    const controllerPanel = MeshBuilder.CreateBox('C1_controller', { width: 0.6, height: 0.4, depth: 0.05 }, this.scene);
    controllerPanel.position = new Vector3(1.2, groundY + 1.85, -1.95);
    controllerPanel.material = this.createMaterial('mat_controller_face', new Color3(0.15, 0.18, 0.22));

    const controllerLcd = MeshBuilder.CreatePlane('C1_lcd', { width: 0.35, height: 0.16 }, this.scene);
    controllerLcd.position = new Vector3(1.2, groundY + 1.92, -1.91);
    controllerLcd.material = this.createMaterial('mat_apfc_lcd', new Color3(0.15, 0.95, 0.5));

    // QC incoming isolator handle
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
   * Builds the Floor Distribution Panels & Representative Loads
   */
  private buildFloorDistribution() {
    const floorHeight = 2.8;

    // 6 Floor Panels: F1 & F2 (Retail), F3-F6 (Office)
    for (let f = 1; f <= 6; f++) {
      const y = f * floorHeight + 0.05;
      const isRetail = f <= 2;
      const tag = `P-F${f}`;

      const panelColor = isRetail ? new Color3(0.1, 0.65, 0.75) : new Color3(0.12, 0.52, 0.85);
      const panelMat = this.createMaterial(`mat_${tag}`, panelColor, 0.4, 32);

      // Floor Panel Box mounted on column/wall near riser
      const panel = MeshBuilder.CreateBox(`${tag}_box`, { width: 0.95, height: 1.35, depth: 0.4 }, this.scene);
      panel.position = new Vector3(-2.5, y + 1.25, 0.5);
      panel.material = panelMat;

      // Digital sub-meter display on panel door
      const subMeter = MeshBuilder.CreatePlane(`${tag}_meter`, { width: 0.35, height: 0.2 }, this.scene);
      subMeter.position = new Vector3(-2.5, y + 1.6, 0.71);
      subMeter.material = this.createMaterial(`mat_${tag}_meter`, new Color3(0.1, 0.9, 0.85));

      // 3 LED pilot lamps (Phase A, B, C)
      const ledA = MeshBuilder.CreateSphere(`${tag}_ledA`, { diameter: 0.07 }, this.scene);
      ledA.position = new Vector3(-2.7, y + 1.35, 0.71);
      ledA.material = this.createMaterial(`mat_${tag}_ledA`, new Color3(0.9, 0.2, 0.2));

      const ledB = MeshBuilder.CreateSphere(`${tag}_ledB`, { diameter: 0.07 }, this.scene);
      ledB.position = new Vector3(-2.5, y + 1.35, 0.71);
      ledB.material = this.createMaterial(`mat_${tag}_ledB`, new Color3(0.9, 0.8, 0.1));

      const ledC = MeshBuilder.CreateSphere(`${tag}_ledC`, { diameter: 0.07 }, this.scene);
      ledC.position = new Vector3(-2.3, y + 1.35, 0.71);
      ledC.material = this.createMaterial(`mat_${tag}_ledC`, new Color3(0.2, 0.5, 0.9));

      // Realistic Architectural Floor Fitouts
      const loadMeshes: Mesh[] = [];
      if (isRetail) {
        // Retail merchandising display islands and suspended track lights
        const islandMat = this.createMaterial(`mat_retail_island_F${f}`, new Color3(0.75, 0.78, 0.82), 0.3, 24);
        const island = MeshBuilder.CreateBox(`retail_island_F${f}`, { width: 5.0, height: 0.8, depth: 2.8 }, this.scene);
        island.position = new Vector3(1.5, y + 0.4, 0.5);
        island.material = islandMat;

        // Display shelf riser
        const shelf = MeshBuilder.CreateBox(`retail_shelf_F${f}`, { width: 4.2, height: 0.4, depth: 1.4 }, this.scene);
        shelf.position = new Vector3(1.5, y + 1.0, 0.5);
        shelf.material = this.createMaterial(`mat_retail_shelf_F${f}`, new Color3(0.85, 0.88, 0.92));

        loadMeshes.push(island, shelf);
      } else {
        // Office floors: modular office workstations with computer monitors
        const deskMat = this.createMaterial(`mat_desk_F${f}`, new Color3(0.82, 0.85, 0.88), 0.2, 16);
        for (let d = 0; d < 2; d++) {
          const desk = MeshBuilder.CreateBox(`office_desk_F${f}_${d}`, { width: 2.8, height: 0.75, depth: 1.6 }, this.scene);
          desk.position = new Vector3(0.5 + d * 3.2, y + 0.38, 0.5);
          desk.material = deskMat;

          // Computer monitor on desk
          const monitor = MeshBuilder.CreateBox(`office_mon_F${f}_${d}`, { width: 0.8, height: 0.5, depth: 0.08 }, this.scene);
          monitor.position = new Vector3(0.5 + d * 3.2, y + 0.95, 0.2);
          monitor.material = this.createMaterial(`mat_mon_F${f}_${d}`, new Color3(0.18, 0.2, 0.25));

          loadMeshes.push(desk, monitor);
        }
      }

      this.registerEquipment(tag, [panel, subMeter, ledA, ledB, ledC, ...loadMeshes], new Vector3(0, f * 2.2, 0));
    }

    // Essential Distribution Panel (EDB) - Level 2
    const edbY = 2 * floorHeight + 0.05;
    const edbMat = this.createMaterial('mat_EDB', new Color3(0.92, 0.52, 0.12), 0.45, 36);
    const edbPanel = MeshBuilder.CreateBox('EDB_box', { width: 1.05, height: 1.45, depth: 0.45 }, this.scene);
    edbPanel.position = new Vector3(-2.5, edbY + 1.25, -2.0);
    edbPanel.material = edbMat;

    // Server rack suite (IT/UPS load powered by EDB)
    const itRackMat = this.createMaterial('mat_IT_rack', new Color3(0.2, 0.24, 0.28), 0.5, 40);
    const itRack1 = MeshBuilder.CreateBox('IT_rack_1', { width: 0.9, height: 2.05, depth: 1.0 }, this.scene);
    itRack1.position = new Vector3(-1.0, edbY + 1.05, -2.0);
    itRack1.material = itRackMat;

    const itRack2 = MeshBuilder.CreateBox('IT_rack_2', { width: 0.9, height: 2.05, depth: 1.0 }, this.scene);
    itRack2.position = new Vector3(0.1, edbY + 1.05, -2.0);
    itRack2.material = itRackMat;

    this.registerEquipment('EDB', [edbPanel, itRack1, itRack2], new Vector3(-2, 2 * 2.2, 0));

    // Mechanical Distribution Panel (MDP) - Basement
    const mdpY = -2.5 + 0.05;
    const mdpMat = this.createMaterial('mat_MDP', new Color3(0.22, 0.48, 0.88), 0.45, 36);
    const mdpPanel = MeshBuilder.CreateBox('MDP_box', { width: 1.15, height: 1.55, depth: 0.45 }, this.scene);
    mdpPanel.position = new Vector3(3.0, mdpY + 1.25, 1.5);
    mdpPanel.material = mdpMat;

    // Water Booster Pumps (WP-MOTOR) in basement
    const wpMat = this.createMaterial('mat_WP', new Color3(0.15, 0.55, 0.85), 0.5, 40);
    const pump1 = MeshBuilder.CreateCylinder('WP_pump1', { diameter: 0.65, height: 0.95 }, this.scene);
    pump1.position = new Vector3(5.0, mdpY + 0.48, 1.0);
    pump1.material = wpMat;

    const pump2 = MeshBuilder.CreateCylinder('WP_pump2', { diameter: 0.65, height: 0.95 }, this.scene);
    pump2.position = new Vector3(5.0, mdpY + 0.48, 2.5);
    pump2.material = wpMat;

    // Diaphragm expansion pressure tank
    const wpTank = MeshBuilder.CreateCylinder('WP_tank', { diameter: 0.8, height: 1.5 }, this.scene);
    wpTank.position = new Vector3(6.5, mdpY + 0.75, 1.8);
    wpTank.material = this.createMaterial('mat_wp_tank', new Color3(0.2, 0.65, 0.9));

    this.registerEquipment('MDP', [mdpPanel], new Vector3(1, -1, 0));
    this.registerEquipment('WP-MOTOR', [pump1, pump2, wpTank], new Vector3(2, -1, 0));

    // Rooftop Elevator Traction Machines & VRF Condensers
    const roofY = 7 * floorHeight + 0.05;
    // Elevator Penthouse Machine Room
    const liftBox = MeshBuilder.CreateBox('LIFT_penthouse', { width: 3.2, height: 2.3, depth: 2.6 }, this.scene);
    liftBox.position = new Vector3(-2.5, roofY + 1.15, -1.5);
    liftBox.material = this.createMaterial('mat_lift_penthouse', new Color3(0.78, 0.82, 0.86));

    // Geared traction motor & cable sheave
    const liftMotor = MeshBuilder.CreateCylinder('LIFT_motor', { diameter: 0.85, height: 1.3 }, this.scene);
    liftMotor.rotation.z = Math.PI / 2;
    liftMotor.position = new Vector3(-2.5, roofY + 1.25, -1.5);
    liftMotor.material = this.createMaterial('mat_lift_motor', new Color3(0.28, 0.52, 0.92));

    this.registerEquipment('LIFT-MOTOR', [liftBox, liftMotor], new Vector3(-1, 7 * 2.2, 0));

    // VRF HVAC Condenser Array (Roof)
    const vrfMeshes: Mesh[] = [];
    const vrfMat = this.createMaterial('mat_VRF', new Color3(0.22, 0.65, 0.85), 0.4, 32);
    for (let i = 0; i < 4; i++) {
      const vrfUnit = MeshBuilder.CreateBox(`VRF_unit_${i}`, { width: 1.25, height: 1.55, depth: 0.95 }, this.scene);
      vrfUnit.position = new Vector3(1.5 + i * 1.5, roofY + 0.78, 1.5);
      vrfUnit.material = vrfMat;

      // Condenser fan grille on top
      const fanGrille = MeshBuilder.CreateCylinder(`VRF_fan_${i}`, { diameter: 0.7, height: 0.08 }, this.scene);
      fanGrille.position = new Vector3(1.5 + i * 1.5, roofY + 1.58, 1.5);
      fanGrille.material = this.createMaterial(`mat_vrf_fan_${i}`, new Color3(0.2, 0.25, 0.3));

      vrfMeshes.push(vrfUnit, fanGrille);
    }
    this.registerEquipment('HVAC-LOAD', vrfMeshes, new Vector3(2, 7 * 2.2, 0));
  }

  /**
   * Builds the Emergency and Fire Protection Infrastructure:
   * - 400 kVA Standby Generator (GEN-1) and Breaker QG
   * - 400 A Essential ATS (ATS-E)
   * - Dedicated Fire Pump Controller / ATS (FP-ATS)
   * - 37 kW Fire Pump Motor & Centrifugal Pump (FP-MOTOR)
   */
  private buildEmergencyAndFireSystem() {
    const groundY = 0.05;
    const plinthMat = this.createMaterial('mat_plinth_gen', new Color3(0.76, 0.79, 0.84), 0.25, 16);

    // 1. Standby Diesel Generator (GEN-1 - 400 kVA / 320 kW Sound-Attenuated Outdoor Canopy)
    const genPlinth = MeshBuilder.CreateBox('GEN_plinth', { width: 4.2, height: 0.2, depth: 2.2 }, this.scene);
    genPlinth.position = new Vector3(8.5, groundY + 0.1, -2.5);
    genPlinth.material = plinthMat;

    const genMat = this.createMaterial('mat_GEN_canopy', new Color3(0.95, 0.65, 0.12), 0.5, 48); // Industrial safety yellow
    const genCanopy = MeshBuilder.CreateBox('GEN-1_canopy', { width: 3.6, height: 2.2, depth: 1.7 }, this.scene);
    genCanopy.position = new Vector3(8.5, groundY + 1.3, -2.5);
    genCanopy.material = genMat;

    // Sub-base structural fuel tank skid
    const fuelSkid = MeshBuilder.CreateBox('GEN-1_skid', { width: 3.75, height: 0.35, depth: 1.8 }, this.scene);
    fuelSkid.position = new Vector3(8.5, groundY + 0.35, -2.5);
    fuelSkid.material = this.createMaterial('mat_gen_skid', new Color3(0.25, 0.28, 0.32));

    // Acoustic sound-trap louvers (Front air intake)
    const intakeLouver = MeshBuilder.CreateBox('GEN-1_intake', { width: 0.1, height: 1.4, depth: 1.3 }, this.scene);
    intakeLouver.position = new Vector3(6.65, groundY + 1.4, -2.5);
    intakeLouver.material = this.createMaterial('mat_louver', new Color3(0.18, 0.2, 0.25));

    // Rooftop Critical-Grade Residential Exhaust Silencer / Muffler
    const muffler = MeshBuilder.CreateCylinder('GEN-1_exhaust', { diameter: 0.45, height: 1.9 }, this.scene);
    muffler.rotation.z = Math.PI / 2;
    muffler.position = new Vector3(8.5, groundY + 2.65, -2.5);
    muffler.material = this.createMaterial('mat_muffler', new Color3(0.3, 0.32, 0.35), 0.6, 32);

    // Rain cap / flapper valve on exhaust tailpipe
    const exhaustPipe = MeshBuilder.CreateCylinder('GEN-1_pipe', { diameter: 0.22, height: 0.9 }, this.scene);
    exhaustPipe.position = new Vector3(9.3, groundY + 3.0, -2.5);
    exhaustPipe.material = muffler.material;

    // Recessed Digital Generator Controller & Emergency Stop
    const genController = MeshBuilder.CreatePlane('GEN-1_lcd', { width: 0.45, height: 0.3 }, this.scene);
    genController.position = new Vector3(8.5, groundY + 1.5, -1.64);
    genController.material = this.createMaterial('mat_gen_lcd', new Color3(0.15, 0.95, 0.85));

    const estopBtn = MeshBuilder.CreateCylinder('GEN-1_estop', { diameter: 0.12, height: 0.08 }, this.scene);
    estopBtn.rotation.x = Math.PI / 2;
    estopBtn.position = new Vector3(9.1, groundY + 1.3, -1.63);
    estopBtn.material = this.createMaterial('mat_estop', new Color3(0.95, 0.1, 0.1));

    // Generator Main Circuit Breaker QG (630 A MCCB)
    const qgBox = MeshBuilder.CreateBox('QG_body', { width: 0.65, height: 0.75, depth: 0.35 }, this.scene);
    qgBox.position = new Vector3(6.9, groundY + 1.3, -1.9);
    qgBox.material = this.createMaterial('mat_QG', new Color3(0.78, 0.48, 0.08));

    this.registerEquipment('GEN-1', [genCanopy, genPlinth, fuelSkid, intakeLouver, muffler, exhaustPipe, genController, estopBtn], new Vector3(3, 0, -1));
    this.registerEquipment('QG', [qgBox], new Vector3(2.5, 0, -0.8));

    // 2. Essential ATS (ATS-E - 400 A 4-Pole Dual Motorized Switch)
    const atsePlinth = MeshBuilder.CreateBox('ATSE_plinth', { width: 1.3, height: 0.15, depth: 0.8 }, this.scene);
    atsePlinth.position = new Vector3(4.0, groundY + 0.075, -2.5);
    atsePlinth.material = plinthMat;

    const atseMat = this.createMaterial('mat_ATSE', new Color3(0.9, 0.55, 0.15), 0.45, 36);
    const atseBox = MeshBuilder.CreateBox('ATS-E_box', { width: 1.15, height: 1.7, depth: 0.65 }, this.scene);
    atseBox.position = new Vector3(4.0, groundY + 1.2, -2.5);
    atseBox.material = atseMat;

    // Normal & Emergency pilot indicator lights
    const normalLed = MeshBuilder.CreateSphere('ATSE_normalLed', { diameter: 0.08 }, this.scene);
    normalLed.position = new Vector3(3.8, groundY + 1.6, -2.16);
    normalLed.material = this.createMaterial('mat_atse_norm', new Color3(0.1, 0.9, 0.2));

    const emerLed = MeshBuilder.CreateSphere('ATSE_emerLed', { diameter: 0.08 }, this.scene);
    emerLed.position = new Vector3(4.2, groundY + 1.6, -2.16);
    emerLed.material = this.createMaterial('mat_atse_emer', new Color3(0.95, 0.7, 0.1));

    this.registerEquipment('ATS-E', [atseBox, atsePlinth, normalLed, emerLed], new Vector3(2, 0, -1));

    // 3. Dedicated Fire Pump Controller & ATS (FP-ATS) - In Basement
    const basementY = -2.5 + 0.05;
    const fpAtsMat = this.createMaterial('mat_FPATS', new Color3(0.95, 0.18, 0.18), 0.5, 48); // Safety Red
    const fpAtsBox = MeshBuilder.CreateBox('FP-ATS_box', { width: 1.25, height: 1.75, depth: 0.65 }, this.scene);
    fpAtsBox.position = new Vector3(2.5, basementY + 1.25, -1.5);
    fpAtsBox.material = fpAtsMat;

    // Rotary isolating switch handle on Fire Pump Controller
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

    // Red water discharge pipe riser
    const fpPipe = MeshBuilder.CreateCylinder('FP_riser_pipe', { diameter: 0.28, height: 2.3 }, this.scene);
    fpPipe.position = new Vector3(6.1, basementY + 1.7, -1.5);
    fpPipe.material = motorMat;

    this.registerEquipment('FP-ATS', [fpAtsBox, fpHandle], new Vector3(1, -1, 0));
    this.registerEquipment('FP-MOTOR', [fpMotor, fpPump, fpPipe], new Vector3(2, -1, 0));
  }

  /**
   * Builds the Electrical Riser, Cable Trays, and Conduits
   */
  private buildCableFeedersAndRiser() {
    const floorHeight = 2.8;

    // 1. Vertical Riser Shaft / Cable Ladder with Rungs
    const riserMat = this.createMaterial('mat_riser', new Color3(0.55, 0.60, 0.68), 0.4, 28);
    const riserHeight = 7 * floorHeight + 2.5;

    // Dual vertical channel rails of ladder
    const railL = MeshBuilder.CreateBox('RISER_railL', { width: 0.08, height: riserHeight, depth: 0.12 }, this.scene);
    railL.position = new Vector3(-3.0, riserHeight / 2 - 2.5, -0.2);
    railL.material = riserMat;

    const railR = MeshBuilder.CreateBox('RISER_railR', { width: 0.08, height: riserHeight, depth: 0.12 }, this.scene);
    railR.position = new Vector3(-2.0, riserHeight / 2 - 2.5, -0.2);
    railR.material = riserMat;

    this.shellMeshes.push(railL, railR);

    // 2. High Voltage 13.8 kV Feeder Path (Red Conduit)
    const hvCableMat = this.createMaterial('mat_cable_HV', new Color3(0.9, 0.2, 0.2), 0.6, 40);
    const hvTube = MeshBuilder.CreateTube('CABLE_HV', {
      path: [
        new Vector3(-10.2, 0.5, -2.5), // From Meter
        new Vector3(-8.5, 0.5, -2.5),  // To HV-01
        new Vector3(-8.5, 1.8, -2.5),  // Through VCB
        new Vector3(-8.5, 2.4, -2.8),
        new Vector3(-6.0, 2.4, -2.8),  // To T1 HV Bushings
        new Vector3(-6.0, 2.2, -3.0)
      ],
      radius: 0.08
    }, this.scene);
    hvTube.material = hvCableMat;
    this.cableMeshes.set('HV', [hvTube]);

    // 3. Copper Busway Trunking (Transformer T1 to Main LV Board MDB-A)
    const busductMat = this.createMaterial('mat_busduct', new Color3(0.85, 0.55, 0.25), 0.6, 40);
    const busduct = MeshBuilder.CreateBox('BUSDUCT_T1_MDB', { width: 3.2, height: 0.35, depth: 0.35 }, this.scene);
    busduct.position = new Vector3(-3.5, 2.45, -2.5);
    busduct.material = busductMat;
    this.cableMeshes.set('LV_MAIN', [busduct]);

    // 4. Low Voltage Floor Feeder Cables from MDB-A to P-F1 through P-F6
    const feederMat = this.createMaterial('mat_feeder_cable', new Color3(0.15, 0.45, 0.85), 0.5, 36);
    for (let f = 1; f <= 6; f++) {
      const y = f * floorHeight;
      const feederTube = MeshBuilder.CreateTube(`CABLE_F${f}`, {
        path: [
          new Vector3(-1.0, 2.3, -2.4),
          new Vector3(-2.5, 2.3, -2.4),
          new Vector3(-2.5, y + 1.25, -0.2),
          new Vector3(-2.5, y + 1.25, 0.5)
        ],
        radius: 0.05
      }, this.scene);
      feederTube.material = feederMat;
      this.cableMeshes.set(`F${f}`, [feederTube]);
    }

    // 5. Emergency Feeder Path (Orange Conduit - Generator to ATS to EDB)
    const emerCableMat = this.createMaterial('mat_cable_EMER', new Color3(0.95, 0.6, 0.12), 0.6, 40);
    const genTube = MeshBuilder.CreateTube('CABLE_GEN_ATS', {
      path: [
        new Vector3(7.0, 1.3, -1.9),
        new Vector3(5.5, 1.3, -2.2),
        new Vector3(4.0, 1.3, -2.2)
      ],
      radius: 0.08
    }, this.scene);
    genTube.material = emerCableMat;
    this.cableMeshes.set('GEN', [genTube]);
  }

  /**
   * Helper to register equipment meshes, interaction actions, and explosion anchors
   */
  private registerEquipment(tag: string, meshes: Mesh[], explodeOffset: Vector3) {
    this.equipmentMeshes.set(tag, meshes);

    meshes.forEach((mesh) => {
      this.originalPositions.set(mesh, mesh.position.clone());
      this.explodedOffsets.set(mesh, explodeOffset);

      // Make pickable
      mesh.isPickable = true;
      mesh.actionManager = new ActionManager(this.scene);

      // Click action
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          this.selectEquipment(tag);
        })
      );

      // Hover actions
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

  /**
   * Public control: selects an equipment tag and highlights it
   */
  public selectEquipment(tag: string | null) {
    if (this.selectedTag === tag && tag !== null) {
      // Toggle off
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
            mat.emissiveColor = new Color3(0.2, 0.45, 0.85); // High-contrast blue highlight
          } else {
            mat.emissiveColor = new Color3(0, 0, 0);
          }
        }
      });
    });
  }

  /**
   * Updates View Options (Layer toggles, Exploded view, Shell modes)
   */
  public updateViewOptions(options: ViewOptions3D) {
    this.currentOptions = options;

    // 1. Shell mode
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

    // 2. Exploded view offsets
    this.updateExplodedOffset(options.explodedOffset);

    // 3. Category visibilities
    this.setCategoryVisibility('HV-01', options.showHV);
    this.setCategoryVisibility('METER', options.showHV);
    this.setCategoryVisibility('T1', options.showTransformer);
    this.setCategoryVisibility('MDB-A', options.showLV);
    this.setCategoryVisibility('Q0', options.showLV);
    this.setCategoryVisibility('C1', options.showAPFC);
    this.setCategoryVisibility('QC', options.showAPFC);

    for (let f = 1; f <= 6; f++) {
      this.setCategoryVisibility(`P-F${f}`, options.showFeeders);
    }

    this.setCategoryVisibility('GEN-1', options.showEmergency);
    this.setCategoryVisibility('QG', options.showEmergency);
    this.setCategoryVisibility('ATS-E', options.showEmergency);
    this.setCategoryVisibility('FP-ATS', options.showEmergency);
    this.setCategoryVisibility('FP-MOTOR', options.showEmergency);
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

  /**
   * Preset Camera Positions - FIXED TO PREVENT SHAKING & JITTER
   * 1. Stops any ongoing animations on camera
   * 2. Clears residual inertial offsets
   * 3. Calculates shortest angular distance to prevent wild 360-degree rotation wraps
   * 4. Uses smooth CubicEase easing curve
   */
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

    // 1. Stop all active animations on the camera to prevent conflict/shaking
    this.scene.stopAnimation(this.camera);

    // 2. Clear any residual inertial momentum so user drag doesn't fight the animation
    this.camera.inertialAlphaOffset = 0;
    this.camera.inertialBetaOffset = 0;
    this.camera.inertialRadiusOffset = 0;
    this.camera.inertialPanningX = 0;
    this.camera.inertialPanningY = 0;

    // 3. Shortest angular path calculation for alpha (prevents spinning 360 degrees or jerking)
    const twoPi = Math.PI * 2;
    let diff = (targetAlpha - this.camera.alpha) % twoPi;
    if (diff > Math.PI) diff -= twoPi;
    if (diff < -Math.PI) diff += twoPi;
    const finalAlpha = this.camera.alpha + diff;

    // 4. Smooth cubic easing curve for natural deceleration
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
