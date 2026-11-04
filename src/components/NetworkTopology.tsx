import React, { useState } from 'react';
import { Satellite, GroundStation, LaserLink } from '../types/simulation';
import { Network, Zap, Radio, Server, Globe, Search, Filter } from 'lucide-react';

interface NetworkTopologyProps {
  satellites: Satellite[];
  groundStations: GroundStation[];
  laserLinks: LaserLink[];
  selectedSatId: string | null;
  selectedStationId: string | null;
  onSelectSat: (id: string | null) => void;
  onSelectStation: (id: string | null) => void;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  satellites,
  groundStations,
  laserLinks,
  selectedSatId,
  selectedStationId,
  onSelectSat,
  onSelectStation,
}) => {
  const [filterPlane, setFilterPlane] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Group satellites by plane
  const planesMap = new Map<number, Satellite[]>();
  satellites.forEach((sat) => {
    const list = planesMap.get(sat.planeIndex) || [];
    list.push(sat);
    planesMap.set(sat.planeIndex, list);
  });

  const planes = Array.from(planesMap.keys()).sort((a, b) => a - b);

  const filteredSatellites = satellites.filter((sat) => {
    const matchesPlane = filterPlane === 'all' || sat.planeIndex === filterPlane;
    const matchesSearch =
      sat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sat.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPlane && matchesSearch;
  });

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-6 shadow-xl flex flex-col gap-6">
      {/* Topology Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-cyan-400" />
            <span>Constellation Network Topology Graph</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual inter-satellite laser mesh, ground gateway downlinks, and packet path topology.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sat or station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:border-cyan-500 w-48"
            />
          </div>

          {/* Plane Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Plane:</span>
            <select
              value={filterPlane}
              onChange={(e) =>
                setFilterPlane(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              }
              className="bg-transparent text-cyan-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">
                All Planes
              </option>
              {planes.map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-slate-200">
                  Plane {p + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Topology Graph Visual Canvas Area */}
      <div className="relative w-full overflow-x-auto min-h-[420px] bg-slate-955 rounded-xl border border-slate-800 p-6 flex flex-col justify-between">
        {/* Satellites Constellation Matrix */}
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-400 border-b border-cyan-900/40 pb-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              LEO Orbital Planes Layer (Laser ISL Mesh)
            </span>
            <span className="text-slate-500">{laserLinks.length} Active Laser ISL Links</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {planes.map((pIdx) => {
              const planeSats = filteredSatellites.filter((s) => s.planeIndex === pIdx);
              if (planeSats.length === 0) return null;

              return (
                <div
                  key={pIdx}
                  className="bg-slate-900/90 rounded-xl border border-cyan-500/20 p-3.5 flex flex-col gap-2.5 shadow-md"
                >
                  <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-1.5">
                    <span className="text-cyan-300 font-bold">Plane #{pIdx + 1}</span>
                    <span className="text-slate-500">{planeSats.length} Sats</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {planeSats.map((sat) => {
                      const isSelected = selectedSatId === sat.id;
                      const isFailed = sat.status === 'failed';

                      return (
                        <button
                          key={sat.id}
                          onClick={() => onSelectSat(isSelected ? null : sat.id)}
                          className={`p-2 rounded-lg text-left text-xs font-mono transition-all flex items-center justify-between border ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400'
                              : isFailed
                              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isFailed ? 'bg-rose-500' : 'bg-emerald-400'
                              }`}
                            />
                            <span>{sat.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {sat.lat > 0 ? `${sat.lat.toFixed(0)}°N` : `${Math.abs(sat.lat).toFixed(0)}°S`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Downlink Energy Flow Indicator */}
        <div className="my-6 relative flex items-center justify-center">
          <div className="w-full h-px bg-gradient-to-r from-cyan-500/10 via-purple-500/40 to-cyan-500/10" />
          <div className="absolute bg-slate-950 px-4 py-1 rounded-full border border-purple-500/40 text-[11px] font-mono text-purple-300 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Feeder & Slant Downlink Downlinks Layer</span>
          </div>
        </div>

        {/* Ground Stations Layer */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 border-b border-emerald-900/40 pb-2 mb-4">
            <span className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-400" />
              Ground Teleports & Gateway Terminals Layer
            </span>
            <span className="text-slate-500">
              {groundStations.filter((g) => g.status === 'connected').length} Active Connections
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {groundStations.map((st) => {
              const isSelected = selectedStationId === st.id;
              const connectedSat = satellites.find((s) => s.id === st.connectedSatId);

              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStation(isSelected ? null : st.id)}
                  className={`p-3 rounded-xl border text-xs text-left transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-md ring-1 ring-purple-400'
                      : st.status === 'connected'
                      ? 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-emerald-500/50'
                      : 'bg-slate-950/40 border-slate-900 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-white">
                    <span className="truncate">{st.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        st.type === 'gateway'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : st.type === 'teleport'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {st.type}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Latency:</span>
                    <span className="text-cyan-300 font-mono">{st.latencyMs.toFixed(1)} ms</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Connected Sat:</span>
                    <span className="text-emerald-400 font-mono truncate max-w-[90px]">
                      {connectedSat ? connectedSat.name : 'Searching...'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
