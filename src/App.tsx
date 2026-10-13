import React, { Suspense, lazy, useState } from 'react';
import { Activity, ArrowUpRight, BarChart3, BookOpen, Box, Building2, ChevronRight, Layers, Menu, Scale, Shield, TrendingUp, X } from 'lucide-react';
import { NavView, ScenarioId } from './types/powerSystem';
import { ScenarioBar } from './components/ScenarioBar';
import { OverviewView } from './components/OverviewView';
import { SingleLineDiagram } from './components/SingleLineDiagram';
import { LoadDemandView } from './components/LoadDemandView';
import { PowerFactorView } from './components/PowerFactorView';
import { VoltageLoadingView } from './components/VoltageLoadingView';
import { ShortCircuitProtectionView } from './components/ShortCircuitProtectionView';
import { DesignAlternativesView } from './components/DesignAlternativesView';
import { AssumptionsStandardsView } from './components/AssumptionsStandardsView';
const View3DBuilding = lazy(() => import('./components/View3DBuilding').then(m => ({ default: m.View3DBuilding })));
const navItems = [
  { id: '3d-view', label: 'Building model', icon: Box, group: 'EXPLORE' },
  { id: 'overview', label: 'Project overview', icon: Building2 },
  { id: 'sld', label: 'Single-line diagram', icon: Layers },
  { id: 'load-demand', label: 'Load & demand', icon: BarChart3, group: 'ENGINEERING' },
  { id: 'pfc', label: 'Power factor', icon: TrendingUp },
  { id: 'voltage-loading', label: 'Voltage & loading', icon: Activity },
  { id: 'fault-protection', label: 'Fault & protection', icon: Shield },
  { id: 'alternatives-econ', label: 'Design alternatives', icon: Scale },
  { id: 'assumptions-files', label: 'Reports & references', icon: BookOpen, group: 'DOCUMENTATION' }
] as const;

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>('3d-view');
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>('A1_Y10_corrected');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = (view: NavView) => { setCurrentView(view); setMenuOpen(false); };
  const current = navItems.find(item => item.id === currentView)!;
  return <div className="app-shell">
    {menuOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`app-navigation ${menuOpen ? 'is-open' : ''}`}>
      <button className="brand" onClick={() => navigate('3d-view')} aria-label="Commerce building model"><span className="brand-mark"><Building2 size={23} strokeWidth={1.4} /></span><span>commerce<span className="brand-period">.</span><small>POWER SYSTEM STUDIO</small></span></button>
      <div className="project-chip"><span className="project-avatar">01</span><span>Commercial building<small>EEA108D · Group 1</small></span><ChevronRight size={14} /></div>
      <nav className="main-navigation" aria-label="Main navigation">{navItems.map(item => <React.Fragment key={item.id}>{'group' in item && <div className="nav-group">{item.group}</div>}<button className={currentView === item.id ? 'active' : ''} onClick={() => navigate(item.id)} aria-current={currentView === item.id ? 'page' : undefined}><item.icon size={17} strokeWidth={1.6} /><span>{item.label}</span>{currentView === item.id && <span className="nav-active-dot" />}</button></React.Fragment>)}</nav>
      <div className="nav-project-note"><span className="eyebrow">THE DESIGN IN NUMBERS</span><strong>12,000 <span>m²</span></strong><p>Six-storey mixed-use development<br />Metro Manila, Philippines</p><div><span>Retail</span><span>Workplace</span></div></div>
      <div className="nav-footer"><span className="university-monogram">M</span><div>Mapúa University<small>School of EECE · Capstone 2026</small></div></div>
    </aside>
    <div className="app-main">
      <header className="app-header"><div className="header-breadcrumb"><button className="icon-button nav-menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button><span>Project workspace</span><ChevronRight size={13} /><strong>{current.label}</strong></div><div className="header-actions"><span className="academic-badge"><span className="live-dot" /> Academic design</span><a href={`${import.meta.env.BASE_URL}Commercial_Building_Power_System_Design_Report.pdf`} target="_blank" rel="noreferrer">Design report <ArrowUpRight size={14} /></a><span className="team-avatar">G1</span></div></header>
      <ScenarioBar activeScenarioId={activeScenarioId} onSelectScenario={setActiveScenarioId} />
      <main className={`app-content ${currentView !== '3d-view' ? 'report-content' : ''}`}>
        {currentView === '3d-view' && <Suspense fallback={<div className="scene-loading"><Box size={28} /><h2>Opening the building model</h2></div>}><View3DBuilding selectedTag={selectedTag} onSelectTag={setSelectedTag} activeScenarioId={activeScenarioId} /></Suspense>}
        {currentView === 'overview' && <OverviewView onNavigate={navigate} onSelectScenario={setActiveScenarioId} />}
        {currentView === 'sld' && <div className="sld-layout"><SingleLineDiagram selectedTag={selectedTag} onSelectTag={setSelectedTag} activeScenarioId={activeScenarioId} /></div>}
        {currentView === 'load-demand' && <LoadDemandView />}
        {currentView === 'pfc' && <PowerFactorView />}
        {currentView === 'voltage-loading' && <VoltageLoadingView />}
        {currentView === 'fault-protection' && <ShortCircuitProtectionView />}
        {currentView === 'alternatives-econ' && <DesignAlternativesView />}
        {currentView === 'assumptions-files' && <AssumptionsStandardsView />}
      </main>
      <footer className="app-status"><span><span className="live-dot" /> EEA108D / E06 <span className="status-separator">·</span> Concept design study</span><span>13.8 kV intake <span className="status-separator">→</span> 400/230 V distribution <span className="status-separator">·</span> Revision 0</span></footer>
    </div>
  </div>;
};
