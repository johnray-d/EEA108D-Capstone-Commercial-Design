import React from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import results from '../data/calculated_results.json';
import { ScenarioId } from '../types/powerSystem';

export const ScenarioBar: React.FC<{ activeScenarioId: ScenarioId; onSelectScenario: (id: ScenarioId) => void }> = ({ activeScenarioId, onSelectScenario }) => {
  const scenario = results.scenarios[activeScenarioId];
  const generator = activeScenarioId === 'GEN_essential';
  const loading = 'transformer' in scenario ? scenario.transformer.loading_pct : 'generator' in scenario ? scenario.generator.kVALoading_pct : 0;
  return <section className="scenario-bar" aria-label="Engineering scenario">
    <div className="scenario-picker"><div className="scenario-symbol"><SlidersHorizontal size={17} /></div><label><span>OPERATING SCENARIO</span><select aria-label="Operating scenario" value={activeScenarioId} onChange={e => onSelectScenario(e.target.value as ScenarioId)}>
      <optgroup label="A1 · Single 1,250 kVA transformer"><option value="A1_Y10_corrected">Year 10 · Corrected baseline</option><option value="A1_Y10_low_utility">Year 10 · Low utility voltage</option><option value="A1_Y10_low_fire">Year 10 · Low utility + fire duty</option><option value="A1_Y10_uncorrected">Year 10 · APFC unavailable</option><option value="A1_Y0_corrected">Year 0 · Corrected</option><option value="A1_Y0_uncorrected">Year 0 · Uncorrected</option></optgroup>
      <optgroup label="A2 · Two 800 kVA transformers"><option value="A2_Y10_corrected">A2 · Year 10 corrected</option><option value="A2_Y10_N1_shed">A2 · N−1 with load shedding</option></optgroup><optgroup label="Essential standby"><option value="GEN_essential">Generator · Essential island</option></optgroup>
    </select></label><ChevronDown size={13} /></div>
    <div className="scenario-metrics"><div><span>PCC DEMAND</span><strong>{scenario.pcc.kVA.toLocaleString(undefined, { maximumFractionDigits: 1 })}<small>kVA</small></strong></div><div><span>POWER FACTOR</span><strong className={scenario.pcc.displacementPF >= 0.97 ? 'metric-good' : 'metric-caution'}>{scenario.pcc.displacementPF.toFixed(3)}</strong></div><div><span>{generator ? 'GENERATOR' : 'TRANSFORMER'}</span><strong>{loading.toFixed(1)}<small>% load</small></strong></div><div className="metric-voltage"><span>MIN. BUS VOLTAGE</span><strong>{scenario.minVoltage.voltage_V.toFixed(1)}<small>V</small></strong></div></div>
    <div className={`apfc-status ${scenario.apfcState === 'AUTO' ? 'auto' : ''}`}><span className="live-dot" /><div>APFC {scenario.apfcState}<small>{scenario.switchedKVAr} kVAr switched</small></div></div>
  </section>;
};
