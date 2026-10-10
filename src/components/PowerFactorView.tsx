import React, { useState } from 'react';
import { Zap, AlertTriangle, ShieldCheck, TrendingUp, Info, HelpCircle } from 'lucide-react';
import designInputs from '../data/design_inputs.json';
import engineeringAnalysis from '../data/engineering_analysis.json';

export const PowerFactorView: React.FC = () => {
  const [selectedKvarStep, setSelectedKvarStep] = useState<number>(250);

  const apfc = designInputs.apfc;
  const payback = engineeringAnalysis.apfcPayback;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Zap className="w-4 h-4" />
          <span>Section 12 • Task 8 • Power Factor Correction & Commercial Loads</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Power Factor Correction, 7% Detuning & Honest Economics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Evaluation of 400 kVAr automatic detuned capacitor bank (16 × 25 kVAr steps), harmonic resonance margins, and life-cycle financial payback.
        </p>
      </div>

      {/* Honest Payback Caution Banner */}
      <div className="bg-amber-50 border border-amber-800/50 rounded-xl p-4 flex items-start gap-3 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-700">
            Design Finding: No Positive Energy-Only Payback at Present Load
          </p>
          <p className="text-slate-700 leading-relaxed">
            The capstone study finds <strong>no credible present electricity-bill payback</strong> for the APFC bank. Under the assumed tariff (PHP 12/kWh), internal reactor and capacitor real losses (5 W/kVAr = 6,433 kWh/year) exceed the upstream I²R cable and transformer savings (5,258 kWh/year), producing a net loss of <strong>-PHP 16,377.69/year</strong> at commissioning. At Year 10, the simple payback is <strong>116.67 years</strong>. The installation is justified strictly by <strong>transformer thermal capacity release (96.95 kVA now / 139.36 kVA future), voltage boost, and Philippine Distribution Code PF compliance (≥ 0.85/0.90 minimum)</strong>, not energy cost savings.
          </p>
        </div>
      </div>

      {/* Power Triangles (Figure 7 & Calculations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Power Triangle Diagram */}
        <div className="bg-white/90 border border-slate-200 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Interactive Power Triangles (Figure 7)</span>
            </h3>
            <span className="text-[11px] font-mono text-cyan-600">P = 758.04 kW</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-center">
            <svg viewBox="0 0 500 320" className="w-full max-w-md h-auto">
              <defs>
                <marker id="arrow-pf" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
              </defs>

              {/* Baseline Horizontal Active Power (P) */}
              <line x1="50" y1="260" x2="420" y2="260" stroke="#38bdf8" strokeWidth="3" />
              <text x="235" y="285" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">
                P = 758.04 kW (Active Power Base)
              </text>

              {/* Uncorrected Hypotenuse (S1) */}
              <line x1="50" y1="260" x2="420" y2="60" stroke="#94a3b8" strokeWidth="2.5" />
              <text x="180" y="140" fill="#cbd5e1" fontSize="11" fontWeight="bold">
                S1 = 858.23 kVA (PF1 = 0.8833)
              </text>

              {/* Uncorrected Vertical Reactive Power (Q1) */}
              <line x1="420" y1="260" x2="420" y2="60" stroke="#f87171" strokeWidth="2.5" />
              <text x="430" y="160" fill="#f87171" fontSize="11" fontWeight="bold">
                Q1 = 402.42 kVAr
              </text>

              {/* Switched APFC Injection (Qc) */}
              <line x1="420" y1="60" x2="420" y2="165" stroke="#10b981" strokeWidth="4" markerEnd="url(#arrow-pf)" />
              <text x="430" y="115" fill="#34d399" fontSize="11" fontWeight="bold">
                Qc = 212.44 kVAr (Load-Only)
              </text>

              {/* Corrected Hypotenuse (S2) */}
              <line x1="50" y1="260" x2="420" y2="165" stroke="#10b981" strokeWidth="3" strokeDasharray="5 3" />
              <text x="220" y="210" fill="#34d399" fontSize="11" fontWeight="bold">
                S2 = 781.48 kVA (PF2 = 0.9700)
              </text>

              {/* Residual Q2 */}
              <text x="430" y="220" fill="#94a3b8" fontSize="10">
                Q2 = 189.98 kVAr
              </text>

              {/* Angle arcs */}
              <path d="M 120 260 A 70 70 0 0 0 112 225" fill="none" stroke="#f87171" strokeWidth="1.5" />
              <text x="125" y="240" fill="#f87171" fontSize="9">φ1 = 27.96°</text>

              <path d="M 170 260 A 120 120 0 0 0 162 235" fill="none" stroke="#10b981" strokeWidth="1.5" />
              <text x="175" y="250" fill="#10b981" fontSize="9">φ2 = 14.07°</text>
            </svg>
          </div>

          <div className="text-[11px] text-slate-500 mt-3 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p>
              <strong>Transformer Inductive VARs:</strong> Load-only sizing (212.4 kVAr) is insufficient because the 1,250 kVA transformer consumes up to 51 kVAr internally. The solver selects <strong>250 kVAr at Year 0</strong> and <strong>350 kVAr at Year 10</strong> to achieve 0.97 displacement PF at the 13.8 kV PCC revenue meter.
            </p>
          </div>
        </div>

        {/* Detuned Reactor & Resonance Screen */}
        <div className="bg-white/90 border border-slate-200 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>7% Series Detuned Reactor Tuning (Table 23)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Capacitor branches include iron-core series reactors (p = 7%) to prevent resonance with nonlinear loads.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Tuning Frequency (fr)</span>
              <span className="text-emerald-600 font-bold text-sm">226.78 Hz</span>
              <span className="text-[9.5px] text-slate-500 block">Harmonic Order: 3.78</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Capacitor Voltage Rating</span>
              <span className="text-cyan-600 font-bold text-sm">480 V Class</span>
              <span className="text-[9.5px] text-slate-500 block">Operating: 430.1 V @ 400 V</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Nameplate Rating @ 480V</span>
              <span className="text-slate-800 font-bold text-sm">535.68 kVAr</span>
              <span className="text-[9.5px] text-slate-500 block">Supplies 400 kVAr Net @ 400V</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Per 25 kVAr Delta Step</span>
              <span className="text-slate-800 font-bold text-sm">128.48 µF / 3.83 mH</span>
              <span className="text-[9.5px] text-slate-500 block">63 A gG Step Fuse</span>
            </div>
          </div>

          {/* Bare-Capacitor Resonance Screen Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-[11px] font-mono">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="p-2">Switched kVAr</th>
                  <th className="p-2">Ssc MVA</th>
                  <th className="p-2">Bare hr</th>
                  <th className="p-2">Harmonic Risk Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {engineeringAnalysis.resonanceScreen.slice(4).map((row) => (
                  <tr key={row.switchedKVAr} className="hover:bg-slate-100">
                    <td className="p-2 font-bold text-white">{row.switchedKVAr} kVAr</td>
                    <td className="p-2 text-slate-500">{row.sscMVA}</td>
                    <td className="p-2 text-cyan-700 font-bold">{row.hr.toFixed(2)}</td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        row.status.includes('Review') ? 'bg-red-50 text-red-700 border border-red-800/50' : 'text-slate-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-900/40 text-[11px] text-indigo-200/90">
            <div className="flex items-center gap-1 font-semibold text-indigo-700 mb-0.5">
              <Info className="w-3.5 h-3.5" />
              <span>Feeder Scope Reminder</span>
            </div>
            Central APFC connected at the 400 V main bus reduces transformer winding and utility line current. It does <strong>not</strong> eliminate reactive current circulating inside the radial floor feeders (F1 to F6).
          </div>
        </div>
      </div>

      {/* Financial Payback & Capacity Benefits (Table 24) */}
      <div className="bg-white/90 border border-slate-200 rounded-xl p-5 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-600" />
          <span>Before vs. After APFC Benefits and Payback Ledger (Table 24)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Year 0 Commissioning Baseline */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-sans font-bold text-slate-800">Year 0 Commissioning Balance</span>
              <span className="text-amber-600 font-bold">Negative Financial Payback</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Upstream I²R Loss Saving:</span>
              <span className="text-emerald-600 font-bold">+1.366 kW (5,258 kWh/yr)</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>APFC Bank Internal Losses (5 W/kVAr):</span>
              <span className="text-red-600">-6,433 kWh/yr</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>APFC Feeder Cable Loss:</span>
              <span className="text-red-600">-189 kWh/yr</span>
            </div>
            <div className="flex justify-between text-slate-800 border-t border-slate-200 pt-1 font-bold">
              <span>Net Annual Energy Balance:</span>
              <span className="text-red-600">-1,364.81 kWh/year</span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span>Net Annual Value (@ PHP 12/kWh):</span>
              <span className="text-red-600">-PHP 16,377.69 / year</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200 font-sans">
              <span>Capacity Released Now:</span>
              <span className="font-mono text-cyan-700 font-bold">+96.95 kVA</span>
            </div>
          </div>

          {/* Year 10 Future Demand Balance */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-sans font-bold text-slate-800">Year 10 Operation Balance</span>
              <span className="text-cyan-600 font-bold">116.67 Years Payback</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Upstream I²R Loss Saving:</span>
              <span className="text-emerald-600 font-bold">+2.668 kW (10,266 kWh/yr)</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>APFC Bank Internal Losses (350 kVAr):</span>
              <span className="text-red-600">-9,006 kWh/yr</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>APFC Feeder Cable Loss:</span>
              <span className="text-red-600">-363 kWh/yr</span>
            </div>
            <div className="flex justify-between text-slate-800 border-t border-slate-200 pt-1 font-bold">
              <span>Net Annual Energy Balance:</span>
              <span className="text-emerald-600">+897.41 kWh/year</span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span>Net Annual Value (@ PHP 12/kWh):</span>
              <span className="text-emerald-600">+PHP 10,768.88 / year</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200 font-sans">
              <span>Capacity Released at Year 10:</span>
              <span className="font-mono text-cyan-700 font-bold">+139.36 kVA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
