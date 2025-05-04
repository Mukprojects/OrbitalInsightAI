
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface GlobeProps {
  onSatelliteSelect: (satellite: any) => void;
}

const Globe = ({ onSatelliteSelect }: GlobeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 4;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create Earth sphere
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    
    // Load Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
      () => {
        setLoaded(true);
      }
    );
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 5
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    
    // Create atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(1.01, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x4cc9f0,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
    
    // Create star background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const positions = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    // Create sample satellites
    const satellites: THREE.Mesh[] = [];
    const satelliteData = [
      { color: 0x4CC9F0, radius: 0.02, distance: 1.3, speed: 0.005, inclination: 0.2 },
      { color: 0x06D6A0, radius: 0.015, distance: 1.5, speed: 0.002, inclination: 0.5 },
      { color: 0xFFD166, radius: 0.02, distance: 1.7, speed: 0.001, inclination: 0.1 },
      { color: 0xFF6B6B, radius: 0.018, distance: 1.4, speed: 0.003, inclination: 0.8 }
    ];
    
    satelliteData.forEach((data, index) => {
      const satelliteGeometry = new THREE.SphereGeometry(data.radius, 16, 16);
      const satelliteMaterial = new THREE.MeshPhongMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.5,
        shininess: 10
      });
      
      const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
      
      // Create orbit
      const orbitGeometry = new THREE.BufferGeometry();
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.5
      });
      
      const orbitPoints = [];
      const segments = 128;
      
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = data.distance * Math.cos(theta);
        const z = data.distance * Math.sin(theta);
        orbitPoints.push(new THREE.Vector3(x, 0, z));
      }
      
      orbitGeometry.setFromPoints(orbitPoints);
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
      
      // Apply inclination
      orbit.rotation.x = data.inclination;
      
      scene.add(orbit);
      scene.add(satellite);
      satellites.push(satellite);
      
      // Set initial position
      const initialAngle = Math.random() * Math.PI * 2;
      satellite.position.x = data.distance * Math.cos(initialAngle);
      satellite.position.z = data.distance * Math.sin(initialAngle);
    });
    
    // Handle click events for satellite selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const onMouseClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(satellites);
      
      if (intersects.length > 0) {
        const index = satellites.indexOf(intersects[0].object as THREE.Mesh);
        
        // Sample satellite data for UI
        const mockSatellites = [
          {
            id: "sat-001",
            name: "GlobalSat-1",
            type: "Earth Observation",
            altitude: 705,
            velocity: 27600,
            inclination: 98.2,
            status: "active" as const
          },
          {
            id: "sat-002",
            name: "OceanMonitor-3",
            type: "Weather",
            altitude: 824,
            velocity: 27100,
            inclination: 35.6,
            status: "active" as const
          },
          {
            id: "sat-003",
            name: "CommRelay-7",
            type: "Communications",
            altitude: 780,
            velocity: 27300,
            inclination: 45.1,
            status: "warning" as const
          },
          {
            id: "sat-004",
            name: "DefenseSat-2",
            type: "Military",
            altitude: 410,
            velocity: 28100,
            inclination: 51.6,
            status: "inactive" as const
          }
        ];
        
        onSatelliteSelect(mockSatellites[index % mockSatellites.length]);
      }
    };
    
    renderer.domElement.addEventListener('click', onMouseClick);
    
    // Make Earth rotate
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let autoRotate = true;
    
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
      autoRotate = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };
      
      earth.rotation.y += deltaMove.x * 0.005;
      earth.rotation.x += deltaMove.y * 0.005;
      
      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      setTimeout(() => {
        if (!isDragging) autoRotate = true;
      }, 2000);
    };
    
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (autoRotate) {
        earth.rotation.y += 0.0005;
      }
      
      // Update satellite positions
      satelliteData.forEach((data, index) => {
        const satellite = satellites[index];
        const time = performance.now() * data.speed * 0.001;
        
        satellite.position.x = data.distance * Math.cos(time);
        satellite.position.z = data.distance * Math.sin(time);
        
        // Apply inclination
        satellite.position.y = Math.sin(time) * Math.sin(data.inclination) * data.distance;
      });
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('click', onMouseClick);
      
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose meshes and geometries
      earthGeometry.dispose();
      earthMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      
      satellites.forEach(satellite => {
        scene.remove(satellite);
      });
    };
  }, [onSatelliteSelect]);
  
  return (
    <div ref={containerRef} className="w-full h-full relative">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-space-accent">Loading Earth model...</div>
        </div>
      )}
      <div className="absolute inset-0 pointer-events-none rounded-lg" style={{
        boxShadow: 'inset 0 0 50px rgba(10, 36, 114, 0.5)'
      }}></div>
    </div>
  );
};

export default Globe;
