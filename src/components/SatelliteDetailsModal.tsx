import React from 'react';
import { Satellite, GroundStation } from '../types/simulation';
import { X, Radio, Battery, Thermometer, ShieldAlert, Cpu, MapPin, Zap } from 'lucide-react';

interface SatelliteDetailsModalProps {
  satellite: Satellite | null;
  onClose: () => void;
  groundStations: GroundStation[];
  onToggleFailSatellite: (satId: string) => void;
}

export const SatelliteDetailsModal: React.FC<SatelliteDetailsModalProps> = ({
  satellite,
  onClose,
  groundStations,
  onToggleFailSatellite,
}) => {
  if (!satellite) return null;

  const connectedStations = groundStations.filter((g) => g.connectedSatId === satellite.id);
  const isFailed = satellite.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-xs font-mono relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{satellite.name}</h3>
            <span className="text-slate-400">ID: {satellite.id} • Plane #{satellite.planeIndex + 1}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-955 border border-slate-800">
          <span className="text-slate-400">Operational Health:</span>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isFailed
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}
          >
            {isFailed ? 'FAILED / OFFLINE' : 'NOMINAL (ACTIVE)'}
          </span>
        </div>

        {/* Position & Velocity */}
        <div className="space-y-2 bg-slate-955 p-3 rounded-xl border border-slate-800">
          <div className="text-cyan-400 font-bold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Orbital Position Telemetry
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Latitude / Longitude:</span>
            <span className="text-white font-bold">
              {satellite.lat.toFixed(2)}°, {satellite.lon.toFixed(2)}°
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Orbital Altitude:</span>
            <span className="text-cyan-300 font-bold">{satellite.altitudeKm} km</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Orbital Speed:</span>
            <span className="text-purple-300 font-bold">{satellite.velocityKmS.toFixed(2)} km/s</span>
          </div>
        </div>

        {/* Subsystems */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-955 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Battery:</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-emerald-300">
              {satellite.batteryPct.toFixed(0)}%
            </div>
          </div>

          <div className="bg-slate-955 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Temperature:</span>
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-amber-300">
              {satellite.temperatureC.toFixed(1)} °C
            </div>
          </div>
        </div>

        {/* Connected Downlinks */}
        <div className="space-y-2">
          <div className="text-slate-400">Connected Ground Downlinks ({connectedStations.length}):</div>
          {connectedStations.length > 0 ? (
            <div className="space-y-1.5">
              {connectedStations.map((st) => (
                <div key={st.id} className="p-2 rounded-lg bg-slate-955 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200 font-bold">{st.name}</span>
                  <span className="text-cyan-300">{st.latencyMs.toFixed(1)} ms</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 italic text-[11px]">No active ground downlinks currently assigned.</div>
          )}
        </div>

        {/* Fail / Reboot Simulation Trigger */}
        <div className="pt-2">
          <button
            onClick={() => onToggleFailSatellite(satellite.id)}
            className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              isFailed
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg'
                : 'bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isFailed ? 'Restore Satellite to Online' : 'Simulate Satellite Power Failure'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
