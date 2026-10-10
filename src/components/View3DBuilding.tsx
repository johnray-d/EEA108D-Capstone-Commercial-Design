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
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2 max-w-[calc(100%-26rem)] pointer-events-auto">
        {/* Camera View Presets */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preset:</span>
          </span>
          <button
            onClick={() => handleCameraPreset('home')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-800 text-slate-200 transition font-medium"
          >
            Iso / Home
          </button>
          <button
            onClick={() => handleCameraPreset('plant')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-800 text-cyan-300 transition font-medium"
          >
            Substation Plant
          </button>
          <button
            onClick={() => handleCameraPreset('riser')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-800 text-slate-200 transition font-medium"
          >
            Riser
          </button>
          <button
            onClick={() => handleCameraPreset('retail')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-800 text-slate-200 transition font-medium"
          >
            Retail (L1-2)
          </button>
          <button
            onClick={() => handleCameraPreset('office')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-800 text-slate-200 transition font-medium"
          >
            Office (L3-6)
          </button>
          <button
            onClick={() => handleCameraPreset('roof')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-800 text-slate-200 transition font-medium"
          >
            Rooftop
          </button>
          <button
            onClick={() => handleCameraPreset('basement')}
            className="px-2 py-1 text-xs rounded-lg hover:bg-slate-800 text-red-300 transition font-medium"
          >
            Basement
          </button>
        </div>

        {/* Building Shell Mode Dropdown / Toggles */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl">
          <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Shell:</span>
          </span>
          {(['cutaway', 'normal', 'hidden'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setOptions({ ...options, shellMode: mode })}
              className={`px-2 py-1 text-xs rounded-lg capitalize font-medium transition ${
                options.shellMode === mode
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Exploded Mode Slider */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-xl">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-semibold text-slate-300">Exploded View:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={options.explodedOffset}
            onChange={(e) => setOptions({ ...options, explodedOffset: parseFloat(e.target.value) })}
            className="w-24 accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
          />
          <span className="text-[11px] font-mono text-cyan-300 w-8">
            {Math.round(options.explodedOffset * 100)}%
          </span>
        </div>

        {/* Accessible Alternative View Button */}
        <button
          onClick={() => setShowAccessibleView(!showAccessibleView)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md shadow-xl transition ${
            showAccessibleView
              ? 'bg-cyan-600 border-cyan-500 text-white'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white'
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
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm transition-opacity">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                  <Zap className="w-5 h-5 text-cyan-400 absolute animate-pulse" />
                </div>
                <div className="text-sm font-semibold text-slate-100">Loading 3D Distribution System</div>
                <div className="text-xs text-slate-400 mt-1">Initializing Babylon.js WebGL2 graphics pipeline...</div>
                <button
                  onClick={() => setShowAccessibleView(true)}
                  className="mt-4 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  Switch to Accessible Schedule View
                </button>
              </div>
            )}

            {/* Error Fallback */}
            {initError && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
                <div className="text-base font-semibold text-slate-100">3D View Notice</div>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">{initError}</p>
                <button
                  onClick={() => setShowAccessibleView(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg"
                >
                  View Accessible Technical Schedule
                </button>
              </div>
            )}

            {/* Hover Tooltip */}
            {hoveredEquipment && (
              <div className="absolute bottom-16 left-6 z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-700 px-3.5 py-2 rounded-xl shadow-2xl text-xs max-w-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: hoveredEquipment.colorHex }}
                  />
                  <span className="font-mono font-bold text-cyan-300">{hoveredEquipment.tag}</span>
                  <span className="text-slate-400">({hoveredEquipment.voltageLevel})</span>
                </div>
                <div className="font-semibold text-slate-100 mt-0.5">{hoveredEquipment.name}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">{hoveredEquipment.rating}</div>
              </div>
            )}
          </>
        ) : (
          /* Accessible Non-3D View (Tabular Equipment Schedule) */
          <div className="w-full h-full p-6 overflow-y-auto bg-slate-950 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">Non-3D Accessible Equipment & Distribution Schedule</h2>
                <p className="text-xs text-slate-400">
                  Full textual equivalent of the 3D model with ratings, protection, and governing equations.
                </p>
              </div>
              <button
                onClick={() => setShowAccessibleView(false)}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
              >
                Switch to 3D Canvas
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <th className="p-3 font-semibold">Tag</th>
                    <th className="p-3 font-semibold">Equipment Name</th>
                    <th className="p-3 font-semibold">Voltage</th>
                    <th className="p-3 font-semibold">Location</th>
                    <th className="p-3 font-semibold">Rating / Sizing</th>
                    <th className="p-3 font-semibold">Protection Setting</th>
                    <th className="p-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11.5px]">
                  {Object.values(EQUIPMENT_CATALOG).map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/50 transition cursor-pointer ${
                        selectedTag === item.tag ? 'bg-indigo-950/40 text-cyan-300' : ''
                      }`}
                      onClick={() => onSelectTag(item.tag)}
                    >
                      <td className="p-3 font-bold text-cyan-400">{item.tag}</td>
                      <td className="p-3 font-sans font-medium text-slate-200">{item.name}</td>
                      <td className="p-3 text-slate-300">{item.voltageLevel}</td>
                      <td className="p-3 text-slate-400 font-sans">{item.floorLevel || 'Building Plant'}</td>
                      <td className="p-3 text-slate-300">{item.rating}</td>
                      <td className="p-3 text-amber-300/90">{item.protectionSetting || 'N/A'}</td>
                      <td className="p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTag(item.tag);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
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
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 gap-3 z-20">
        {/* Layer Visibility Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Visible:</span>
          </span>
          <button
            onClick={() => setOptions({ ...options, showHV: !options.showHV })}
            className={`px-2 py-0.5 rounded text-[11px] border font-medium transition ${
              options.showHV
                ? 'bg-red-950/60 border-red-500/50 text-red-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
          >
            HV 13.8 kV
          </button>
          <button
            onClick={() => setOptions({ ...options, showTransformer: !options.showTransformer })}
            className={`px-2 py-0.5 rounded text-[11px] border font-medium transition ${
              options.showTransformer
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
          >
            Transformer
          </button>
          <button
            onClick={() => setOptions({ ...options, showLV: !options.showLV })}
            className={`px-2 py-0.5 rounded text-[11px] border font-medium transition ${
              options.showLV
                ? 'bg-sky-950/60 border-sky-500/50 text-sky-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
          >
            Main LV Board
          </button>
          <button
            onClick={() => setOptions({ ...options, showFeeders: !options.showFeeders })}
            className={`px-2 py-0.5 rounded text-[11px] border font-medium transition ${
              options.showFeeders
                ? 'bg-blue-950/60 border-blue-500/50 text-blue-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
          >
            Floor Panels
          </button>
          <button
            onClick={() => setOptions({ ...options, showAPFC: !options.showAPFC })}
            className={`px-2 py-0.5 rounded text-[11px] border font-medium transition ${
              options.showAPFC
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
          >
            APFC Bank
          </button>
          <button
            onClick={() => setOptions({ ...options, showEmergency: !options.showEmergency })}
            className={`px-2 py-0.5 rounded text-[11px] border font-medium transition ${
              options.showEmergency
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
          >
            Generator & Fire
          </button>
          <button
            onClick={() => setOptions({ ...options, showLoads: !options.showLoads })}
            className={`px-2 py-0.5 rounded text-[11px] border font-medium transition ${
              options.showLoads
                ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
          >
            Loads
          </button>
        </div>

        {/* Render Engine & Disclaimer Badge */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Engine: <strong className="text-slate-200">{engineType}</strong></span>
          </span>
          <span className="text-slate-500 hidden md:inline">
            Diagrammatic visualization • Not to scale • Room placement illustrative
          </span>
        </div>
      </div>
    </div>
  );
};
