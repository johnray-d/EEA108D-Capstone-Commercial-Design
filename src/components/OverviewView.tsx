import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, Activity, Zap, FileText, CheckCircle2, Layers } from 'lucide-react';
import designInputs from '../data/design_inputs.json';
import calculatedResults from '../data/calculated_results.json';
import { NavView, ScenarioId } from '../types/powerSystem';

interface OverviewViewProps {
  onNavigate: (view: NavView) => void;
  onSelectScenario: (scenarioId: ScenarioId) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate, onSelectScenario }) => {
  const a1Results = calculatedResults.scenarios['A1_Y10_corrected'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title & Course Header */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {designInputs.project.course}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                {designInputs.project.group}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                {designInputs.project.revision} • {designInputs.project.date}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {designInputs.project.title}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              {designInputs.project.institution} • Team: {designInputs.project.authors.join(', ')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('3d-view')}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-600/30 transition"
            >
              <Layers className="w-4 h-4" />
              <span>Launch 3D Visualizer</span>
            </button>
            <button
              onClick={() => onNavigate('sld')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition"
            >
              <Zap className="w-4 h-4" />
              <span>View SLD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Status Banner & Cautions */}
      <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-4 flex items-start gap-3 text-amber-200/90 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300">
            Design Status: Academic Engineering Evaluation using Assumed Utility & Equipment Data
          </p>
          <p className="text-slate-300 leading-relaxed">
            All numerical results originate from the stated design brief and the delivered independent Python solver. Protection settings are preliminary engineering starting points. Manufacturer time-current curves, site utility impedance certificates, and approved submittals are commissioning inputs. No professional seal or construction approval is represented.
          </p>
        </div>
      </div>

      {/* Key System Ratings Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Utility Intake</span>
            <span className="font-mono text-cyan-400">13.8 kV</span>
          </div>
          <div className="text-xl font-bold text-white">1 Radial Feeder</div>
          <p className="text-[11px] text-slate-400 mt-1">250 MVA initial fault level • X/R = 10</p>
          <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 inline-block">
            Selected Switchgear: 17.5 kV / 25 kA
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Recommended Transformer</span>
            <span className="font-mono text-emerald-400">Alt 1</span>
          </div>
          <div className="text-xl font-bold text-white">1,250 kVA</div>
          <p className="text-[11px] text-slate-400 mt-1">Dyn11 • 13.8 kV / 400 V • 6.0% Z</p>
          <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 inline-block">
            Year 10 Loading: 83.12% (Normal)
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Low-Voltage Distribution</span>
            <span className="font-mono text-cyan-400">400/230 V</span>
          </div>
          <div className="text-xl font-bold text-white">2,500 A Bus</div>
          <p className="text-[11px] text-slate-400 mt-1">Q0: 2500 AF / 2200 AT • 50 kA class</p>
          <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 inline-block">
            200% Neutral Area (Floors/EDB/Main)
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Emergency Standby</span>
            <span className="font-mono text-amber-400">Essential</span>
          </div>
          <div className="text-xl font-bold text-white">400 kVA / 320 kW</div>
          <p className="text-[11px] text-slate-400 mt-1">Dedicated Fire Pump + Essentials Only</p>
          <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 inline-block">
            No Utility Parallel Operation
          </div>
        </div>
      </div>

      {/* System Power Path Architecture */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <span>Electrical Power Flow Architecture</span>
        </h2>
        <p className="text-slate-300 text-xs leading-relaxed">
          The distribution topology maintains rigorous separation between normal utility and emergency paths, and isolates the life-safety fire pump ahead of the main building breaker:
        </p>

        {/* Path Flow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-red-900/40 relative">
            <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase">Stage 1: MV Intake</span>
            <h4 className="font-bold text-slate-100 text-xs mt-1">Utility 13.8 kV</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              CT/VT revenue meter + 17.5 kV / 25 kA vacuum circuit breaker (HV-01) with visible isolation.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-cyan-900/40 relative">
            <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">Stage 2: Transformation</span>
            <h4 className="font-bold text-slate-100 text-xs mt-1">1,250 kVA Dyn11</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Step-down to 400/230 V. Delta primary blocks zero-sequence harmonics. 1.025 no-load tap boost.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-blue-900/40 relative">
            <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">Stage 3: Main LV Board</span>
            <h4 className="font-bold text-slate-100 text-xs mt-1">2,500 A MDB-A</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Main breaker Q0 (2500 AF/2200 AT, 50 kA). 10 parallel sets 300 mm² Cu, 200% neutral.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-emerald-900/40 relative">
            <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Stage 4: Power Factor</span>
            <h4 className="font-bold text-slate-100 text-xs mt-1">400 kVAr Detuned APFC</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              16 × 25 kVAr steps with 7% detuned reactors (226.8 Hz). Target 0.97 PCC displacement PF.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-indigo-900/40 relative">
            <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">Stage 5: Radial Feeders</span>
            <h4 className="font-bold text-slate-100 text-xs mt-1">Floors & Area Panels</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              F1-F6 (400 A), EDB (320 A), MDP (125 A), and dedicated fire takeoff (200 A) ahead of Q0.
            </p>
          </div>
        </div>

        {/* Dedicated Fire Takeoff & Generator Callout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-red-950/20 border border-red-800/40 p-3.5 rounded-lg text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-red-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Dedicated Fire-Pump Connection Ahead of Main Breaker</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Matching the capstone report and fire code (NFPA 20 / PEC), the fire-pump circuit (37 kW motor) connects directly ahead of the Q0 main breaker. It is protected by a listed 200 A controller/ATS with locked-rotor protection and ground-fault alarm only (no trip), preventing general building trips from shutting down emergency fire pumps.
            </p>
          </div>

          <div className="bg-amber-950/20 border border-amber-800/40 p-3.5 rounded-lg text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Zap className="w-4 h-4" />
              <span>Isolated Standby Generator (No Parallel Operation)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              The 400 kVA generator feeds only essential loads (fire pump, 1 elevator, 1 water pump, IT/UPS, and life safety) via open-transition four-pole transfer switches (ATS-E & FP-ATS). Normal retail and office floors are shed. Four-pole switching maintains isolated source grounding and prevents circulating neutral currents.
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Design vs Alternative 2 Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Alternative Evaluation Summary</h2>
          <button
            onClick={() => onNavigate('alternatives-econ')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Full Economic Comparison</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-slate-950/80 border border-cyan-800/50 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400 text-sm">Alternative 1: 1 × 1,250 kVA (Recommended)</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold">Score: 4.05 / 5.0</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Single radial transformer providing simple operation and lowest capital cost (PHP 28.98M). Fully satisfies all ten-year normal load growth and voltage criteria (83.12% loading at nominal utility).
            </p>
            <div className="space-y-1 text-slate-400 border-t border-slate-800 pt-2">
              <div className="flex justify-between"><span>Estimated Capital Cost:</span> <span className="font-mono text-slate-200">PHP 28,980,670</span></div>
              <div className="flex justify-between"><span>Budget Variance (vs PHP 25M target):</span> <span className="font-mono text-amber-400">+PHP 3.98M (+15.9%)</span></div>
              <div className="flex justify-between"><span>20-Year Life-Cycle Present Value:</span> <span className="font-mono text-slate-200">PHP 37,054,042</span></div>
              <div className="flex justify-between"><span>Transformer N-1 Capability:</span> <span className="text-amber-400">None (Generator essentials only)</span></div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-sm">Alternative 2: 2 × 800 kVA (Split-Bus)</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Score: 3.85 / 5.0</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Provides partial normal continuity during transformer maintenance via interlocked bus tie. However, carrying full Year 10 load on one 800 kVA unit causes severe overload (131.11%), requiring 45% load shedding before tie closure.
            </p>
            <div className="space-y-1 text-slate-400 border-t border-slate-800 pt-2">
              <div className="flex justify-between"><span>Estimated Capital Cost:</span> <span className="font-mono text-slate-200">PHP 33,953,667</span></div>
              <div className="flex justify-between"><span>Budget Variance (vs PHP 25M target):</span> <span className="font-mono text-red-400">+PHP 8.95M (+35.8%)</span></div>
              <div className="flex justify-between"><span>20-Year Life-Cycle Present Value:</span> <span className="font-mono text-slate-200">PHP 42,877,192</span></div>
              <div className="flex justify-between"><span>Common-Mode Vulnerability:</span> <span className="text-slate-300">Still shares single utility feeder</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
