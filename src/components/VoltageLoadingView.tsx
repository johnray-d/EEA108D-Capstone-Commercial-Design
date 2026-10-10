import React, { useState } from 'react';
import { Activity, Zap, CheckCircle2, AlertTriangle, ArrowRight, Table, Layers } from 'lucide-react';
import calculatedResults from '../data/calculated_results.json';

export const VoltageLoadingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'solver-table' | 'feeder-loading' | 'hand-vs-sim'>('profile');

  const comparison = calculatedResults.voltageComparison;

  // Buses for Figure 4 chart
  const busProfileData = [
    { bus: 'TA', v: 391.77, pu: 0.9794 },
    { bus: 'MDB-A', v: 391.39, pu: 0.9785 },
    { bus: 'F1', v: 390.52, pu: 0.9763 },
    { bus: 'F2', v: 390.17, pu: 0.9754 },
    { bus: 'F3', v: 389.91, pu: 0.9748 },
    { bus: 'F4', v: 389.58, pu: 0.9740 },
    { bus: 'F5', v: 389.25, pu: 0.9731 },
    { bus: 'F6', v: 388.92, pu: 0.9723 },
    { bus: 'EDB', v: 390.67, pu: 0.9767 },
    { bus: 'MDP', v: 389.09, pu: 0.9727 }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Activity className="w-4 h-4" />
          <span>Section 8 • Task 4 • Voltage-Drop & Equipment Loading Analysis</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Voltage Profiles, Bus Regulation & Feeder Loading</h1>
        <p className="text-xs text-slate-400 mt-1">
          Verification of 0.95 - 1.05 pu load voltage compliance, ≤ 3% feeder drop allowance, and thermal conductor ampacities.
        </p>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'profile' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
          }`}
        >
          Figure 4: Voltage Profile (Low Utility)
        </button>
        <button
          onClick={() => setActiveTab('solver-table')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'solver-table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
          }`}
        >
          Table 16: Multi-Scenario Bus Voltages
        </button>
        <button
          onClick={() => setActiveTab('feeder-loading')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'feeder-loading' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
          }`}
        >
          Table 17 & 35: Feeder Loading & Drops
        </button>
        <button
          onClick={() => setActiveTab('hand-vs-sim')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'hand-vs-sim' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
          }`}
        >
          Table 36: Hand Calc vs. Python Solver Check
        </button>
      </div>

      {/* TAB 1: Voltage Profile Chart (Figure 4) */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Voltage Profile: Year 10 Low-Utility Supply (0.975 pu)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Figure 4 (E-10): All busbars remain above the 0.95 pu limit (380 V) after 1% branch circuit reserve.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-cyan-500 rounded-sm" />
                <span>Bus Voltage (pu)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-red-500 border border-red-500 border-dashed" />
                <span className="text-red-400">Min Load Limit (0.950 pu = 380 V)</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Representation of Figure 4 */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
            <div className="relative h-64 flex items-end justify-between gap-3 pt-6 pb-2">
              {/* 0.95 pu Threshold Line */}
              <div
                className="absolute left-0 right-0 border-b-2 border-red-500 border-dashed z-10 flex items-center justify-end pr-2"
                style={{ bottom: '25%' }}
              >
                <span className="bg-red-950/80 text-red-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-red-800">
                  0.950 pu (380.0 V Limit)
                </span>
              </div>

              {/* Individual Bus Bars */}
              {busProfileData.map((b) => {
                // Scale from 0.94 pu to 1.00 pu for high visual resolution
                const minScale = 0.94;
                const maxScale = 0.99;
                const heightPct = Math.max(0, Math.min(100, ((b.pu - minScale) / (maxScale - minScale)) * 100));

                return (
                  <div key={b.bus} className="flex-1 flex flex-col items-center h-full justify-end group z-20">
                    <span className="text-[10px] font-mono text-cyan-300 mb-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {b.v.toFixed(1)} V ({b.pu.toFixed(4)} pu)
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-cyan-900 to-cyan-500 rounded-t transition-all group-hover:from-cyan-700 group-hover:to-cyan-400"
                      style={{ height: `${heightPct}%` }}
                    />
                    <div className="text-center mt-2">
                      <span className="text-[11px] font-mono font-bold text-slate-200 block">{b.bus}</span>
                      <span className="text-[9.5px] font-mono text-slate-400 block">{b.v.toFixed(1)}V</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3 mt-4 space-y-1">
              <p>
                <strong>Critical Observation on Farthest Bus F6:</strong> At 75 m route distance, F6 solved voltage is <strong>388.92 V (0.9723 pu)</strong>. Subtracting the assumed 1% (4.0 V) downstream branch circuit wiring allowance yields <strong>384.92 V (0.9623 pu)</strong> at the tenant equipment terminals, safely maintaining the required 380 V threshold.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Table 16 Bus Voltages Across Scenarios */}
      {activeTab === 'solver-table' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Table 16: Independent Solver Bus Voltages</h2>
              <p className="text-xs text-slate-400">
                Phase-domain simulation results under different utility and APFC states.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">All voltages Line-to-Line (VLL)</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[11px]">
                  <th className="p-3 font-sans">Bus Tag</th>
                  <th className="p-3 text-right">Present No APFC (V)</th>
                  <th className="p-3 text-right">Present Corrected (V)</th>
                  <th className="p-3 text-right">Year 10 Corrected (V)</th>
                  <th className="p-3 text-right">Year 10 Low Utility (V)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11.5px]">
                {[
                  { bus: 'TA', v0_no: 398.84, v0_corr: 404.13, v10_corr: 402.14, v10_low: 391.77 },
                  { bus: 'MDB-A', v0_no: 398.46, v0_corr: 403.86, v10_corr: 401.77, v10_low: 391.39 },
                  { bus: 'F1 (Retail)', v0_no: 397.82, v0_corr: 403.23, v10_corr: 400.92, v10_low: 390.52 },
                  { bus: 'F2 (Retail)', v0_no: 397.57, v0_corr: 402.97, v10_corr: 400.57, v10_low: 390.17 },
                  { bus: 'F3 (Office)', v0_no: 397.38, v0_corr: 402.79, v10_corr: 400.32, v10_low: 389.91 },
                  { bus: 'F4 (Office)', v0_no: 397.14, v0_corr: 402.55, v10_corr: 400.00, v10_low: 389.58 },
                  { bus: 'F5 (Office)', v0_no: 396.90, v0_corr: 402.31, v10_corr: 399.68, v10_low: 389.25 },
                  { bus: 'F6 (Farthest)', v0_no: 396.66, v0_corr: 402.07, v10_corr: 399.36, v10_low: 388.92 },
                  { bus: 'EDB (Life Safety)', v0_no: 397.93, v0_corr: 403.33, v10_corr: 401.06, v10_low: 390.67 },
                  { bus: 'MDP (Pumps)', v0_no: 396.79, v0_corr: 402.20, v10_corr: 399.53, v10_low: 389.09 },
                  { bus: 'FIRE (Fire Pump)', v0_no: 398.84, v0_corr: 404.13, v10_corr: 402.14, v10_low: 391.77 }
                ].map((row) => (
                  <tr key={row.bus} className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-bold text-slate-200">{row.bus}</td>
                    <td className="p-3 text-right text-slate-400">{row.v0_no.toFixed(2)}</td>
                    <td className="p-3 text-right text-cyan-300 font-semibold">{row.v0_corr.toFixed(2)}</td>
                    <td className="p-3 text-right text-emerald-400 font-semibold">{row.v10_corr.toFixed(2)}</td>
                    <td className={`p-3 text-right font-bold ${row.v10_low < 390 ? 'text-amber-400' : 'text-slate-200'}`}>
                      {row.v10_low.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <strong>Tap Boost Justification:</strong> In an initial trial without the 1.025 equivalent tap boost and without APFC, the Year 10 panel voltage fell to 381.20 V, leaving only 377.20 V after branch reserve (below 380 V: NOT OK). The 1.025 tap and 400 kVAr APFC maintain proper voltages above 380 V in all evaluated conditions.
          </div>
        </div>
      )}

      {/* TAB 3: Table 17 & 35 Feeder Loading and Voltage Drop */}
      {activeTab === 'feeder-loading' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Table 17 & 35: Cable Routes, Voltage Drops and Ampacity</h2>
            <span className="text-xs font-mono text-emerald-400">Criteria: Feeder ΔV ≤ 3%, Total Wiring ≤ 5%</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[11px]">
                  <th className="p-2.5 font-sans">Tag</th>
                  <th className="p-2.5">Route (m)</th>
                  <th className="p-2.5">R (Ω)</th>
                  <th className="p-2.5">X (Ω)</th>
                  <th className="p-2.5 text-right">Drop Y0 %</th>
                  <th className="p-2.5 text-right">Drop Y10 %</th>
                  <th className="p-2.5 text-right">Load Y0 %</th>
                  <th className="p-2.5 text-right">Load Y10 %</th>
                  <th className="p-2.5 text-center font-sans">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11.5px]">
                {[
                  { tag: 'F1', m: 25, r: 0.001601, x: 0.001200, dy0: 0.159, dy10: 0.213, ly0: 44.98, ly10: 60.79 },
                  { tag: 'F2', m: 35, r: 0.002242, x: 0.001680, dy0: 0.222, dy10: 0.299, ly0: 45.01, ly10: 60.85 },
                  { tag: 'F3', m: 45, r: 0.002882, x: 0.002160, dy0: 0.269, dy10: 0.361, ly0: 42.37, ly10: 57.29 },
                  { tag: 'F4', m: 55, r: 0.003523, x: 0.002640, dy0: 0.328, dy10: 0.441, ly0: 42.39, ly10: 57.33 },
                  { tag: 'F5', m: 65, r: 0.004164, x: 0.003120, dy0: 0.388, dy10: 0.522, ly0: 42.42, ly10: 57.38 },
                  { tag: 'F6', m: 75, r: 0.004804, x: 0.003600, dy0: 0.448, dy10: 0.602, ly0: 42.44, ly10: 57.42 },
                  { tag: 'EDB', m: 30, r: 0.002370, x: 0.001440, dy0: 0.132, dy10: 0.177, ly0: 31.15, ly10: 42.10 },
                  { tag: 'MDP', m: 60, r: 0.014968, x: 0.005760, dy0: 0.416, dy10: 0.559, ly0: 45.98, ly10: 62.20 }
                ].map((row) => (
                  <tr key={row.tag} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold font-sans text-cyan-300">{row.tag}</td>
                    <td className="p-2.5 text-slate-300">{row.m} m</td>
                    <td className="p-2.5 text-slate-400">{row.r.toFixed(6)}</td>
                    <td className="p-2.5 text-slate-400">{row.x.toFixed(6)}</td>
                    <td className="p-2.5 text-right text-slate-300">{row.dy0.toFixed(3)}%</td>
                    <td className="p-2.5 text-right text-cyan-300 font-semibold">{row.dy10.toFixed(3)}%</td>
                    <td className="p-2.5 text-right text-slate-300">{row.ly0.toFixed(2)}%</td>
                    <td className="p-2.5 text-right text-emerald-400 font-semibold">{row.ly10.toFixed(2)}%</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                        PASS
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Table 36 Hand Calculation vs Simulation Validation */}
      {activeTab === 'hand-vs-sim' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Table 36: Calculated Hand Voltage vs. Simulation Solver</h2>
              <p className="text-xs text-slate-400">
                Validation of hand equation against iterative backward/forward load-flow solver.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Maximum difference: ~0.12%</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[11px]">
                  <th className="p-2.5 font-sans">Bus</th>
                  <th className="p-2.5 text-right">Hand Calculated (V)</th>
                  <th className="p-2.5 text-right">Simulated Solver (V)</th>
                  <th className="p-2.5 text-right">Difference %</th>
                  <th className="p-2.5 font-sans">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11.5px]">
                {comparison.map((item) => (
                  <tr key={item.bus} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold font-sans text-cyan-300">{item.bus}</td>
                    <td className="p-2.5 text-right text-slate-300">{item.handCalculated_V.toFixed(4)}</td>
                    <td className="p-2.5 text-right text-emerald-400 font-semibold">{item.simulated_V.toFixed(4)}</td>
                    <td className="p-2.5 text-right text-amber-300">{item.diffPct.toFixed(4)}%</td>
                    <td className="p-2.5 font-sans text-slate-400 text-[11px]">{item.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-cyan-300">Why the 0.12% difference occurs:</p>
            <p className="text-slate-400 leading-relaxed text-[11.5px]">
              The hand formula assumes a fixed 400 V base current: ΔV = (P·R + Q·X) / 400. In contrast, the numerical solver runs iterative backward/forward sweeps where constant-power loads draw slightly higher current when bus voltage drops below nominal, and capacitor reactive injection varies quadratically with |V|². The ~0.12% difference perfectly confirms numerical convergence and correct physical behavior.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
