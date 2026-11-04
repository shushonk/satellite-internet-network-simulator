import React from 'react';
import { NetworkScenario } from '../types/simulation';
import { Layers, Activity, AlertTriangle, Radio, Wifi, Zap, Globe2 } from 'lucide-react';

export const SCENARIOS: NetworkScenario[] = [
  {
    id: 'normal',
    name: 'Normal Network Operation',
    description: 'Baseline 550 km LEO constellation operating with standard laser links and optimal ground station handovers.',
    icon: 'activity',
    configOverrides: {
      altitudeKm: 550,
      inclinationDeg: 53.0,
      planesCount: 6,
      satsPerPlane: 10,
      islEnabled: true,
      weatherLossDb: 1.5,
    },
  },
  {
    id: 'high_traffic',
    name: 'High Network Traffic',
    description: 'Heavy bandwidth demand across North America and Europe causing higher queueing delay and link utilization.',
    icon: 'zap',
    trafficMultiplier: 2.5,
  },
  {
    id: 'sat_failure',
    name: 'Satellite Failure Event',
    description: '3 primary orbital satellites experience power degradation, forcing dynamic packet rerouting over laser ISLs.',
    icon: 'alert-triangle',
    failedSatIds: ['sat-p1-s3', 'sat-p3-s5', 'sat-p5-s2'],
  },
  {
    id: 'gs_failure',
    name: 'Ground Station Gateway Outage',
    description: 'New York Gateway experiences atmospheric blackout, forcing failover to London & Frankfurt teleports.',
    icon: 'radio',
    failedStationIds: ['gs-newyork'],
  },
  {
    id: 'congestion',
    name: 'Network Congestion & Jitter',
    description: 'Severe weather and high packet loss rate across transatlantic inter-satellite links.',
    icon: 'wifi',
    configOverrides: {
      weatherLossDb: 4.8,
    },
  },
  {
    id: 'handover_stress',
    name: 'Fast Orbit Handover Stress',
    description: 'Low 350 km altitude orbit with high angular velocity, testing rapid ground terminal satellite handovers.',
    icon: 'layers',
    configOverrides: {
      altitudeKm: 350,
      minElevationDeg: 35,
    },
  },
  {
    id: 'global_polar',
    name: 'Polar Global Coverage Scan',
    description: 'High 87.9° polar inclination constellation ensuring 100% coverage over Arctic and Antarctic regions.',
    icon: 'globe2',
    configOverrides: {
      inclinationDeg: 87.9,
      planesCount: 8,
      satsPerPlane: 6,
    },
  },
];

interface ScenarioSelectorProps {
  activeScenarioId: string;
  onSelectScenario: (scenario: NetworkScenario) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  activeScenarioId,
  onSelectScenario,
}) => {
  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-4 shadow-xl">
      <div className="text-xs font-mono text-slate-400 mb-3 flex items-center justify-between">
        <span className="text-cyan-300 font-bold flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          Predefined Simulation Scenarios
        </span>
        <span>Select to apply live conditions</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {SCENARIOS.map((sc) => {
          const isActive = activeScenarioId === sc.id;

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 group ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-lg ring-1 ring-cyan-400/50'
                  : 'bg-slate-955 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-900/90'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-white group-hover:text-cyan-300 truncate">
                  {sc.name}
                </span>
                {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />}
              </div>

              <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                {sc.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
