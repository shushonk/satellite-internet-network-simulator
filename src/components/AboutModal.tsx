import React from 'react';
import { X, Info, Globe, Radio, Zap, Shield, BookOpen } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-xs font-mono relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-base font-bold text-white">Satellite Internet Network Simulator</h3>
            <span className="text-slate-400">Mathematical Models & Aerospace Assumptions</span>
          </div>
        </div>

        <div className="space-y-4 text-slate-300 leading-relaxed">
          <div>
            <h4 className="text-cyan-300 font-bold mb-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              1. Keplerian Orbital Mechanics
            </h4>
            <p className="text-[11px] text-slate-400">
              Satellite orbits are computed using Keplerian circular orbits around Earth (R_E = 6371 km, μ = 398600.44 km³/s²). Angular velocity ω = √(μ / r³). Constellations are structured into planes rotated by RAAN Ω_p = 2π p / P and inclination i.
            </p>
          </div>

          <div>
            <h4 className="text-purple-300 font-bold mb-1 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-purple-400" />
              2. Link Budget & Path Loss Physics
            </h4>
            <p className="text-[11px] text-slate-400">
              Downlink and uplink path losses follow Free Space Path Loss:
              <br />
              <code className="text-purple-300 bg-slate-955 px-2 py-1 rounded block my-1">
                FSPL (dB) = 20 log10(d_km) + 20 log10(f_GHz) + 92.45
              </code>
              Atmospheric attenuation scales inversely with ground station elevation angle θ. Link capacity uses Shannon-Hartley theorem C = B log2(1 + SNR) scaled for 72% spectral efficiency.
            </p>
          </div>

          <div>
            <h4 className="text-emerald-300 font-bold mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              3. Inter-Satellite Laser Links (ISL) Mesh Routing
            </h4>
            <p className="text-[11px] text-slate-400">
              Satellites form an optical mesh network with intra-plane ring links and cross-plane lateral links. Optical propagation delay is computed at speed of light c = 299,792.458 km/s. Shortest paths between terminals and gateways are calculated continuously.
            </p>
          </div>

          <div>
            <h4 className="text-amber-300 font-bold mb-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              4. Ground Terminal Handovers
            </h4>
            <p className="text-[11px] text-slate-400">
              When a satellite drops below the minimum elevation angle threshold θ_min (default 25°), the ground station automatically switches connection to the highest elevation satellite in line-of-sight.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
          >
            Got it, return to simulation
          </button>
        </div>
      </div>
    </div>
  );
};
