import React, { useState } from 'react';
import { DollarSign, Scale, AlertOctagon, CheckCircle2, FileSpreadsheet, ShieldAlert, Layers } from 'lucide-react';
import engineeringAnalysis from '../data/engineering_analysis.json';

export const DesignAlternativesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'n1-shed' | 'bom' | 'lifecycle'>('comparison');

  const comp = engineeringAnalysis.technicalEconomicComparison;
  const bom = engineeringAnalysis.billOfMaterials;
  const lifecycle = engineeringAnalysis.lifeCycleAnalysis;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Scale className="w-4 h-4" />
          <span>Section 13 & Section 14 • Design Alternatives & Technical-Economic Evaluation</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Alternative 1 (1 × 1,250 kVA) vs. Alternative 2 (2 × 800 kVA)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Rigorous engineering and economic comparison covering N-1 contingency limits, common-mode utility exposure, and full 20-year life-cycle costs.
        </p>
      </div>

      {/* Transparent Budget Target Disclosure Banner */}
      <div className="bg-red-950/20 border border-red-800/50 rounded-xl p-4 flex items-start gap-3 text-xs">
        <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-red-300">
            Budget Feasibility Status: NOT OK Against Soft Planning Target (PHP 25,000,000)
          </p>
          <p className="text-slate-300 leading-relaxed">
            Both design alternatives exceed the owner’s assumed PHP 25M soft budget envelope:
            <strong> Alternative 1 exceeds by PHP 3,980,670 (+15.9%)</strong>, while
            <strong> Alternative 2 exceeds by PHP 8,953,667 (+35.8%)</strong>.
            This gap is stated transparently in the capstone report. Technical safety, derated 200% neutral sizing, and 50 kA equipment fault classes are preserved rather than deleting protective gear to meet budget.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'comparison' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
          }`}
        >
          Table 26: Side-by-Side Comparison
        </button>
        <button
          onClick={() => setActiveTab('n1-shed')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'n1-shed' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
          }`}
        >
          Figure 8 & Task 7: Alternative 2 N-1 Load Shedding
        </button>
        <button
          onClick={() => setActiveTab('bom')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'bom' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
          }`}
        >
          Tables 27-29: Bill of Materials & Cost Breakdown
        </button>
        <button
          onClick={() => setActiveTab('lifecycle')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'lifecycle' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
          }`}
        >
          Table 30: 20-Year Life-Cycle PV & Decision Matrix
        </button>
      </div>

      {/* TAB 1: Side-by-Side Table 26 */}
      {activeTab === 'comparison' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Table 26: Governing Design-Alternative Comparison</h2>
              <p className="text-xs text-slate-400">
                Evaluation across capital cost, capacity, loading, fault duty, and outage continuity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Alternative 1 Selected (Score: 4.05/5)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[11px]">
                  <th className="p-3">Evaluation Criterion</th>
                  <th className="p-3 text-cyan-300">Alternative 1 (1 × 1,250 kVA)</th>
                  <th className="p-3 text-amber-300">Alternative 2 (2 × 800 kVA Split)</th>
                  <th className="p-3 text-slate-400">Engineering Trade-Off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11.5px]">
                {comp.criteria.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-200">{item.criterion}</td>
                    <td className="p-3 font-mono text-cyan-300/90">{item.a1}</td>
                    <td className="p-3 font-mono text-amber-300/90">{item.a2}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{item.advantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: N-1 Load Shedding Analysis */}
      {activeTab === 'n1-shed' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Alternative 2: N-1 Limitation & Mandatory 45% Load Shedding</span>
            </h2>
            <p className="text-xs text-slate-400">
              Analysis of transformer outage behavior under full 10-year commercial load.
            </p>
          </div>

          {/* Overload Alert Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-950/20 border border-red-800/50 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                <AlertOctagon className="w-4 h-4" />
                <span>Full Load on Surviving Unit: 131.11% Overload (NOT OK)</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                If Transformer TB suffers an outage and tie breaker QT closes without load shedding, the entire 10-year load (1,018.74 kW / 540.82 kVAr) collapses onto the single surviving 800 kVA transformer TA. Winding current reaches <strong>131.11% of rated capacity</strong>, leading to immediate thermal damage or trip.
              </p>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-800/50 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Mandatory Action: Retain 55%, Shed 45% (OK)</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                The control logic sheds 45% of normal non-essential load before closing tie QT. Retained 55% demand (560.31 kW) brings surviving transformer loading to <strong>70.89% (74.63% with harmonic allowance: OK)</strong>. Minimum voltage remains 397.65 V (&gt; 380 V: OK).
              </p>
            </div>
          </div>

          {/* Common-Mode Failure Point Callout */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>Common-Mode Utility Feeder Limitation</span>
            </h4>
            <p className="leading-relaxed">
              Crucially, Alternative 2 does <strong>not</strong> provide utility grid redundancy. Both 800 kVA transformers connect to the <em>same single 13.8 kV utility radial feeder</em>. A utility fault, line trip, or upstream outage interrupts power to both units simultaneously. Therefore, the additional PHP 4.97M investment in Alternative 2 only protects against internal transformer failure, not grid outages.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: BOM and Cost Breakdown (Tables 27-29) */}
      {activeTab === 'bom' && (
        <div className="space-y-6">
          {/* Cost Comparison Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 border border-cyan-800/60 p-4 rounded-xl font-mono text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-sans font-bold text-cyan-400 text-sm">Alternative 1 Budget</span>
                <span className="font-bold text-white text-sm">PHP 28,980,670</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Materials Base:</span>
                <span>PHP 21,913,550.00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Installation (+15%):</span>
                <span>PHP 3,287,032.50</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Contingency (+15%):</span>
                <span>PHP 3,780,087.38</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold border-t border-slate-800 pt-1">
                <span>Variance vs. Target:</span>
                <span>+PHP 3,980,670 (+15.9%)</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl font-mono text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-sans font-bold text-amber-400 text-sm">Alternative 2 Budget</span>
                <span className="font-bold text-white text-sm">PHP 33,953,667</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Materials Base:</span>
                <span>PHP 25,673,850.00</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Installation (+15%):</span>
                <span>PHP 3,851,077.50</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Contingency (+15%):</span>
                <span>PHP 4,428,739.12</span>
              </div>
              <div className="flex justify-between text-red-400 font-bold border-t border-slate-800 pt-1">
                <span>Variance vs. Target:</span>
                <span>+PHP 8,953,667 (+35.8%)</span>
              </div>
            </div>
          </div>

          {/* Common Bill of Materials Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Table 27: Calculated Common Bill of Materials (Shared by Both Alternatives)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[11px]">
                    <th className="p-2.5 font-sans">Tag</th>
                    <th className="p-2.5 font-sans">Description</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Unit Price (PHP)</th>
                    <th className="p-2.5 text-right">Total Amount (PHP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11.5px]">
                  {bom.common.map((item) => (
                    <tr key={item.tag} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-cyan-300">{item.tag}</td>
                      <td className="p-2.5 font-sans text-slate-300">{item.description}</td>
                      <td className="p-2.5 text-right text-slate-200">{item.qty.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-slate-400">{item.unit_PHP.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-semibold text-slate-100">{item.amount_PHP.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 20-Year Life-Cycle PV & Decision Matrix (Table 30) */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-6">
          {/* Life Cycle PV Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2 text-xs font-mono">
              <span className="font-sans font-bold text-cyan-400 text-sm">Alternative 1: 20-Year Life-Cycle Cost</span>
              <div className="text-xl font-bold text-white mt-1">PHP 37,054,042</div>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Annual Core + Load Losses:</span>
                <span className="text-slate-200">50,262.9 kWh/yr (PHP 603,155)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Annual Maintenance (1%):</span>
                <span className="text-slate-200">PHP 219,136 / yr</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>PV Factor (8% real, 20 yrs):</span>
                <span className="text-slate-200">9.818147</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2 text-xs font-mono">
              <span className="font-sans font-bold text-amber-400 text-sm">Alternative 2: 20-Year Life-Cycle Cost</span>
              <div className="text-xl font-bold text-white mt-1">PHP 42,877,192</div>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Annual Core + Load Losses:</span>
                <span className="text-slate-200">54,345.2 kWh/yr (PHP 652,142)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Annual Maintenance (1%):</span>
                <span className="text-slate-200">PHP 256,739 / yr</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>PV Difference:</span>
                <span className="text-red-400">+PHP 5,823,150 (+15.7%)</span>
              </div>
            </div>
          </div>

          {/* Table 30: Weighted Decision Matrix */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Table 30: Multi-Criteria Weighted Decision Matrix (5 is Best)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[11px]">
                    <th className="p-3 font-sans">Evaluation Criterion</th>
                    <th className="p-3 text-center">Weight</th>
                    <th className="p-3 text-center">A1 Score</th>
                    <th className="p-3 text-center">A2 Score</th>
                    <th className="p-3 text-right">A1 Weighted</th>
                    <th className="p-3 text-right">A2 Weighted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11.5px]">
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-medium text-slate-200">Capital Cost</td>
                    <td className="p-3 text-center">35%</td>
                    <td className="p-3 text-center text-cyan-300">5</td>
                    <td className="p-3 text-center text-amber-300">3</td>
                    <td className="p-3 text-right text-cyan-300 font-bold">1.75</td>
                    <td className="p-3 text-right text-amber-300">1.05</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-medium text-slate-200">Normal Capacity and Voltage</td>
                    <td className="p-3 text-center">20%</td>
                    <td className="p-3 text-center text-cyan-300">4</td>
                    <td className="p-3 text-center text-amber-300">5</td>
                    <td className="p-3 text-right text-cyan-300">0.80</td>
                    <td className="p-3 text-right text-amber-300 font-bold">1.00</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-medium text-slate-200">Transformer Outage Continuity</td>
                    <td className="p-3 text-center">15%</td>
                    <td className="p-3 text-center text-cyan-300">2</td>
                    <td className="p-3 text-center text-amber-300">4</td>
                    <td className="p-3 text-right text-cyan-300">0.30</td>
                    <td className="p-3 text-right text-amber-300 font-bold">0.60</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-medium text-slate-200">Operation and Maintenance</td>
                    <td className="p-3 text-center">15%</td>
                    <td className="p-3 text-center text-cyan-300">5</td>
                    <td className="p-3 text-center text-amber-300">3</td>
                    <td className="p-3 text-right text-cyan-300 font-bold">0.75</td>
                    <td className="p-3 text-right text-amber-300">0.45</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-medium text-slate-200">Expansion Flexibility</td>
                    <td className="p-3 text-center">15%</td>
                    <td className="p-3 text-center text-cyan-300">3</td>
                    <td className="p-3 text-center text-amber-300">5</td>
                    <td className="p-3 text-right text-cyan-300">0.45</td>
                    <td className="p-3 text-right text-amber-300 font-bold">0.75</td>
                  </tr>
                  <tr className="bg-slate-950 font-bold text-white border-t-2 border-slate-700">
                    <td className="p-3 font-sans">TOTAL WEIGHTED SCORE</td>
                    <td className="p-3 text-center">100%</td>
                    <td className="p-3 text-center text-cyan-300">-</td>
                    <td className="p-3 text-center text-amber-300">-</td>
                    <td className="p-3 text-right text-emerald-400 text-sm">4.05 / 5.00</td>
                    <td className="p-3 text-right text-amber-400 text-sm">3.85 / 5.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
