import {
  Satellite,
  GroundStation,
  LaserLink,
  ConstellationConfig,
  LocationCoverageResult,
} from '../types/simulation';

export const EARTH_RADIUS_KM = 6371;
export const MU_KM3_S2 = 398600.4418; // Earth's standard gravitational parameter
export const SPEED_OF_LIGHT_KM_S = 299792.458; // km/s
export const EARTH_ROTATION_RAD_S = 7.2921159e-5; // Earth angular velocity rad/s

export const DEFAULT_CONFIG: ConstellationConfig = {
  satelliteCount: 60,
  altitudeKm: 550,
  inclinationDeg: 53.0,
  planesCount: 6,
  satsPerPlane: 10,
  txPowerWatts: 40,
  frequencyGHz: 12.5, // Ku band (GHz)
  bandwidthMHz: 250,
  minElevationDeg: 25,
  islEnabled: true,
  weatherLossDb: 1.5,
};

export const DEFAULT_GROUND_STATIONS: GroundStation[] = [
  {
    id: 'gs-tokyo',
    name: 'Tokyo Teleport',
    lat: 35.6762,
    lon: 139.6503,
    minElevationDeg: 25,
    connectedSatId: null,
    signalStrengthDbm: -72,
    downloadMbps: 220,
    uploadMbps: 45,
    latencyMs: 24,
    snrDb: 18,
    elevationDeg: 42,
    distanceKm: 680,
    status: 'connected',
    type: 'gateway',
    country: 'Japan',
  },
  {
    id: 'gs-newyork',
    name: 'New York Gateway',
    lat: 40.7128,
    lon: -74.006,
    minElevationDeg: 25,
    connectedSatId: null,
    signalStrengthDbm: -68,
    downloadMbps: 280,
    uploadMbps: 55,
    latencyMs: 22,
    snrDb: 21,
    elevationDeg: 58,
    distanceKm: 610,
    status: 'connected',
    type: 'gateway',
    country: 'USA',
  },
  {
    id: 'gs-london',
    name: 'London Station',
    lat: 51.5074,
    lon: -0.1278,
    minElevationDeg: 25,
    connectedSatId: null,
    signalStrengthDbm: -75,
    downloadMbps: 195,
    uploadMbps: 38,
    latencyMs: 27,
    snrDb: 16,
    elevationDeg: 35,
    distanceKm: 740,
    status: 'connected',
    type: 'gateway',
    country: 'UK',
  },
  {
    id: 'gs-sydney',
    name: 'Sydney Terminal',
    lat: -33.8688,
    lon: 151.2093,
    minElevationDeg: 25,
    connectedSatId: null,
    signalStrengthDbm: -70,
    downloadMbps: 240,
    uploadMbps: 48,
    latencyMs: 25,
    snrDb: 19,
    elevationDeg: 49,
    distanceKm: 645,
    status: 'connected',
    type: 'user_terminal',
    country: 'Australia',
  },
  {
    id: 'gs-saopaulo',
    name: 'São Paulo Station',
    lat: -23.5505,
    lon: -46.6333,
    minElevationDeg: 25,
    connectedSatId: null,
    signalStrengthDbm: -78,
    downloadMbps: 160,
    uploadMbps: 30,
    latencyMs: 31,
    snrDb: 14,
    elevationDeg: 31,
    distanceKm: 790,
    status: 'connected',
    type: 'user_terminal',
    country: 'Brazil',
  },
  {
    id: 'gs-frankfurt',
    name: 'Frankfurt Hub',
    lat: 50.1109,
    lon: 8.6821,
    minElevationDeg: 25,
    connectedSatId: null,
    signalStrengthDbm: -66,
    downloadMbps: 310,
    uploadMbps: 65,
    latencyMs: 19,
    snrDb: 23,
    elevationDeg: 62,
    distanceKm: 585,
    status: 'connected',
    type: 'teleport',
    country: 'Germany',
  },
  {
    id: 'gs-singapore',
    name: 'Singapore Teleport',
    lat: 1.3521,
    lon: 103.8198,
    minElevationDeg: 25,
    connectedSatId: null,
    signalStrengthDbm: -73,
    downloadMbps: 210,
    uploadMbps: 40,
    latencyMs: 26,
    snrDb: 17,
    elevationDeg: 40,
    distanceKm: 700,
    status: 'connected',
    type: 'teleport',
    country: 'Singapore',
  },
  {
    id: 'gs-johannesburg',
    name: 'Johannesburg station',
    lat: -26.2041,
    lon: 28.0473,
    minElevationDeg: 25,
    connectedSatId: null,
    signalStrengthDbm: -80,
    downloadMbps: 140,
    uploadMbps: 28,
    latencyMs: 35,
    snrDb: 12,
    elevationDeg: 28,
    distanceKm: 830,
    status: 'connected',
    type: 'user_terminal',
    country: 'South Africa',
  },
  {
    id: 'gs-anchorage',
    name: 'Anchorage Gateway',
    lat: 61.2181,
    lon: -149.9003,
    minElevationDeg: 25,
    connectedSatId: null,
    signalStrengthDbm: -74,
    downloadMbps: 185,
    uploadMbps: 35,
    latencyMs: 29,
    snrDb: 16,
    elevationDeg: 38,
    distanceKm: 715,
    status: 'connected',
    type: 'gateway',
    country: 'USA (Alaska)',
  },
  {
    id: 'gs-mumbai',
    name: 'Mumbai Gateway',
    lat: 19.076,
    lon: 72.8777,
    minElevationDeg: 25,
    connectedSatId: null,
    signalStrengthDbm: -71,
    downloadMbps: 235,
    uploadMbps: 46,
    latencyMs: 23,
    snrDb: 19,
    elevationDeg: 46,
    distanceKm: 660,
    status: 'connected',
    type: 'gateway',
    country: 'India',
  },
];

