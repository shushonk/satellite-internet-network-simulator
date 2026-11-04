import React, { useState, useEffect, useRef } from 'react';
import {
  Satellite,
  GroundStation,
  LaserLink,
  ConstellationConfig,
  MetricPoint,
  NetworkScenario,
} from './types/simulation';
import {
  DEFAULT_CONFIG,
  DEFAULT_GROUND_STATIONS,
  calculateSatelliteState,
  computeSlantRangeAndElevation,
  calculateLinkBudget,
  buildLaserLinks,
  calculateCoverageAnalysis,
} from './services/simulationEngine';

import { Earth3D } from './components/Earth3D';
import { NetworkTopology } from './components/NetworkTopology';
import { GroundStationsPanel } from './components/GroundStationsPanel';
import { CoverageAnalysis } from './components/CoverageAnalysis';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { ConstellationConfigPanel } from './components/ConstellationConfig';
import { AINetworkAssistant } from './components/AINetworkAssistant';
import { ScenarioSelector, SCENARIOS } from './components/ScenarioSelector';
import { SatelliteDetailsModal } from './components/SatelliteDetailsModal';
import { AboutModal } from './components/AboutModal';

import {
  Globe,
  Radio,
  Network,
  Server,
  Activity,
  Sliders,
  Bot,
  Info,
  Clock,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

type TabType =
  | 'overview'
  | '3d_sim'
  | 'topology'
  | 'ground_stations'
  | 'coverage'
  | 'analytics'
  | 'config'
  | 'ai_assistant';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Simulation State
  const [config, setConfig] = useState<ConstellationConfig>(DEFAULT_CONFIG);
  const [groundStations, setGroundStations] = useState<GroundStation[]>(DEFAULT_GROUND_STATIONS);
  const [failedSatIds, setFailedSatIds] = useState<Set<string>>(new Set());
  const [failedStationIds, setFailedStationIds] = useState<Set<string>>(new Set());
  const [activeScenario, setActiveScenario] = useState<NetworkScenario>(SCENARIOS[0]);

  // Simulation Time Controls
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Selected Nodes
  const [selectedSatId, setSelectedSatId] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Modals
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);

  // Dynamic Telemetry Metrics
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [laserLinks, setLaserLinks] = useState<LaserLink[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>([]);

  // Telemetry Aggregates
  const [telemetry, setTelemetry] = useState({
    avgLatency: 24,
    totalThroughputGbps: 18.5,
    activeSatellites: 60,
    connectedGroundStations: 10,
    activeISLCount: 90,
    globalCoveragePct: 86.5,
    weakStations: [] as string[],
  });

  // Calculate satellite positions at timeSeconds
  useEffect(() => {
    const newSats: Satellite[] = [];
    const count = config.planesCount * config.satsPerPlane;

    for (let p = 0; p < config.planesCount; p++) {
      for (let s = 0; s < config.satsPerPlane; s++) {
        const sat = calculateSatelliteState(p, s, config, timeSeconds, failedSatIds);
        newSats.push(sat);
      }
    }

    setSatellites(newSats);

    // Laser ISL links
    const links = buildLaserLinks(newSats, config);
    setLaserLinks(links);

    // Calculate Ground Station handovers & downlinks
    let totalLatency = 0;
    let connectedCount = 0;
    let totalThroughputMbps = 0;
    const weakList: string[] = [];

    const updatedStations = groundStations.map((st) => {
      if (failedStationIds.has(st.id)) {
        return {
          ...st,
          status: 'offline' as const,
          connectedSatId: null,
          latencyMs: 0,
          downloadMbps: 0,
          uploadMbps: 0,
          signalStrengthDbm: -120,
        };
      }

      // Find best visible satellite (highest elevation angle >= minElevationDeg)
      let bestSat: Satellite | null = null;
      let maxElevation = -90;
      let bestDist = Infinity;

      newSats.forEach((sat) => {
        if (sat.status === 'failed') return;
        const { distanceKm, elevationDeg } = computeSlantRangeAndElevation(st.lat, st.lon, sat.rawEcef);
        if (elevationDeg >= config.minElevationDeg && elevationDeg > maxElevation) {
          maxElevation = elevationDeg;
          bestSat = sat;
          bestDist = distanceKm;
        }
      });

      if (bestSat) {
        const link = calculateLinkBudget(bestDist, maxElevation, config);
        const lat = link.propagationDelayMs * 2 + 12; // Slant propagation delay + network routing
        totalLatency += lat;
        connectedCount++;
        totalThroughputMbps += link.downloadMbps;

        if (maxElevation < config.minElevationDeg + 5) {
          weakList.push(st.name);
        }

        return {
          ...st,
          status: 'connected' as const,
          connectedSatId: (bestSat as Satellite).id,
          elevationDeg: maxElevation,
          distanceKm: bestDist,
          latencyMs: lat,
          signalStrengthDbm: link.rssiDbm,
          snrDb: link.snrDb,
          downloadMbps: link.downloadMbps,
          uploadMbps: link.uploadMbps,
        };
      } else {
        return {
          ...st,
          status: 'searching' as const,
          connectedSatId: null,
          latencyMs: 99,
          downloadMbps: 0,
          uploadMbps: 0,
          signalStrengthDbm: -110,
        };
      }
    });

    setGroundStations(updatedStations);

    // Coverage analysis
    const { coveragePct } = calculateCoverageAnalysis(newSats, config);

    const avgLat = connectedCount > 0 ? totalLatency / connectedCount : 45;
    const totalGbps = (totalThroughputMbps / 1000) * (activeScenario.trafficMultiplier || 1.0);

    setTelemetry({
      avgLatency: avgLat,
      totalThroughputGbps: totalGbps,
      activeSatellites: newSats.filter((s) => s.status === 'active').length,
      connectedGroundStations: connectedCount,
      activeISLCount: links.length,
      globalCoveragePct: coveragePct,
      weakStations: weakList,
    });
  }, [timeSeconds, config, failedSatIds, failedStationIds, activeScenario]);

  // Simulation Clock Tick Loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTimeSeconds((prev) => prev + 1.5 * simSpeed);
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, simSpeed]);

  // Record Metric History for Recharts
  useEffect(() => {
    const date = new Date(timeSeconds * 1000);
    const mins = String(Math.floor(timeSeconds / 60)).padStart(2, '0');
    const secs = String(Math.floor(timeSeconds % 60)).padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    const newPoint: MetricPoint = {
      timestamp: timeSeconds,
      timeStr,
      avgLatency: telemetry.avgLatency,
      downloadMbps: (telemetry.totalThroughputGbps * 1000) / Math.max(1, telemetry.connectedGroundStations),
      uploadMbps: (telemetry.totalThroughputGbps * 200) / Math.max(1, telemetry.connectedGroundStations),
      totalThroughputGbps: telemetry.totalThroughputGbps,
      activeSatellites: telemetry.activeSatellites,
      connectedStations: telemetry.connectedGroundStations,
      activeISLs: telemetry.activeISLCount,
      packetLossPct: Math.max(0.2, (100 - telemetry.globalCoveragePct) * 0.15),
      globalCoveragePct: telemetry.globalCoveragePct,
    };

    setMetricsHistory((prev) => [...prev.slice(-30), newPoint]);
  }, [Math.floor(timeSeconds / 5)]);

  // Apply Scenario Changes
  const handleSelectScenario = (scenario: NetworkScenario) => {
    setActiveScenario(scenario);

    // Apply config overrides if present
    if (scenario.configOverrides) {
      setConfig((prev) => ({ ...prev, ...scenario.configOverrides }));
    }

    // Apply failed sat overrides
    if (scenario.failedSatIds) {
      setFailedSatIds(new Set(scenario.failedSatIds));
    } else {
      setFailedSatIds(new Set());
    }

    // Apply failed station overrides
    if (scenario.failedStationIds) {
      setFailedStationIds(new Set(scenario.failedStationIds));
    } else {
      setFailedStationIds(new Set());
    }
  };

  const handleToggleFailSatellite = (satId: string) => {
    setFailedSatIds((prev) => {
      const next = new Set(prev);
      if (next.has(satId)) next.delete(satId);
      else next.add(satId);
      return next;
    });
  };

  const selectedSatObj = satellites.find((s) => s.id === selectedSatId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header & Telemetry Status Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-cyan-500/20 px-4 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-xl">
        {/* App Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-bold text-white tracking-wide flex items-center gap-2 font-mono">
              <span>Satellite Internet Network Simulator</span>
            </h1>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
              <span className="text-cyan-400">LEO Mesh Orbit Engine</span>
              <span>•</span>
              <span className="text-emerald-400">T+{Math.floor(timeSeconds / 60)}m {Math.floor(timeSeconds % 60)}s</span>
            </div>
          </div>
        </div>

        {/* Live Quick Metrics Bar */}
        <div className="hidden md:flex items-center gap-4 bg-slate-955 px-4 py-1.5 rounded-2xl border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Latency:</span>
            <span className="text-cyan-300 font-bold">{telemetry.avgLatency.toFixed(1)} ms</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Capacity:</span>
            <span className="text-purple-300 font-bold">{telemetry.totalThroughputGbps.toFixed(1)} Gbps</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Coverage:</span>
            <span className="text-emerald-300 font-bold">{telemetry.globalCoveragePct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Right Info & Preset Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAboutModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Aerospace Physics & About"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <nav className="bg-slate-900/60 border-b border-slate-800 px-4 lg:px-8 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 text-xs font-mono">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: '3d_sim', label: '3D Orbit View', icon: Globe },
          { id: 'topology', label: 'Network Topology', icon: Network },
          { id: 'ground_stations', label: 'Ground Stations', icon: Server },
          { id: 'coverage', label: 'Coverage Map', icon: Radio },
          { id: 'analytics', label: 'Analytics', icon: Activity },
          { id: 'config', label: 'Constellation Config', icon: Sliders },
          { id: 'ai_assistant', label: 'AI Network Assistant', icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content View Container */}
      <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Scenarios Preset Bar */}
        <ScenarioSelector
          activeScenarioId={activeScenario.id}
          onSelectScenario={handleSelectScenario}
        />

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 3D Earth Viewer Main Spotlight */}
            <div className="w-full h-[580px]">
              <Earth3D
                satellites={satellites}
                groundStations={groundStations}
                laserLinks={laserLinks}
                config={config}
                selectedSatId={selectedSatId}
                selectedStationId={selectedStationId}
                onSelectSat={setSelectedSatId}
                onSelectStation={setSelectedStationId}
                isPaused={isPaused}
                onTogglePause={() => setIsPaused(!isPaused)}
                onResetTime={() => setTimeSeconds(0)}
                simSpeed={simSpeed}
                onChangeSpeed={setSimSpeed}
                timeSeconds={timeSeconds}
              />
            </div>

            {/* Topology & Analytics Snippets Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NetworkTopology
                satellites={satellites}
                groundStations={groundStations}
                laserLinks={laserLinks}
                selectedSatId={selectedSatId}
                selectedStationId={selectedStationId}
                onSelectSat={setSelectedSatId}
                onSelectStation={setSelectedStationId}
              />

              <PerformanceAnalytics
                metricsHistory={metricsHistory}
                currentMetrics={{
                  activeSatellites: telemetry.activeSatellites,
                  connectedStations: telemetry.connectedGroundStations,
                  avgLatency: telemetry.avgLatency,
                  totalThroughputGbps: telemetry.totalThroughputGbps,
                  globalCoveragePct: telemetry.globalCoveragePct,
                  activeISLCount: telemetry.activeISLCount,
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: 3D SIMULATION */}
        {activeTab === '3d_sim' && (
          <div className="w-full h-[760px]">
            <Earth3D
              satellites={satellites}
              groundStations={groundStations}
              laserLinks={laserLinks}
              config={config}
              selectedSatId={selectedSatId}
              selectedStationId={selectedStationId}
              onSelectSat={setSelectedSatId}
              onSelectStation={setSelectedStationId}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused(!isPaused)}
              onResetTime={() => setTimeSeconds(0)}
              simSpeed={simSpeed}
              onChangeSpeed={setSimSpeed}
              timeSeconds={timeSeconds}
            />
          </div>
        )}

        {/* Tab 3: NETWORK TOPOLOGY */}
        {activeTab === 'topology' && (
          <NetworkTopology
            satellites={satellites}
            groundStations={groundStations}
            laserLinks={laserLinks}
            selectedSatId={selectedSatId}
            selectedStationId={selectedStationId}
            onSelectSat={setSelectedSatId}
            onSelectStation={setSelectedStationId}
          />
        )}

        {/* Tab 4: GROUND STATIONS */}
        {activeTab === 'ground_stations' && (
          <GroundStationsPanel
            groundStations={groundStations}
            satellites={satellites}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
            onAddStation={(newSt) => setGroundStations((prev) => [...prev, newSt])}
            onRemoveStation={(id) => setGroundStations((prev) => prev.filter((g) => g.id !== id))}
            onUpdateStation={(updatedSt) =>
              setGroundStations((prev) => prev.map((g) => (g.id === updatedSt.id ? updatedSt : g)))
            }
          />
        )}

        {/* Tab 5: COVERAGE ANALYSIS */}
        {activeTab === 'coverage' && (
          <CoverageAnalysis satellites={satellites} config={config} />
        )}

        {/* Tab 6: PERFORMANCE ANALYTICS */}
        {activeTab === 'analytics' && (
          <PerformanceAnalytics
            metricsHistory={metricsHistory}
            currentMetrics={{
              activeSatellites: telemetry.activeSatellites,
              connectedStations: telemetry.connectedGroundStations,
              avgLatency: telemetry.avgLatency,
              totalThroughputGbps: telemetry.totalThroughputGbps,
              globalCoveragePct: telemetry.globalCoveragePct,
              activeISLCount: telemetry.activeISLCount,
            }}
          />
        )}

        {/* Tab 7: CONSTELLATION CONFIG */}
        {activeTab === 'config' && (
          <ConstellationConfigPanel
            config={config}
            onChangeConfig={setConfig}
            onResetDefault={() => setConfig(DEFAULT_CONFIG)}
            metricsHistory={metricsHistory}
          />
        )}

        {/* Tab 8: AI NETWORK ASSISTANT */}
        {activeTab === 'ai_assistant' && (
          <AINetworkAssistant
            telemetryData={{
              scenario: activeScenario.name,
              totalSatellites: config.planesCount * config.satsPerPlane,
              activeSatellites: telemetry.activeSatellites,
              connectedGroundStations: telemetry.connectedGroundStations,
              totalGroundStations: groundStations.length,
              avgLatency: telemetry.avgLatency,
              totalThroughput: telemetry.totalThroughputGbps,
              activeISLCount: telemetry.activeISLCount,
              activeDownlinks: telemetry.connectedGroundStations,
              coveragePercentage: telemetry.globalCoveragePct,
              frequencyGHz: config.frequencyGHz,
              txPowerWatts: config.txPowerWatts,
              minElevationDeg: config.minElevationDeg,
              weakStations: telemetry.weakStations,
            }}
          />
        )}
      </main>

      {/* Satellite Details Inspector Modal */}
      {selectedSatObj && (
        <SatelliteDetailsModal
          satellite={selectedSatObj}
          onClose={() => setSelectedSatId(null)}
          groundStations={groundStations}
          onToggleFailSatellite={handleToggleFailSatellite}
        />
      )}

      {/* Aerospace Info Modal */}
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
    </div>
  );
}
