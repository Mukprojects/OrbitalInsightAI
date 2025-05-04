
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
    camera.position.z = 3.5;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    
    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    const blueLight = new THREE.PointLight(0x4CC9F0, 2, 10);
    blueLight.position.set(-5, 3, 0);
    scene.add(blueLight);

    // Create Earth sphere with higher resolution
    const earthGeometry = new THREE.SphereGeometry(1, 96, 96);
    
    // Load Earth texture with additional maps
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
      () => {
        setLoaded(true);
      }
    );
    
    // Load bump map for terrain
    const bumpMap = textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg"
    );
    
    // Load specular map for better water reflections
    const specularMap = textureLoader.load(
      "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg"
    );
    
    // Enhanced material with normal and specular maps
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      specularMap: specularMap,
      specular: new THREE.Color(0x4CC9F0),
      shininess: 15
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    
    // Create atmosphere glow with better transparency
    const atmosphereGeometry = new THREE.SphereGeometry(1.01, 96, 96);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x4cc9f0,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
    
    // Create outer glow
    const glowGeometry = new THREE.SphereGeometry(1.15, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.1 },
        p: { value: 4.5 },
        glowColor: { value: new THREE.Color(0x4cc9f0) },
        viewVector: { value: camera.position }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.6 - dot(vNormal, vNormel), 2.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity * 0.4);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);
    
    // Create better star background with varying sizes
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 3000;
    const positions = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);
    
    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;
      
      // Varying star sizes for better visual effect
      sizes[i] = Math.random() * 0.1 + 0.05;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Improved stars with custom shaders for better glow
    const starsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        pointTexture: { value: null }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = vec3(1.0, 1.0, 1.0);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying vec3 vColor;
        void main() {
          float r = 0.0;
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          r = dot(cxy, cxy);
          if (r > 1.0) {
              discard;
          }
          gl_FragColor = vec4(color * vColor, 1.0 - r);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      transparent: true
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    // Create sample satellites with better visuals
    const satellites: THREE.Mesh[] = [];
    const satelliteData = [
      { color: 0x4CC9F0, radius: 0.02, distance: 1.3, speed: 0.005, inclination: 0.2, trailLength: 50 },
      { color: 0x06D6A0, radius: 0.015, distance: 1.5, speed: 0.002, inclination: 0.5, trailLength: 50 },
      { color: 0xFFD166, radius: 0.02, distance: 1.7, speed: 0.001, inclination: 0.1, trailLength: 50 },
      { color: 0xFF6B6B, radius: 0.018, distance: 1.4, speed: 0.003, inclination: 0.8, trailLength: 50 }
    ];
    
    // Create satellite trails
    const trails: THREE.Line[] = [];
    
    satelliteData.forEach((data, index) => {
      // Create a more detailed satellite
      const satelliteGeometry = new THREE.SphereGeometry(data.radius, 16, 16);
      const satelliteMaterial = new THREE.MeshPhongMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.5,
        shininess: 30
      });
      
      const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
      
      // Add a small glow around the satellite
      const satelliteGlowGeometry = new THREE.SphereGeometry(data.radius * 1.5, 16, 16);
      const satelliteGlowMaterial = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.3
      });
      const satelliteGlow = new THREE.Mesh(satelliteGlowGeometry, satelliteGlowMaterial);
      satellite.add(satelliteGlow);
      
      // Create improved orbit with fade effect
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
      
      // Create satellite trail
      const trailGeometry = new THREE.BufferGeometry();
      const trailMaterial = new THREE.LineBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.7
      });
      
      // Initialize empty trail points
      const trailPositions = new Float32Array(data.trailLength * 3);
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      trailGeometry.setDrawRange(0, 0);
      
      const trail = new THREE.Line(trailGeometry, trailMaterial);
      trails.push(trail);
      
      scene.add(orbit);
      scene.add(satellite);
      scene.add(trail);
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
        
        // Highlight selected satellite
        satellites.forEach((sat, i) => {
          if (i === index) {
            (sat.material as THREE.MeshPhongMaterial).emissiveIntensity = 1.0;
          } else {
            (sat.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.5;
          }
        });
        
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
      atmosphere.rotation.y = earth.rotation.y;
      atmosphere.rotation.x = earth.rotation.x;
      glow.rotation.y = earth.rotation.y;
      glow.rotation.x = earth.rotation.x;
      
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
    
    // Trail position arrays
    const trailPositionsArrays = trails.map(() => []);
    
    // Animation loop with improved effects
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (autoRotate) {
        earth.rotation.y += 0.0005;
        atmosphere.rotation.y = earth.rotation.y;
        glow.rotation.y = earth.rotation.y;
      }
      
      // Update glow shader for camera position
      (glowMaterial.uniforms.viewVector as any).value = new THREE.Vector3().subVectors(
        camera.position, glow.position
      );
      
      // Update satellite positions and trails
      satelliteData.forEach((data, index) => {
        const satellite = satellites[index];
        const trail = trails[index];
        const trailPositions = trailPositionsArrays[index] as THREE.Vector3[];
        
        const time = performance.now() * data.speed * 0.001;
        
        // Calculate new satellite position
        const x = data.distance * Math.cos(time);
        const z = data.distance * Math.sin(time);
        const y = Math.sin(time) * Math.sin(data.inclination) * data.distance;
        
        satellite.position.set(x, y, z);
        
        // Update trail
        if (trailPositions.length >= data.trailLength) {
          trailPositions.shift();
        }
        
        trailPositions.push(new THREE.Vector3(x, y, z));
        
        // Update trail geometry
        const trailGeometry = trail.geometry as THREE.BufferGeometry;
        const positions = trailGeometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < trailPositions.length; i++) {
          const i3 = i * 3;
          positions[i3] = trailPositions[i].x;
          positions[i3 + 1] = trailPositions[i].y;
          positions[i3 + 2] = trailPositions[i].z;
        }
        
        trailGeometry.setDrawRange(0, trailPositions.length);
        trailGeometry.attributes.position.needsUpdate = true;
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
      
      // Dispose resources
      earthGeometry.dispose();
      earthMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      
      satellites.forEach(satellite => {
        scene.remove(satellite);
        satellite.geometry.dispose();
        (satellite.material as THREE.Material).dispose();
      });
      
      trails.forEach(trail => {
        scene.remove(trail);
        trail.geometry.dispose();
        (trail.material as THREE.Material).dispose();
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
        boxShadow: 'inset 0 0 50px rgba(76, 201, 240, 0.3)'
      }}></div>
    </div>
  );
};

export default Globe;
