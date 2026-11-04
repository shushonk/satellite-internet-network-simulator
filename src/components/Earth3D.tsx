import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Satellite, GroundStation, LaserLink, ConstellationConfig } from '../types/simulation';
import {
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Zap,
  Globe,
  Radio,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Earth3DProps {
  satellites: Satellite[];
  groundStations: GroundStation[];
  laserLinks: LaserLink[];
  config: ConstellationConfig;
  selectedSatId: string | null;
  selectedStationId: string | null;
  onSelectSat: (satId: string | null) => void;
  onSelectStation: (stationId: string | null) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onResetTime: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
  timeSeconds: number;
}

export const Earth3D: React.FC<Earth3DProps> = ({
  satellites,
  groundStations,
  laserLinks,
  config,
  selectedSatId,
  selectedStationId,
  onSelectSat,
  onSelectStation,
  isPaused,
  onTogglePause,
  onResetTime,
  simSpeed,
  onChangeSpeed,
  timeSeconds,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Toggles
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showLaserLinks, setShowLaserLinks] = useState<boolean>(true);
  const [showDownlinks, setShowDownlinks] = useState<boolean>(true);
  const [showGroundStations, setShowGroundStations] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const satMeshMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const stationMeshMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const orbitLineGroupRef = useRef<THREE.Group | null>(null);
  const laserLineGroupRef = useRef<THREE.Group | null>(null);
  const downlinkLineGroupRef = useRef<THREE.Group | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);

  // Create procedural Earth texture
  const createEarthTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Oceans background (deep midnight navy blue gradient)
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, '#060d1b');
    oceanGrad.addColorStop(0.5, '#0a1628');
    oceanGrad.addColorStop(1, '#060d1b');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Latitude / Longitude coordinate grid overlay
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += canvas.width / 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += canvas.height / 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Equator line
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Procedural simplified landmass polygons (Continents aesthetic vector render)
    ctx.fillStyle = 'rgba(16, 42, 67, 0.95)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2;

    const drawBlob = (cx: number, cy: number, rx: number, ry: number) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    // North America
    drawBlob(450, 320, 220, 140);
    // South America
    drawBlob(620, 680, 130, 200);
    // Europe
    drawBlob(1080, 280, 140, 90);
    // Africa
    drawBlob(1120, 580, 160, 210);
    // Asia
    drawBlob(1480, 300, 320, 180);
    // Australia
    drawBlob(1680, 720, 150, 100);
    // Antarctica
    drawBlob(1024, 980, 950, 40);

    // City lights neon dots
    ctx.fillStyle = '#00f0ff';
    const cities = [
      [450, 320], [520, 310], [400, 350], [620, 650], [1080, 280], [1150, 260],
      [1450, 320], [1600, 330], [1520, 380], [1680, 720], [1120, 580], [420, 260]
    ];
    cities.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  // Create Satellite 3D composite group (3-12 parts)
  const createSatelliteMesh = (sat: Satellite, isSelected: boolean): THREE.Group => {
    const group = new THREE.Group();

    // 1. Central bus chassis (Cube)
    const busGeo = new THREE.BoxGeometry(0.022, 0.022, 0.035);
    const busMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x00f0ff : 0xcccccc,
      metalness: 0.9,
      roughness: 0.2,
      emissive: isSelected ? 0x00aaff : 0x000000,
      emissiveIntensity: 0.4,
    });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    group.add(busMesh);

    // 2. Dual Solar Array Panels (Left & Right)
    const solarGeo = new THREE.BoxGeometry(0.12, 0.002, 0.02);
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x112255,
      metalness: 0.8,
      roughness: 0.1,
      emissive: 0x0044aa,
      emissiveIntensity: 0.2,
    });
    const solarMesh = new THREE.Mesh(solarGeo, solarMat);
    group.add(solarMesh);

    // 3. Phased Array Downlink Antenna Dish (Bottom)
    const dishGeo = new THREE.CylinderGeometry(0.012, 0.005, 0.006, 12);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      metalness: 0.95,
      roughness: 0.1,
    });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.position.y = -0.014;
    group.add(dishMesh);

    // 4. Status LED beacon
    const ledGeo = new THREE.SphereGeometry(0.004, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({
      color: sat.status === 'failed' ? 0xff0044 : isSelected ? 0x00ffff : 0x00ff88,
    });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0, 0.014, 0);
    group.add(ledMesh);

    // Selection Glow Ring
    if (isSelected) {
      const ringGeo = new THREE.RingGeometry(0.035, 0.042, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      group.add(ringMesh);
    }

    group.userData = { id: sat.id, type: 'satellite' };
    return group;
  };

  // Create Ground Station 3D marker mesh
  const createGroundStationMesh = (station: GroundStation, isSelected: boolean): THREE.Group => {
    const group = new THREE.Group();

    // Dish Base / Tower
    const towerGeo = new THREE.CylinderGeometry(0.006, 0.012, 0.025, 12);
    const towerMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0xab47bc : 0x0288d1,
      metalness: 0.8,
      roughness: 0.3,
    });
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.y = 0.012;
    group.add(towerMesh);

    // Parabolic Dish Antenna
    const dishGeo = new THREE.SphereGeometry(0.014, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.position.y = 0.024;
    dishMesh.rotation.x = -Math.PI / 4;
    group.add(dishMesh);

    // Ground Pulse Base Circle
    const circleGeo = new THREE.RingGeometry(0.015, 0.022, 24);
    const circleMat = new THREE.MeshBasicMaterial({
      color: isSelected ? 0xd000ff : 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const circleMesh = new THREE.Mesh(circleGeo, circleMat);
    circleMesh.rotation.x = Math.PI / 2;
    group.add(circleMesh);

    group.userData = { id: station.id, type: 'station' };
    return group;
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Software WebGL Guard & Renderer setup
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040814); // Deep space dark navy
    scene.fog = new THREE.FogExp2(0x040814, 0.08);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 3.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Studio Environment reflection setup
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.3;
    controls.maxDistance = 6.0;
    controlsRef.current = controls;

    // Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 3, 5);
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x00f0ff, 0x050b18, 1.2);
    scene.add(fillLight);

    // 2. Earth Sphere
    const earthGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const earthTexture = createEarthTexture();
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Atmosphere Glow Atmosphere Atmosphere Outer Rim
    const atmosGeo = new THREE.SphereGeometry(1.035, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // Orbit Lines Group
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);
    orbitLineGroupRef.current = orbitGroup;

    // Laser Links Group
    const laserGroup = new THREE.Group();
    scene.add(laserGroup);
    laserLineGroupRef.current = laserGroup;

    // Downlinks Group
    const downlinkGroup = new THREE.Group();
    scene.add(downlinkGroup);
    downlinkLineGroupRef.current = downlinkGroup;

    // Starfield Background Particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 15 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.7 });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Raycaster for click interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const objectsToTest: THREE.Object3D[] = [];
      satMeshMapRef.current.forEach((mesh) => objectsToTest.push(mesh));
      stationMeshMapRef.current.forEach((mesh) => objectsToTest.push(mesh));

      const intersects = raycaster.intersectObjects(objectsToTest, true);
      if (intersects.length > 0) {
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr && !curr.userData?.id) {
          curr = curr.parent;
        }
        if (curr && curr.userData) {
          if (curr.userData.type === 'satellite') {
            onSelectSat(curr.userData.id);
            onSelectStation(null);
          } else if (curr.userData.type === 'station') {
            onSelectStation(curr.userData.id);
            onSelectSat(null);
          }
        }
      } else {
        onSelectSat(null);
        onSelectStation(null);
      }
    };

    const canvasEl = renderer.domElement;
    canvasEl.addEventListener('click', handleCanvasClick);

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Render Loop
    let frameId = 0;
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      if (earthMeshRef.current) {
        earthMeshRef.current.rotation.y = timeSeconds * 0.005; // Slow Earth axial drift
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      canvasEl.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Orbit Rings when config changes
  useEffect(() => {
    if (!sceneRef.current || !orbitLineGroupRef.current) return;
    const group = orbitLineGroupRef.current;
    
    // Clear old orbit lines
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Line;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      group.remove(child);
    }

    if (!showOrbits) return;

    const planes = Math.max(1, config.planesCount);
    const orbitRadius = 1.0 + config.altitudeKm / 6371;
    const inclinationRad = (config.inclinationDeg * Math.PI) / 180;

    for (let p = 0; p < planes; p++) {
      const raanRad = (2 * Math.PI * p) / planes;
      const points: THREE.Vector3[] = [];
      const segments = 64;

      for (let i = 0; i <= segments; i++) {
        const u = (i * Math.PI * 2) / segments;
        const xOrb = orbitRadius * Math.cos(u);
        const yOrb = orbitRadius * Math.sin(u);

        const xInc = xOrb;
        const yInc = yOrb * Math.cos(inclinationRad);
        const zInc = yOrb * Math.sin(inclinationRad);

        const xEci = xInc * Math.cos(raanRad) - yInc * Math.sin(raanRad);
        const yEci = xInc * Math.sin(raanRad) + yInc * Math.cos(raanRad);
        const zEci = zInc;

        points.push(new THREE.Vector3(xEci, zEci, -yEci));
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.35,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      group.add(line);
    }
  }, [config.planesCount, config.altitudeKm, config.inclinationDeg, showOrbits]);

  // Sync Satellites 3D Meshes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const currentMap = satMeshMapRef.current;

    // Track active sat ids
    const activeIds = new Set(satellites.map((s) => s.id));

    // Remove obsolete
    currentMap.forEach((mesh, satId) => {
      if (!activeIds.has(satId)) {
        scene.remove(mesh);
        currentMap.delete(satId);
      }
    });

    // Add or update
    satellites.forEach((sat) => {
      let mesh = currentMap.get(sat.id);
      const isSelected = selectedSatId === sat.id;

      if (!mesh) {
        mesh = createSatelliteMesh(sat, isSelected);
        scene.add(mesh);
        currentMap.set(sat.id, mesh);
      }

      // Update position
      mesh.position.set(sat.position[0], sat.position[1], sat.position[2]);
    });
  }, [satellites, selectedSatId]);

  // Sync Ground Station 3D Markers
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const currentMap = stationMeshMapRef.current;

    if (!showGroundStations) {
      currentMap.forEach((mesh) => scene.remove(mesh));
      currentMap.clear();
      return;
    }

    const activeIds = new Set(groundStations.map((g) => g.id));
    currentMap.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        scene.remove(mesh);
        currentMap.delete(id);
      }
    });

    groundStations.forEach((st) => {
      let mesh = currentMap.get(st.id);
      const isSelected = selectedStationId === st.id;

      if (!mesh) {
        mesh = createGroundStationMesh(st, isSelected);
        scene.add(mesh);
        currentMap.set(st.id, mesh);
      }

      // Lat/Lon to unit vector on Earth surface
      const phi = (st.lat * Math.PI) / 180;
      const lambda = (st.lon * Math.PI) / 180;
      const r = 1.01; // Slightly above Earth surface

      const x = r * Math.cos(phi) * Math.cos(lambda);
      const y = r * Math.sin(phi);
      const z = -r * Math.cos(phi) * Math.sin(lambda);

      mesh.position.set(x, y, z);
      // Orient normal away from center
      mesh.lookAt(x * 2, y * 2, z * 2);
    });
  }, [groundStations, selectedStationId, showGroundStations]);

  // Render Laser Inter-Satellite Links (ISL) lines
  useEffect(() => {
    if (!laserLineGroupRef.current) return;
    const group = laserLineGroupRef.current;

    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Line;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      group.remove(child);
    }

    if (!showLaserLinks || laserLinks.length === 0) return;

    const satPosMap = new Map<string, [number, number, number]>();
    satellites.forEach((s) => satPosMap.set(s.id, s.position));

    laserLinks.forEach((link) => {
      const posA = satPosMap.get(link.fromSatId);
      const posB = satPosMap.get(link.toSatId);
      if (!posA || !posB) return;

      const points = [
        new THREE.Vector3(posA[0], posA[1], posA[2]),
        new THREE.Vector3(posB[0], posB[1], posB[2]),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: link.type === 'intra_plane' ? 0x00ffff : 0xd000ff,
        transparent: true,
        opacity: link.type === 'intra_plane' ? 0.6 : 0.4,
      });
      const line = new THREE.Line(geo, mat);
      group.add(line);
    });
  }, [laserLinks, satellites, showLaserLinks]);

  // Render Downlink Beams from Ground Station to Connected Satellite
  useEffect(() => {
    if (!downlinkLineGroupRef.current) return;
    const group = downlinkLineGroupRef.current;

    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Line;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      group.remove(child);
    }

    if (!showDownlinks) return;

    const satPosMap = new Map<string, [number, number, number]>();
    satellites.forEach((s) => satPosMap.set(s.id, s.position));

    groundStations.forEach((st) => {
      if (!st.connectedSatId || st.status !== 'connected') return;
      const satPos = satPosMap.get(st.connectedSatId);
      if (!satPos) return;

      const phi = (st.lat * Math.PI) / 180;
      const lambda = (st.lon * Math.PI) / 180;
      const gx = 1.01 * Math.cos(phi) * Math.cos(lambda);
      const gy = 1.01 * Math.sin(phi);
      const gz = -1.01 * Math.cos(phi) * Math.sin(lambda);

      const points = [
        new THREE.Vector3(gx, gy, gz),
        new THREE.Vector3(satPos[0], satPos[1], satPos[2]),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.8,
      });
      const line = new THREE.Line(geo, mat);
      group.add(line);
    });
  }, [groundStations, satellites, showDownlinks]);

  return (
    <div className="relative w-full h-full min-h-[520px] bg-slate-950 rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl">
      {/* 3D WebGL Canvas Mounting Box */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Overlay: Quick View Mode Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-xs text-cyan-300 font-mono shadow-lg">
        <Globe className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
        <span>LEO Orbit View • {config.altitudeKm} km</span>
      </div>

      {/* Top Right Overlay: Camera Controls & Fullscreen */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => {
            if (controlsRef.current && cameraRef.current) {
              cameraRef.current.position.set(0, 1.8, 3.2);
              controlsRef.current.target.set(0, 0, 0);
              controlsRef.current.update();
            }
          }}
          className="p-2 rounded-lg bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 transition-all shadow-lg text-xs flex items-center gap-1.5"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Cam</span>
        </button>

        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-2 rounded-lg bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 transition-all shadow-lg"
          title="Toggle Canvas Fullscreen"
        >
          {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Center Unified Collapsible Dock (Zero Viewport Occlusion Discipline) */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 max-w-[94vw] w-[860px] ${
          isDockCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse Drawer Toggle Bar */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="flex items-center gap-1.5 px-4 py-1 rounded-t-xl bg-slate-900/90 border-t border-x border-cyan-500/40 text-[11px] font-mono text-cyan-300 hover:text-white transition-colors shadow-lg"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Show Controls Dock</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Main Glassmorphism Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200">
          {/* Time & Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePause}
              className={`p-2 rounded-xl border font-medium flex items-center gap-1.5 transition-all shadow-md ${
                isPaused
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4 fill-cyan-300" /> : <Pause className="w-4 h-4 fill-emerald-300" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={onResetTime}
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              title="Reset Time to T+00:00"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Sim Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-[11px]">
              {[0.5, 1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    simSpeed === s
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOrbits(!showOrbits)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
                showOrbits
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Orbits</span>
            </button>

            <button
              onClick={() => setShowLaserLinks(!showLaserLinks)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
                showLaserLinks
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Laser ISL</span>
            </button>

            <button
              onClick={() => setShowDownlinks(!showDownlinks)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
                showDownlinks
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Downlinks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
