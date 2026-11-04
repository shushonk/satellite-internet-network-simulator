import React, { useState, useMemo } from 'react';
import { Satellite, ConstellationConfig, LocationCoverageResult } from '../types/simulation';
import { calculateCoverageAnalysis } from '../services/simulationEngine';
import { Globe, ShieldCheck, MapPin, Radio, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CoverageAnalysisProps {
  satellites: Satellite[];
  config: ConstellationConfig;
}

export const CoverageAnalysis: React.FC<CoverageAnalysisProps> = ({ satellites, config }) => {
  const [testLat, setTestLat] = useState<number>(37.7749); // San Francisco
  const [testLon, setTestLon] = useState<number>(-122.4194);

  // Calculate full coverage analysis
  const { coveragePct, targetResult } = useMemo(() => {
    return calculateCoverageAnalysis(satellites, config, testLat, testLon);
  }, [satellites, config, testLat, testLon]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lon = (x / rect.width) * 360 - 180;
    const lat = 90 - (y / rect.height) * 180;

    setTestLat(parseFloat(lat.toFixed(2)));
    setTestLon(parseFloat(lon.toFixed(2)));
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-cyan-400" />
            <span>Global Coverage & Visibility Footprint Analysis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate global surface coverage percentage, elevation cones, and test connection latency anywhere on Earth.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-cyan-500/30">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-400 font-mono">GLOBAL COVERAGE</div>
            <div className="text-lg font-bold text-emerald-300 font-mono">
              {coveragePct.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* 2D Equirectangular Interactive Globe Map & Footprints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-955 rounded-2xl border border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Click anywhere on the world map to test coverage & latency</span>
            <span className="text-cyan-400">Target: [{testLat.toFixed(1)}°, {testLon.toFixed(1)}°]</span>
          </div>

          <div
            onClick={handleMapClick}
            className="relative w-full aspect-[2/1] bg-slate-950 rounded-xl overflow-hidden cursor-crosshair border border-cyan-900/40 group shadow-inner"
          >
            {/* Equirectangular Grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

            {/* Latitude / Longitude Lines */}
            <div className="absolute inset-0 border-t border-b border-cyan-500/20 top-1/2 -translate-y-1/2" />
            <div className="absolute inset-0 border-l border-r border-cyan-500/20 left-1/2 -translate-x-1/2" />

            {/* Render Satellites Footprint Cones on 2D map */}
            {satellites.map((sat) => {
              if (sat.status === 'failed') return null;
              // Map Lat/Lon to % offset
              const leftPct = ((sat.lon + 180) / 360) * 100;
              const topPct = ((90 - sat.lat) / 180) * 100;

              return (
                <div key={sat.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${leftPct}%`, top: `${topPct}%` }}>
                  {/* Coverage Ring */}
                  <div className="w-12 h-12 rounded-full border border-cyan-400/40 bg-cyan-500/10 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse" />
                  {/* Satellite Core Marker */}
                  <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_6px_#00f0ff] -translate-x-1/2 -translate-y-1/2" />
                </div>
              );
            })}

            {/* Clicked Target Location Marker Pin */}
            <div
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-200"
              style={{
                left: `${((testLon + 180) / 360) * 100}%`,
                top: `${((90 - testLat) / 180) * 100}%`,
              }}
            >
              <div className="flex flex-col items-center">
                <MapPin className="w-6 h-6 text-rose-500 drop-shadow-[0_0_8px_#f43f5e] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-rose-500 opacity-60" />
              </div>
            </div>
          </div>
        </div>

        {/* Location Diagnostic Panel */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Location Telemetry Inspector</span>
            </div>

            {/* Coordinates Inputs */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400">Latitude</label>
                <input
                  type="number"
                  value={testLat}
                  onChange={(e) => setTestLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400">Longitude</label>
                <input
                  type="number"
                  value={testLon}
                  onChange={(e) => setTestLon(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Results Card */}
            {targetResult && (
              <div className="space-y-3 mt-3">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                    targetResult.isCovered
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {targetResult.isCovered ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>{targetResult.isCovered ? 'Coverage Available' : 'No Line-of-Sight'}</span>
                  </div>
                  <span>{targetResult.visibleSatCount} Visible Sats</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Highest Elevation Angle:</span>
                    <span className="text-cyan-300 font-bold">{targetResult.bestElevationDeg.toFixed(1)}°</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Nearest Sat Distance:</span>
                    <span className="text-purple-300 font-bold">{targetResult.bestDistanceKm.toFixed(0)} km</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Est. Round-Trip Latency:</span>
                    <span className="text-emerald-300 font-bold">{targetResult.estLatencyMs.toFixed(1)} ms</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Est. Downlink Speed:</span>
                    <span className="text-blue-300 font-bold">{targetResult.estDownloadMbps.toFixed(0)} Mbps</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            💡 Minimum elevation threshold is set to <span className="text-cyan-300 font-bold">{config.minElevationDeg}°</span>. Satellites below this angle suffer high atmospheric distortion and terrain obstruction.
          </div>
        </div>
      </div>
    </div>
  );
};
