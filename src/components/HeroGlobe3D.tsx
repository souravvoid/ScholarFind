import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const HeroGlobe3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) {
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 220;

    // Outer globe sphere (wireframe geodesic)
    const globeGeo = new THREE.IcosahedronGeometry(70, 3);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x1d4ed8,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Inner glowing core
    const innerGeo = new THREE.SphereGeometry(66, 24, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x0037b0,
      transparent: true,
      opacity: 0.03,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    globe.add(innerSphere);

    // Verified Hub Nodes (representing key global university endowments)
    const hubs = [
      { lat: 52.2, lon: 0.12 },   // Cambridge, UK
      { lat: 52.5, lon: 13.4 },   // Berlin / Germany
      { lat: 37.4, lon: -122.1 }, // Stanford / USA
      { lat: 48.8, lon: 2.35 },   // Paris / EU
      { lat: 35.6, lon: 139.6 },  // Tokyo / Japan
      { lat: -35.2, lon: 149.1 }, // Canberra / Australia
      { lat: 43.6, lon: -79.3 },  // Toronto / Canada
      { lat: 6.5, lon: 3.3 },     // Lagos / West Africa
      { lat: 12.9, lon: 77.5 },   // Bangalore / India
    ];

    const hubGroup = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(2.2, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x1d4ed8 });
    const ringGeo = new THREE.RingGeometry(3, 4.5, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x047857, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });

    function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    }

    const hubPoints: THREE.Vector3[] = [];
    hubs.forEach((hub) => {
      const pos = latLonToVector3(hub.lat, hub.lon, 70.5);
      hubPoints.push(pos);

      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      hubGroup.add(nodeMesh);

      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.01));
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      hubGroup.add(ringMesh);
    });

    globe.add(hubGroup);

    // Collegiate Mobility Arc Lines connecting hubs
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.35,
    });

    for (let i = 0; i < hubPoints.length - 1; i++) {
      const start = hubPoints[i];
      const end = hubPoints[(i + 1) % hubPoints.length];
      const mid = start.clone().add(end).multiplyScalar(0.5);
      mid.multiplyScalar(1.25); // arch outward

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(24);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveLine = new THREE.Line(curveGeo, lineMat);
      globe.add(curveLine);
    }

    // Floating micro-star particle field
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 140;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 300;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 150;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x1d4ed8,
      size: 2,
      transparent: true,
      opacity: 0.25,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Initial rotation angle
    globe.rotation.x = 0.2;
    globe.rotation.y = 1.2;

    // Intersection Observer to pause rendering when not in viewport
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      if (!prefersReducedMotion) {
        globe.rotation.y += delta * 0.12;
        particles.rotation.y += delta * 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      lineMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  if (!hasWebGL) {
    return (
      <div className="w-full h-full flex items-center justify-center opacity-40">
        <div className="w-48 h-48 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center">
          <span aria-hidden="true" className="material-symbols-outlined text-[48px] text-primary">public</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mountRef} 
      className="w-full h-[320px] sm:h-[380px] lg:h-[440px] relative pointer-events-none select-none flex items-center justify-center"
      aria-hidden="true"
    />
  );
};
