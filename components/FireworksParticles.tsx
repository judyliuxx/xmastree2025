import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 3000; // Increased count
const GRAVITY = 0.05;
const DRAG = 0.96; // Slightly more drag to keep them floating longer

// Dazzling Purple Palette - Base colors for gradients
const BASE_COLORS = [
  '#E0B0FF', // Mauve
  '#D8BFD8', // Thistle
  '#DA70D6', // Orchid
  '#BA55D3', // MediumOrchid
  '#9400D3', // DarkViolet
  '#8A2BE2', // BlueViolet
  '#4B0082', // Indigo
  '#FF00FF', // Magenta (pop)
  '#FFFFFF', // White for sparkle
].map(c => new THREE.Color(c));

// Vertex Shader: Explicitly declare color attribute and increase size multiplier
const vertexShader = `
  attribute float scale;
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Scale particles based on distance to camera. Increased multiplier for better visibility.
    gl_PointSize = scale * (800.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment Shader: Boosts brightness
const fragmentShader = `
  varying vec3 vColor;
  void main() {
    // Calculate distance from center of point
    vec2 coord = gl_PointCoord - vec2(0.5);
    float length = length(coord);
    
    // Discard outside circle
    if (length > 0.5) discard;
    
    // Soft glow falloff
    float strength = 1.0 - (length * 2.0);
    strength = pow(strength, 1.5);
    
    // Output color with boosted brightness for bloom
    gl_FragColor = vec4(vColor * 2.0, strength);
  }
`;

interface ParticleState {
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export const FireworksParticles = ({ active }: { active: boolean }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Physics simulation state (CPU side)
  const particles = useMemo<ParticleState[]>(() => {
    return new Array(PARTICLE_COUNT).fill(null).map(() => ({
      vx: 0, vy: 0, vz: 0,
      life: 0, maxLife: 1,
      color: new THREE.Color()
    }));
  }, []);

  // Geometry attributes (GPU side)
  const { positions, colors, scales } = useMemo(() => {
    return {
      positions: new Float32Array(PARTICLE_COUNT * 3),
      colors: new Float32Array(PARTICLE_COUNT * 3),
      scales: new Float32Array(PARTICLE_COUNT)
    };
  }, []);

  const explosionTimer = useRef(0);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    // 1. Spawn Explosions
    if (active) {
      explosionTimer.current -= delta;
      
      if (explosionTimer.current <= 0) {
        // Reset timer (faster bursts)
        explosionTimer.current = 0.1 + Math.random() * 0.4;
        
        // Pick random spawn position in background (spread out more)
        const startX = (Math.random() - 0.5) * 80; 
        const startY = 5 + Math.random() * 30;      
        const startZ = -10 - Math.random() * 30;    // Closer to tree layer (-10 to -40)

        // Pick a base color for this burst
        const baseColor = BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)];
        
        // Spawn N particles
        let particlesToSpawn = 150 + Math.floor(Math.random() * 150);
        
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          if (particlesToSpawn <= 0) break;
          
          if (particles[i].life <= 0) {
             const p = particles[i];
             p.life = 1.0 + Math.random() * 2.0; // 1s to 3s life
             p.maxLife = p.life;
             
             // Explosive velocity
             const speed = 0.5 + Math.random() * 1.0; // Faster expansion
             const theta = Math.random() * Math.PI * 2;
             const phi = Math.acos(2 * Math.random() - 1);
             
             p.vx = speed * Math.sin(phi) * Math.cos(theta);
             p.vy = speed * Math.sin(phi) * Math.sin(theta);
             p.vz = speed * Math.cos(phi);

             // Color Logic
             if (Math.random() > 0.9) {
                p.color.set('#FFFFFF'); // White sparkles
             } else {
                p.color.copy(baseColor);
                const hOffset = (Math.random() - 0.5) * 0.1;
                const lOffset = (Math.random() - 0.5) * 0.3;
                p.color.offsetHSL(hOffset, 0, lOffset);
             }

             // Set start pos
             positions[i*3] = startX;
             positions[i*3+1] = startY;
             positions[i*3+2] = startZ;
             
             // Set start color
             colors[i*3] = p.color.r;
             colors[i*3+1] = p.color.g;
             colors[i*3+2] = p.color.b;

             particlesToSpawn--;
          }
        }
      }
    }

    // 2. Update Physics for ALL active particles
    let activeCount = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      
      if (p.life > 0) {
        p.life -= delta;
        
        // Gravity (Make them fall gracefully)
        p.vy -= GRAVITY * delta * 10; 
        
        // Drag
        p.vx *= DRAG;
        p.vy *= DRAG;
        p.vz *= DRAG;

        // Apply velocity
        positions[i*3] += p.vx;
        positions[i*3+1] += p.vy;
        positions[i*3+2] += p.vz;
        
        // Scale/Flicker logic
        const progress = 1 - (p.life / p.maxLife);
        // Fade out size: Pop then shrink
        let size = Math.sin(progress * Math.PI) * 2.0; 
        
        // Twinkle
        if (Math.random() > 0.85) size *= 1.8;
        
        scales[i] = size;
        activeCount++;
      } else {
        // Hide dead particles
        scales[i] = 0;
        positions[i*3] = 0;
        positions[i*3+1] = -5000; // Far away
      }
    }

    // 3. Mark geometry for update
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.scale.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true; 
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-scale" count={PARTICLE_COUNT} array={scales} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial 
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        // vertexColors={true} is implicit if we provide 'color' attribute, but explicit doesn't hurt logic
      />
    </points>
  );
};