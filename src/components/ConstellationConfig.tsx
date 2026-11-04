import React from 'react';
import { ConstellationConfig, MetricPoint } from '../types/simulation';
import { Sliders, RotateCcw, Download, Save, Zap, Radio, Globe, Shield } from 'lucide-react';

interface ConstellationConfigProps {
  config: ConstellationConfig;
  onChangeConfig: (newConfig: ConstellationConfig) => void;
  onResetDefault: () => void;
  metricsHistory: MetricPoint[];
}

export const ConstellationConfigPanel: React.FC<ConstellationConfigProps> = ({
  config,
  onChangeConfig,
  onResetDefault,
  metricsHistory,
}) => {
  const handleChange = (key: keyof ConstellationConfig, value: number | boolean) => {
    const updated = { ...config, [key]: value };

    // Auto calculate plane structure if satellite count changed
    if (key === 'planesCount' || key === 'satsPerPlane') {
      updated.satelliteCount = (updated.planesCount || 1) * (updated.satsPerPlane || 1);
    }
    onChangeConfig(updated);
  };

  // Presets
  const applyStarlinkPreset = () => {
    onChangeConfig({
      ...config,
      satelliteCount: 60,
      altitudeKm: 550,
      inclinationDeg: 53.0,
      planesCount: 6,
      satsPerPlane: 10,
      txPowerWatts: 45,
      frequencyGHz: 12.5,
      bandwidthMHz: 250,
      minElevationDeg: 25,
      islEnabled: true,
      weatherLossDb: 1.5,
    });
  };

  const applyOneWebPreset = () => {
    onChangeConfig({
      ...config,
      satelliteCount: 48,
      altitudeKm: 1200,
      inclinationDeg: 87.9,
      planesCount: 8,
      satsPerPlane: 6,
      txPowerWatts: 60,
      frequencyGHz: 14.0,
      bandwidthMHz: 200,
      minElevationDeg: 20,
      islEnabled: true,
      weatherLossDb: 2.0,
    });
  };

  const applyKuiperPreset = () => {
    onChangeConfig({
      ...config,
      satelliteCount: 60,
      altitudeKm: 630,
      inclinationDeg: 51.9,
      planesCount: 10,
      satsPerPlane: 6,
      txPowerWatts: 50,
      frequencyGHz: 28.0,
      bandwidthMHz: 400,
      minElevationDeg: 30,
      islEnabled: true,
      weatherLossDb: 2.5,
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (metricsHistory.length === 0) return;

    const headers = [
      'Timestamp',
      'TimeStr',
      'AvgLatency_ms',
      'Throughput_Gbps',
      'ActiveSatellites',
      'ConnectedStations',
      'ActiveISLs',
      'GlobalCoverage_pct',
      'PacketLoss_pct',
    ];

    const rows = metricsHistory.map((m) => [
      m.timestamp,
      m.timeStr,
      m.avgLatency.toFixed(2),
      m.totalThroughputGbps.toFixed(2),
      m.activeSatellites,
      m.connectedStations,
      m.activeISLs,
      m.globalCoveragePct.toFixed(1),
      m.packetLossPct.toFixed(1),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `satellite_simulation_metrics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToLocalStorage = () => {
    localStorage.setItem('sat_sim_config', JSON.stringify(config));
    alert('Simulation Configuration saved to browser storage!');
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-cyan-400" />
            <span>Constellation Architecture & RF Link Parameters</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure orbital planes, transmit power, frequency bands, elevation angles, and preset constellations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onResetDefault}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            onClick={handleSaveToLocalStorage}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Config</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-cyan-400 shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="bg-slate-955 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <span className="text-slate-400">Constellation Presets:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={applyStarlinkPreset}
            className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 transition-all"
          >
            Starlink Gen1 (550 km)
          </button>
          <button
            onClick={applyOneWebPreset}
            className="px-3 py-1.5 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 hover:bg-purple-900 transition-all"
          >
            OneWeb Polar (1200 km)
          </button>
          <button
            onClick={applyKuiperPreset}
            className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 transition-all"
          >
            Kuiper Ka-Band (630 km)
          </button>
        </div>
      </div>

      {/* Form Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-mono">
        {/* Orbital Mechanics Parameters */}
        <div className="bg-slate-955 rounded-xl border border-slate-800 p-4 space-y-4">
          <div className="text-cyan-300 font-bold border-b border-slate-800 pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Orbital Mechanics
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Orbital Altitude:</span>
              <span className="text-cyan-400 font-bold">{config.altitudeKm} km</span>
            </div>
            <input
              type="range"
              min="300"
              max="1500"
              step="10"
              value={config.altitudeKm}
              onChange={(e) => handleChange('altitudeKm', parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">LEO standard: 300 - 1500 km</div>
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Inclination Angle:</span>
              <span className="text-cyan-400 font-bold">{config.inclinationDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="98"
              step="0.5"
              value={config.inclinationDeg}
              onChange={(e) => handleChange('inclinationDeg', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">53° Mid-inclination / 87° Polar</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Planes Count</label>
              <input
                type="number"
                min="1"
                max="24"
                value={config.planesCount}
                onChange={(e) => handleChange('planesCount', parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Sats / Plane</label>
              <input
                type="number"
                min="1"
                max="32"
                value={config.satsPerPlane}
                onChange={(e) => handleChange('satsPerPlane', parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Radio Frequency (RF) & Link Budget */}
        <div className="bg-slate-955 rounded-xl border border-slate-800 p-4 space-y-4">
          <div className="text-purple-300 font-bold border-b border-slate-800 pb-2 flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            RF Link & Power Budget
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Transmit Power:</span>
              <span className="text-purple-400 font-bold">{config.txPowerWatts} W</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={config.txPowerWatts}
              onChange={(e) => handleChange('txPowerWatts', parseInt(e.target.value, 10))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Frequency Band:</span>
              <span className="text-purple-400 font-bold">{config.frequencyGHz} GHz</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="0.5"
              value={config.frequencyGHz}
              onChange={(e) => handleChange('frequencyGHz', parseFloat(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">Ku: 12 GHz / Ka: 28 GHz</div>
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Channel Bandwidth:</span>
              <span className="text-purple-400 font-bold">{config.bandwidthMHz} MHz</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={config.bandwidthMHz}
              onChange={(e) => handleChange('bandwidthMHz', parseInt(e.target.value, 10))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Geometry & Inter-Satellite Mesh */}
        <div className="bg-slate-955 rounded-xl border border-slate-800 p-4 space-y-4">
          <div className="text-emerald-300 font-bold border-b border-slate-800 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Geometry & Laser Mesh
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Min Elevation Angle:</span>
              <span className="text-emerald-400 font-bold">{config.minElevationDeg}°</span>
            </div>
            <input
              type="range"
              min="10"
              max="45"
              step="1"
              value={config.minElevationDeg}
              onChange={(e) => handleChange('minElevationDeg', parseInt(e.target.value, 10))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Weather / Atmospheric Loss:</span>
              <span className="text-emerald-400 font-bold">{config.weatherLossDb} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="0.1"
              value={config.weatherLossDb}
              onChange={(e) => handleChange('weatherLossDb', parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-300">Inter-Satellite Laser Links (ISL):</span>
              <input
                type="checkbox"
                checked={config.islEnabled}
                onChange={(e) => handleChange('islEnabled', e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