/**
 * Calculates ECEF (Earth-Centered Earth-Fixed) position in km for a satellite at time t (seconds).
 */
export function calculateSatelliteState(
  planeIndex: number,
  satInPlaneIndex: number,
  config: ConstellationConfig,
  timeSeconds: number,
  failedSatIds: Set<string> = new Set()
): Satellite {
  const planes = Math.max(1, config.planesCount);
  const satsPerPlane = Math.max(1, config.satsPerPlane);
  const orbitRadiusKm = EARTH_RADIUS_KM + config.altitudeKm;
  const inclinationRad = (config.inclinationDeg * Math.PI) / 180;

  // Keplerian mean motion (rad/s)
  const meanMotionRadS = Math.sqrt(MU_KM3_S2 / Math.pow(orbitRadiusKm, 3));
  const velocityKmS = Math.sqrt(MU_KM3_S2 / orbitRadiusKm);

  // RAAN for plane
  const raanRad = (2 * Math.PI * planeIndex) / planes;

  // Stagger anomaly between planes to ensure balanced global distribution
  const phaseOffset = (planeIndex * Math.PI * 2) / (planes * satsPerPlane);
  const meanAnomaly0 = (2 * Math.PI * satInPlaneIndex) / satsPerPlane + phaseOffset;

  // Current mean anomaly at time t
  const currentAnomaly = meanAnomaly0 + meanMotionRadS * timeSeconds;

  // Position in orbital plane
  const xOrb = orbitRadiusKm * Math.cos(currentAnomaly);
  const yOrb = orbitRadiusKm * Math.sin(currentAnomaly);

  // Rotate by inclination around X
  const xInc = xOrb;
  const yInc = yOrb * Math.cos(inclinationRad);
  const zInc = yOrb * Math.sin(inclinationRad);

  // Rotate by RAAN around Z
  const xEci = xInc * Math.cos(raanRad) - yInc * Math.sin(raanRad);
  const yEci = xInc * Math.sin(raanRad) + yInc * Math.cos(raanRad);
  const zEci = zInc;

  // Account for Earth's rotation (ECI to ECEF)
  const earthRotRad = EARTH_ROTATION_RAD_S * timeSeconds;
  const xEcef = xEci * Math.cos(-earthRotRad) - yEci * Math.sin(-earthRotRad);
  const yEcef = xEci * Math.sin(-earthRotRad) + yEci * Math.cos(-earthRotRad);
  const zEcef = zEci;

  // Latitude and Longitude
  const rXY = Math.sqrt(xEcef * xEcef + yEcef * yEcef);
  const lat = (Math.atan2(zEcef, rXY) * 180) / Math.PI;
  const lon = (Math.atan2(yEcef, xEcef) * 180) / Math.PI;

  // 3D Scene normalized coordinates (Earth Radius = 1.0 unit)
  const scale = 1 / EARTH_RADIUS_KM;
  const normX = xEcef * scale;
  const normY = zEcef * scale; // Map Z to Y for 3D graphic convention if needed or standard coordinates
  const normZ = -yEcef * scale;

  const satId = `sat-p${planeIndex + 1}-s${satInPlaneIndex + 1}`;
  const isFailed = failedSatIds.has(satId);

  return {
    id: satId,
    name: `OrbNet-${planeIndex + 1}0${satInPlaneIndex + 1}`,
    planeIndex,
    satInPlane: satInPlaneIndex,
    lat,
    lon,
    altitudeKm: config.altitudeKm,
    position: [normX, normY, normZ],
    rawEcef: [xEcef, yEcef, zEcef],
    velocityKmS,
    status: isFailed ? 'failed' : 'active',
    batteryPct: isFailed ? 0 : 92 + Math.sin(timeSeconds * 0.05 + planeIndex) * 7,
    txPowerWatts: config.txPowerWatts,
    activeLinksCount: 0,
    temperatureC: 18 + Math.cos(currentAnomaly) * 12,
  };
}

