"use client";

import { useEffect, useRef } from "react";
import {
  Scene,
  FogExp2,
  PerspectiveCamera,
  WebGLRenderer,
  CanvasTexture,
  LinearFilter,
  BufferGeometry,
  BufferAttribute,
  Float32BufferAttribute,
  ShaderMaterial,
  AdditiveBlending,
  Points,
  Group,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Clock,
} from "three";
import { generateCampusPointData, CAMPUS_NODES } from "@/lib/buildingGeometry";

// CUSTOMIZABLE PARAMETERS FOR THE 3D SCENE
const CONFIG = {
  particleDensity: 1.0,        // 1.0 is standard. Increase/decrease for more/fewer dots.
  cameraDistanceStart: 95,     // Initial camera zoom out (further is smaller building)
  cameraDistanceEnd: 28,       // Final camera zoom on scroll (closer is zoomed in)
  cameraHeightStart: 38,       // Camera height above ground
  cameraHeightEnd: 15,        // Camera height at maximum scroll
  rotationSpeed: 0.08,         // Speed of the slow automated turntable rotation
  driftFrequency: 0.4,         // Frequency of the gentle breathing drift
  driftAmplitude: 0.15,        // Amplitude of the breathing drift
  dispersionIntensity: 22.0,   // How far particles scatter/explode on scroll
  fadeScrollPercent: 0.70,     // Scroll percentage where canvas is completely faded out (0.0 to 1.0)
};

