import React, { useState } from 'react';
import {
  Layers,
  Zap,
  BarChart3,
  TrendingUp,
  Activity,
  Shield,
  Scale,
  BookOpen,
  Info,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { NavView, ScenarioId } from './types/powerSystem';
import { ScenarioBar } from './components/ScenarioBar';
import { OverviewView } from './components/OverviewView';
import { View3DBuilding } from './components/View3DBuilding';
import { SingleLineDiagram } from './components/SingleLineDiagram';
import { LoadDemandView } from './components/LoadDemandView';
import { PowerFactorView } from './components/PowerFactorView';
import { VoltageLoadingView } from './components/VoltageLoadingView';
import { ShortCircuitProtectionView } from './components/ShortCircuitProtectionView';
import { DesignAlternativesView } from './components/DesignAlternativesView';
import { AssumptionsStandardsView } from './components/AssumptionsStandardsView';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>('overview');
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>('A1_Y10_corrected');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: NavView; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: '1. Overview', icon: <Info className="w-4 h-4" /> },
    { id: '3d-view', label: '2. 3D Distribution View', icon: <Layers className="w-4 h-4" /> },
    { id: 'sld', label: '3. Single-Line Diagram', icon: <Zap className="w-4 h-4" /> },
    { id: 'load-demand', label: '4. Load & Demand', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'pfc', label: '5. Power Factor (APFC)', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'voltage-loading', label: '6. Voltage & Loading', icon: <Activity className="w-4 h-4" /> },
    { id: 'fault-protection', label: '7. Short-Circuit & Protection', icon: <Shield className="w-4 h-4" /> },
    { id: 'alternatives-econ', label: '8. Alternatives & Economics', icon: <Scale className="w-4 h-4" /> },
    { id: 'assumptions-files', label: '9. Assumptions & Reports', icon: <BookOpen className="w-4 h-4" /> }
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans">
      {/* Top Main Navigation Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 z-40 select-none shadow-xs">
        {/* Brand & Project Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-600/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                EEA108D Power System Design
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold hidden sm:inline">
                Capstone Group 1
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Commercial Building Electrical Power System • Mapua University
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 p-3 space-y-1 z-50 shadow-md">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                currentView === item.id ? 'bg-cyan-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Global Scenario Selector & Telemetry Bar */}
      <ScenarioBar
        activeScenarioId={activeScenarioId}
        onSelectScenario={setActiveScenarioId}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {currentView === 'overview' && (
          <div className="h-full overflow-y-auto">
            <OverviewView
              onNavigate={setCurrentView}
              onSelectScenario={setActiveScenarioId}
            />
          </div>
        )}

        {currentView === '3d-view' && (
          <View3DBuilding
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            activeScenarioId={activeScenarioId}
          />
        )}

        {currentView === 'sld' && (
          <div className="h-full p-4">
            <SingleLineDiagram
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
              activeScenarioId={activeScenarioId}
            />
          </div>
        )}

        {currentView === 'load-demand' && (
          <div className="h-full overflow-y-auto">
            <LoadDemandView />
          </div>
        )}

        {currentView === 'pfc' && (
          <div className="h-full overflow-y-auto">
            <PowerFactorView />
          </div>
        )}

        {currentView === 'voltage-loading' && (
          <div className="h-full overflow-y-auto">
            <VoltageLoadingView />
          </div>
        )}

        {currentView === 'fault-protection' && (
          <div className="h-full overflow-y-auto">
            <ShortCircuitProtectionView />
          </div>
        )}

        {currentView === 'alternatives-econ' && (
          <div className="h-full overflow-y-auto">
            <DesignAlternativesView />
          </div>
        )}

        {currentView === 'assumptions-files' && (
          <div className="h-full overflow-y-auto">
            <AssumptionsStandardsView />
          </div>
        )}
      </main>

      {/* Engineering Footer Legend */}
      <footer className="px-4 py-1.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 z-30 select-none">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">Color Legend:</span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>13.8 kV MV / Fire</span>
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>400 V Normal Supply</span>
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Standby Generator / ATS</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Detuned APFC (p=7%)</span>
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span>Inspected Item</span>
          </span>
        </div>

        <div className="text-slate-500 font-mono text-[10.5px]">
          Rev 0 • Checksum: 4af2946ec053642f • Academic Engineering Design
        </div>
      </footer>
    </div>
  );
};
