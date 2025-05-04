
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { satelliteList, latLongToVector3, SatelliteData } from "../utils/satelliteData";

interface GlobeProps {
  onSatelliteSelect: (satellite: SatelliteData) => void;
  selectedSatelliteId?: string;
}

const Globe = ({ onSatelliteSelect, selectedSatelliteId }: GlobeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const satelliteObjectsRef = useRef<{[id: string]: THREE.Object3D}>({});
  
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
    
    // Create real satellites from our data
    const satellites: THREE.Object3D[] = [];
    const satelliteObjects: {[id: string]: THREE.Object3D} = {};

    // Color mapping for satellite types
    const typeColorMap: Record<string, number> = {
      "Earth Observation": 0x4CC9F0,
      "Weather": 0x06D6A0,
      "Communications": 0xFFD166,
      "Military": 0xFF6B6B,
      "Scientific": 0xAA96DA
    };

    // Status effect mapping
    const statusEffectMap: Record<string, {opacity: number, pulseSpeed: number}> = {
      "active": {opacity: 0.7, pulseSpeed: 0.5},
      "warning": {opacity: 0.9, pulseSpeed: 2},
      "inactive": {opacity: 0.3, pulseSpeed: 0.1}
    };

    // Create satellites based on real data
    satelliteList.forEach((satData) => {
      const color = typeColorMap[satData.type] || 0xFFFFFF;
      
      // Create a group to hold the satellite and its label
      const satelliteGroup = new THREE.Group();

      // Create a more detailed satellite
      const satelliteGeometry = new THREE.SphereGeometry(0.02, 16, 16);
      const satelliteMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        shininess: 30
      });
      
      const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
      
      // Add a small glow around the satellite
      const satelliteGlowGeometry = new THREE.SphereGeometry(0.03, 16, 16);
      const satelliteGlowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: statusEffectMap[satData.status]?.opacity || 0.5
      });
      const satelliteGlow = new THREE.Mesh(satelliteGlowGeometry, satelliteGlowMaterial);
      satellite.add(satelliteGlow);
      
      // Add a ping effect for better visibility
      const pingGeometry = new THREE.SphereGeometry(0.01, 16, 16);
      const pingMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
      });
      const ping = new THREE.Mesh(pingGeometry, pingMaterial);
      satellite.add(ping);
      
      // Add to group
      satelliteGroup.add(satellite);
      
      // Add user data for raycasting identification
      satelliteGroup.userData = { id: satData.id };
      
      // Calculate position from lat/long
      const scaleFactor = satData.altitude / 2500; // Scale altitude for visual effect
      const altitude = 0.05 + scaleFactor * 0.15;
      const [x, y, z] = latLongToVector3(satData.latitude, satData.longitude, 1, altitude);
      
      satelliteGroup.position.set(x, y, z);
      
      // Create orbit based on inclination and altitude
      const orbitGeometry = new THREE.BufferGeometry();
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2 + (statusEffectMap[satData.status]?.opacity || 0) * 0.3
      });
      
      // Calculate orbit points based on satellite position and inclination
      const orbitRadius = Math.sqrt(x*x + y*y + z*z);
      const orbitPoints = [];
      const segments = 128;
      
      // Create orbit points in a circle that passes through the satellite position
      const normalVector = new THREE.Vector3(x, y, z).normalize();
      const rotationAxis = new THREE.Vector3(0, 1, 0).cross(normalVector).normalize();
      
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        
        // Create a point on a circle
        const tempVector = new THREE.Vector3(
          orbitRadius * Math.cos(theta),
          0,
          orbitRadius * Math.sin(theta)
        );
        
        // Rotate the circle to align with the satellite's position
        tempVector.applyAxisAngle(rotationAxis, Math.acos(normalVector.y));
        
        orbitPoints.push(tempVector);
      }
      
      orbitGeometry.setFromPoints(orbitPoints);
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
      
      // Apply inclination variation
      orbit.rotation.x = (satData.inclination / 180) * Math.PI * 0.3;
      
      scene.add(orbit);
      scene.add(satelliteGroup);
      satellites.push(satelliteGroup);
      satelliteObjects[satData.id] = satelliteGroup;
    });
    
    // Store satellite objects reference
    satelliteObjectsRef.current = satelliteObjects;
    
    // Handle click events for satellite selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const onMouseClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(satellites, true);
      
      if (intersects.length > 0) {
        // Find the parent group
        let obj: THREE.Object3D | null = intersects[0].object;
        
        // Go up the hierarchy until we find the group with userData
        while (obj && !obj.userData?.id) {
          obj = obj.parent;
        }
        
        if (obj && obj.userData?.id) {
          const satelliteId = obj.userData.id;
          const satellite = satelliteList.find(sat => sat.id === satelliteId);
          
          if (satellite) {
            // Highlight selected satellite
            highlightSatellite(satelliteId);
            onSatelliteSelect(satellite);
          }
        }
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
    
    // Function to highlight a selected satellite
    const highlightSatellite = (id: string | undefined) => {
      Object.entries(satelliteObjects).forEach(([satId, satObj]) => {
        const isSelected = satId === id;
        
        // Find the satellite mesh (first child)
        const satMesh = satObj.children[0] as THREE.Mesh;
        if (satMesh) {
          // Update material properties based on selection
          const material = satMesh.material as THREE.MeshPhongMaterial;
          material.emissiveIntensity = isSelected ? 1.0 : 0.5;
          
          // Find and update the glow effect
          if (satMesh.children.length > 0) {
            const glowMesh = satMesh.children[0] as THREE.Mesh;
            const glowMaterial = glowMesh.material as THREE.MeshBasicMaterial;
            
            if (isSelected) {
              glowMaterial.opacity = 0.9;
              const scale = isSelected ? 1.8 : 1.0;
              glowMesh.scale.set(scale, scale, scale);
            } else {
              const satData = satelliteList.find(sat => sat.id === satId);
              if (satData) {
                glowMaterial.opacity = statusEffectMap[satData.status]?.opacity || 0.5;
              }
              glowMesh.scale.set(1, 1, 1);
            }
          }
          
          // Scale the satellite up if selected
          satMesh.scale.set(
            isSelected ? 1.5 : 1.0,
            isSelected ? 1.5 : 1.0,
            isSelected ? 1.5 : 1.0
          );
        }
      });
    };
    
    // Animation variables
    const clock = new THREE.Clock();
    
    // Animation loop with improved effects
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      if (autoRotate) {
        earth.rotation.y += 0.0005;
        atmosphere.rotation.y = earth.rotation.y;
        glow.rotation.y = earth.rotation.y;
      }
      
      // Update glow shader for camera position
      (glowMaterial.uniforms.viewVector as any).value = new THREE.Vector3().subVectors(
        camera.position, glow.position
      );
      
      // Animate satellites
      satelliteList.forEach((satData) => {
        const satObj = satelliteObjects[satData.id];
        if (satObj) {
          // Get the main satellite mesh
          const satMesh = satObj.children[0] as THREE.Mesh;
          
          if (satMesh && satMesh.children.length > 0) {
            // Update glow ping effect
            const glowMesh = satMesh.children[0] as THREE.Mesh;
            const pingMesh = satMesh.children[1] as THREE.Mesh;
            
            // Pulse effect based on status
            const statusEffect = statusEffectMap[satData.status] || { opacity: 0.5, pulseSpeed: 0.5 };
            const pulseFactor = Math.sin(elapsedTime * statusEffect.pulseSpeed) * 0.2 + 0.8;
            
            if (glowMesh) {
              const glowMaterial = glowMesh.material as THREE.MeshBasicMaterial;
              glowMaterial.opacity = statusEffect.opacity * pulseFactor;
            }
            
            // Scale ping for pulse effect
            if (pingMesh) {
              const pingScale = 1.0 + Math.sin(elapsedTime * statusEffect.pulseSpeed * 2) * 0.5;
              pingMesh.scale.set(pingScale, pingScale, pingScale);
            }
          }
        }
      });
      
      renderer.render(scene, camera);
    };
    
    // Start animation
    animate();
    
    // Apply initial highlight if a satellite is selected
    if (selectedSatelliteId) {
      highlightSatellite(selectedSatelliteId);
    }
    
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
      
      Object.values(satelliteObjects).forEach(satellite => {
        scene.remove(satellite);
        // Dispose geometry and materials recursively
        satellite.traverse((child) => {
          if ((child as THREE.Mesh).geometry) {
            (child as THREE.Mesh).geometry.dispose();
          }
          
          if ((child as THREE.Mesh).material) {
            const material = (child as THREE.Mesh).material;
            if (Array.isArray(material)) {
              material.forEach(mat => mat.dispose());
            } else {
              material.dispose();
            }
          }
        });
      });
    };
  }, [onSatelliteSelect, selectedSatelliteId]);
  
  // Highlight selected satellite if ID changes
  useEffect(() => {
    if (selectedSatelliteId) {
      const satelliteObjects = satelliteObjectsRef.current;
      Object.entries(satelliteObjects).forEach(([satId, satObj]) => {
        const isSelected = satId === selectedSatelliteId;
        const satMesh = satObj.children[0] as THREE.Mesh;
        
        if (satMesh) {
          // Update material properties based on selection
          const material = satMesh.material as THREE.MeshPhongMaterial;
          material.emissiveIntensity = isSelected ? 1.0 : 0.5;
          
          // Scale the satellite up if selected
          satMesh.scale.set(
            isSelected ? 1.5 : 1.0,
            isSelected ? 1.5 : 1.0,
            isSelected ? 1.5 : 1.0
          );
          
          // Find and update the glow effect
          if (satMesh.children.length > 0) {
            const glowMesh = satMesh.children[0] as THREE.Mesh;
            const glowMaterial = glowMesh.material as THREE.MeshBasicMaterial;
            
            if (isSelected) {
              glowMaterial.opacity = 0.9;
              const scale = isSelected ? 1.8 : 1.0;
              glowMesh.scale.set(scale, scale, scale);
            }
          }
        }
      });
    }
  }, [selectedSatelliteId]);
  
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
      <div className="absolute bottom-4 left-4 text-xs text-space-accent bg-black/30 p-2 rounded">
        <div>Globe Controls: Click + Drag to rotate</div>
        <div>Click on any satellite to view details</div>
      </div>
    </div>
  );
};

export default Globe;
