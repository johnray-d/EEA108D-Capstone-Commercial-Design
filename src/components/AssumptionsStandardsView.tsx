import React, { useState } from 'react';
import { BookOpen, FileText, Download, CheckCircle2, Shield, AlertTriangle, Database, Code } from 'lucide-react';
import designInputs from '../data/design_inputs.json';
import calculatedResults from '../data/calculated_results.json';
import engineeringAnalysis from '../data/engineering_analysis.json';

export const AssumptionsStandardsView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<'inputs' | 'results' | 'analysis'>('inputs');

  const standards = [
    { code: 'PEC 2017', desc: 'Philippine Electrical Code, Part 1, 2017', use: 'Local installation rules, conductor ampacity, continuous load factor (125%), overcurrent protection, and fire pump treatment.' },
    { code: 'PDC 2017', desc: 'Philippine Distribution Code, 2017 Edition', use: 'Connection requirements, revenue metering at 13.8 kV, power quality standards, and utility coordination.' },
    { code: 'IEEE Color Books', desc: 'IEEE Std 141, 242, 399', use: 'Commercial power distribution practice, protection coordination methodology, and system analysis.' },
    { code: 'IEC 60909', desc: 'Short-circuit currents in three-phase a.c. systems', use: 'Equivalent-voltage source calculation method, impedance network, and maximum/minimum study criteria.' },
    { code: 'IEC 60076 / IEEE C57', desc: 'Power Transformers', use: 'Transformer specification, Dyn11 vector connection, impedance, losses, and temperature rise.' },
    { code: 'IEC 60364', desc: 'Low-voltage electrical installations', use: 'Method-C 70°C cable thermal sizing, voltage drop limits, and TN-S earthing system.' },
    { code: 'Phil. Green Building Code', desc: 'DPWH Green Building Checklist / DOE DC2020-12-0026', use: 'Lighting power density benchmarks (10.8 W/m² office benchmark vs 10.0 W/m² designed) and energy efficiency.' }
  ];

  const closureActions = [
    { priority: 'Utility', action: 'Obtain actual maximum/minimum fault MVA, X/R ratio, high/low voltage limits, grounding rules, and CT/VT metering requirements from the distribution utility.' },
    { priority: 'Cables', action: 'Confirm PEC load/ampacity with manufacturer submittals, terminal temperature limits (75°C vs 90°C), tray grouping, and preserve equal parallel lengths.' },
    { priority: 'Transformer', action: 'Verify factory loss guarantees (P0, Pk), harmonic loss factor, actual tap ratios, %Z tolerance, and 87T/REF protection sensor compatibility.' },
    { priority: 'Protection', action: 'Obtain breaker TCC curves, I²t let-through data, ATS conditional short-circuit withstand, and generator decrement curves for selective coordination.' },
    { priority: 'Power Quality', action: 'Perform on-site harmonic spectrum measurements, THDi analysis, and detuned-bank frequency scan to verify anti-resonance performance.' },
    { priority: 'Life Safety', action: 'Validate listed fire-pump controller transfer sequence and generator motor-starting transient voltage acceleration with physical submittals.' },
    { priority: 'Budget', action: 'Authorize funding for the PHP 28.98M estimate or conduct value engineering without compromising protective ratings or neutral ampacity.' }
  ];

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-cyan-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Sections 4, 16, 17 & Appendices • Assumptions, Standards & Source Files</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Governing Codes, Closure Register & Verifiable Package Files</h1>
        <p className="text-xs text-slate-500 mt-1">
          Frozen design brief inputs, published regulatory references, commissioning action register, and downloadable model datasets.
        </p>
      </div>

      {/* PDF Report and Simulation Package Download Box */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-slate-300 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-bold text-slate-900">Attached Capstone Engineering Report (PDF)</h2>
          </div>
          <p className="text-xs text-slate-700 max-w-2xl leading-relaxed">
            Full 63-page report: "Design and Engineering Evaluation of the Electrical Power System of a Commercial Building" (Revision 0, 10 October 2026). Includes all mathematical derivations, single-line drawings, and simulation tables.
          </p>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 pt-1">
            <span>SHA-256 Checksum: 4af2946ec053642f...</span>
            <span>•</span>
            <span>File size: 2.5 MB</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`${import.meta.env.BASE_URL}Commercial_Building_Power_System_Design_Report.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition"
          >
            <Download className="w-4 h-4" />
            <span>Open / Download PDF</span>
          </a>
        </div>
      </div>

      {/* Standards Hierarchy (Table 8) */}
      <div className="bg-white/90 border border-slate-200 rounded-xl p-5 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-600" />
          <span>Table 8: Applicable Standards & Hierarchy of Use</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {standards.map((std) => (
            <div key={std.code} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-600">{std.code}</span>
                <span className="text-[10px] text-slate-500 font-mono">Reference Standard</span>
              </div>
              <h4 className="font-semibold text-slate-800 text-[11.5px]">{std.desc}</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed pt-1">{std.use}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Closure Actions Register (Table 32) */}
      <div className="bg-white/90 border border-slate-200 rounded-xl p-5 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Table 32: Required Closure Actions Before Procurement & Commissioning</span>
        </h3>
        <p className="text-xs text-slate-500">
          Identifies the necessary boundary transitions from assumed planning data to certified commissioning submittals.
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold text-[11px]">
                <th className="p-3 w-32">Discipline / Priority</th>
                <th className="p-3">Required Closure Action / Verification Acceptance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11.5px]">
              {closureActions.map((c) => (
                <tr key={c.priority} className="hover:bg-slate-100">
                  <td className="p-3 font-bold font-mono text-cyan-700">{c.priority}</td>
                  <td className="p-3 text-slate-700 leading-relaxed">{c.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulation Package Raw Data Viewer & CSV Downloads */}
      <div className="bg-white/90 border border-slate-200 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Simulation Package Datasets & Model Files (Table 40)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Download structured project data or view raw model inputs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFile('inputs')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                selectedFile === 'inputs' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'
              }`}
            >
              design_inputs.json
            </button>
            <button
              onClick={() => setSelectedFile('results')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                selectedFile === 'results' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'
              }`}
            >
              calculated_results.json
            </button>
            <button
              onClick={() => setSelectedFile('analysis')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                selectedFile === 'analysis' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'
              }`}
            >
              engineering_analysis.json
            </button>
          </div>
        </div>

        {/* Download CSV pills */}
        <div className="flex flex-wrap gap-2 pt-1 pb-2">
          {[
            { name: 'load_schedule.csv', url: '/src/data/load_schedule.csv' },
            { name: 'feeder_inputs.csv', url: '/src/data/feeder_inputs.csv' },
            { name: 'year_by_year.csv', url: '/src/data/year_by_year.csv' },
            { name: 'a1_y10_buses.csv', url: '/src/data/a1_y10_buses.csv' },
            { name: 'a1_y10_branches.csv', url: '/src/data/a1_y10_branches.csv' },
            { name: 'fault_summary.csv', url: '/src/data/fault_summary.csv' }
          ].map((csv) => (
            <span
              key={csv.name}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5"
            >
              <Code className="w-3 h-3 text-cyan-600" />
              <span>{csv.name}</span>
            </span>
          ))}
        </div>

        {/* JSON Viewer */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
          <pre className="text-[11px] font-mono text-cyan-200/90 leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(
              selectedFile === 'inputs'
                ? designInputs
                : selectedFile === 'results'
                ? calculatedResults
                : engineeringAnalysis,
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};
