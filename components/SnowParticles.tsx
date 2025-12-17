import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SnowParticlesProps {
  isTreeMode: boolean;
}

export const SnowParticles: React.FC<SnowParticlesProps> = ({ isTreeMode }) => {
  const count = 1500;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const moundRef = useRef<THREE.Mesh>(null);
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
        // Only move if Tree Mode is active, or if we need to clear the screen (reset to top)
        if (isTreeMode) {
            if (!p.landed) {
                // Falling
                p.y -= p.velocity * (delta * 60); // Normalize speed
                
                // Wobble
                const wobble = Math.sin(state.clock.elapsedTime * 2 + p.wobbleOffset) * 0.05;
                
                // Ground Hit (Accumulation Logic)
                // Tree base is around -10, so ground is roughly -12
                // We add some variance to the ground height to make the pile look uneven
                const groundHeight = -12 + (Math.random() * 0.5); 

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
        } else {
            // If not tree mode, quickly scatter/fade them up or hide them
            // Let's reset them to top so they are ready to fall next time
            if (p.y > -15) {
                p.y += 0.5; // Fly away up
            }
             dummy.position.set(p.x, p.y, p.z);
        }

        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      });
      
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Update Snow Mound (Growing effect)
    if (moundRef.current) {
        const targetScale = isTreeMode ? 1 : 0;
        // Lerp scale
        const s = THREE.MathUtils.lerp(moundRef.current.scale.x, targetScale, delta * 0.5);
        moundRef.current.scale.setScalar(s);
        
        // Slight rotation for visual interest
        moundRef.current.rotation.z += delta * 0.01;
    }
  });

  return (
    <>
      {/* Falling Snowflakes */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
      </instancedMesh>

      {/* Accumulation Mound on Floor */}
      <mesh ref={moundRef} position={[0, -12.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[15, 64]} />
        <meshStandardMaterial 
            color="#E0FFFF" 
            roughness={1} 
            metalness={0.1}
            transparent 
            opacity={0.6}
            emissive="#ffffff"
            emissiveIntensity={0.2}
        />
      </mesh>
    </>
  );
};