/**
 * Convert Lat/Lon to ECEF coordinates in km.
 */
export function latLonToEcef(latDeg: number, lonDeg: number, altKm: number = 0): [number, number, number] {
  const phi = (latDeg * Math.PI) / 180;
  const lambda = (lonDeg * Math.PI) / 180;
  const r = EARTH_RADIUS_KM + altKm;

  const x = r * Math.cos(phi) * Math.cos(lambda);
  const y = r * Math.cos(phi) * Math.sin(lambda);
  const z = r * Math.sin(phi);

  return [x, y, z];
}

/**
 * Computes slant range distance (km) and elevation angle (deg) between Ground Station and Satellite.
 */
export function computeSlantRangeAndElevation(
  gsLat: number,
  gsLon: number,
  satEcef: [number, number, number]
): { distanceKm: number; elevationDeg: number } {
  const [gsX, gsY, gsZ] = latLonToEcef(gsLat, gsLon, 0);

  // Delta vector from GS to Sat
  const dx = satEcef[0] - gsX;
  const dy = satEcef[1] - gsY;
  const dz = satEcef[2] - gsZ;
  const distanceKm = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Unit normal vector of ground station (pointing up away from Earth center)
  const normGs = Math.sqrt(gsX * gsX + gsY * gsY + gsZ * gsZ);
  const nx = gsX / normGs;
  const ny = gsY / normGs;
  const nz = gsZ / normGs;

  // Dot product between delta vector and normal
  const dot = (dx * nx + dy * ny + dz * nz) / distanceKm;
  const clampedDot = Math.max(-1, Math.min(1, dot));

  // Elevation angle in degrees
  const elevationRad = Math.asin(clampedDot);
  const elevationDeg = (elevationRad * 180) / Math.PI;

  return { distanceKm, elevationDeg };
}

/**
 * Physical Link Budget calculation for satellite-to-ground downlink/uplink.
 */
