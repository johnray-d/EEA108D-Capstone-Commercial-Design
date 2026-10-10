import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, ShieldAlert, Zap, Layers } from 'lucide-react';
import { EQUIPMENT_CATALOG } from '../data/equipmentDb';
import calculatedResults from '../data/calculated_results.json';
import { ScenarioId } from '../types/powerSystem';

interface SLDProps {
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  activeScenarioId: ScenarioId;
}

export const SingleLineDiagram: React.FC<SLDProps> = ({
  selectedTag,
  onSelectTag,
  activeScenarioId
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [diagramMode, setDiagramMode] = useState<'A1_final' | 'A1_prelim' | 'A2_split'>('A1_final');
  const [showProtection, setShowProtection] = useState(true);
  const [showSolvedValues, setShowSolvedValues] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeScenario = calculatedResults.scenarios[activeScenarioId] || calculatedResults.scenarios['A1_Y10_corrected'];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const isHighlighted = (tag: string) => selectedTag === tag;

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg overflow-hidden shadow-2xl">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-600" />
          <span className="font-semibold text-sm tracking-wide">Interactive Single-Line Diagram (SLD)</span>
          <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-300 ml-2">
            <button
              onClick={() => setDiagramMode('A1_final')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                diagramMode === 'A1_final' ? 'bg-cyan-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Alternative 1 (Recommended)
            </button>
            <button
              onClick={() => setDiagramMode('A2_split')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                diagramMode === 'A2_split' ? 'bg-cyan-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Alternative 2 (Split-Bus)
            </button>
            <button
              onClick={() => setDiagramMode('A1_prelim')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                diagramMode === 'A1_prelim' ? 'bg-cyan-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Preliminary (E-01)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProtection(!showProtection)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition ${
              showProtection
                ? 'bg-amber-50 border-amber-500/50 text-amber-700'
                : 'bg-slate-800 border-slate-300 text-slate-500'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Protection Settings</span>
          </button>
          <button
            onClick={() => setShowSolvedValues(!showSolvedValues)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition ${
              showSolvedValues
                ? 'bg-cyan-50 border-cyan-500/50 text-cyan-700'
                : 'bg-slate-800 border-slate-300 text-slate-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Solved Data Overlay</span>
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.2, 2.5))}
            className="p-1.5 bg-slate-800 hover:bg-slate-200 rounded border border-slate-300 text-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z / 1.2, 0.6))}
            className="p-1.5 bg-slate-800 hover:bg-slate-200 rounded border border-slate-300 text-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 bg-slate-800 hover:bg-slate-200 rounded border border-slate-300 text-slate-700"
            title="Reset Pan/Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden bg-slate-50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox="0 0 1150 780"
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '50% 50%',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" />
            </filter>
            <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a855f7" />
            </filter>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
          </defs>

          {/* Grid Background */}
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* --- TOP: Utility 13.8 kV Grid Entrance --- */}
          <g id="node-utility">
            {/* Grid Source Circle */}
            <circle cx="500" cy="45" r="22" fill="#ffffff" stroke="#ef4444" strokeWidth="2.5" />
            <path d="M 490 45 Q 495 38 500 45 T 510 45" fill="none" stroke="#ef4444" strokeWidth="2" />
            <text x="440" y="38" fill="#f87171" fontSize="12" fontWeight="bold">Utility 13.8 kV</text>
            <text x="440" y="54" fill="#475569" fontSize="10">250 MVA Fault Level (X/R = 10)</text>

            {/* Downward line to CT/VT Meter */}
            <line x1="500" y1="67" x2="500" y2="105" stroke="#ef4444" strokeWidth="2.5" />
          </g>

          {/* Revenue CT/VT Meter (METER) */}
          <g
            id="node-meter"
            className="cursor-pointer"
            onClick={() => onSelectTag('METER')}
          >
            <circle
              cx="500"
              cy="125"
              r="18"
              fill={isHighlighted('METER') ? '#581c87' : '#0f172a'}
              stroke={isHighlighted('METER') ? '#c084fc' : '#f97316'}
              strokeWidth={isHighlighted('METER') ? '3' : '2'}
              filter={isHighlighted('METER') ? 'url(#glow-purple)' : undefined}
            />
            <text x="495" y="130" fill="#f97316" fontSize="14" fontWeight="bold">M</text>
            <text x="400" y="128" fill="#334155" fontSize="11" fontWeight="500">Revenue CT/VT Meter</text>

            {/* Line to HV-01 */}
            <line x1="500" y1="143" x2="500" y2="175" stroke="#ef4444" strokeWidth="2.5" />
          </g>

          {/* HV Breaker HV-01 */}
          <g
            id="node-hv01"
            className="cursor-pointer"
            onClick={() => onSelectTag('HV-01')}
          >
            <rect
              x="490"
              y="175"
              width="20"
              height="20"
              fill={isHighlighted('HV-01') ? '#581c87' : '#0f172a'}
              stroke={isHighlighted('HV-01') ? '#c084fc' : '#ef4444'}
              strokeWidth={isHighlighted('HV-01') ? '3' : '2'}
              filter={isHighlighted('HV-01') ? 'url(#glow-purple)' : undefined}
            />
            <text x="520" y="185" fill="#f87171" fontSize="11" fontWeight="bold">HV-01 | 17.5 kV, 630 A, 25 kA</text>
            {showProtection && (
              <text x="325" y="195" fill="#f59e0b" fontSize="10">
                51: 65 A, 0.6s | 50: 800 A, 0.05s | 87T + 49 + REF
              </text>
            )}

            {/* Line to Transformer */}
            <line x1="500" y1="195" x2="500" y2="235" stroke="#ef4444" strokeWidth="2.5" />
          </g>

          {/* --- TRANSFORMER SECTION --- */}
          {diagramMode !== 'A2_split' ? (
            /* Alternative 1: Single 1,250 kVA Transformer T1 */
            <g
              id="node-t1"
              className="cursor-pointer"
              onClick={() => onSelectTag('T1')}
            >
              {/* Overlapping Circles Dyn11 */}
              <circle
                cx="500"
                cy="255"
                r="18"
                fill="none"
                stroke={isHighlighted('T1') ? '#c084fc' : '#ef4444'}
                strokeWidth="2.5"
              />
              <circle
                cx="500"
                cy="277"
                r="18"
                fill="none"
                stroke={isHighlighted('T1') ? '#c084fc' : '#38bdf8'}
                strokeWidth="2.5"
              />
              {/* Grounding symbol on wye secondary */}
              <line x1="482" y1="277" x2="470" y2="277" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="470" y1="272" x2="470" y2="282" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="466" y1="274" x2="466" y2="280" stroke="#38bdf8" strokeWidth="1.5" />

              <text x="530" y="260" fill="#38bdf8" fontSize="12" fontWeight="bold">T1 | 1,250 kVA</text>
              <text x="530" y="275" fill="#475569" fontSize="10">13.8 kV / 400 V | Dyn11 | 6% Z</text>
              {showSolvedValues && (
                <text x="530" y="290" fill="#34d399" fontSize="10" fontWeight="bold">
                  Loading: {((activeScenario as any).transformer?.loading_pct ?? 0).toFixed(1)}% | Secondary: {activeScenario.buses['TA']?.V.toFixed(1) || '402.1'} V
                </text>
              )}

              {/* Line from T1 down to Q0 */}
              <line x1="500" y1="295" x2="500" y2="340" stroke="#38bdf8" strokeWidth="3" />
            </g>
          ) : (
            /* Alternative 2: Split 2 x 800 kVA Transformers TA and TB */
            <g id="node-t-split">
              {/* Transformer TA */}
              <g className="cursor-pointer" onClick={() => onSelectTag('T1')}>
                <line x1="500" y1="210" x2="350" y2="210" stroke="#ef4444" strokeWidth="2" />
                <line x1="350" y1="210" x2="350" y2="235" stroke="#ef4444" strokeWidth="2" />
                <circle cx="350" cy="255" r="16" fill="none" stroke="#ef4444" strokeWidth="2" />
                <circle cx="350" cy="275" r="16" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <text x="260" y="260" fill="#38bdf8" fontSize="11" fontWeight="bold">TA | 800 kVA</text>
                <text x="260" y="275" fill="#475569" fontSize="9">Dyn11 | 6% Z</text>
                <line x1="350" y1="291" x2="350" y2="340" stroke="#38bdf8" strokeWidth="2.5" />
              </g>

              {/* Transformer TB */}
              <g className="cursor-pointer" onClick={() => onSelectTag('T1')}>
                <line x1="500" y1="210" x2="650" y2="210" stroke="#ef4444" strokeWidth="2" />
                <line x1="650" y1="210" x2="650" y2="235" stroke="#ef4444" strokeWidth="2" />
                <circle cx="650" cy="255" r="16" fill="none" stroke="#ef4444" strokeWidth="2" />
                <circle cx="650" cy="275" r="16" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <text x="680" y="260" fill="#38bdf8" fontSize="11" fontWeight="bold">TB | 800 kVA</text>
                <text x="680" y="275" fill="#475569" fontSize="9">Dyn11 | 6% Z</text>
                <line x1="650" y1="291" x2="650" y2="340" stroke="#38bdf8" strokeWidth="2.5" />
              </g>
            </g>
          )}

          {/* DEDICATED FIRE PUMP TAKEOFF (Direct from T1 stabs ahead of Q0!) */}
          <g id="node-fire-takeoff">
            {/* Takeoff tap point on T1 secondary */}
            <circle cx="500" cy="315" r="4" fill="#dc2626" />
            <line x1="500" y1="315" x2="920" y2="315" stroke="#dc2626" strokeWidth="2" strokeDasharray="5 3" />
            <text x="760" y="310" fill="#f87171" fontSize="10" fontWeight="bold">Dedicated Fire Takeoff (Ahead of Q0)</text>
            <line x1="920" y1="315" x2="920" y2="440" stroke="#dc2626" strokeWidth="2" />
          </g>

          {/* Main LV Breaker Q0 */}
          <g
            id="node-q0"
            className="cursor-pointer"
            onClick={() => onSelectTag('Q0')}
          >
            <rect
              x="488"
              y="340"
              width="24"
              height="24"
              fill={isHighlighted('Q0') ? '#581c87' : '#0f172a'}
              stroke={isHighlighted('Q0') ? '#c084fc' : '#38bdf8'}
              strokeWidth={isHighlighted('Q0') ? '3' : '2'}
              filter={isHighlighted('Q0') ? 'url(#glow-purple)' : undefined}
            />
            <text x="522" y="352" fill="#38bdf8" fontSize="11" fontWeight="bold">Q0 | 2500 AF / 2200 AT | 50 kA</text>
            {showProtection && (
              <text x="522" y="366" fill="#f59e0b" fontSize="9.5">
                Isd=6Ir=13.2 kA, 0.30s | ZSI | GF: 440 A, 0.30s
              </text>
            )}

            {/* Line to Main Busbar */}
            <line x1="500" y1="364" x2="500" y2="410" stroke="#38bdf8" strokeWidth="3" />
          </g>

          {/* --- MAIN 400 V BUSBAR (MDB-A) --- */}
          {diagramMode !== 'A2_split' ? (
            /* Alternative 1: Solid 2,500 A Main Busbar */
            <g
              id="node-main-bus"
              className="cursor-pointer"
              onClick={() => onSelectTag('MDB-A')}
            >
              <line
                x1="160"
                y1="410"
                x2="840"
                y2="410"
                stroke={isHighlighted('MDB-A') ? '#c084fc' : '#0284c7'}
                strokeWidth={isHighlighted('MDB-A') ? '8' : '6'}
                strokeLinecap="round"
                filter={isHighlighted('MDB-A') ? 'url(#glow-purple)' : undefined}
              />
              <text x="145" y="400" fill="#38bdf8" fontSize="11" fontWeight="bold">
                MDB-A | 2500 A | 400/230 V, 3P+N+PE | 50 kA / 1 s
              </text>
              {showSolvedValues && (
                <text x="550" y="400" fill="#34d399" fontSize="11" fontWeight="bold">
                  Bus Voltage: {activeScenario.buses['MDB-A']?.V.toFixed(1) || '401.8'} V
                </text>
              )}
            </g>
          ) : (
            /* Alternative 2: Split Buses A & B with Normally Open Tie QT */
            <g id="node-split-bus">
              {/* Bus A */}
              <line x1="160" y1="410" x2="460" y2="410" stroke="#0284c7" strokeWidth="6" strokeLinecap="round" />
              <text x="160" y="400" fill="#38bdf8" fontSize="10" fontWeight="bold">Section A (1600 A)</text>

              {/* Normally Open Tie Breaker QT */}
              <g className="cursor-pointer" onClick={() => onSelectTag('Q0')}>
                <line x1="460" y1="410" x2="480" y2="410" stroke="#94a3b8" strokeWidth="2" />
                <rect x="480" y="400" width="20" height="20" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
                <line x1="500" y1="410" x2="520" y2="410" stroke="#94a3b8" strokeWidth="2" />
                <text x="450" y="435" fill="#f59e0b" fontSize="9" fontWeight="bold">QT 1600 AF/1400 AT (N.O. Tie)</text>
              </g>

              {/* Bus B */}
              <line x1="520" y1="410" x2="840" y2="410" stroke="#0284c7" strokeWidth="6" strokeLinecap="round" />
              <text x="730" y="400" fill="#38bdf8" fontSize="10" fontWeight="bold">Section B (1600 A)</text>
            </g>
          )}

          {/* --- LEFT: APFC Bank C1 & Breaker QC --- */}
          <g
            id="node-apfc"
            className="cursor-pointer"
            onClick={() => onSelectTag('C1')}
          >
            {/* Feeder line up from bus */}
            <line x1="190" y1="410" x2="190" y2="340" stroke="#10b981" strokeWidth="2.5" />

            {/* QC Breaker */}
            <rect
              x="180"
              y="340"
              width="20"
              height="20"
              fill={isHighlighted('QC') ? '#581c87' : '#0f172a'}
              stroke={isHighlighted('QC') ? '#c084fc' : '#10b981'}
              strokeWidth="2"
              onClick={(e) => { e.stopPropagation(); onSelectTag('QC'); }}
            />
            <text x="210" y="348" fill="#34d399" fontSize="10" fontWeight="bold">QC 1000 AF / 900 AT</text>

            <line x1="190" y1="340" x2="190" y2="280" stroke="#10b981" strokeWidth="2.5" />

            {/* Capacitor Symbol */}
            <g transform="translate(170, 240)">
              <line x1="10" y1="40" x2="30" y2="40" stroke="#10b981" strokeWidth="3" />
              <line x1="10" y1="48" x2="30" y2="48" stroke="#10b981" strokeWidth="3" />
              {/* 7% Reactor Symbol (Loop) */}
              <path d="M 20 48 Q 10 58 20 65 Q 30 72 20 80" fill="none" stroke="#10b981" strokeWidth="2" />
            </g>

            <text x="210" y="270" fill="#10b981" fontSize="11" fontWeight="bold">C1 | 400 kVAr NET</text>
            <text x="210" y="285" fill="#475569" fontSize="9.5">16 x 25 kVAr, 7% reactors</text>
            {showSolvedValues && (
              <text x="210" y="300" fill="#34d399" fontSize="9.5" fontWeight="bold">
                Switched: {activeScenario.switchedKVAr} kVAr ({activeScenario.switchedSteps} steps)
              </text>
            )}
          </g>

          {/* --- RIGHT: STANDBY GENERATOR (GEN-1) & ATS INFRASTRUCTURE --- */}
          <g id="node-generator-system">
            {/* Generator Source */}
            <g className="cursor-pointer" onClick={() => onSelectTag('GEN-1')}>
              <circle
                cx="750"
                cy="140"
                r="18"
                fill={isHighlighted('GEN-1') ? '#581c87' : '#0f172a'}
                stroke={isHighlighted('GEN-1') ? '#c084fc' : '#f59e0b'}
                strokeWidth="2.5"
                filter={isHighlighted('GEN-1') ? 'url(#glow-purple)' : undefined}
              />
              <text x="744" y="146" fill="#f59e0b" fontSize="14" fontWeight="bold">G</text>
              <text x="780" y="135" fill="#fbbf24" fontSize="11" fontWeight="bold">GEN-1</text>
              <text x="780" y="150" fill="#475569" fontSize="10">400 kVA / 320 kW, 400 V</text>
            </g>

            {/* Generator Breaker QG */}
            <g className="cursor-pointer" onClick={() => onSelectTag('QG')}>
              <line x1="750" y1="158" x2="750" y2="185" stroke="#f59e0b" strokeWidth="2.5" />
              <rect
                x="740"
                y="185"
                width="20"
                height="20"
                fill={isHighlighted('QG') ? '#581c87' : '#0f172a'}
                stroke={isHighlighted('QG') ? '#c084fc' : '#f59e0b'}
                strokeWidth="2"
              />
              <text x="770" y="195" fill="#f59e0b" fontSize="10" fontWeight="bold">QG 630 AF / 500 AT</text>
              {showProtection && (
                <text x="770" y="208" fill="#475569" fontSize="9">GF ALARM ONLY (no trip)</text>
              )}
            </g>

            {/* Emergency Source Bus */}
            <line x1="750" y1="205" x2="750" y2="245" stroke="#f59e0b" strokeWidth="2.5" />
            <rect x="700" y="245" width="100" height="20" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" rx="3" />
            <text x="708" y="259" fill="#f59e0b" fontSize="9.5" fontWeight="bold">Emergency Source Bus</text>

            {/* Emergency Feeder Lines to ATS-E and FP-ATS */}
            {/* Branch E1 to ATS-E */}
            <line x1="730" y1="265" x2="730" y2="520" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="715" y="470" fill="#f59e0b" fontSize="9">E1</text>

            {/* Branch E2 to FP-ATS */}
            <line x1="780" y1="265" x2="920" y2="265" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
            <line x1="920" y1="265" x2="920" y2="440" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="895" y="380" fill="#f59e0b" fontSize="9">E2</text>
          </g>

          {/* --- OUTGOING FEEDERS DOWNWARD FROM MDB --- */}

          {/* Feeder QF1 (Retail Floor 1) */}
          <g className="cursor-pointer" onClick={() => onSelectTag('P-F1')}>
            <line x1="160" y1="410" x2="160" y2="470" stroke="#0ea5e9" strokeWidth="2" />
            <rect x="150" y="470" width="20" height="20" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="160" y1="490" x2="160" y2="560" stroke="#0ea5e9" strokeWidth="2" />
            <rect
              x="130"
              y="560"
              width="60"
              height="40"
              fill={isHighlighted('P-F1') ? '#581c87' : '#0f172a'}
              stroke={isHighlighted('P-F1') ? '#c084fc' : '#0ea5e9'}
              strokeWidth="2"
              rx="4"
            />
            <text x="160" y="578" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">F1</text>
            <text x="160" y="591" fill="#475569" fontSize="8.5" textAnchor="middle">Retail | 25m</text>
            <text x="135" y="460" fill="#475569" fontSize="8.5">QF1 400A</text>
            {showSolvedValues && (
              <text x="160" y="615" fill="#34d399" fontSize="8.5" textAnchor="middle">
                {activeScenario.buses['F1']?.V.toFixed(1) || '400.9'} V
              </text>
            )}
          </g>

          {/* Feeder QF2 (Retail Floor 2) */}
          <g className="cursor-pointer" onClick={() => onSelectTag('P-F2')}>
            <line x1="240" y1="410" x2="240" y2="470" stroke="#0ea5e9" strokeWidth="2" />
            <rect x="230" y="470" width="20" height="20" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="240" y1="490" x2="240" y2="560" stroke="#0ea5e9" strokeWidth="2" />
            <rect
              x="210"
              y="560"
              width="60"
              height="40"
              fill={isHighlighted('P-F2') ? '#581c87' : '#0f172a'}
              stroke={isHighlighted('P-F2') ? '#c084fc' : '#0ea5e9'}
              strokeWidth="2"
              rx="4"
            />
            <text x="240" y="578" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">F2</text>
            <text x="240" y="591" fill="#475569" fontSize="8.5" textAnchor="middle">Retail | 35m</text>
            <text x="215" y="460" fill="#475569" fontSize="8.5">QF2 400A</text>
            {showSolvedValues && (
              <text x="240" y="615" fill="#34d399" fontSize="8.5" textAnchor="middle">
                {activeScenario.buses['F2']?.V.toFixed(1) || '400.6'} V
              </text>
            )}
          </g>

          {/* Feeder QF3 (Office Floor 3) */}
          <g className="cursor-pointer" onClick={() => onSelectTag('P-F3')}>
            <line x1="320" y1="410" x2="320" y2="470" stroke="#0ea5e9" strokeWidth="2" />
            <rect x="310" y="470" width="20" height="20" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="320" y1="490" x2="320" y2="560" stroke="#0ea5e9" strokeWidth="2" />
            <rect
              x="290"
              y="560"
              width="60"
              height="40"
              fill={isHighlighted('P-F3') ? '#581c87' : '#0f172a'}
              stroke={isHighlighted('P-F3') ? '#c084fc' : '#0ea5e9'}
              strokeWidth="2"
              rx="4"
            />
            <text x="320" y="578" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">F3</text>
            <text x="320" y="591" fill="#475569" fontSize="8.5" textAnchor="middle">Office | 45m</text>
            <text x="295" y="460" fill="#475569" fontSize="8.5">QF3 400A</text>
            {showSolvedValues && (
              <text x="320" y="615" fill="#34d399" fontSize="8.5" textAnchor="middle">
                {activeScenario.buses['F3']?.V.toFixed(1) || '400.3'} V
              </text>
            )}
          </g>

          {/* Feeder QF4 (Office Floor 4) */}
          <g className="cursor-pointer" onClick={() => onSelectTag('P-F4')}>
            <line x1="400" y1="410" x2="400" y2="470" stroke="#0ea5e9" strokeWidth="2" />
            <rect x="390" y="470" width="20" height="20" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="400" y1="490" x2="400" y2="560" stroke="#0ea5e9" strokeWidth="2" />
            <rect
              x="370"
              y="560"
              width="60"
              height="40"
              fill={isHighlighted('P-F4') ? '#581c87' : '#0f172a'}
              stroke={isHighlighted('P-F4') ? '#c084fc' : '#0ea5e9'}
              strokeWidth="2"
              rx="4"
            />
            <text x="400" y="578" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">F4</text>
            <text x="400" y="591" fill="#475569" fontSize="8.5" textAnchor="middle">Office | 55m</text>
            <text x="375" y="460" fill="#475569" fontSize="8.5">QF4 400A</text>
            {showSolvedValues && (
              <text x="400" y="615" fill="#34d399" fontSize="8.5" textAnchor="middle">
                {activeScenario.buses['F4']?.V.toFixed(1) || '400.0'} V
              </text>
            )}
          </g>

          {/* Feeder QF5 (Office Floor 5) */}
          <g className="cursor-pointer" onClick={() => onSelectTag('P-F5')}>
            <line x1="480" y1="410" x2="480" y2="470" stroke="#0ea5e9" strokeWidth="2" />
            <rect x="470" y="470" width="20" height="20" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="480" y1="490" x2="480" y2="560" stroke="#0ea5e9" strokeWidth="2" />
            <rect
              x="450"
              y="560"
              width="60"
              height="40"
              fill={isHighlighted('P-F5') ? '#581c87' : '#0f172a'}
              stroke={isHighlighted('P-F5') ? '#c084fc' : '#0ea5e9'}
              strokeWidth="2"
              rx="4"
            />
            <text x="480" y="578" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">F5</text>
            <text x="480" y="591" fill="#475569" fontSize="8.5" textAnchor="middle">Office | 65m</text>
            <text x="455" y="460" fill="#475569" fontSize="8.5">QF5 400A</text>
            {showSolvedValues && (
              <text x="480" y="615" fill="#34d399" fontSize="8.5" textAnchor="middle">
                {activeScenario.buses['F5']?.V.toFixed(1) || '399.7'} V
              </text>
            )}
          </g>

          {/* Feeder QF6 (Office Floor 6 - Farthest Node) */}
          <g className="cursor-pointer" onClick={() => onSelectTag('P-F6')}>
            <line x1="560" y1="410" x2="560" y2="470" stroke="#0ea5e9" strokeWidth="2" />
            <rect x="550" y="470" width="20" height="20" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="560" y1="490" x2="560" y2="560" stroke="#0ea5e9" strokeWidth="2" />
            <rect
              x="530"
              y="560"
              width="60"
              height="40"
              fill={isHighlighted('P-F6') ? '#581c87' : '#0f172a'}
              stroke={isHighlighted('P-F6') ? '#c084fc' : '#0ea5e9'}
              strokeWidth="2"
              rx="4"
            />
            <text x="560" y="578" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">F6 (Farthest)</text>
            <text x="560" y="591" fill="#475569" fontSize="8.5" textAnchor="middle">Office | 75m</text>
            <text x="535" y="460" fill="#475569" fontSize="8.5">QF6 400A</text>
            {showSolvedValues && (
              <text x="560" y="615" fill="#34d399" fontSize="8.5" textAnchor="middle">
                {activeScenario.buses['F6']?.V.toFixed(1) || '399.4'} V
              </text>
            )}
          </g>

          {/* --- ESSENTIAL DISTRIBUTION FEEDER QE -> ATS-E -> EDB --- */}
          <g id="node-edb-feeder">
            {/* Feeder QE Breaker from MDB */}
            <line x1="660" y1="410" x2="660" y2="470" stroke="#8b5cf6" strokeWidth="2" />
            <rect x="650" y="470" width="20" height="20" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
            <text x="675" y="480" fill="#a78bfa" fontSize="9.5">QE 400 AF / 320 AT</text>

            {/* Normal input to ATS-E */}
            <line x1="660" y1="490" x2="660" y2="530" stroke="#8b5cf6" strokeWidth="2" />
            <line x1="660" y1="530" x2="630" y2="530" stroke="#8b5cf6" strokeWidth="2" />

            {/* ATS-E Component */}
            <g className="cursor-pointer" onClick={() => onSelectTag('ATS-E')}>
              <rect
                x="620"
                y="520"
                width="80"
                height="30"
                fill={isHighlighted('ATS-E') ? '#581c87' : '#0f172a'}
                stroke={isHighlighted('ATS-E') ? '#c084fc' : '#f59e0b'}
                strokeWidth="2"
                rx="4"
              />
              <text x="660" y="538" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">ATS-E 400 A</text>
            </g>

            {/* Output from ATS-E down to EDB Panel */}
            <line x1="660" y1="550" x2="660" y2="590" stroke="#8b5cf6" strokeWidth="2.5" />
            <g className="cursor-pointer" onClick={() => onSelectTag('EDB')}>
              <rect
                x="625"
                y="590"
                width="70"
                height="45"
                fill={isHighlighted('EDB') ? '#581c87' : '#0f172a'}
                stroke={isHighlighted('EDB') ? '#c084fc' : '#8b5cf6'}
                strokeWidth="2"
                rx="4"
              />
              <text x="660" y="608" fill="#c084fc" fontSize="11" fontWeight="bold" textAnchor="middle">EDB</text>
              <text x="660" y="622" fill="#475569" fontSize="8.5" textAnchor="middle">IT / Life Safety</text>
              {showSolvedValues && (
                <text x="660" y="648" fill="#34d399" fontSize="8.5" textAnchor="middle">
                  {activeScenario.buses['EDB']?.V.toFixed(1) || '401.1'} V
                </text>
              )}
            </g>
          </g>

          {/* --- MECHANICAL DISTRIBUTION FEEDER QM -> MDP --- */}
          <g id="node-mdp-feeder" className="cursor-pointer" onClick={() => onSelectTag('MDP')}>
            <line x1="760" y1="410" x2="760" y2="470" stroke="#3b82f6" strokeWidth="2" />
            <rect x="750" y="470" width="20" height="20" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
            <text x="775" y="480" fill="#60a5fa" fontSize="9.5">QM 160 AF / 125 AT</text>

            <line x1="760" y1="490" x2="760" y2="590" stroke="#3b82f6" strokeWidth="2" />
            <rect
              x="725"
              y="590"
              width="70"
              height="45"
              fill={isHighlighted('MDP') ? '#581c87' : '#0f172a'}
              stroke={isHighlighted('MDP') ? '#c084fc' : '#3b82f6'}
              strokeWidth="2"
              rx="4"
            />
            <text x="760" y="608" fill="#60a5fa" fontSize="11" fontWeight="bold" textAnchor="middle">MDP</text>
            <text x="760" y="622" fill="#475569" fontSize="8.5" textAnchor="middle">Lifts + Pumps</text>
            {showSolvedValues && (
              <text x="760" y="648" fill="#34d399" fontSize="8.5" textAnchor="middle">
                {activeScenario.buses['MDP']?.V.toFixed(1) || '399.5'} V
              </text>
            )}
            <text x="760" y="665" fill="#f59e0b" fontSize="8" textAnchor="middle">E3: Local ATS (1 Lift / 1 Pump)</text>
          </g>

          {/* --- FIRE PUMP CONTROLLER (FP-ATS) & MOTOR --- */}
          <g id="node-fire-system">
            {/* FP-ATS box */}
            <g className="cursor-pointer" onClick={() => onSelectTag('FP-ATS')}>
              <rect
                x="870"
                y="440"
                width="100"
                height="45"
                fill={isHighlighted('FP-ATS') ? '#581c87' : '#0f172a'}
                stroke={isHighlighted('FP-ATS') ? '#c084fc' : '#dc2626'}
                strokeWidth="2"
                rx="4"
              />
              <text x="920" y="458" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">FP ATS / Controller</text>
              <text x="920" y="472" fill="#475569" fontSize="8.5" textAnchor="middle">200 A, 50 kA Listed</text>
            </g>

            {/* Line to Fire Pump Motor */}
            <line x1="920" y1="485" x2="920" y2="560" stroke="#dc2626" strokeWidth="2.5" />
            <g className="cursor-pointer" onClick={() => onSelectTag('FP-MOTOR')}>
              <circle
                cx="920"
                cy="580"
                r="20"
                fill={isHighlighted('FP-MOTOR') ? '#581c87' : '#0f172a'}
                stroke={isHighlighted('FP-MOTOR') ? '#c084fc' : '#dc2626'}
                strokeWidth="2"
              />
              <text x="914" y="586" fill="#f87171" fontSize="14" fontWeight="bold">M</text>
              <text x="920" y="615" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">Fire Pump</text>
              <text x="920" y="628" fill="#475569" fontSize="8.5" textAnchor="middle">37 kW Shaft (41.1 kW)</text>
            </g>
          </g>

          {/* Bottom Legend */}
          <g id="sld-legend" transform="translate(100, 715)">
            <rect x="0" y="0" width="950" height="45" fill="#ffffff" stroke="#e2e8f0" rx="6" />
            <circle cx="30" cy="22" r="6" fill="#ef4444" />
            <text x="42" y="26" fill="#334155" fontSize="10">13.8 kV Medium Voltage</text>

            <circle cx="190" cy="22" r="6" fill="#38bdf8" />
            <text x="202" y="26" fill="#334155" fontSize="10">400/230 V Normal LV Supply</text>

            <circle cx="370" cy="22" r="6" fill="#f59e0b" />
            <text x="382" y="26" fill="#334155" fontSize="10">Standby Generator / ATS Essential</text>

            <circle cx="590" cy="22" r="6" fill="#dc2626" />
            <text x="602" y="26" fill="#334155" fontSize="10">Dedicated Fire Pump Circuit</text>

            <circle cx="770" cy="22" r="6" fill="#10b981" />
            <text x="782" y="26" fill="#334155" fontSize="10">400 kVAr Detuned APFC</text>
          </g>
        </svg>
      </div>
    </div>
  );
};