export default function ThreeHeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // --- 1. SETUP THREE.JS SCENE ---
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new Scene();
    scene.fog = new FogExp2(0x0c0a09, 0.007); // Subtle ambient fog matching Deep Obsidian

    // Camera with responsive FOV
    const camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    
    // Position camera initially at high isometric-style angle
    camera.position.set(0, CONFIG.cameraHeightStart, CONFIG.cameraDistanceStart);
    camera.lookAt(0, 4, 0);

    const renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap at 1.5 for performance
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent canvas background

    // --- 2. PROCEDURAL TEXTURE GENERATION ---
    // Generates a soft-glow radial dot inside an off-screen canvas to feed to the GPU.
    // Avoids fetching static image files, ensuring instant, zero-flicker loads.
    function createGlowTexture() {
      const size = 64;
      const tCanvas = document.createElement("canvas");
      tCanvas.width = size;
      tCanvas.height = size;
      const ctx = tCanvas.getContext("2d");
      
      if (ctx) {
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
        grad.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
        grad.addColorStop(0.5, "rgba(255, 255, 255, 0.18)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
      }
      
      const texture = new CanvasTexture(tCanvas);
      texture.minFilter = LinearFilter;
      return texture;
    }

    const particleTexture = createGlowTexture();

    // --- 3. GENERATE CAMPUS GEOMETRY ---
    const campusData = generateCampusPointData(CONFIG.particleDensity);
    
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(campusData.positions, 3));
    geometry.setAttribute("color", new BufferAttribute(campusData.colors, 3));
    geometry.setAttribute("aSize", new BufferAttribute(campusData.sizes, 1));

    // Custom Shaders for ultra-high GPU performance & complex visual behaviors
    const vertexShader = `
      uniform float uScrollProgress;
      uniform float uTime;
      uniform float uIsDark;
      attribute float aSize;
      varying vec3 vColor;
      varying float vAlpha;

      // Pseudo-random hash function for unique particle directions
      float hash(float n) { 
        return fract(sin(n) * 43758.5453123); 
      }

      void main() {
        // Original color from buffer (Amber/Terracotta)
        vec3 darkColor = color;
        
        // Custom light-theme colors: we darken the bright amber/terracotta particles in light mode
        // to provide excellent readability and editorial premium contrast on soft cream surfaces.
        vec3 lightColor = vec3(
          darkColor.r * 0.42,
          darkColor.g * 0.38,
          darkColor.b * 0.32
        );
        
        vColor = mix(lightColor, darkColor, uIsDark);
        
        // Generate a seed unique to each particle based on its starting coordinate
        float seed = position.x * 17.1 + position.y * 23.3 + position.z * 37.7;
        
        // Dispersion vector: particles explode softly outwards from their origin as scroll progress increases
        vec3 dispersionDir = vec3(
          hash(seed) - 0.5,
          hash(seed + 1.0) - 0.5,
          hash(seed + 2.0) - 0.5
        );
        
        // Normalize and apply dispersion amplitude
        vec3 dispersion = normalize(dispersionDir) * ${CONFIG.dispersionIntensity.toFixed(2)} * uScrollProgress;
        
        // Core breathing drift animation calculated in the vertex shader at 60 FPS
        vec3 drift = vec3(
          sin(uTime * ${CONFIG.driftFrequency.toFixed(2)} + seed) * ${CONFIG.driftAmplitude.toFixed(4)},
          cos(uTime * (${CONFIG.driftFrequency} * 0.8) + seed) * ${CONFIG.driftAmplitude.toFixed(4)},
          sin(uTime * (${CONFIG.driftFrequency} * 1.2) - seed) * ${CONFIG.driftAmplitude.toFixed(4)}
        );

        // Compute final vertex model position
        vec3 finalPosition = position + dispersion + drift;
        vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Distance-based particle size attenuation (larger when closer to camera)
        gl_PointSize = aSize * (400.0 / -mvPosition.z);
        
        // Gradient organic fade-out: different particles dissolve at varying stages of scroll
        float dissolveThreshold = hash(seed + 3.0);
        vAlpha = smoothstep(1.0, 0.2 + dissolveThreshold * 0.8, 1.0 - uScrollProgress);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        // Sample our procedurally generated soft glow texture
        vec4 texColor = texture2D(uTexture, gl_PointCoord);
        if (texColor.a < 0.01) discard;
        
        // Blend particle color and alpha
        gl_FragColor = vec4(vColor, vAlpha * texColor.a * 0.90);
      }
    `;

    const pointsMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uScrollProgress: { value: 0.0 },
        uTime: { value: 0.0 },
        uTexture: { value: particleTexture },
        uIsDark: { value: 1.0 }
      },
      transparent: true,
      depthWrite: false, // Prevents dark rectangular border artifacts between overlapping particles
      blending: AdditiveBlending,
      vertexColors: true,
    });

    const pointCloud = new Points(geometry, pointsMaterial);
    scene.add(pointCloud);

    // --- 4. ACCENT CONNECTION LINES & PULSING NODES ---
    // Create subtle connecting nodes on the campus map to hint at "connections"
    const nodeGroup = new Group();
    scene.add(nodeGroup);

    const nodeGeometry = new SphereGeometry(0.55, 16, 16);
    const nodeMaterials: MeshBasicMaterial[] = [];
    const nodeMeshes: Mesh[] = [];

    CAMPUS_NODES.forEach((node) => {
      // By default created as transparent basic materials (mutated dynamically by the observer)
      const mat = new MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.85,
      });
      nodeMaterials.push(mat);

      const mesh = new Mesh(nodeGeometry, mat);
      mesh.position.set(node.x, node.y, node.z);
      nodeMeshes.push(mesh);
      nodeGroup.add(mesh);
    });

    // Subtly connect the key nodes with thin elegant lines
    const lineIndices: [number, number][] = [
      [0, 1], // Rectorado -> Pabellon A
      [0, 2], // Rectorado -> Pabellon B
      [0, 3], // Rectorado -> Pabellon C
      [0, 4], // Rectorado -> Pabellon D
      [1, 2], // Pabellon A -> B
      [2, 5], // Pabellon B -> Biblioteca AI
      [3, 5], // Pabellon C -> Biblioteca AI
      [3, 4], // Pabellon C -> D
    ];

    const linePositions: number[] = [];
    lineIndices.forEach(([i1, i2]) => {
      const n1 = CAMPUS_NODES[i1];
      const n2 = CAMPUS_NODES[i2];
      linePositions.push(n1.x, n1.y, n1.z);
      linePositions.push(n2.x, n2.y, n2.z);
    });

    const lineGeometry = new BufferGeometry();
    lineGeometry.setAttribute("position", new Float32BufferAttribute(linePositions, 3));

    const lineMaterial = new LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.22,
      blending: AdditiveBlending,
    });

    const networkLines = new LineSegments(lineGeometry, lineMaterial);
    scene.add(networkLines);

    // --- Dynamic Theme Listener (MutationObserver) ---
    // Listens to document.documentElement (html element) class changes (e.g. from ThemeToggle)
    // and seamlessly adapts fog clear colors, shaders, lines, and nodes colors.
    function updateThemeColors() {
      const isDark = document.documentElement.classList.contains("dark");

      // Update shader uniform
      pointsMaterial.uniforms.uIsDark.value = isDark ? 1.0 : 0.0;

      // Update fog color matching stylesheet background specs (Dark: Warm Obsidian 0x0c0a09 | Light: Soft Cream 0xfbf9f5)
      if (scene.fog) {
        scene.fog.color.setHex(isDark ? 0x0c0a09 : 0xfbf9f5);
      }

      // Update connection lines
      lineMaterial.color.setHex(isDark ? 0xf59e0b : 0x855300);
      lineMaterial.opacity = isDark ? 0.22 : 0.15;

      // Update connection nodes
      nodeMeshes.forEach((mesh, idx) => {
        const isServer = CAMPUS_NODES[idx].type === "server";
        if (isDark) {
          (mesh.material as MeshBasicMaterial).color.setHex(isServer ? 0xe2775f : 0xf59e0b);
        } else {
          (mesh.material as MeshBasicMaterial).color.setHex(isServer ? 0x944a23 : 0x855300);
        }
      });
    }

    const themeObserver = new MutationObserver(updateThemeColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Run once at start to align with existing HTML state
    updateThemeColors();

    // --- 5. SCROLL INTERPOLATION LOGIC ---
    let scrollProgress = 0;

    function handleScroll() {
      const scrollY = window.scrollY;
      const scrollMax = window.innerHeight || 800;
      
      // Normalized progress representing how far the user has scrolled through the Hero
      scrollProgress = Math.min(1, Math.max(0, scrollY / scrollMax));

      // 1. Zoom Camera (Interpolate Camera Z & Height)
      const currentDistance = MathUtils.lerp(
        CONFIG.cameraDistanceStart,
        CONFIG.cameraDistanceEnd,
        scrollProgress
      );
      const currentHeight = MathUtils.lerp(
        CONFIG.cameraHeightStart,
        CONFIG.cameraHeightEnd,
        scrollProgress
      );

      // Add a slight scroll-driven orbit swing
      const orbitAngle = scrollProgress * 0.45;
      camera.position.x = Math.sin(orbitAngle) * currentDistance;
      camera.position.z = Math.cos(orbitAngle) * currentDistance;
      camera.position.y = currentHeight;
      camera.lookAt(0, 4 - scrollProgress * 3.0, 0);

      // 2. Update particle uniforms (Dispersion and dissolve)
      pointsMaterial.uniforms.uScrollProgress.value = scrollProgress;

      // 3. Fade connection nodes & lines
      const lineOpacity = Math.max(0, 0.22 * (1 - scrollProgress * 1.5));
      lineMaterial.opacity = lineOpacity;

      nodeMaterials.forEach((mat) => {
        mat.opacity = Math.max(0, 0.85 * (1 - scrollProgress * 1.6));
      });

      // 4. Smoothly fade out the HTML Canvas layer in the DOM
      // Fully invisible by uScrollProgress = CONFIG.fadeScrollPercent (e.g. 70% scrolled)
      const domOpacity = Math.max(0, 1 - scrollProgress / CONFIG.fadeScrollPercent);
      if (canvas) {
        canvas.style.opacity = domOpacity.toString();
        
        // Stop rendering if completely scrolled past to optimize system resources
        if (domOpacity <= 0) {
          canvas.style.visibility = "hidden";
        } else {
          canvas.style.visibility = "visible";
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Trigger once on load to align initial scroll state

    // --- 6. ANIMATION TICK LOOP ---
    const clock = new Clock();
    let animationFrameId: number;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

      // Pass time to particles shader for drift/breathing
      pointsMaterial.uniforms.uTime.value = elapsedTime;

      // Pulse connection nodes (scale and brightness)
      const pulse = 1.0 + Math.sin(elapsedTime * 2.8) * 0.12;
      nodeMeshes.forEach((mesh, index) => {
        // Pulsing scale
        mesh.scale.set(pulse, pulse, pulse);
        
        // Pulse glow effect (Server node pulses in cycles)
        if (CAMPUS_NODES[index].type === "server") {
          const serverPulse = 0.65 + Math.sin(elapsedTime * 4.5) * 0.35;
          nodeMaterials[index].opacity = Math.max(0, serverPulse * (1 - scrollProgress * 1.6));
        }
      });

      // Slow automated turntable rotation for camera on initial load
      if (scrollProgress < 0.99) {
        const driftRotation = Math.sin(elapsedTime * 0.05) * 0.07;
        const autoOrbit = elapsedTime * CONFIG.rotationSpeed;
        
        // Combine automatic drift and manual scroll position
        const currentDistance = MathUtils.lerp(
          CONFIG.cameraDistanceStart,
          CONFIG.cameraDistanceEnd,
          scrollProgress
        );
        const currentHeight = MathUtils.lerp(
          CONFIG.cameraHeightStart,
          CONFIG.cameraHeightEnd,
          scrollProgress
        );

        const totalAngle = autoOrbit + driftRotation + scrollProgress * 0.45;
        camera.position.x = Math.sin(totalAngle) * currentDistance;
        camera.position.z = Math.cos(totalAngle) * currentDistance;
        camera.position.y = currentHeight;
        camera.lookAt(0, 4 - scrollProgress * 3.0, 0);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // --- 7. RESPONSIVE RESIZING ---
    function handleResize() {
      if (!container || !canvas) return;
      width = container.clientWidth;
      height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    }

    window.addEventListener("resize", handleResize);

    // --- 8. CLEANUP ON UNMOUNT ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      themeObserver.disconnect();

      // Clean up GPU memory allocations
      geometry.dispose();
      pointsMaterial.dispose();
      particleTexture.dispose();
      nodeGeometry.dispose();
      nodeMaterials.forEach((m) => m.dispose());
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full -z-5 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none transition-opacity duration-150 ease-out"
        style={{ willChange: "opacity, transform" }}
      />
    </div>
  );
}
