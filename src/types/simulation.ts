export interface Satellite {
  id: string;
  name: string;
  planeIndex: number;
  satInPlane: number;
  lat: number;
  lon: number;
  altitudeKm: number;
  position: [number, number, number]; // [x, y, z] normalized for 3D world space
  rawEcef: [number, number, number]; // [x, y, z] in km
  velocityKmS: number;
  status: 'active' | 'degraded' | 'failed';
  batteryPct: number;
  txPowerWatts: number;
  activeLinksCount: number;
  temperatureC: number;
}

export interface GroundStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  minElevationDeg: number;
  connectedSatId: string | null;
  signalStrengthDbm: number;
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  snrDb: number;
  elevationDeg: number;
  distanceKm: number;
  status: 'connected' | 'connecting' | 'searching' | 'offline';
  type: 'user_terminal' | 'gateway' | 'teleport';
  country?: string;
}

export interface LaserLink {
  id: string;
  fromSatId: string;
  toSatId: string;
  distanceKm: number;
  delayMs: number;
  bandwidthGbps: number;
  status: 'active' | 'degraded' | 'broken';
  type: 'intra_plane' | 'inter_plane';
}

export interface Downlink {
  id: string;
  stationId: string;
  satId: string;
  distanceKm: number;
  elevationDeg: number;
  rssiDbm: number;
  snrDb: number;
  latencyMs: number;
  active: boolean;
}

export interface ConstellationConfig {
  satelliteCount: number;
  altitudeKm: number;
  inclinationDeg: number;
  planesCount: number;
  satsPerPlane: number;
  txPowerWatts: number;
  frequencyGHz: number;
  bandwidthMHz: number;
  minElevationDeg: number;
  islEnabled: boolean;
  weatherLossDb: number;
}

export interface MetricPoint {
  timeStr: string;
  timestamp: number;
  avgLatency: number;
  downloadMbps: number;
  uploadMbps: number;
  totalThroughputGbps: number;
  activeSatellites: number;
  connectedStations: number;
  activeISLs: number;
  packetLossPct: number;
  globalCoveragePct: number;
}

export interface NetworkScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  configOverrides?: Partial<ConstellationConfig>;
  failedSatIds?: string[];
  failedStationIds?: string[];
  trafficMultiplier?: number;
}

export interface LocationCoverageResult {
  lat: number;
  lon: number;
  isCovered: boolean;
  visibleSatCount: number;
  bestSatId: string | null;
  bestElevationDeg: number;
  bestDistanceKm: number;
  estLatencyMs: number;
  estDownloadMbps: number;
}
