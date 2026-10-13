export type NavView =
  | 'overview'
  | '3d-view'
  | 'sld'
  | 'load-demand'
  | 'pfc'
  | 'voltage-loading'
  | 'fault-protection'
  | 'alternatives-econ'
  | 'assumptions-files';

export type ScenarioId =
  | 'A1_Y0_uncorrected'
  | 'A1_Y0_corrected'
  | 'A1_Y10_uncorrected'
  | 'A1_Y10_corrected'
  | 'A1_Y10_low_utility'
  | 'A1_Y10_low_fire'
  | 'A2_Y10_corrected'
  | 'A2_Y10_N1_shed'
  | 'GEN_essential';

export interface EquipmentDetail {
  id: string;
  tag: string;
  name: string;
  category: 'utility' | 'transformer' | 'lv-switchgear' | 'feeder' | 'panel' | 'apfc' | 'emergency' | 'fire' | 'load';
  voltageLevel: '13.8 kV' | '400 V' | '230 V';
  floorLevel?: string;
  rating: string;
  selectedDesign: string;
  assumedInput: string;
  calculatedResult: string;
  reportSection: string;
  protectionSetting?: string;
  whyThisMatters: string;
  formulaNote?: string;
  colorHex: string;
}

export interface ScenarioData {
  id: ScenarioId;
  name: string;
  description: string;
  system: string;
  year: number;
  utilityVoltage_pu: number;
  apfcState: 'OFF' | 'AUTO' | 'BLOCKED';
  switchedSteps: number;
  switchedKVAr: number;
  firePumpRunning: boolean;
  pcc: {
    kW: number;
    kVAr: number;
    kVA: number;
    displacementPF: number;
    truePF: number;
  };
  transformer: {
    loading_pct: number;
    effectiveThermalLoading_pct?: number;
    losses_kW: number;
    status: string;
    ta_loading_pct?: number;
    tb_loading_pct?: number;
  };
  generator?: {
    rating_kVA: number;
    rating_kW: number;
    essentialDemand_kW: number;
    essentialDemand_kVAr: number;
    essentialDemand_kVA: number;
    kWLoading_pct: number;
    kVALoading_pct: number;
    voltage_V: number;
    status: string;
  };
  minVoltage: {
    bus: string;
    voltage_V: number;
    voltage_pu: number;
  };
  buses: Record<string, { V: number; angle_deg: number }>;
  branches?: Array<{
    name: string;
    current_A: number;
    kW_sent: number;
    kVAr_sent: number;
    loading_pct: number;
    loss_kW: number;
    loss_kVAr: number;
  }>;
  warnings: string[];
}

export interface ViewOptions3D {
  shellMode: 'normal' | 'cutaway' | 'wireframe' | 'hidden';
  shellOpacity: number;
  explodedOffset: number; // 0 to 1
  showHV: boolean;
  showTransformer: boolean;
  showLV: boolean;
  showFeeders: boolean;
  showEmergency: boolean;
  showLoads: boolean;
  showAPFC: boolean;
  showPowerPath: 'none' | 'normal' | 'emergency' | 'fire';
  targetEquipmentId?: string;
  animateFlow: boolean;
  lighting: 'day' | 'dusk';
  quality: 'balanced' | 'high';
  autoRotate: boolean;
  showLabels: boolean;
  isolatedFloor: number | null;
  apfcEnergized: boolean;
}
