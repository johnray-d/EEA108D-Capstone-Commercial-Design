import React from 'react';
import { X, ExternalLink, HelpCircle, Shield, Cpu, BookOpen, AlertCircle } from 'lucide-react';
import { EQUIPMENT_CATALOG } from '../data/equipmentDb';

interface InspectorPanelProps {
  selectedTag: string | null;
  onClose: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ selectedTag, onClose }) => {
  if (!selectedTag) return null;

  const equipment = EQUIPMENT_CATALOG[selectedTag] || {
    id: selectedTag,
    tag: selectedTag,
    name: `Equipment ${selectedTag}`,
    category: 'panel',
    voltageLevel: '400 V',
    rating: 'Engineering specification in report',
    selectedDesign: 'Refer to report schedule',
    assumedInput: 'Design brief basis',
    calculatedResult: 'Calculated in solver model',
    reportSection: 'Sections 6-10',
    whyThisMatters: 'Integral component of the commercial building power system.',
    colorHex: '#38bdf8'
  };

  return (
    <div className="absolute top-4 right-4 w-96 max-h-[calc(100vh-2rem)] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
            style={{ backgroundColor: equipment.colorHex }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {equipment.tag}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {equipment.voltageLevel}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-100 mt-1 leading-snug">
              {equipment.name}
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body with scrolling */}
      <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-300">
        {equipment.floorLevel && (
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/80">
            <span>Location:</span>
            <span className="font-medium text-slate-200">{equipment.floorLevel}</span>
          </div>
        )}

        {/* Selected Design & Equipment Rating */}
        <div>
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>Selected Design & Rating</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
            <p className="font-medium text-slate-100">{equipment.selectedDesign}</p>
            <p className="text-slate-400 font-mono text-[11px]">{equipment.rating}</p>
          </div>
        </div>

        {/* Assumed Input vs Calculated Result */}
        <div className="grid grid-cols-1 gap-2.5">
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1 text-amber-400 font-semibold mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Assumed Input (Design Brief)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{equipment.assumedInput}</p>
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1 text-emerald-400 font-semibold mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Calculated / Simulation Result</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{equipment.calculatedResult}</p>
          </div>
        </div>

        {/* Protection Setting (if available) */}
        {equipment.protectionSetting && (
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Preliminary Protection Setting</span>
            </div>
            <div className="bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/40 text-amber-200 font-mono text-[11px] leading-relaxed">
              {equipment.protectionSetting}
            </div>
          </div>
        )}

        {/* Formula Note */}
        {equipment.formulaNote && (
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Governing Calculation Formula</span>
            </div>
            <p className="font-mono text-[11px] text-sky-200 leading-relaxed bg-slate-900/80 p-2 rounded">
              {equipment.formulaNote}
            </p>
          </div>
        )}

        {/* Why This Matters (Expandable Educational Context) */}
        <div className="bg-indigo-950/30 p-3 rounded-lg border border-indigo-900/40">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Why This Matters (Educational Context)</span>
          </div>
          <p className="text-indigo-100/90 leading-relaxed text-[11.5px]">
            {equipment.whyThisMatters}
          </p>
        </div>

        {/* Report Reference */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Report Citation:</span>
          <span className="font-semibold text-slate-300">{equipment.reportSection}</span>
        </div>
      </div>
    </div>
  );
};
