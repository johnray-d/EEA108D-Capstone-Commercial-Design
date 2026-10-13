import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Box, Check, Compass, Eye, Focus, Layers, Loader2, Maximize2, Moon, MousePointer2, RotateCcw, RotateCw, Search, Settings2, Sun, Table2, X, Zap } from 'lucide-react';
import { BuildingSceneManager, CameraPreset } from '../3d/BuildingScene';
import { EQUIPMENT_CATALOG } from '../data/equipmentDb';
import { ScenarioId, ViewOptions3D } from '../types/powerSystem';
import { InspectorPanel } from './InspectorPanel';
import results from '../data/calculated_results.json';

interface Props { selectedTag: string | null; onSelectTag: (tag: string | null) => void; activeScenarioId: ScenarioId }
const presets: { id: CameraPreset; name: string; note: string }[] = [
  { id: 'home', name: 'Building', note: 'Full perspective' }, { id: 'plant', name: 'Substation', note: 'Utility & transformer' },
  { id: 'riser', name: 'Service riser', note: 'Radial floor feeders' }, { id: 'retail', name: 'Retail', note: 'Levels 01–02' },
  { id: 'office', name: 'Workplace', note: 'Levels 03–06' }, { id: 'roof', name: 'Rooftop', note: '36 VRF outdoor units' },
  { id: 'basement', name: 'Service court', note: 'Standby & pumps' }
];
const initialOptions: ViewOptions3D = {
  shellMode: 'normal', shellOpacity: 0.65, explodedOffset: 0, showHV: true, showTransformer: true,
  showLV: true, showFeeders: true, showEmergency: true, showLoads: true, showAPFC: true,
  showPowerPath: 'none', animateFlow: true, lighting: 'day', quality: 'balanced', autoRotate: false,
  showLabels: false, isolatedFloor: null, apfcEnergized: true
};

