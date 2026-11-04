import React from 'react';
import { MetricPoint } from '../types/simulation';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Activity, Clock, Zap, Signal, Wifi, ArrowUpRight } from 'lucide-react';

interface PerformanceAnalyticsProps {
  metricsHistory: MetricPoint[];
  currentMetrics: {
    activeSatellites: number;
    connectedStations: number;
    avgLatency: number;
    totalThroughputGbps: number;
    globalCoveragePct: number;
    activeISLCount: number;
  };
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  metricsHistory,
  currentMetrics,
}) => {
  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-6 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span>Constellation Performance Analytics & Live Telemetry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time throughput, latency budget, packet transmission success, and constellation health trends.
          </p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-955 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>AVG LATENCY</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 font-mono mt-1">
            {currentMetrics.avgLatency.toFixed(1)} <span className="text-xs text-slate-400 font-normal">ms</span>
          </div>
        </div>

        <div className="bg-slate-955 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>THROUGHPUT</span>
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-300 font-mono mt-1">
            {currentMetrics.totalThroughputGbps.toFixed(1)} <span className="text-xs text-slate-400 font-normal">Gbps</span>
          </div>
        </div>

        <div className="bg-slate-955 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>ACTIVE SATS</span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300 font-mono mt-1">
            {currentMetrics.activeSatellites}
          </div>
        </div>

        <div className="bg-slate-955 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>CONNECTED GS</span>
            <Signal className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-300 font-mono mt-1">
            {currentMetrics.connectedStations}
          </div>
        </div>

        <div className="bg-slate-955 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>LASER ISLs</span>
            <Zap className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <div className="text-xl font-bold text-pink-300 font-mono mt-1">
            {currentMetrics.activeISLCount}
          </div>
        </div>

        <div className="bg-slate-955 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>COVERAGE</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-teal-300 font-mono mt-1">
            {currentMetrics.globalCoveragePct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Over Time Chart */}
        <div className="bg-slate-955 rounded-2xl border border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-300 font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Round-Trip Network Latency Over Time (ms)
            </span>
            <span className="text-slate-500">Live Window</span>
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeStr" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={['dataMin - 5', 'dataMax + 10']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#00f0ff', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="avgLatency"
                  name="Avg Latency (ms)"
                  stroke="#00f0ff"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Throughput Area Chart */}
        <div className="bg-slate-955 rounded-2xl border border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-purple-300 font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Total Constellation Throughput (Gbps)
            </span>
            <span className="text-slate-500">Mesh Capacity</span>
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsHistory}>
                <defs>
                  <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ab47bc" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ab47bc" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeStr" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ab47bc', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="totalThroughputGbps"
                  name="Throughput (Gbps)"
                  stroke="#d000ff"
                  fillOpacity={1}
                  fill="url(#throughputGrad)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active ISL Links Bar Chart */}
        <div className="bg-slate-955 rounded-2xl border border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-300 font-bold flex items-center gap-2">
              <Signal className="w-4 h-4 text-emerald-400" />
              Inter-Satellite Laser Links Count
            </span>
            <span className="text-slate-500">Cross-Plane Mesh</span>
          </div>

          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeStr" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#10b981', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="activeISLs" name="Active Laser ISLs" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Coverage & Packet Loss */}
        <div className="bg-slate-955 rounded-2xl border border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-blue-300 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Global Coverage & Packet Transmission
            </span>
            <span className="text-slate-500">Service Reliability</span>
          </div>

          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeStr" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#3b82f6', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="globalCoveragePct"
                  name="Global Coverage (%)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="packetLossPct"
                  name="Packet Loss (%)"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