export function calculateLinkBudget(
  distanceKm: number,
  elevationDeg: number,
  config: ConstellationConfig
) {
  // Free Space Path Loss (dB): 20 log10(d_km) + 20 log10(f_GHz) + 92.45
  const fsplDb = 20 * Math.log10(Math.max(1, distanceKm)) + 20 * Math.log10(config.frequencyGHz) + 92.45;

  // Atmospheric and rain attenuation model based on elevation angle
  const minElev = Math.max(5, elevationDeg);
  const atmLossDb = (config.weatherLossDb + 0.8) / Math.sin((minElev * Math.PI) / 180);

  const totalPathLossDb = fsplDb + atmLossDb;

  // Satellite Transmit Power EIRP (dBW)
  const txPowerDbw = 10 * Math.log10(Math.max(1, config.txPowerWatts));
  const txAntennaGainDbi = 34.0; // Typical phased array gain
  const eirpDbw = txPowerDbw + txAntennaGainDbi;

  // Ground Station Receiver G/T
  const rxGainDbi = 32.0;
  const systemNoiseFloorDbm = -105.0; // dBm thermal noise across channel bandwidth

  // Received Signal Strength Indicator (RSSI in dBm)
  const rssiDbm = eirpDbw - totalPathLossDb + rxGainDbi - 30; // convert dBW to dBm
  const clampedRssi = Math.max(-120, Math.min(-45, rssiDbm));

  // SNR (dB)
  const snrDb = Math.max(0, clampedRssi - systemNoiseFloorDbm);

  // Physical speed of light latency (ms)
  const propagationDelayMs = (distanceKm / SPEED_OF_LIGHT_KM_S) * 1000;

  // Throughput via Shannon-Hartley capacity formula with efficiency scaling
  const bandwidthHz = config.bandwidthMHz * 1e6;
  const snrLinear = Math.pow(10, snrDb / 10);
  const maxCapacityBps = bandwidthHz * Math.log2(1 + snrLinear) * 0.72; // 72% spectral efficiency factor
  const downloadMbps = Math.min(450, Math.max(10, maxCapacityBps / 1e6));
  const uploadMbps = downloadMbps * 0.22; // Asymmetric downlink/uplink ratio

  return {
    fsplDb,
    atmLossDb,
    rssiDbm: clampedRssi,
    snrDb,
    propagationDelayMs,
    downloadMbps,
    uploadMbps,
  };
}

/**
 * Generate Inter-Satellite Laser Links (ISL) mesh.
 */
