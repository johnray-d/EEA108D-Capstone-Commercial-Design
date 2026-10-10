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
  Animation
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
    this.scene.clearColor = new Color4(0.024, 0.039, 0.078, 1.0); // Slate-950

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
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 75;
    this.camera.wheelPrecision = 20;
    this.camera.inertia = 0.75;
    this.camera.panningSensibility = 50;
  }

  private setupLights() {
    const ambient = new HemisphericLight('ambientLight', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.65;
    ambient.groundColor = new Color3(0.08, 0.12, 0.2);

    const dirLight1 = new DirectionalLight('dirLight1', new Vector3(-1, -2, -1), this.scene);
    dirLight1.position = new Vector3(20, 40, 20);
    dirLight1.intensity = 0.8;

    const dirLight2 = new DirectionalLight('dirLight2', new Vector3(1, -1.5, 1), this.scene);
    dirLight2.position = new Vector3(-20, 30, -20);
    dirLight2.intensity = 0.4;
  }

  /**
   * Builds the 6-storey building architectural skeleton
   */
  private buildBuildingShell() {
    const floorWidth = 14;
    const floorDepth = 10;
    const floorHeight = 2.8;
    const numFloors = 6;

    // Ground floor slab (Y = 0)
    const groundMat = new StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new Color3(0.1, 0.15, 0.22);
    groundMat.specularColor = new Color3(0.2, 0.25, 0.3);

    const groundSlab = MeshBuilder.CreateBox('groundSlab', {
      width: floorWidth + 8,
      height: 0.4,
      depth: floorDepth + 8
    }, this.scene);
    groundSlab.position = new Vector3(0, -0.2, 0);
    groundSlab.material = groundMat;

    // Basement pit
    const basementSlab = MeshBuilder.CreateBox('basementSlab', {
      width: 7,
      height: 0.3,
      depth: 6
    }, this.scene);
    basementSlab.position = new Vector3(5, -2.5, 2);
    basementSlab.material = groundMat;

    // Floor slabs (L1 to L6 and Roof)
    const slabMat = new StandardMaterial('slabMat', this.scene);
    slabMat.diffuseColor = new Color3(0.15, 0.2, 0.28);
    slabMat.specularColor = new Color3(0.1, 0.1, 0.1);

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

      // Save for exploded offsets
      this.originalPositions.set(slab, slab.position.clone());
      this.explodedOffsets.set(slab, new Vector3(0, i * 2.2, 0));
    }

    // Glass building shell (cutaway view)
    const glassMat = new StandardMaterial('glassShellMat', this.scene);
    glassMat.diffuseColor = new Color3(0.2, 0.4, 0.6);
    glassMat.alpha = this.currentOptions.shellOpacity;
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

    // Columns
    const colMat = new StandardMaterial('colMat', this.scene);
    colMat.diffuseColor = new Color3(0.12, 0.18, 0.25);
    const colPositions = [
      new Vector3(-floorWidth / 2 + 0.3, ((numFloors + 1) * floorHeight) / 2, -floorDepth / 2 + 0.3),
      new Vector3(floorWidth / 2 - 0.3, ((numFloors + 1) * floorHeight) / 2, -floorDepth / 2 + 0.3),
      new Vector3(-floorWidth / 2 + 0.3, ((numFloors + 1) * floorHeight) / 2, floorDepth / 2 - 0.3),
      new Vector3(floorWidth / 2 - 0.3, ((numFloors + 1) * floorHeight) / 2, floorDepth / 2 - 0.3)
    ];

    colPositions.forEach((pos, idx) => {
      const col = MeshBuilder.CreateBox(`col_${idx}`, {
        width: 0.4,
        height: (numFloors + 1) * floorHeight,
        depth: 0.4
      }, this.scene);
      col.position = pos;
      col.material = colMat;
      this.shellMeshes.push(col);
    });
  }

  /**
   * Builds the Ground Floor Electrical Plant Room:
   * - 13.8 kV Intake & HV Switchgear (HV-01)
   * - Revenue Metering Point (METER)
   * - 1,250 kVA Oil Transformer (T1)
   * - 2,500 A Main Distribution Board (MDB-A) & Main Breaker Q0
   * - 400 kVAr Detuned APFC Bank (C1 & QC)
   */
  private buildElectricalPlantRoom() {
    const groundY = 0.1;

    // 1. HV Switchgear & Breaker (HV-01)
    const hvMat = this.createMaterial('mat_HV', new Color3(0.9, 0.2, 0.2));
    const hvCubicle = MeshBuilder.CreateBox('HV-01_body', { width: 1.4, height: 2.2, depth: 1.1 }, this.scene);
    hvCubicle.position = new Vector3(-8.5, groundY + 1.1, -2.5);
    hvCubicle.material = hvMat;

    const hvHandle = MeshBuilder.CreateCylinder('HV-01_handle', { diameter: 0.1, height: 0.3 }, this.scene);
    hvHandle.rotation.z = Math.PI / 2;
    hvHandle.position = new Vector3(-8.5, groundY + 1.2, -1.9);
    hvHandle.material = this.createMaterial('mat_metal', new Color3(0.7, 0.7, 0.7));

    this.registerEquipment('HV-01', [hvCubicle, hvHandle], new Vector3(-2, 0, -1));

    // 2. Revenue Metering Cubicle (METER)
    const meterMat = this.createMaterial('mat_Meter', new Color3(0.95, 0.5, 0.1));
    const meterCubicle = MeshBuilder.CreateBox('METER_body', { width: 0.9, height: 1.8, depth: 0.8 }, this.scene);
    meterCubicle.position = new Vector3(-10.2, groundY + 0.9, -2.5);
    meterCubicle.material = meterMat;

    const meterGlass = MeshBuilder.CreatePlane('METER_display', { width: 0.5, height: 0.4 }, this.scene);
    meterGlass.position = new Vector3(-10.2, groundY + 1.3, -2.09);
    meterGlass.material = this.createMaterial('mat_screen', new Color3(0.1, 0.9, 0.9));

    this.registerEquipment('METER', [meterCubicle, meterGlass], new Vector3(-3, 0, -1));

    // 3. 1,250 kVA Transformer T1 (Alternative 1)
    const trMat = this.createMaterial('mat_T1', new Color3(0.2, 0.6, 0.9));
    const trTank = MeshBuilder.CreateBox('T1_tank', { width: 1.8, height: 1.8, depth: 1.6 }, this.scene);
    trTank.position = new Vector3(-5.5, groundY + 0.9, -2.5);
    trTank.material = trMat;

    // Radiator cooling fins
    const finL = MeshBuilder.CreateBox('T1_finL', { width: 0.2, height: 1.5, depth: 1.4 }, this.scene);
    finL.position = new Vector3(-6.5, groundY + 0.9, -2.5);
    finL.material = this.createMaterial('mat_fin', new Color3(0.15, 0.45, 0.75));

    const finR = MeshBuilder.CreateBox('T1_finR', { width: 0.2, height: 1.5, depth: 1.4 }, this.scene);
    finR.position = new Vector3(-4.5, groundY + 0.9, -2.5);
    finR.material = finL.material;

    // Oil conservator tank on top
    const conservator = MeshBuilder.CreateCylinder('T1_conservator', { diameter: 0.5, height: 1.5 }, this.scene);
    conservator.rotation.z = Math.PI / 2;
    conservator.position = new Vector3(-5.5, groundY + 2.05, -2.2);
    conservator.material = trMat;

    // HV Bushings (Red)
    const hvBushing = MeshBuilder.CreateCylinder('T1_hvBush', { diameter: 0.15, height: 0.4 }, this.scene);
    hvBushing.position = new Vector3(-6.0, groundY + 2.0, -3.0);
    hvBushing.material = this.createMaterial('mat_bushHV', new Color3(0.9, 0.2, 0.2));

    // LV Bushings (Cyan)
    const lvBushing = MeshBuilder.CreateCylinder('T1_lvBush', { diameter: 0.15, height: 0.4 }, this.scene);
    lvBushing.position = new Vector3(-5.0, groundY + 2.0, -3.0);
    lvBushing.material = this.createMaterial('mat_bushLV', new Color3(0.2, 0.8, 0.9));

    this.registerEquipment('T1', [trTank, finL, finR, conservator, hvBushing, lvBushing], new Vector3(-1, 0, -1));

    // 4. Main Distribution Board (MDB-A) and Main Breaker Q0
    const mdbMat = this.createMaterial('mat_MDB', new Color3(0.08, 0.45, 0.75));
    const mdbBody = MeshBuilder.CreateBox('MDB-A_body', { width: 3.2, height: 2.2, depth: 1.0 }, this.scene);
    mdbBody.position = new Vector3(-1.5, groundY + 1.1, -2.5);
    mdbBody.material = mdbMat;

    // Main breaker Q0 module (center-left)
    const q0Mat = this.createMaterial('mat_Q0', new Color3(0.05, 0.35, 0.6));
    const q0Box = MeshBuilder.CreateBox('Q0_body', { width: 0.8, height: 0.8, depth: 0.4 }, this.scene);
    q0Box.position = new Vector3(-2.4, groundY + 1.2, -1.9);
    q0Box.material = q0Mat;

    // Busbar cover window
    const busbarWindow = MeshBuilder.CreatePlane('MDB_buswindow', { width: 2.8, height: 0.4 }, this.scene);
    busbarWindow.position = new Vector3(-1.5, groundY + 1.9, -1.99);
    busbarWindow.material = this.createMaterial('mat_copper', new Color3(0.85, 0.55, 0.25));

    this.registerEquipment('MDB-A', [mdbBody, busbarWindow], new Vector3(0, 0, -1));
    this.registerEquipment('Q0', [q0Box], new Vector3(0, 0, -0.8));

    // 5. APFC Capacitor Bank & Detuned Reactors (C1 & QC)
    const apfcMat = this.createMaterial('mat_APFC', new Color3(0.1, 0.7, 0.45));
    const apfcBody = MeshBuilder.CreateBox('C1_body', { width: 1.8, height: 2.2, depth: 1.0 }, this.scene);
    apfcBody.position = new Vector3(1.5, groundY + 1.1, -2.5);
    apfcBody.material = apfcMat;

    // Lower tier detuned reactor chamber
    const reactorMat = this.createMaterial('mat_reactors', new Color3(0.1, 0.5, 0.35));
    const reactorChamber = MeshBuilder.CreateBox('C1_reactors', { width: 1.6, height: 0.7, depth: 0.8 }, this.scene);
    reactorChamber.position = new Vector3(1.5, groundY + 0.45, -2.4);
    reactorChamber.material = reactorMat;

    // QC breaker
    const qcBox = MeshBuilder.CreateBox('QC_body', { width: 0.5, height: 0.5, depth: 0.2 }, this.scene);
    qcBox.position = new Vector3(1.1, groundY + 1.4, -1.95);
    qcBox.material = this.createMaterial('mat_QC', new Color3(0.05, 0.5, 0.3));

    this.registerEquipment('C1', [apfcBody, reactorChamber], new Vector3(1.5, 0, -1));
    this.registerEquipment('QC', [qcBox], new Vector3(1.5, 0, -0.8));
  }

  /**
   * Builds the Floor Distribution Panels & Representative Loads
   */
  private buildFloorDistribution() {
    const floorHeight = 2.8;

    // 6 Floor Panels: F1 & F2 (Retail), F3-F6 (Office)
    for (let f = 1; f <= 6; f++) {
      const y = f * floorHeight + 0.1;
      const isRetail = f <= 2;
      const tag = `P-F${f}`;

      const panelMat = this.createMaterial(
        `mat_${tag}`,
        isRetail ? new Color3(0.05, 0.65, 0.75) : new Color3(0.05, 0.5, 0.85)
      );

      // Floor Panel Box mounted on column/wall near riser
      const panel = MeshBuilder.CreateBox(`${tag}_box`, { width: 0.9, height: 1.3, depth: 0.4 }, this.scene);
      panel.position = new Vector3(-2.5, y + 1.2, 0.5);
      panel.material = panelMat;

      // Status indicator light
      const led = MeshBuilder.CreateSphere(`${tag}_led`, { diameter: 0.12 }, this.scene);
      led.position = new Vector3(-2.5, y + 1.7, 0.72);
      led.material = this.createMaterial(`mat_${tag}_led`, new Color3(0.2, 0.9, 0.4));

      // Representative floor loads
      const loadMeshes: Mesh[] = [];
      if (isRetail) {
        // Retail display island & lighting track
        const island = MeshBuilder.CreateBox(`retail_island_F${f}`, { width: 4.5, height: 0.8, depth: 2.5 }, this.scene);
        island.position = new Vector3(1.5, y + 0.4, 0.5);
        island.material = this.createMaterial(`mat_retail_F${f}`, new Color3(0.25, 0.35, 0.45));
        loadMeshes.push(island);
      } else {
        // Office workstation clusters
        const desk1 = MeshBuilder.CreateBox(`office_desk_F${f}_1`, { width: 4.0, height: 0.75, depth: 1.8 }, this.scene);
        desk1.position = new Vector3(1.5, y + 0.38, 0.5);
        desk1.material = this.createMaterial(`mat_office_F${f}`, new Color3(0.2, 0.28, 0.38));
        loadMeshes.push(desk1);
      }

      this.registerEquipment(tag, [panel, led, ...loadMeshes], new Vector3(-1, f * 2.2, 0));
    }

    // Essential Distribution Board (EDB) - Floor 2 Technical Center
    const edbY = 2 * floorHeight + 0.1;
    const edbMat = this.createMaterial('mat_EDB', new Color3(0.55, 0.35, 0.9));
    const edbPanel = MeshBuilder.CreateBox('EDB_box', { width: 0.9, height: 1.4, depth: 0.4 }, this.scene);
    edbPanel.position = new Vector3(-4.5, edbY + 1.2, -1.5);
    edbPanel.material = edbMat;

    // IT Server Racks & UPS
    const itRack1 = MeshBuilder.CreateBox('IT_rack_1', { width: 0.9, height: 2.0, depth: 1.0 }, this.scene);
    itRack1.position = new Vector3(-4.5, edbY + 1.0, 1.2);
    itRack1.material = this.createMaterial('mat_IT1', new Color3(0.12, 0.15, 0.2));

    const itRack2 = MeshBuilder.CreateBox('IT_rack_2', { width: 0.9, height: 2.0, depth: 1.0 }, this.scene);
    itRack2.position = new Vector3(-3.4, edbY + 1.0, 1.2);
    itRack2.material = itRack1.material;

    this.registerEquipment('EDB', [edbPanel, itRack1, itRack2], new Vector3(-2, 2 * 2.2, 0));

    // Mechanical Distribution Panel (MDP) - Basement
    const mdpY = -2.5 + 0.1;
    const mdpMat = this.createMaterial('mat_MDP', new Color3(0.2, 0.45, 0.85));
    const mdpPanel = MeshBuilder.CreateBox('MDP_box', { width: 1.1, height: 1.5, depth: 0.4 }, this.scene);
    mdpPanel.position = new Vector3(3.0, mdpY + 1.2, 1.5);
    mdpPanel.material = mdpMat;

    // Water Booster Pumps (WP)
    const wpMat = this.createMaterial('mat_WP', new Color3(0.1, 0.5, 0.8));
    const pump1 = MeshBuilder.CreateCylinder('WP_pump1', { diameter: 0.6, height: 0.9 }, this.scene);
    pump1.position = new Vector3(5.0, mdpY + 0.45, 1.0);
    pump1.material = wpMat;

    const pump2 = MeshBuilder.CreateCylinder('WP_pump2', { diameter: 0.6, height: 0.9 }, this.scene);
    pump2.position = new Vector3(5.0, mdpY + 0.45, 2.5);
    pump2.material = wpMat;

    this.registerEquipment('MDP', [mdpPanel], new Vector3(1, -1, 0));
    this.registerEquipment('WP-MOTOR', [pump1, pump2], new Vector3(2, -1, 0));

    // Rooftop Elevator Traction Machines & VRF Condensers
    const roofY = 7 * floorHeight + 0.1;
    // Elevator Penthouse
    const liftBox = MeshBuilder.CreateBox('LIFT_penthouse', { width: 3.0, height: 2.2, depth: 2.5 }, this.scene);
    liftBox.position = new Vector3(-2.5, roofY + 1.1, -1.5);
    liftBox.material = this.createMaterial('mat_lift_penthouse', new Color3(0.2, 0.3, 0.4));

    const liftMotor = MeshBuilder.CreateCylinder('LIFT_motor', { diameter: 0.8, height: 1.2 }, this.scene);
    liftMotor.rotation.z = Math.PI / 2;
    liftMotor.position = new Vector3(-2.5, roofY + 1.2, -1.5);
    liftMotor.material = this.createMaterial('mat_lift_motor', new Color3(0.3, 0.5, 0.9));

    this.registerEquipment('LIFT-MOTOR', [liftBox, liftMotor], new Vector3(-1, 7 * 2.2, 0));

    // VRF Condensers array
    const vrfMeshes: Mesh[] = [];
    const vrfMat = this.createMaterial('mat_VRF', new Color3(0.15, 0.6, 0.8));
    for (let i = 0; i < 4; i++) {
      const vrfUnit = MeshBuilder.CreateBox(`VRF_unit_${i}`, { width: 1.2, height: 1.5, depth: 0.9 }, this.scene);
      vrfUnit.position = new Vector3(1.5 + i * 1.5, roofY + 0.75, 1.5);
      vrfUnit.material = vrfMat;
      vrfMeshes.push(vrfUnit);
    }
    this.registerEquipment('HVAC-LOAD', vrfMeshes, new Vector3(2, 7 * 2.2, 0));
  }

  /**
   * Builds the Emergency and Fire Protection Infrastructure:
   * - 400 kVA Standby Generator (GEN-1) and Breaker QG
   * - 400 A Essential ATS (ATS-E)
   * - Dedicated Fire Pump Controller / ATS (FP-ATS)
   * - 37 kW Fire Pump Motor & Pump (FP-MOTOR)
   */
  private buildEmergencyAndFireSystem() {
    const groundY = 0.1;

    // 1. Standby Diesel Generator (GEN-1) - Outdoor enclosure
    const genMat = this.createMaterial('mat_GEN', new Color3(0.9, 0.6, 0.1));
    const genCanopy = MeshBuilder.CreateBox('GEN-1_canopy', { width: 3.5, height: 2.2, depth: 1.6 }, this.scene);
    genCanopy.position = new Vector3(8.5, groundY + 1.1, -2.5);
    genCanopy.material = genMat;

    // Exhaust muffler on top
    const muffler = MeshBuilder.CreateCylinder('GEN-1_exhaust', { diameter: 0.4, height: 1.8 }, this.scene);
    muffler.rotation.z = Math.PI / 2;
    muffler.position = new Vector3(8.5, groundY + 2.4, -2.5);
    muffler.material = this.createMaterial('mat_exhaust', new Color3(0.2, 0.2, 0.2));

    const exhaustPipe = MeshBuilder.CreateCylinder('GEN-1_pipe', { diameter: 0.2, height: 1.0 }, this.scene);
    exhaustPipe.position = new Vector3(9.2, groundY + 2.8, -2.5);
    exhaustPipe.material = muffler.material;

    // Generator Breaker QG
    const qgBox = MeshBuilder.CreateBox('QG_body', { width: 0.6, height: 0.7, depth: 0.3 }, this.scene);
    qgBox.position = new Vector3(6.9, groundY + 1.2, -1.9);
    qgBox.material = this.createMaterial('mat_QG', new Color3(0.7, 0.45, 0.05));

    this.registerEquipment('GEN-1', [genCanopy, muffler, exhaustPipe], new Vector3(3, 0, -1));
    this.registerEquipment('QG', [qgBox], new Vector3(2.5, 0, -0.8));

    // 2. Essential ATS (ATS-E)
    const atseMat = this.createMaterial('mat_ATSE', new Color3(0.85, 0.5, 0.1));
    const atseBox = MeshBuilder.CreateBox('ATS-E_box', { width: 1.1, height: 1.6, depth: 0.6 }, this.scene);
    atseBox.position = new Vector3(4.0, groundY + 1.1, -2.5);
    atseBox.material = atseMat;

    this.registerEquipment('ATS-E', [atseBox], new Vector3(2, 0, -1));

    // 3. Dedicated Fire Pump Controller & ATS (FP-ATS) - In Basement
    const basementY = -2.5 + 0.1;
    const fpAtsMat = this.createMaterial('mat_FPATS', new Color3(0.9, 0.15, 0.15));
    const fpAtsBox = MeshBuilder.CreateBox('FP-ATS_box', { width: 1.2, height: 1.7, depth: 0.6 }, this.scene);
    fpAtsBox.position = new Vector3(2.5, basementY + 1.2, -1.5);
    fpAtsBox.material = fpAtsMat;

    // 4. Fire Pump Motor (FP-MOTOR) and pump assembly
    const motorMat = this.createMaterial('mat_FPMotor', new Color3(0.8, 0.1, 0.1));
    const fpMotor = MeshBuilder.CreateCylinder('FP_motor', { diameter: 0.7, height: 1.2 }, this.scene);
    fpMotor.rotation.z = Math.PI / 2;
    fpMotor.position = new Vector3(5.0, basementY + 0.5, -1.5);
    fpMotor.material = motorMat;

    const fpPump = MeshBuilder.CreateCylinder('FP_casing', { diameter: 0.9, height: 0.7 }, this.scene);
    fpPump.position = new Vector3(6.0, basementY + 0.5, -1.5);
    fpPump.material = this.createMaterial('mat_FPCasing', new Color3(0.65, 0.1, 0.1));

    const fpPipe = MeshBuilder.CreateCylinder('FP_riser_pipe', { diameter: 0.25, height: 2.2 }, this.scene);
    fpPipe.position = new Vector3(6.0, basementY + 1.6, -1.5);
    fpPipe.material = fpPump.material;

    this.registerEquipment('FP-ATS', [fpAtsBox], new Vector3(1, -1, 0));
    this.registerEquipment('FP-MOTOR', [fpMotor, fpPump, fpPipe], new Vector3(2, -1, 0));
  }

  /**
   * Builds the Electrical Riser, Cable Trays, and Conduits
   */
  private buildCableFeedersAndRiser() {
    const floorHeight = 2.8;

    // 1. Vertical Riser Shaft / Tray Ladder
    const riserMat = this.createMaterial('mat_riser', new Color3(0.4, 0.45, 0.5));
    const riserHeight = 7 * floorHeight + 2.5;
    const riserLadder = MeshBuilder.CreateBox('RISER_ladder', { width: 1.2, height: riserHeight, depth: 0.4 }, this.scene);
    riserLadder.position = new Vector3(-2.5, riserHeight / 2 - 2.5, -0.2);
    riserLadder.material = riserMat;
    this.registerEquipment('RISER', [riserLadder], new Vector3(-0.5, 3.5 * 2.2, 0));

    // 2. High Voltage (13.8 kV) Cable Route (Utility -> METER -> HV-01 -> T1)
    const hvCableMat = this.createMaterial('mat_cable_HV', new Color3(0.95, 0.2, 0.2));
    const hvLine = MeshBuilder.CreateTube('cable_HV', {
      path: [
        new Vector3(-12.0, 0.3, -2.5),
        new Vector3(-10.2, 0.3, -2.5),
        new Vector3(-8.5, 0.3, -2.5),
        new Vector3(-5.5, 0.3, -2.5),
        new Vector3(-5.5, 1.8, -3.0)
      ],
      radius: 0.08
    }, this.scene);
    hvLine.material = hvCableMat;
    this.cableMeshes.set('HV', [hvLine]);

    // 3. Main LV Busduct / Conductor Route (T1 Secondary -> MDB-A Q0)
    const lvMainMat = this.createMaterial('mat_cable_LVMain', new Color3(0.2, 0.75, 0.95));
    const mainBusRoute = MeshBuilder.CreateTube('cable_MainBus', {
      path: [
        new Vector3(-5.0, 1.8, -3.0),
        new Vector3(-5.0, 2.3, -3.0),
        new Vector3(-2.4, 2.3, -3.0),
        new Vector3(-2.4, 1.6, -2.5)
      ],
      radius: 0.12
    }, this.scene);
    mainBusRoute.material = lvMainMat;
    this.cableMeshes.set('MAIN', [mainBusRoute]);

    // 4. Dedicated Fire Pump Route (ahead of Q0 directly to FP-ATS in Basement)
    const fireCableMat = this.createMaterial('mat_cable_FIRE', new Color3(0.9, 0.1, 0.1));
    const fireRoute = MeshBuilder.CreateTube('cable_FireTakeoff', {
      path: [
        new Vector3(-4.8, 1.8, -2.9), // T1 secondary stabs
        new Vector3(-4.8, 0.2, -2.9),
        new Vector3(0.5, 0.2, -2.9),
        new Vector3(0.5, -2.0, -1.5),
        new Vector3(2.5, -2.0, -1.5)
      ],
      radius: 0.07
    }, this.scene);
    fireRoute.material = fireCableMat;
    this.cableMeshes.set('FIRE', [fireRoute]);

    // 5. APFC Feeder Route (MDB-A -> QC -> C1)
    const apfcCableMat = this.createMaterial('mat_cable_APFC', new Color3(0.1, 0.85, 0.45));
    const apfcRoute = MeshBuilder.CreateTube('cable_APFC', {
      path: [
        new Vector3(-0.5, 1.9, -2.5),
        new Vector3(1.1, 1.9, -2.5),
        new Vector3(1.5, 1.4, -2.5)
      ],
      radius: 0.08
    }, this.scene);
    apfcRoute.material = apfcCableMat;
    this.cableMeshes.set('APFC', [apfcRoute]);

    // 6. Floor Feeder Branches (MDB-A -> Riser -> Each Floor Panel F1 to F6)
    for (let f = 1; f <= 6; f++) {
      const targetY = f * floorHeight + 1.2;
      const feederMat = this.createMaterial(`mat_feeder_F${f}`, new Color3(0.15, 0.65, 0.9));
      const branchTube = MeshBuilder.CreateTube(`cable_feeder_F${f}`, {
        path: [
          new Vector3(-1.5, 2.0, -2.5),
          new Vector3(-2.5, 2.0, -0.2), // In riser
          new Vector3(-2.5, targetY, -0.2),
          new Vector3(-2.5, targetY, 0.5) // Floor panel
        ],
        radius: 0.045
      }, this.scene);
      branchTube.material = feederMat;
      this.cableMeshes.set(`F${f}`, [branchTube]);
    }

    // 7. EDB Feeder Route (MDB-A -> ATS-E -> EDB on Level 2)
    const edbFeederMat = this.createMaterial('mat_feeder_EDB', new Color3(0.65, 0.4, 0.95));
    const edbTube = MeshBuilder.CreateTube('cable_feeder_EDB', {
      path: [
        new Vector3(-1.0, 1.8, -2.5),
        new Vector3(4.0, 1.8, -2.5), // to ATS-E
        new Vector3(4.0, 2 * floorHeight + 1.2, -1.5),
        new Vector3(-4.5, 2 * floorHeight + 1.2, -1.5)
      ],
      radius: 0.05
    }, this.scene);
    edbTube.material = edbFeederMat;
    this.cableMeshes.set('EDB', [edbTube]);

    // 8. Generator Feeder Route (GEN-1 -> QG -> ATS-E & FP-ATS)
    const genCableMat = this.createMaterial('mat_cable_GEN', new Color3(0.95, 0.65, 0.15));
    const genTube = MeshBuilder.CreateTube('cable_GEN_emergency', {
      path: [
        new Vector3(8.5, 1.0, -2.5),
        new Vector3(6.9, 1.0, -1.9),
        new Vector3(4.0, 1.0, -2.5), // Into ATS-E
        new Vector3(2.5, -1.8, -1.5)  // Down to FP-ATS
      ],
      radius: 0.075
    }, this.scene);
    genTube.material = genCableMat;
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

  private createMaterial(name: string, diffuse: Color3): StandardMaterial {
    const mat = new StandardMaterial(name, this.scene);
    mat.diffuseColor = diffuse;
    mat.specularColor = new Color3(0.2, 0.2, 0.2);
    return mat;
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
            mat.emissiveColor = new Color3(0.4, 0.2, 0.7); // Purple glow
          } else {
            mat.emissiveColor = new Color3(0, 0, 0);
          }
        }
      });
    });
  }

  /**
   * Updates view options dynamically from React state
   */
  public updateViewOptions(options: ViewOptions3D) {
    this.currentOptions = options;

    // Shell mode & opacity
    const glassMat = this.scene.getMaterialByName('glassShellMat') as StandardMaterial;
    if (glassMat) {
      glassMat.alpha = options.shellOpacity;
    }

    const frontWall = this.scene.getMeshByName('frontWall');
    if (frontWall) {
      frontWall.isVisible = options.shellMode === 'normal';
    }

    this.shellMeshes.forEach((mesh) => {
      if (mesh.name !== 'frontWall') {
        mesh.isVisible = options.shellMode !== 'hidden';
      }
    });

    // Exploded view animation
    this.updateExplodedOffset(options.explodedOffset);

    // Category visibility toggles
    this.setCategoryVisibility('HV-01', options.showHV);
    this.setCategoryVisibility('METER', options.showHV);
    this.setCategoryVisibility('T1', options.showTransformer);
    this.setCategoryVisibility('MDB-A', options.showLV);
    this.setCategoryVisibility('Q0', options.showLV);
    this.setCategoryVisibility('C1', options.showAPFC);
    this.setCategoryVisibility('QC', options.showAPFC);
    this.setCategoryVisibility('GEN-1', options.showEmergency);
    this.setCategoryVisibility('QG', options.showEmergency);
    this.setCategoryVisibility('ATS-E', options.showEmergency);
    this.setCategoryVisibility('FP-ATS', options.showEmergency);
    this.setCategoryVisibility('FP-MOTOR', options.showEmergency);

    for (let f = 1; f <= 6; f++) {
      this.setCategoryVisibility(`P-F${f}`, options.showFeeders);
      const feederCables = this.cableMeshes.get(`F${f}`);
      if (feederCables) {
        feederCables.forEach((c) => (c.isVisible = options.showFeeders));
      }
    }

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
    // Smoothly shift positions based on exploded factor (0 = assembled, 1 = fully exploded)
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
   * Preset Camera Positions
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
        targetRadius = 14;
        targetLook = new Vector3(-2, 1.2, -2.5);
        break;
      case 'riser':
        targetAlpha = -Math.PI / 1.8;
        targetBeta = Math.PI / 2.4;
        targetRadius = 22;
        targetLook = new Vector3(-2.5, 9.0, 0);
        break;
      case 'retail':
        targetAlpha = -Math.PI / 3;
        targetBeta = Math.PI / 2.6;
        targetRadius = 18;
        targetLook = new Vector3(0, 3.5, 0);
        break;
      case 'office':
        targetAlpha = -Math.PI / 3;
        targetBeta = Math.PI / 2.6;
        targetRadius = 22;
        targetLook = new Vector3(0, 12.0, 0);
        break;
      case 'roof':
        targetAlpha = -Math.PI / 4;
        targetBeta = Math.PI / 4.5;
        targetRadius = 16;
        targetLook = new Vector3(0, 20.0, 0);
        break;
      case 'basement':
        targetAlpha = -Math.PI / 3;
        targetBeta = Math.PI / 2.5;
        targetRadius = 14;
        targetLook = new Vector3(4, -1.5, 0);
        break;
    }

    Animation.CreateAndStartAnimation('camAlpha', this.camera, 'alpha', 30, 20, this.camera.alpha, targetAlpha);
    Animation.CreateAndStartAnimation('camBeta', this.camera, 'beta', 30, 20, this.camera.beta, targetBeta);
    Animation.CreateAndStartAnimation('camRadius', this.camera, 'radius', 30, 20, this.camera.radius, targetRadius);
    Animation.CreateAndStartAnimation('camTarget', this.camera, 'target', 30, 20, this.camera.target, targetLook);
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
