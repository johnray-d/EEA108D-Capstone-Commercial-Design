import React, { useState } from 'react';
import { BarChart3, TrendingUp, Info, HelpCircle, Calculator, Zap, Clock } from 'lucide-react';
import designInputs from '../data/design_inputs.json';
import engineeringAnalysis from '../data/engineering_analysis.json';

export const LoadDemandView: React.FC = () => {
  const [interactiveGrowthRate, setInteractiveGrowthRate] = useState<number>(3.0);
  const [interactiveTargetYear, setInteractiveTargetYear] = useState<number>(10);

  // Simplified website calculation
  const baseP = designInputs.loadTotals.demandKW;
  const baseQ = designInputs.loadTotals.demandKVAr;
  const calcFactor = Math.pow(1 + interactiveGrowthRate / 100, interactiveTargetYear);
  const calcP = baseP * calcFactor;
  const calcQ = baseQ * calcFactor;
  const calcS = Math.sqrt(calcP * calcP + calcQ * calcQ);
  const calcPF = calcP / calcS;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 text-slate-100">
      {/* Page Title & Scope */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Zap className="w-4 h-4" />
          <span>Section 5 & Section 11 • Load Assessment & Operating Characteristics</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Load Schedule, Commercial Demand & 10-Year Growth</h1>
        <p className="text-xs text-slate-400 mt-1">
          Assessment of 12,000 m² mixed-use commercial facility (Floors 1-2 retail, Floors 3-6 office) based on utilization & coincidence factors.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400">Connected Installed Load</span>
          <div className="text-2xl font-bold text-white mt-1">1,047.56 kW</div>
          <span className="text-[10px] text-slate-400 font-mono">Includes 41.1 kW fire pump</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400">Coincident Normal Peak</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1">758.04 kW</div>
          <span className="text-[10px] text-slate-400 font-mono">402.42 kVAr • 858.23 kVA</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400">Initial Power Factor</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">0.8833 lag</div>
          <span className="text-[10px] text-slate-400 font-mono">Building Demand Factor: 0.7236</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400">Year-10 Normal Demand</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">1,018.74 kW</div>
          <span className="text-[10px] text-slate-400 font-mono">+34.39% growth (3%/yr over 10 yrs)</span>
        </div>
      </div>

      {/* Load Schedule Table (Table 4 & Table 9) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">Calculated Load Schedule (Table 4 & Table 9)</h2>
            <p className="text-xs text-slate-400">
              Coincidence method: Pdemand = Pconn × DF × CF; Qdemand = Pdemand × tan(arccos(PF))
            </p>
          </div>
          <div className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Source: Report Section 5, Table 9
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                <th className="p-3">Load Category</th>
                <th className="p-3">Quantity & Unit Rating</th>
                <th className="p-3">η</th>
                <th className="p-3">PF</th>
                <th className="p-3">DF</th>
                <th className="p-3">CF</th>
                <th className="p-3 text-right">Connected kW</th>
                <th className="p-3 text-right">Demand kW</th>
                <th className="p-3 text-right">Demand kVAr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11.5px]">
              {designInputs.loads.map((load) => (
                <tr key={load.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-sans font-medium text-slate-200">
                    <span className="font-mono text-cyan-400 font-bold mr-1.5">{load.id}</span>
                    <span>{load.name}</span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {load.qty} × {load.unitKW.toFixed(2)} kW
                  </td>
                  <td className="p-3 text-slate-400">{load.efficiency.toFixed(2)}</td>
                  <td className="p-3 text-slate-300">{load.pf.toFixed(2)}</td>
                  <td className="p-3 text-slate-300">{load.df.toFixed(2)}</td>
                  <td className="p-3 text-slate-300">{load.cf.toFixed(2)}</td>
                  <td className="p-3 text-right text-slate-200">{load.connectedKW.toFixed(2)}</td>
                  <td className="p-3 text-right font-bold text-cyan-400">{load.demandKW.toFixed(2)}</td>
                  <td className="p-3 text-right text-slate-300">{load.demandKVAr.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-slate-950/90 font-bold text-white border-t-2 border-slate-700">
                <td className="p-3 font-sans" colSpan={6}>TOTAL BUILDING AGGREGATE</td>
                <td className="p-3 text-right text-slate-200">1,047.56</td>
                <td className="p-3 text-right text-cyan-300">758.04</td>
                <td className="p-3 text-right text-slate-200">402.42</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
          <p>
            <strong>Note on Fire Pump:</strong> Electric fire pump normal demand factor is 0.00; normal coincident demand excludes fire pump. Fire emergency operates as a distinct calculation case adding 41.11 kW and 25.48 kVAr. Motor shaft ratings are divided by assumed efficiency (η = 0.90). VRF ratings are already electrical input. General receptacles exclude IT and tenant appliances.
          </p>
        </div>
      </div>

      {/* 24-Hour Commercial Daily Load Profile (Figure 1 & Table 7) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Assumed Commercial Daily Profile (Table 7 & Figure 1)</span>
            </h2>
            <p className="text-xs text-amber-300/90 font-medium">
              Assumed designer planning profile — not measured field telemetry.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-300">Load Factor: <strong className="text-cyan-400">0.5875</strong></span>
            <span className="text-slate-300">Loss Factor: <strong className="text-cyan-400">0.4394</strong></span>
            <span className="text-slate-300">HVAC Peak Share: <strong className="text-emerald-400">43.60%</strong></span>
          </div>
        </div>

        {/* Visual Bar Chart for 24 Hours */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-end justify-between h-48 gap-2 pt-6 pb-2">
            {designInputs.dailyProfile.map((item, idx) => {
              const kw = designInputs.loadTotals.demandKW * item.fraction;
              const heightPct = Math.round(item.fraction * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-mono text-cyan-300 opacity-0 group-hover:opacity-100 transition mb-1">
                    {kw.toFixed(0)} kW
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-cyan-900 to-cyan-500 rounded-t-md transition-all group-hover:from-cyan-700 group-hover:to-cyan-400"
                    style={{ height: `${heightPct}%` }}
                  />
                  <div className="text-center mt-2">
                    <span className="text-[10px] font-mono text-slate-300 block">{item.block}</span>
                    <span className="text-[9px] text-slate-500 font-mono">({(item.fraction * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3 mt-2">
            <span>Daily Energy: <strong className="text-slate-200">10,688.30 kWh/day</strong></span>
            <span>Annual Energy (365 days): <strong className="text-slate-200">3,901,230 kWh/year</strong></span>
            <span>Off-Peak Base Load: <strong className="text-slate-200">151.61 kW (20%)</strong></span>
          </div>
        </div>

        {/* Explanatory notes on HVAC and Non-Linear Characteristics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <h4 className="font-semibold text-cyan-400">HVAC Dominance (43.6%)</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              VRF outdoor units (330.48 kW coincident) represent 43.6% of peak demand, driving midday load spikes and significant reactive demand.
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <h4 className="font-semibold text-amber-400">Nonlinear Loads & Harmonics</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              LED drivers, IT server rectifiers, and VRF inverters produce substantial harmonic distortion. A 15% THDi current allowance and 200% neutral sizing are enforced.
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <h4 className="font-semibold text-indigo-400">24-Hour Continuous Base Load</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              IT/UPS rooms and building security generate a continuous 151.6 kW base load even during unoccupied overnight hours (00:00 - 06:00).
            </p>
          </div>
        </div>
      </div>

      {/* Ten-Year Growth Table (Table 10 & Table 21) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>10-Year Growth Projection & APFC Stepping (Table 10 & 21)</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Formula: Pn = P0 × (1 + 0.03)^n
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold font-mono text-[11px]">
                <th className="p-2.5">Year</th>
                <th className="p-2.5">Multiplier</th>
                <th className="p-2.5">Demand kW</th>
                <th className="p-2.5">Demand kVAr</th>
                <th className="p-2.5">Uncorrected kVA</th>
                <th className="p-2.5">Switched APFC</th>
                <th className="p-2.5">PCC PF</th>
                <th className="p-2.5">T1 Loading %</th>
                <th className="p-2.5">Min Panel pu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {engineeringAnalysis.tenYearGrowth.map((row) => (
                <tr key={row.year} className="hover:bg-slate-800/40 transition">
                  <td className="p-2.5 font-bold text-white">Year {row.year}</td>
                  <td className="p-2.5 text-slate-400">{row.factor.toFixed(6)}</td>
                  <td className="p-2.5 text-cyan-300 font-medium">{row.demandKW.toFixed(2)}</td>
                  <td className="p-2.5 text-slate-300">{row.demandKVAr.toFixed(2)}</td>
                  <td className="p-2.5 text-slate-300">{row.uncorrectedKVA.toFixed(2)}</td>
                  <td className="p-2.5 text-emerald-400 font-bold">{row.switchedKVAr} kVAr</td>
                  <td className="p-2.5 text-amber-300">{row.pccPF.toFixed(4)}</td>
                  <td className="p-2.5 text-slate-200">{row.t1LoadPct.toFixed(2)}%</td>
                  <td className="p-2.5 text-slate-400">{row.minPanelPu.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Growth Calculator (Website Calculation) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Interactive Growth Calculator</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
            Website Calculation • Simplified Model
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Test custom growth assumptions. Note: This calculator uses the report’s compound growth formula for screening; full nonlinear load-flow and voltage-dependent capacitor outputs require the delivered Python solver.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Annual Growth Rate (%):</span>
                <span className="font-mono text-cyan-400 font-bold">{interactiveGrowthRate}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="6.0"
                step="0.1"
                value={interactiveGrowthRate}
                onChange={(e) => setInteractiveGrowthRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Target Study Year:</span>
                <span className="font-mono text-cyan-400 font-bold">Year {interactiveTargetYear}</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={interactiveTargetYear}
                onChange={(e) => setInteractiveTargetYear(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Compounding Multiplier:</span>
              <span className="text-slate-200">{(calcFactor).toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Calculated Active Demand:</span>
              <span className="text-cyan-300 font-bold">{calcP.toFixed(2)} kW</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Calculated Reactive Demand:</span>
              <span className="text-slate-200">{calcQ.toFixed(2)} kVAr</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Uncorrected Apparent Power:</span>
              <span className="text-slate-200">{calcS.toFixed(2)} kVA</span>
            </div>
            <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
              <span>1,250 kVA Transformer Loading (Uncorrected):</span>
              <span className={`font-bold ${calcS / 1250 > 0.95 ? 'text-red-400' : 'text-emerald-400'}`}>
                {((calcS / 1250) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