export function buildLaserLinks(
  satellites: Satellite[],
  config: ConstellationConfig
): LaserLink[] {
  if (!config.islEnabled) return [];

  const links: LaserLink[] = [];
  const satMap = new Map<string, Satellite>();
  satellites.forEach((s) => satMap.set(s.id, s));

  // Group by plane
  const planeGroups = new Map<number, Satellite[]>();
  satellites.forEach((sat) => {
    if (sat.status === 'failed') return;
    const list = planeGroups.get(sat.planeIndex) || [];
    list.push(sat);
    planeGroups.set(sat.planeIndex, list);
  });

  planeGroups.forEach((planeSats, planeIdx) => {
    planeSats.sort((a, b) => a.satInPlane - b.satInPlane);
    const n = planeSats.length;

    // Intra-plane laser links (ring topology within plane)
    for (let i = 0; i < n; i++) {
      const satA = planeSats[i];
      const satB = planeSats[(i + 1) % n];

      const dx = satA.rawEcef[0] - satB.rawEcef[0];
      const dy = satA.rawEcef[1] - satB.rawEcef[1];
      const dz = satA.rawEcef[2] - satB.rawEcef[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      links.push({
        id: `isl-${satA.id}-${satB.id}`,
        fromSatId: satA.id,
        toSatId: satB.id,
        distanceKm: dist,
        delayMs: (dist / SPEED_OF_LIGHT_KM_S) * 1000,
        bandwidthGbps: 10.0,
        status: 'active',
        type: 'intra_plane',
      });
    }

    // Inter-plane laser links (connect to adjacent plane)
    const nextPlaneIdx = (planeIdx + 1) % config.planesCount;
    const nextPlaneSats = planeGroups.get(nextPlaneIdx);

    if (nextPlaneSats && nextPlaneSats.length > 0) {
      planeSats.forEach((satA) => {
        // Find closest satellite in adjacent plane
        let closestSat: Satellite | null = null;
        let minDist = Infinity;

        nextPlaneSats.forEach((satB) => {
          const dx = satA.rawEcef[0] - satB.rawEcef[0];
          const dy = satA.rawEcef[1] - satB.rawEcef[1];
          const dz = satA.rawEcef[2] - satB.rawEcef[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < minDist) {
            minDist = dist;
            closestSat = satB;
          }
        });

        // Max optical line-of-sight distance without clipping atmosphere (around 4500 km for 550 km orbit)
        if (closestSat && minDist < 4500) {
          links.push({
            id: `isl-plane-${satA.id}-${(closestSat as Satellite).id}`,
            fromSatId: satA.id,
            toSatId: (closestSat as Satellite).id,
            distanceKm: minDist,
            delayMs: (minDist / SPEED_OF_LIGHT_KM_S) * 1000,
            bandwidthGbps: 10.0,
            status: 'active',
            type: 'inter_plane',
          });
        }
      });
    }
  });

  return links;
}

/**
 * Calculates global coverage percentage and location test metrics.
 */
export function calculateCoverageAnalysis(
  satellites: Satellite[],
  config: ConstellationConfig,
  targetLat?: number,
  targetLon?: number
): { coveragePct: number; targetResult?: LocationCoverageResult } {
  const activeSats = satellites.filter((s) => s.status === 'active');
  
  // Sample 200 geographic points on Earth grid to estimate global coverage
  let coveredCount = 0;
  const sampleStepsLat = 10;
  const sampleStepsLon = 20;
  let totalSamples = 0;

  for (let lat = -70; lat <= 70; lat += 140 / sampleStepsLat) {
    for (let lon = -180; lon <= 180; lon += 360 / sampleStepsLon) {
      totalSamples++;
      let isPointCovered = false;

      for (let i = 0; i < activeSats.length; i++) {
        const sat = activeSats[i];
        const { elevationDeg } = computeSlantRangeAndElevation(lat, lon, sat.rawEcef);
        if (elevationDeg >= config.minElevationDeg) {
          isPointCovered = true;
          break;
        }
      }

      if (isPointCovered) coveredCount++;
    }
  }

  const coveragePct = totalSamples > 0 ? (coveredCount / totalSamples) * 100 : 0;

  let targetResult: LocationCoverageResult | undefined;
  if (targetLat !== undefined && targetLon !== undefined) {
    let visibleCount = 0;
    let bestSat: Satellite | null = null;
    let maxElevation = -90;
    let bestDistance = Infinity;

    activeSats.forEach((sat) => {
      const { distanceKm, elevationDeg } = computeSlantRangeAndElevation(targetLat, targetLon, sat.rawEcef);
      if (elevationDeg >= config.minElevationDeg) {
        visibleCount++;
        if (elevationDeg > maxElevation) {
          maxElevation = elevationDeg;
          bestSat = sat;
          bestDistance = distanceKm;
        }
      }
    });

    const isCovered = visibleCount > 0;
    const estLink = isCovered
      ? calculateLinkBudget(bestDistance, maxElevation, config)
      : { downloadMbps: 0, propagationDelayMs: 0 };

    targetResult = {
      lat: targetLat,
      lon: targetLon,
      isCovered,
      visibleSatCount: visibleCount,
      bestSatId: bestSat ? (bestSat as Satellite).id : null,
      bestElevationDeg: maxElevation > -90 ? maxElevation : 0,
      bestDistanceKm: bestDistance < Infinity ? bestDistance : 0,
      estLatencyMs: isCovered ? estLink.propagationDelayMs * 2 + 15 : 0,
      estDownloadMbps: estLink.downloadMbps,
    };
  }

  return { coveragePct, targetResult };
}