export const View3DBuilding: React.FC<Props> = ({ selectedTag, onSelectTag, activeScenarioId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<BuildingSceneManager | null>(null);
  const selectRef = useRef(onSelectTag);
  selectRef.current = onSelectTag;
  const selectedTagRef = useRef(selectedTag);
  selectedTagRef.current = selectedTag;
  const [options, setOptions] = useState<ViewOptions3D>(() => ({ ...initialOptions, animateFlow: !window.matchMedia('(prefers-reduced-motion: reduce)').matches }));
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);
  const [preset, setPreset] = useState<CameraPreset>('home');
  const [schedule, setSchedule] = useState(false);
  const [panel, setPanel] = useState<'scene' | 'equipment'>('scene');
  const [mobileControls, setMobileControls] = useState(false);
  const [query, setQuery] = useState('');
  const change = <K extends keyof ViewOptions3D>(key: K, value: ViewOptions3D[K]) => setOptions(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;
    const manager = new BuildingSceneManager(canvasRef.current, {
      onSelectEquipment: tag => selectRef.current(tag), onHoverEquipment: setHovered
    }, optionsRef.current);
    managerRef.current = manager;
    manager.init().then(type => {
      if (cancelled) return;
      manager.updateViewOptions(optionsRef.current);
      manager.selectEquipment(selectedTagRef.current);
      setEngine(type);
      setLoading(false);
    }).catch(err => {
      if (cancelled) return;
      console.error('3D scene initialization failed', err);
      setError('The 3D renderer could not start. Enable browser hardware acceleration, or explore the equipment schedule.');
      setLoading(false);
    });
    const observer = new ResizeObserver(() => manager.resize());
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => { cancelled = true; observer.disconnect(); manager.dispose(); managerRef.current = null; };
  }, []);

  useEffect(() => { managerRef.current?.updateViewOptions(options); }, [options]);
  useEffect(() => { managerRef.current?.selectEquipment(selectedTag); }, [selectedTag]);
  useEffect(() => { if (!schedule) requestAnimationFrame(() => managerRef.current?.resize()); }, [schedule]);
  useEffect(() => {
    change('apfcEnergized', results.scenarios[activeScenarioId].apfcState === 'AUTO');
    if (activeScenarioId === 'GEN_essential') change('showPowerPath', 'emergency');
    else if (activeScenarioId === 'A1_Y10_low_fire') change('showPowerPath', 'fire');
    else setOptions(prev => ({ ...prev, showPowerPath: prev.showPowerPath === 'none' ? 'none' : 'normal' }));
  }, [activeScenarioId]);

  const choosePreset = (id: CameraPreset) => {
    setPreset(id);
    const next = { ...options, autoRotate: false, isolatedFloor: null };
    if (id === 'riser' || id === 'retail' || id === 'office') next.shellMode = 'cutaway';
    setOptions(next);
    managerRef.current?.updateViewOptions(next);
    managerRef.current?.setCameraPreset(id);
  };
  const isolate = (floor: number | null) => {
    const next = { ...options, isolatedFloor: floor, shellMode: floor === null ? options.shellMode : 'cutaway' as const, autoRotate: false };
    setOptions(next);
    managerRef.current?.updateViewOptions(next);
    if (floor !== null && floor < 6) managerRef.current?.focusFloor(floor);
    else managerRef.current?.setCameraPreset(floor === 6 ? 'roof' : 'home');
  };
  const inspect = (id: string) => {
    const next = { ...options, isolatedFloor: null, shellMode: 'cutaway' as const, autoRotate: false,
      showHV: true, showTransformer: true, showLV: true, showFeeders: true, showEmergency: true, showLoads: true, showAPFC: true };
    setOptions(next);
    managerRef.current?.updateViewOptions(next);
    onSelectTag(id);
    managerRef.current?.focusEquipment(id);
    setMobileControls(false);
  };
  const equipment = Object.entries(EQUIPMENT_CATALOG).filter(([id, item]) => `${id} ${item.name}`.toLowerCase().includes(query.toLowerCase()));
  const hoveredEquipment = hovered ? EQUIPMENT_CATALOG[hovered] : null;
  const fullScreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await viewportRef.current?.requestFullscreen();
    } catch { /* Fullscreen may be restricted by the embedding browser. */ }
  };

  return <div className="model-workspace">
    <div className="model-viewport" ref={viewportRef}>
      <canvas ref={canvasRef} className="model-canvas" style={{ visibility: schedule ? 'hidden' : 'visible' }} tabIndex={0}
        aria-label="Interactive six-storey commercial building. Drag to orbit, scroll to zoom, right-drag to pan. Use the scene controls or equipment directory for keyboard access."
        onKeyDown={e => { if (e.key.toLowerCase() === 'h') choosePreset('home'); if (e.key === 'Escape') onSelectTag(null); }} />
      {!schedule && <>
        <div className="viewport-heading"><span className="eyebrow"><span className="live-dot" /> PROJECT MODEL / 01</span><h1>Commerce, connected.</h1><p>Six levels. One integrated power system.</p></div>
        <div className="viewport-tools">
          <button className="icon-button mobile-settings" title="Scene settings" aria-label="Scene settings" onClick={() => setMobileControls(!mobileControls)}><Settings2 size={17} /></button>
          <button className="icon-button" title="Reset view (H)" aria-label="Reset view" onClick={() => choosePreset('home')}><RotateCcw size={17} /></button>
          <button className="icon-button" title="Fullscreen" aria-label="Fullscreen" onClick={fullScreen}><Maximize2 size={17} /></button>
        </div>
        <div className="floor-selector" aria-label="Isolate floor"><span>LEVEL</span>
          {[6, 5, 4, 3, 2, 1, 0].map(f => <button key={f} className={options.isolatedFloor === f ? 'active' : ''} onClick={() => isolate(options.isolatedFloor === f ? null : f)} title={f === 6 ? 'Isolate rooftop' : `Isolate level ${f + 1}`} aria-label={f === 6 ? 'Isolate rooftop' : `Isolate level ${f + 1}`} aria-pressed={options.isolatedFloor === f}>{f === 6 ? 'R' : `0${f + 1}`}</button>)}
          <button className={options.isolatedFloor === null ? 'active' : ''} onClick={() => isolate(null)} aria-pressed={options.isolatedFloor === null}>All</button>
        </div>
        <div className="model-compass"><Compass size={27} strokeWidth={1} /><span>ORBIT VIEW</span></div>
        <div className="model-bottom"><div className="viewport-mode" aria-label="Building envelope">
          {([{ id: 'normal', label: 'Exterior', icon: Box }, { id: 'cutaway', label: 'Cutaway', icon: Layers }, { id: 'hidden', label: 'Structure', icon: Eye }] as const).map(({ id, label, icon: Icon }) => <button key={id} aria-pressed={options.shellMode === id} className={options.shellMode === id ? 'active' : ''} onClick={() => change('shellMode', id)}><Icon size={15} />{label}</button>)}
        </div><div className="canvas-help"><MousePointer2 size={13} /> Drag to orbit <span>·</span> Scroll to zoom <span>·</span> Right-drag to pan</div></div>
        {hoveredEquipment && !selectedTag && <div className="equipment-tooltip"><span>{hoveredEquipment.tag}</span><strong>{hoveredEquipment.name}</strong><small>Click to inspect equipment <ArrowUpRight size={12} /></small></div>}
        {loading && <div className="scene-loading"><div className="loading-mark"><Box size={28} strokeWidth={1} /></div><h2>Assembling your building</h2><p>Architecture, materials & electrical systems</p><Loader2 size={20} className="animate-spin" /></div>}
        {error && <div className="scene-loading"><Box size={32} /><h2>3D view unavailable</h2><p>{error}</p><button className="primary-button" onClick={() => setSchedule(true)}>Open equipment schedule</button></div>}
      </>}
      {schedule && <div className="equipment-schedule"><div className="schedule-heading"><div><span className="eyebrow">ASSET DIRECTORY</span><h2>Equipment schedule</h2><p>The complete electrical system, accessible without the 3D canvas.</p></div><button className="secondary-button" onClick={() => setSchedule(false)}><Box size={15} /> Return to model</button></div><div className="table-scroll"><table><thead><tr><th>Tag</th><th>Equipment</th><th>Voltage</th><th>Rating</th><th /></tr></thead><tbody>{Object.entries(EQUIPMENT_CATALOG).map(([id, item]) => <tr key={id}><td>{item.tag}</td><td>{item.name}</td><td>{item.voltageLevel}</td><td>{item.rating}</td><td><button className="text-button" onClick={() => onSelectTag(id)}>Inspect <ArrowUpRight size={14} /></button></td></tr>)}</tbody></table></div></div>}
      <InspectorPanel selectedTag={selectedTag} onClose={() => onSelectTag(null)} />
      {activeScenarioId.startsWith('A2') && <div className="model-scenario-note">A2 results selected · Architecture shows the recommended A1 installation. See the single-line diagram for topology.</div>}
    </div>
    <aside className={`scene-sidebar ${mobileControls ? 'mobile-open' : ''}`}>
      <div className="scene-sidebar-tabs"><button className={panel === 'scene' ? 'active' : ''} onClick={() => setPanel('scene')}><Settings2 size={14} /> Scene</button><button className={panel === 'equipment' ? 'active' : ''} onClick={() => setPanel('equipment')}><Zap size={14} /> Equipment</button><button className="mobile-settings icon-button" aria-label="Close scene settings" onClick={() => setMobileControls(false)}><X size={16} /></button></div>
      <div className="scene-sidebar-scroll">
        {panel === 'scene' ? <>
          <section className="control-section"><div className="section-caption">01 <span>Explore the building</span></div><div className="camera-grid">{presets.map(p => <button key={p.id} className={preset === p.id ? 'active' : ''} onClick={() => choosePreset(p.id)}><span>{p.name}</span><small>{p.note}</small>{preset === p.id && <span className="preset-dot" />}</button>)}</div></section>
          <section className="control-section"><div className="section-caption">02 <span>Atmosphere</span></div><div className="segmented-control"><button className={options.lighting === 'day' ? 'active' : ''} aria-pressed={options.lighting === 'day'} onClick={() => change('lighting', 'day')}><Sun size={15} /> Daylight</button><button className={options.lighting === 'dusk' ? 'active' : ''} aria-pressed={options.lighting === 'dusk'} onClick={() => change('lighting', 'dusk')}><Moon size={15} /> Dusk</button></div><label className="control-row"><span>Render quality</span><select aria-label="Render quality" value={options.quality} onChange={e => change('quality', e.target.value as 'balanced' | 'high')}><option value="balanced">Balanced</option><option value="high">High detail</option></select></label><button className="control-row toggle-row" aria-pressed={options.autoRotate} onClick={() => change('autoRotate', !options.autoRotate)}><span><RotateCw size={14} /> Slow orbit</span><span className={`toggle ${options.autoRotate ? 'on' : ''}`} /></button></section>
          <section className="control-section"><div className="section-caption">03 <span>Look inside</span></div><label className="slider-label" htmlFor="floor-spacing">Separate floors <output>{Math.round(options.explodedOffset * 100)}%</output></label><input id="floor-spacing" type="range" min="0" max="1" step="0.05" value={options.explodedOffset} onChange={e => { const next = { ...options, explodedOffset: +e.target.value, shellMode: 'cutaway' as const }; setOptions(next); managerRef.current?.updateViewOptions(next); managerRef.current?.setCameraPreset('home'); }} /><label className="slider-label" htmlFor="glass-opacity">Glass opacity <output>{Math.round(options.shellOpacity * 100)}%</output></label><input id="glass-opacity" type="range" min="0.1" max="1" step="0.05" value={options.shellOpacity} onChange={e => change('shellOpacity', +e.target.value)} /><button className="control-row toggle-row" aria-pressed={options.showLabels} onClick={() => change('showLabels', !options.showLabels)}><span>Model labels</span><span className={`toggle ${options.showLabels ? 'on' : ''}`} /></button></section>
          <section className="control-section"><div className="section-caption">04 <span>Electrical distribution</span></div><label className="control-row"><span>Trace supply</span><select aria-label="Trace supply" value={options.showPowerPath} onChange={e => change('showPowerPath', e.target.value as ViewOptions3D['showPowerPath'])}><option value="none">Off</option><option value="normal">Normal</option><option value="emergency">Standby</option><option value="fire">Fire pump</option></select></label>{options.showPowerPath !== 'none' && <button className="control-row toggle-row" aria-pressed={options.animateFlow} onClick={() => change('animateFlow', !options.animateFlow)}><span><Zap size={14} /> Animate flow</span><span className={`toggle ${options.animateFlow ? 'on' : ''}`} /></button>}<div className="layer-list">{([
            ['showHV', 'Medium voltage', '#b85142'], ['showTransformer', 'Transformer', '#59877b'], ['showLV', 'Switchboards', '#518092'], ['showFeeders', 'Floor panels & riser', '#71958e'], ['showAPFC', 'APFC bank', '#4c8772'], ['showEmergency', 'Standby & fire', '#cda64e'], ['showLoads', 'Mechanical loads', '#837496']
          ] as const).map(([key, label, color]) => <button key={key} aria-pressed={options[key]} onClick={() => change(key, !options[key])}><span className="layer-color" style={{ background: color }} /><span>{label}</span><span className={`layer-check ${options[key] ? 'checked' : ''}`}>{options[key] && <Check size={11} />}</span></button>)}</div></section>
        </> : <section className="control-section"><div className="section-caption">DIRECTORY <span>{equipment.length} assets</span></div><label className="equipment-search"><Search size={14} /><input placeholder="Find equipment…" aria-label="Find equipment" value={query} onChange={e => setQuery(e.target.value)} /></label><div className="equipment-list">{equipment.map(([id, item]) => <button key={id} className={selectedTag === id ? 'active' : ''} onClick={() => inspect(id)}><span className="equipment-tag">{item.tag}</span><strong>{item.name}</strong><small>{item.voltageLevel} <Focus size={13} /></small></button>)}{equipment.length === 0 && <p>No matching equipment.</p>}</div></section>}
        <section className="model-note"><span className="eyebrow">DESIGN BASIS</span><p>6 floors × 2,000 m²<br />Retail 01–02 · Offices 03–06</p><small>Architecture and equipment placement are illustrative. Electrical ratings follow the capstone report.</small></section>
      </div>
      <div className="scene-sidebar-footer"><button onClick={() => { setSchedule(!schedule); setMobileControls(false); }}><Table2 size={14} />{schedule ? 'Return to 3D model' : 'Equipment schedule'}<ArrowUpRight size={14} /></button><span><span className="live-dot" />{loading ? 'Preparing scene' : error ? 'Schedule available' : `${engine} · PBR materials`}</span></div>
    </aside>
  </div>;
};
