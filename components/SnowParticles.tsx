import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const SnowParticles: React.FC = () => {
  const count = 1500;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize particle data
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const r = 25 * Math.sqrt(Math.random()); // Spread within radius
      const theta = Math.random() * 2 * Math.PI;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      
      temp.push({
        x,
        y: 20 + Math.random() * 30, // Start high
        z,
        velocity: 0.05 + Math.random() * 0.1,
        scale: 0.05 + Math.random() * 0.1,
        landed: false,
        landTime: 0,
        maxLandTime: 1 + Math.random() * 3, // How long to stay on ground
        wobbleOffset: Math.random() * 100
      });
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    // 1. Update Snow Particles
    if (meshRef.current) {
      particles.forEach((p, i) => {
        // Always Fall Logic
        if (!p.landed) {
            // Falling
            p.y -= p.velocity * (delta * 60); // Normalize speed
            
            // Wobble
            const wobble = Math.sin(state.clock.elapsedTime * 2 + p.wobbleOffset) * 0.05;
            
            // Ground Hit (Accumulation Logic)
            // Tree base is around -10, so ground is roughly -12
            const groundHeight = -12; 

            if (p.y <= groundHeight) {
                p.y = groundHeight;
                p.landed = true;
                p.landTime = 0;
            }
            
            // Update position
            dummy.position.set(p.x + wobble, p.y, p.z);
        } else {
            // Landed (Accumulating)
            p.landTime += delta;
            if (p.landTime > p.maxLandTime) {
                // Recycle to top
                p.y = 20 + Math.random() * 10;
                p.landed = false;
            }
            dummy.position.set(p.x, p.y, p.z);
        }

        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      });
      
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Falling Snowflakes */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
      </instancedMesh>
    </>
  );
};