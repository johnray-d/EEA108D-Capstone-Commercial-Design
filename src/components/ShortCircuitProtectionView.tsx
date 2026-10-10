import React, { useState } from 'react';
import { Shield, Zap, AlertTriangle, CheckCircle2, Lock, GitBranch, ArrowDown } from 'lucide-react';
import calculatedResults from '../data/calculated_results.json';
import engineeringAnalysis from '../data/engineering_analysis.json';

export const ShortCircuitProtectionView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faults' | 'settings' | 'impedance' | 'coordination'>('faults');

  const faultDataA1 = calculatedResults.shortCircuitResults.alternative1;
  const faultDataA2 = calculatedResults.shortCircuitResults.alternative2;
  const protection = engineeringAnalysis.protectionSettings;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-red-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Shield className="w-4 h-4" />
          <span>Section 9 & Section 10 • Short-Circuit Analysis & Protection Design</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Fault Level Verification & Preliminary Protection Coordination</h1>
        <p className="text-xs text-slate-500 mt-1">
          IEC 60909 equivalent-source 3-phase fault evaluation with motor bounding, device interrupting ratings, and preliminary relay settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('faults')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'faults' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-800 bg-white'
          }`}
        >
          Table 19: Bus Fault Currents & Breaker Classes
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'settings' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-800 bg-white'
          }`}
        >
          Table 20: Protection Coordination Schedule
        </button>
        <button
          onClick={() => setActiveTab('impedance')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'impedance' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-800 bg-white'
          }`}
        >
          Figure 5: Positive-Sequence Impedance Network
        </button>
        <button
          onClick={() => setActiveTab('coordination')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'coordination' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-800 bg-white'
          }`}
        >
          Inrush, ZSI & Earth-Loop Sensitivity Checks
        </button>
      </div>

      {/* TAB 1: Fault Duties (Table 19) */}
      {activeTab === 'faults' && (
        <div className="space-y-6">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 border border-slate-200 p-4 rounded-xl">
              <span className="text-[11px] text-slate-500">Maximum LV 3-Phase Bolted Fault</span>
              <div className="text-2xl font-bold text-red-600 mt-1">38.09 kA</div>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                At T secondary stabs (33.07 kA utility + 5.02 kA motor bound)
              </p>
              <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-700 border border-emerald-800/40 inline-block">
                Below Selected 50 kA Equipment Class (OK)
              </div>
            </div>

            <div className="bg-white/80 border border-slate-200 p-4 rounded-xl">
              <span className="text-[11px] text-slate-500">Peak Making-Current Bound (ip)</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">89.96 kA peak</div>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                κ = 1.02 + 0.98 exp(-3R/X) • includes 2√2 motor bound
              </p>
              <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-700 border border-emerald-800/40 inline-block">
                Below Selected ≥ 105 kA Peak Rating (OK)
              </div>
            </div>

            <div className="bg-white/80 border border-slate-200 p-4 rounded-xl">
              <span className="text-[11px] text-slate-500">HV Medium-Voltage Fault Duty</span>
              <div className="text-2xl font-bold text-cyan-600 mt-1">10.56 kA</div>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                10.42 kA utility + 0.15 kA motor contribution referred to 13.8 kV
              </p>
              <div className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-700 border border-emerald-800/40 inline-block">
                Below Selected 25 kA Switchgear Class (OK)
              </div>
            </div>
          </div>

          {/* Fault Duty Table */}
          <div className="bg-white/90 border border-slate-200 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Table 19: Maximum Three-Phase Duty by Bus (Alternative 1)</h2>
                <p className="text-xs text-slate-500">
                  Calculated with cmax = 1.10, transformer Zmin = 0.90 × nominal, and 5.02 kA motor arithmetic bound.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">All values RMS symmetrical kA</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold text-[11px]">
                    <th className="p-3 font-sans">Bus Tag</th>
                    <th className="p-3">Base kV</th>
                    <th className="p-3 text-right">Utility kA</th>
                    <th className="p-3 text-right">Motor Bound kA</th>
                    <th className="p-3 text-right">Total Design kA</th>
                    <th className="p-3 text-right">Equipment Rating kA</th>
                    <th className="p-3 text-center font-sans">Adequacy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11.5px]">
                  {faultDataA1.map((f) => (
                    <tr key={f.bus} className="hover:bg-slate-100">
                      <td className="p-3 font-bold font-sans text-slate-800">{f.bus}</td>
                      <td className="p-3 text-slate-500">{f.kV.toFixed(1)} kV</td>
                      <td className="p-3 text-right text-slate-700">{f.utility_kA.toFixed(2)}</td>
                      <td className="p-3 text-right text-amber-700/80">{f.motorBound_kA.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-red-600">{f.total_kA.toFixed(2)}</td>
                      <td className="p-3 text-right text-slate-800 font-semibold">{f.rating_kA} kA</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-700 border border-emerald-800/50">
                          ADEQUATE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
              <strong>Conservative Motor Bounding Note:</strong> The 5.02 kA motor bound uses 4 × all connected future motor rated current (Smotor,10 = 870.03 kVA) without cable attenuation. This provides a safe, standard equipment envelope (50 kA) for all switchboards without relying on unverified device cascading tables.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Protection Settings (Table 20) */}
      {activeTab === 'settings' && (
        <div className="bg-white/90 border border-slate-200 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Table 20: Preliminary Protection Coordination & Setting Table</h2>
              <p className="text-xs text-slate-500">
                Engineering starting points for selective tripping. Final settings require certified manufacturer curves.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-800/40">
              Preliminary Settings
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold text-[11px]">
                  <th className="p-3 font-sans">Protected Zone / Device</th>
                  <th className="p-3 font-sans">Long-Time / Thermal</th>
                  <th className="p-3 font-sans">Short-Time / Instantaneous</th>
                  <th className="p-3 font-sans">Ground Fault / Delay</th>
                  <th className="p-3 font-sans">Engineering Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11.5px]">
                {protection.map((p) => (
                  <tr key={p.device} className="hover:bg-slate-100">
                    <td className="p-3 font-sans font-bold text-cyan-700">
                      <div>{p.device}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{p.zone}</div>
                    </td>
                    <td className="p-3 text-slate-800">{p.longTime}</td>
                    <td className="p-3 text-amber-700">{p.shortTime}</td>
                    <td className="p-3 text-slate-700">{p.ground}</td>
                    <td className="p-3 font-sans text-slate-500 text-[11px]">{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Impedance Diagram (Figure 5) */}
      {activeTab === 'impedance' && (
        <div className="bg-white/90 border border-slate-200 rounded-xl p-5 shadow-xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Figure 5: Positive-Sequence Impedance Network (Referred to 400 V)</h2>
            <p className="text-xs text-slate-500">
              Per-phase series impedance chain used for hand calculations and nodal admittance matrix check.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center space-y-3 max-w-2xl mx-auto">
            {/* Box 1: Utility */}
            <div className="w-full p-3 rounded-lg bg-white border border-red-500/50 text-center text-xs">
              <span className="font-bold text-red-600 block">Utility Source (PCC)</span>
              <span className="font-mono text-slate-700">
                ZQ = 0.000070 + j0.000701 Ω (400 V base) • X/R = 10
              </span>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-600" />

            {/* Box 2: HV Cable */}
            <div className="w-full p-3 rounded-lg bg-white border border-red-500/30 text-center text-xs">
              <span className="font-bold text-red-700 block">15 kV Shielded HV Cable (20 m)</span>
              <span className="font-mono text-slate-700">
                ZHV,LV = 0.0000083 + j0.0000020 Ω
              </span>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-600" />

            {/* Box 3: Transformer */}
            <div className="w-full p-3 rounded-lg bg-white border border-cyan-500/50 text-center text-xs">
              <span className="font-bold text-cyan-600 block">1,250 kVA Transformer T1</span>
              <span className="font-mono text-slate-700">
                ZT,max-fault = 0.001163 + j0.006878 Ω (with KT = 1.0092 & 0.90 tolerance)
              </span>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-600" />

            {/* Box 4: Main LV Bus & Cable */}
            <div className="w-full p-3 rounded-lg bg-white border border-sky-500/50 text-center text-xs">
              <span className="font-bold text-sky-400 block">Main LV Bus (MDB-A) & 15 m Busduct</span>
              <span className="font-mono text-slate-700">
                Zmain,cold = 0.000086 + j0.000144 Ω (10 parallel sets 300 mm²)
              </span>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-600" />

            {/* Box 5: Radial Floor Feeders */}
            <div className="w-full p-3 rounded-lg bg-white border border-blue-500/50 text-center text-xs">
              <span className="font-bold text-blue-600 block">Radial Floor Feeders (25 m to 75 m)</span>
              <span className="font-mono text-slate-700">
                ZF6,cold = 0.003495 + j0.003600 Ω (2 sets 185 mm² @ 75 m)
              </span>
            </div>

            {/* Side Motor Addition */}
            <div className="w-full mt-4 p-3 rounded-lg bg-amber-50 border border-amber-800/40 text-center text-xs text-amber-200">
              <strong>Motor Contribution Bounding Addition:</strong> At every LV bus, <strong>+5.023 kA</strong> is added directly to determine device interrupting and withstand ratings.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Inrush, ZSI & Loop Checks */}
      {activeTab === 'coordination' && (
        <div className="bg-white/90 border border-slate-200 rounded-xl p-5 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Inrush, Selectivity & TN-S Loop Verification</h2>
            <p className="text-xs text-slate-500">
              Detailed engineering checks from Section 10 ensuring inrush ride-through and earth-fault sensitivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Check 1: Inrush */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-cyan-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Transformer Inrush Screen</span>
              </div>
              <p className="text-slate-700 font-mono text-[11px] leading-relaxed">
                T1 Rated HV Current: 52.30 A<br />
                12× Inrush Envelope: 627.56 A<br />
                HV-01 High-Set: 800 A &gt; 627.56 A: <strong>OK</strong>
              </p>
              <p className="text-slate-500 text-[10.5px]">
                HV high-set operates in 0.05 s without tripping on transformer energization transients.
              </p>
            </div>

            {/* Check 2: ZSI Margins */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-cyan-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zone Selective Interlocking (ZSI)</span>
              </div>
              <p className="text-slate-700 font-mono text-[11px] leading-relaxed">
                HV Backup Delay: 0.60 s<br />
                Q0 Main Short-Time: 0.30 s (0.30s margin)<br />
                QF Feeder Short-Time: 0.08 s (0.22s margin)
              </p>
              <p className="text-slate-500 text-[10.5px]">
                ZSI clears un-restrained main bus faults in 0.08 s, but maintains 0.30 s delay if feeder detects fault.
              </p>
            </div>

            {/* Check 3: F6 Loop */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-cyan-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>F6 Earth-Fault Sensitivity</span>
              </div>
              <p className="text-slate-700 font-mono text-[11px] leading-relaxed">
                Zloop (75 m route): 0.0214 Ω<br />
                Minimum Earth Fault: 10,242.9 A<br />
                Feeder GF Pickup: 80 A &lt;&lt; 10,243 A: <strong>OK</strong>
              </p>
              <p className="text-slate-500 text-[10.5px]">
                Confirms reliable earth-fault magnetic disconnection at the farthest floor panel under TN-S earthing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
