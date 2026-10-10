import React from 'react';
import { SlidersHorizontal, AlertTriangle, CheckCircle2, Zap, Shield, Flame } from 'lucide-react';
import calculatedResults from '../data/calculated_results.json';
import { ScenarioId } from '../types/powerSystem';

interface ScenarioBarProps {
  activeScenarioId: ScenarioId;
  onSelectScenario: (id: ScenarioId) => void;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  activeScenarioId,
  onSelectScenario
}) => {
  const currentScenario = calculatedResults.scenarios[activeScenarioId] || calculatedResults.scenarios['A1_Y10_corrected'];

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
      {/* Left: Scenario Selector Dropdown & Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
          <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
          <span>Case / Scenario:</span>
        </div>

        <select
          value={activeScenarioId}
          onChange={(e) => onSelectScenario(e.target.value as ScenarioId)}
          className="bg-slate-50 border border-slate-300 text-cyan-900 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-xs hover:border-slate-400 transition"
        >
          <optgroup label="Alternative 1: Single 1,250 kVA Transformer">
            <option value="A1_Y10_corrected">A1 - Year 10 Corrected (Recommended Baseline)</option>
            <option value="A1_Y10_low_utility">A1 - Year 10 Low Utility (0.975 pu Source)</option>
            <option value="A1_Y10_low_fire">A1 - Year 10 Low Utility + Fire Pump Duty</option>
            <option value="A1_Y10_uncorrected">A1 - Year 10 Uncorrected (APFC Off - Critical)</option>
            <option value="A1_Y0_corrected">A1 - Year 0 Corrected (Commissioning Peak)</option>
            <option value="A1_Y0_uncorrected">A1 - Year 0 Uncorrected (Commissioning APFC Off)</option>
          </optgroup>
          <optgroup label="Alternative 2: Two 800 kVA Transformers (Split-Bus)">
            <option value="A2_Y10_corrected">A2 - Year 10 Corrected (Split Busbars)</option>
            <option value="A2_Y10_N1_shed">A2 - Transformer N-1 Outage (45% Load Shed)</option>
          </optgroup>
          <optgroup label="Emergency Standby System">
            <option value="GEN_essential">GEN-1 - Island Essential Operation (Utility Lost)</option>
          </optgroup>
        </select>

        {/* Operating status pill */}
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          APFC: <strong className={currentScenario.apfcState === 'AUTO' ? 'text-emerald-700' : 'text-slate-600'}>{currentScenario.apfcState} ({currentScenario.switchedSteps} steps / {currentScenario.switchedKVAr} kVAr)</strong>
        </span>

        {currentScenario.firePumpRunning && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-600" />
            <span>Fire Pump Active (41.1 kW)</span>
          </span>
        )}
      </div>

      {/* Right: Key Solved Parameters */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-500">PCC S: </span>
          <span className="text-slate-900 font-bold">{currentScenario.pcc.kVA.toFixed(1)} kVA</span>
        </div>
        <div>
          <span className="text-slate-500">PCC PF: </span>
          <span className={`font-bold ${currentScenario.pcc.displacementPF >= 0.97 ? 'text-emerald-700' : 'text-amber-700'}`}>
            {currentScenario.pcc.displacementPF.toFixed(4)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">T Loading: </span>
          <span className={`font-bold ${((currentScenario as any).transformer?.loading_pct ?? (currentScenario as any).generator?.kVALoading_pct ?? 0) > 90 ? 'text-red-700' : 'text-cyan-700'}`}>
            {((currentScenario as any).transformer?.loading_pct ?? (currentScenario as any).generator?.kVALoading_pct ?? 0).toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-slate-500">Min Bus: </span>
          <span className={`font-bold ${currentScenario.minVoltage.voltage_V < 388 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {currentScenario.minVoltage.bus} ({currentScenario.minVoltage.voltage_V.toFixed(1)} V)
          </span>
        </div>
      </div>
    </div>
  );
};
