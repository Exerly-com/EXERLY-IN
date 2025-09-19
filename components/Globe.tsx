'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import Globe from 'three-globe';
import * as THREE from 'three';

// Trade routes
const routes = [
  { startLat: 19.07, startLng: 72.87, endLat: 25.27, endLng: 55.3, name: 'Mumbai → Dubai' },
  { startLat: 25.27, startLng: 55.3, endLat: 51.51, endLng: -0.13, name: 'Dubai → London' },
  { startLat: 51.51, startLng: -0.13, endLat: 40.71, endLng: -74.0, name: 'London → New York' },
  { startLat: 40.71, endLat: -74.0, startLng: 35.68, lng: 139.69, name: 'New York → Tokyo' },
  { startLat: 35.68, startLng: 139.69, endLat: 1.35, endLng: 103.82, name: 'Tokyo → Singapore' },
  { startLat: 1.35, startLng: 103.82, endLat: 28.61, endLng: 77.23, name: 'Singapore → Delhi' },
  { startLat: -23.55, startLng: -46.63, endLat: 40.71, endLng: -74.0, name: 'São Paulo → New York' },
  { startLat: 55.75, startLng: 37.62, endLat: 25.27, endLng: 55.3, name: 'Moscow → Dubai' },
  { startLat: -33.87, startLng: 151.21, endLat: 1.35, endLng: 103.82, name: 'Sydney → Singapore' },
  { startLat: 48.85, startLng: 2.35, endLat: 25.27, endLng: 55.3, name: 'Paris → Dubai' }
];

function Scene() {
  const { scene } = useThree();
  const globeGroup = useRef<THREE.Group>(new THREE.Group());

  useEffect(() => {
    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(150, 80, 220);
    scene.add(dirLight);

    // Globe with arcs
    const globe = new Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .arcsData(routes)
      .arcColor(() => ['#2563eb', '#60a5fa']) // neon gradient blue
      .arcAltitude(0.28)
      .arcStroke(1.15)
      .arcDashLength(0.6) // arc visible length
      .arcDashGap(1.8)
      .arcDashAnimateTime(6000); // smoother, slower flow

    // Pulse rings at origins
    const origins = routes.map(r => ({ lat: r.startLat, lng: r.startLng }));
    globe
      .ringsData(origins)
      .ringColor(() => 'rgba(59,130,246,0.85)')
      .ringMaxRadius(6)
      .ringPropagationSpeed(1.1)
      .ringRepeatPeriod(3000);

    globe.scale.set(1.3, 1.3, 1.3);

    globeGroup.current.add(globe);
    scene.add(globeGroup.current);
  }, [scene]);

  useFrame(() => {
    if (globeGroup.current) globeGroup.current.rotation.y += 0.0007; // slow, smooth spin
  });

  return null;
}

export default function Globe3D() {
  return (
    <Canvas camera={{ position: [0, 0, 430], fov: 45 }} style={{ width: '100%', height: 650 }}>
      <Scene />

      {/* Premium stars */}
      <Stars
        radius={900}
        depth={120}
        count={5000}
        factor={3}
        saturation={0}
        fade
        speed={0.2}
      />

      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}
