import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Layers,
  Sliders,
  Eye,
  Zap,
  Activity,
  Maximize2,
  Table,
  Box,
  RotateCw,
  Compass,
  AlertCircle
} from 'lucide-react';
import { BuildingSceneManager } from '../3d/BuildingScene';
import { ViewOptions3D, ScenarioId } from '../types/powerSystem';
import { EQUIPMENT_CATALOG } from '../data/equipmentDb';
import { InspectorPanel } from './InspectorPanel';
import calculatedResults from '../data/calculated_results.json';

interface View3DBuildingProps {
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  activeScenarioId: ScenarioId;
}

export const View3DBuilding: React.FC<View3DBuildingProps> = ({
  selectedTag,
  onSelectTag,
  activeScenarioId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<BuildingSceneManager | null>(null);

  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [engineType, setEngineType] = useState<string>('Initializing...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [showAccessibleView, setShowAccessibleView] = useState<boolean>(false);

  const [options, setOptions] = useState<ViewOptions3D>({
    shellMode: 'cutaway',
    shellOpacity: 0.25,
    explodedOffset: 0.0,
    showHV: true,
    showTransformer: true,
    showLV: true,
    showFeeders: true,
    showEmergency: true,
    showLoads: true,
    showAPFC: true,
    showPowerPath: 'normal',
    animateFlow: true
  });

  // Initialize Babylon.js Scene
  useEffect(() => {
    if (!canvasRef.current) return;

    let isCancelled = false;
    const manager = new BuildingSceneManager(
      canvasRef.current,
      {
        onSelectEquipment: (tag) => onSelectTag(tag),
        onHoverEquipment: (tag) => setHoveredTag(tag)
      },
      options
    );

    sceneManagerRef.current = manager;

    manager.init().then((type) => {
      if (isCancelled) return;
      setEngineType(type);
      setIsLoading(false);
      // Ensure canvas adapts to layout dimensions
      requestAnimationFrame(() => {
        manager.resize();
      });
      setTimeout(() => {
        manager.resize();
      }, 150);
    }).catch((err) => {
      if (isCancelled) return;
      console.error('Failed to init 3D engine:', err);
      setInitError('WebGL acceleration could not be initialized. Please check your browser hardware acceleration settings or use the Accessible Schedule view.');
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // ResizeObserver on the container to resize 3D viewport smoothly
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      sceneManagerRef.current?.resize();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync React options changes to Babylon.js scene
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateViewOptions(options);
    }
  }, [options]);

  // Sync external selection (from SLD or tables) to Babylon.js highlighting
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.selectEquipment(selectedTag);
    }
  }, [selectedTag]);

  const handleCameraPreset = (preset: 'home' | 'plant' | 'riser' | 'retail' | 'office' | 'roof' | 'basement') => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(preset);
    }
  };

  const hoveredEquipment = hoveredTag ? EQUIPMENT_CATALOG[hoveredTag] : null;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2 max-w-[calc(100%-26rem)] pointer-events-auto">
        {/* Camera View Presets */}
        <div className="flex items-center bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-md">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-cyan-600" />
            <span>Preset:</span>
          </span>
          <button
            onClick={() => handleCameraPreset('home')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition font-medium"
          >
            Iso / Home
          </button>
          <button
            onClick={() => handleCameraPreset('plant')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-cyan-50 text-cyan-700 hover:text-cyan-900 transition font-medium"
          >
            Substation Plant
          </button>
          <button
            onClick={() => handleCameraPreset('riser')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition font-medium"
          >
            Riser
          </button>
          <button
            onClick={() => handleCameraPreset('retail')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition font-medium"
          >
            Retail (L1–2)
          </button>
          <button
            onClick={() => handleCameraPreset('office')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition font-medium"
          >
            Office (L3–6)
          </button>
          <button
            onClick={() => handleCameraPreset('roof')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition font-medium"
          >
            Rooftop
          </button>
          <button
            onClick={() => handleCameraPreset('basement')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-red-50 text-red-700 hover:text-red-900 transition font-medium"
          >
            Basement
          </button>
        </div>

        {/* Building Shell Mode Dropdown / Toggles */}
        <div className="flex items-center bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-md">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Shell:</span>
          </span>
          {(['cutaway', 'normal', 'hidden'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setOptions({ ...options, shellMode: mode })}
              className={`px-2 py-1 text-xs rounded-lg capitalize font-medium transition ${
                options.shellMode === mode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Exploded Mode Slider */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-md">
          <Sliders className="w-3.5 h-3.5 text-cyan-600" />
          <span className="text-[11px] font-semibold text-slate-700">Exploded View:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={options.explodedOffset}
            onChange={(e) => setOptions({ ...options, explodedOffset: parseFloat(e.target.value) })}
            className="w-24 accent-cyan-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
          <span className="text-[11px] font-mono text-cyan-700 font-bold w-8">
            {Math.round(options.explodedOffset * 100)}%
          </span>
        </div>

        {/* Accessible Alternative View Button */}
        <button
          onClick={() => setShowAccessibleView(!showAccessibleView)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md shadow-md transition ${
            showAccessibleView
              ? 'bg-cyan-600 border-cyan-500 text-white'
              : 'bg-white/95 border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          {showAccessibleView ? <Box className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
          <span>{showAccessibleView ? 'Return to 3D View' : 'Accessible Schedule View'}</span>
        </button>
      </div>

      {/* Main 3D Canvas / Accessible View */}
      <div ref={containerRef} className="relative flex-1 w-full h-full min-h-0 overflow-hidden">
        {!showAccessibleView ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full outline-none block canvas-container"
              style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Loading Indicator Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm transition-opacity">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-600 animate-spin" />
                  <Zap className="w-5 h-5 text-cyan-600 absolute animate-pulse" />
                </div>
                <div className="text-sm font-semibold text-slate-800">Loading 3D Distribution System</div>
                <div className="text-xs text-slate-500 mt-1">Initializing Babylon.js WebGL2 graphics pipeline...</div>
                <button
                  onClick={() => setShowAccessibleView(true)}
                  className="mt-4 px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                >
                  Switch to Accessible Schedule View
                </button>
              </div>
            )}

            {/* Error Fallback */}
            {initError && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                <div className="text-base font-semibold text-slate-800">3D View Notice</div>
                <p className="text-xs text-slate-600 max-w-md mt-1 mb-4">{initError}</p>
                <button
                  onClick={() => setShowAccessibleView(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-md"
                >
                  View Accessible Technical Schedule
                </button>
              </div>
            )}

            {/* Hover Tooltip */}
            {hoveredEquipment && (
              <div className="absolute bottom-16 left-6 z-20 pointer-events-none bg-white/95 backdrop-blur-md border border-slate-200/90 px-3.5 py-2.5 rounded-xl shadow-xl text-xs max-w-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: hoveredEquipment.colorHex }}
                  />
                  <span className="font-mono font-bold text-cyan-700">{hoveredEquipment.tag}</span>
                  <span className="text-slate-500 font-medium">({hoveredEquipment.voltageLevel})</span>
                </div>
                <div className="font-semibold text-slate-800 mt-1">{hoveredEquipment.name}</div>
                <div className="text-[11px] text-slate-600 font-mono mt-1">{hoveredEquipment.rating}</div>
              </div>
            )}
          </>
        ) : (
          /* Accessible Non-3D View (Tabular Equipment Schedule) */
          <div className="w-full h-full p-6 overflow-y-auto bg-slate-50 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Non-3D Accessible Equipment & Distribution Schedule</h2>
                <p className="text-xs text-slate-500">
                  Full textual equivalent of the 3D model with ratings, protection, and governing equations.
                </p>
              </div>
              <button
                onClick={() => setShowAccessibleView(false)}
                className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-sm"
              >
                Switch to 3D Canvas
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th className="p-3 font-semibold">Tag</th>
                    <th className="p-3 font-semibold">Equipment Name</th>
                    <th className="p-3 font-semibold">Voltage</th>
                    <th className="p-3 font-semibold">Location</th>
                    <th className="p-3 font-semibold">Rating / Sizing</th>
                    <th className="p-3 font-semibold">Protection Setting</th>
                    <th className="p-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11.5px]">
                  {Object.values(EQUIPMENT_CATALOG).map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        selectedTag === item.tag ? 'bg-cyan-50/70 text-cyan-900 font-semibold' : ''
                      }`}
                      onClick={() => onSelectTag(item.tag)}
                    >
                      <td className="p-3 font-bold text-cyan-700">{item.tag}</td>
                      <td className="p-3 font-sans font-medium text-slate-800">{item.name}</td>
                      <td className="p-3 text-slate-600">{item.voltageLevel}</td>
                      <td className="p-3 text-slate-600 font-sans">{item.floorLevel || 'Building Plant'}</td>
                      <td className="p-3 text-slate-700">{item.rating}</td>
                      <td className="p-3 text-amber-700 font-semibold">{item.protectionSetting || 'N/A'}</td>
                      <td className="p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTag(item.tag);
                          }}
                          className="px-2.5 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-cyan-700 border border-slate-200 font-semibold"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Selected Equipment Inspector Modal/Panel */}
        <InspectorPanel selectedTag={selectedTag} onClose={() => onSelectTag(null)} />
      </div>

      {/* Bottom Status & Visibility Controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-600 gap-3 z-20 shadow-sm">
        {/* Layer Visibility Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-cyan-600" />
            <span>Visible:</span>
          </span>
          <button
            onClick={() => setOptions({ ...options, showHV: !options.showHV })}
            className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium transition ${
              options.showHV
                ? 'bg-red-50 border-red-300 text-red-700 font-semibold shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            HV 13.8 kV
          </button>
          <button
            onClick={() => setOptions({ ...options, showTransformer: !options.showTransformer })}
            className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium transition ${
              options.showTransformer
                ? 'bg-sky-50 border-sky-300 text-sky-700 font-semibold shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            Transformer
          </button>
          <button
            onClick={() => setOptions({ ...options, showLV: !options.showLV })}
            className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium transition ${
              options.showLV
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            Main LV Board
          </button>
          <button
            onClick={() => setOptions({ ...options, showFeeders: !options.showFeeders })}
            className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium transition ${
              options.showFeeders
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            Floor Panels
          </button>
          <button
            onClick={() => setOptions({ ...options, showAPFC: !options.showAPFC })}
            className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium transition ${
              options.showAPFC
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            APFC Bank
          </button>
          <button
            onClick={() => setOptions({ ...options, showEmergency: !options.showEmergency })}
            className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium transition ${
              options.showEmergency
                ? 'bg-amber-50 border-amber-300 text-amber-700 font-semibold shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            Generator & Fire
          </button>
          <button
            onClick={() => setOptions({ ...options, showLoads: !options.showLoads })}
            className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium transition ${
              options.showLoads
                ? 'bg-purple-50 border-purple-300 text-purple-700 font-semibold shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            Loads
          </button>
        </div>

        {/* Render Engine & Disclaimer Badge */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Engine: <strong className="text-slate-800">{engineType}</strong></span>
          </span>
          <span className="text-slate-400 hidden md:inline">
            Diagrammatic visualization • Not to scale • Room placement illustrative
          </span>
        </div>
      </div>
    </div>
  );
};
