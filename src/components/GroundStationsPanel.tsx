import React, { useState } from 'react';
import { GroundStation, Satellite } from '../types/simulation';
import {
  Server,
  Plus,
  Trash2,
  Edit2,
  Signal,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Radio,
  MapPin,
  CheckCircle,
  XCircle,
  Globe,
} from 'lucide-react';

interface GroundStationsPanelProps {
  groundStations: GroundStation[];
  satellites: Satellite[];
  selectedStationId: string | null;
  onSelectStation: (id: string | null) => void;
  onAddStation: (station: GroundStation) => void;
  onRemoveStation: (id: string) => void;
  onUpdateStation: (station: GroundStation) => void;
}

export const GroundStationsPanel: React.FC<GroundStationsPanelProps> = ({
  groundStations,
  satellites,
  selectedStationId,
  onSelectStation,
  onAddStation,
  onRemoveStation,
  onUpdateStation,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<GroundStation | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [lat, setLat] = useState('37.7749');
  const [lon, setLon] = useState('-122.4194');
  const [type, setType] = useState<'user_terminal' | 'gateway' | 'teleport'>('user_terminal');
  const [minElevation, setMinElevation] = useState('25');
  const [country, setCountry] = useState('USA');

  const handleOpenAddModal = () => {
    setEditingStation(null);
    setName('');
    setLat('37.7749');
    setLon('-122.4194');
    setType('user_terminal');
    setMinElevation('25');
    setCountry('USA');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (station: GroundStation) => {
    setEditingStation(station);
    setName(station.name);
    setLat(station.lat.toString());
    setLon(station.lon.toString());
    setType(station.type);
    setMinElevation(station.minElevationDeg.toString());
    setCountry(station.country || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    const parsedElev = parseFloat(minElevation);

    if (isNaN(parsedLat) || isNaN(parsedLon) || !name.trim()) return;

    if (editingStation) {
      onUpdateStation({
        ...editingStation,
        name: name.trim(),
        lat: parsedLat,
        lon: parsedLon,
        type,
        minElevationDeg: parsedElev || 25,
        country: country.trim() || undefined,
      });
    } else {
      const newStation: GroundStation = {
        id: `gs-custom-${Date.now()}`,
        name: name.trim(),
        lat: parsedLat,
        lon: parsedLon,
        minElevationDeg: parsedElev || 25,
        connectedSatId: null,
        signalStrengthDbm: -75,
        downloadMbps: 200,
        uploadMbps: 40,
        latencyMs: 25,
        snrDb: 18,
        elevationDeg: 35,
        distanceKm: 700,
        status: 'connected',
        type,
        country: country.trim() || undefined,
      };
      onAddStation(newStation);
    }
    setIsModalOpen(false);
  };

  // Quick Presets
  const applyPreset = (presetName: string, pLat: number, pLon: number, pCountry: string) => {
    setName(presetName);
    setLat(pLat.toString());
    setLon(pLon.toString());
    setCountry(pCountry);
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-emerald-400" />
            <span>Ground Stations & Gateways Network</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage user terminals, teleports, and gateways receiving LEO downlink signals.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/25"
        >
          <Plus className="w-4 h-4" />
          <span>Add Ground Station</span>
        </button>
      </div>

      {/* Grid of Station Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groundStations.map((st) => {
          const isSelected = selectedStationId === st.id;
          const connectedSat = satellites.find((s) => s.id === st.connectedSatId);

          return (
            <div
              key={st.id}
              onClick={() => onSelectStation(isSelected ? null : st.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/50 shadow-xl'
                  : 'bg-slate-955 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/90'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        st.status === 'connected'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          : 'bg-amber-400'
                      }`}
                    />
                    <h3 className="text-sm font-bold text-white">{st.name}</h3>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {st.lat >= 0 ? `${st.lat.toFixed(2)}°N` : `${Math.abs(st.lat).toFixed(2)}°S`},{' '}
                      {st.lon >= 0 ? `${st.lon.toFixed(2)}°E` : `${Math.abs(st.lon).toFixed(2)}°W`}
                    </span>
                    {st.country && <span className="text-slate-500">({st.country})</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(st);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Edit Station"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveStation(st.id);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete Station"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Connected Sat & Elevation */}
              <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 text-xs flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400">Target Sat:</span>
                </div>
                <span className="text-emerald-300 font-bold">
                  {connectedSat ? connectedSat.name : 'Searching...'}
                </span>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-[10px] text-slate-500">LATENCY</div>
                    <div className="text-cyan-300 font-bold">{st.latencyMs.toFixed(1)} ms</div>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
                  <Signal className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-[10px] text-slate-500">SIGNAL RSSI</div>
                    <div className="text-purple-300 font-bold">{st.signalStrengthDbm.toFixed(0)} dBm</div>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
                  <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-slate-500">DOWNLOAD</div>
                    <div className="text-emerald-300 font-bold">{st.downloadMbps.toFixed(0)} Mbps</div>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-[10px] text-slate-500">UPLOAD</div>
                    <div className="text-blue-300 font-bold">{st.uploadMbps.toFixed(0)} Mbps</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Add / Edit Station */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <span>{editingStation ? 'Edit Ground Station' : 'Add New Ground Station'}</span>
            </h3>

            {/* Quick Presets */}
            {!editingStation && (
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Quick Location Presets:</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('Paris Gateway', 48.8566, 2.3522, 'France')}
                    className="px-2 py-1 rounded bg-slate-800 text-[11px] text-cyan-300 hover:bg-cyan-500/20"
                  >
                    Paris
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('Dubai Teleport', 25.2048, 55.2708, 'UAE')}
                    className="px-2 py-1 rounded bg-slate-800 text-[11px] text-cyan-300 hover:bg-cyan-500/20"
                  >
                    Dubai
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('Honolulu Station', 21.3069, -157.8583, 'USA (Hawaii)')}
                    className="px-2 py-1 rounded bg-slate-800 text-[11px] text-cyan-300 hover:bg-cyan-500/20"
                  >
                    Honolulu
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-mono text-slate-300">Station Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Berlin Teleport"
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300">Latitude (-90 to 90)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-300">Longitude (-180 to 180)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300">Station Type</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="user_terminal">User Terminal</option>
                    <option value="gateway">Internet Gateway</option>
                    <option value="teleport">Satellite Teleport</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-300">Min Elevation (°)</label>
                  <input
                    type="number"
                    value={minElevation}
                    onChange={(e) => setMinElevation(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300">Country / Region</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Germany"
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400"
                >
                  {editingStation ? 'Save Changes' : 'Create Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
