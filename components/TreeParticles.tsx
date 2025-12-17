import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import { Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleData, GeometryType } from '../types';

// Tiffany Blue Palette
const COLORS_LEAVES = ['#0ABAB5', '#40E0D0', '#7FFFD4', '#20B2AA']; 
const COLORS_DECOR = ['#FFFFFF', '#E0FFFF', '#F0FFFF'];
const COLOR_RIBBON = '#FFFFFF';

// Letter Palette: 26 distinct vibrant colors for A-Z
const COLORS_LETTERS = [
  '#FF0000', // Red
  '#FF4500', // OrangeRed
  '#FF8C00', // DarkOrange
  '#FFA500', // Orange
  '#FFD700', // Gold
  '#FFFF00', // Yellow
  '#ADFF2F', // GreenYellow
  '#32CD32', // LimeGreen
  '#00FA9A', // MediumSpringGreen
  '#00FF7F', // SpringGreen
  '#00FFFF', // Cyan
  '#00BFFF', // DeepSkyBlue
  '#1E90FF', // DodgerBlue
  '#0000FF', // Blue
  '#8A2BE2', // BlueViolet
  '#9400D3', // DarkViolet
  '#9932CC', // DarkOrchid
  '#BA55D3', // MediumOrchid
  '#FF00FF', // Magenta
  '#FF1493', // DeepPink
  '#FF69B4', // HotPink
  '#DC143C', // Crimson
  '#FFC0CB', // Pink
  '#F08080', // LightCoral
  '#FF6347', // Tomato
  '#B22222'  // FireBrick
];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface TreeParticlesProps {
  isTreeMode: boolean;
  rotationVelocity: number;
  userName: string;
}

const Star: React.FC<{ isTreeMode: boolean }> = ({ isTreeMode }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const { shape, extrudeSettings } = useMemo(() => {
    const s = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.2;
    const innerRadius = 0.5;
    // Start from top (PI/2)
    const startAngle = Math.PI / 2;
    
    for (let i = 0; i < points * 2; i++) {
      const angle = startAngle + (i / (points * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();

    const settings = {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelSegments: 2
    };

    return { shape: s, extrudeSettings: settings };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;

    // 1. Target Position logic
    const targetY = isTreeMode ? 11.5 : 40;
    
    // 2. Floating Effect (Sine wave)
    const floatOffset = isTreeMode ? Math.sin(time * 2) * 0.2 : 0;
    
    // 3. Lerp Position
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY + floatOffset, delta * 2);
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, delta * 2);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, 0, delta * 2);

    // 4. Rotation (Spin)
    meshRef.current.rotation.y += delta * 0.8;

    // 5. Breathing Scale
    const breathe = 1 + Math.sin(time * 3) * 0.15;
    const targetScale = isTreeMode ? 1.5 : 0.01; // Shrink to nothing when exploded
    const currentScale = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale * breathe, delta * 3);
    
    meshRef.current.scale.setScalar(currentScale);
  });

  return (
    <mesh ref={meshRef}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial 
        color="#FFD700" 
        emissive="#FFD700"
        emissiveIntensity={2.5}
        toneMapped={false}
        roughness={0.1}
        metalness={0.9}
      />
      <pointLight color="#FFD700" intensity={3} distance={8} decay={2} />
    </mesh>
  );
};

// Ambient Floating Letters (The random alphabet soup)
const FloatingLetter: React.FC<{ char: string; index: number; isTreeMode: boolean }> = ({ char, index, isTreeMode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const fontUrl = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';
  
  const { posTree, posExplode, color, rotSpeed, rotAxis } = useMemo(() => {
    const total = LETTERS.length;
    // Spiral distribution
    const t = index / total;
    const y = -9 + (t * 18); // -9 to +9 height
    const r = (8 * (1 - (y + 10) / 20)) + 1.2; // Slightly outside the main cone
    const theta = t * Math.PI * 2 * 3.5; // 3.5 revolutions
    
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);

    // Explode pos
    const exR = 20 + Math.random() * 30;
    const exTheta = Math.random() * Math.PI * 2;
    const exPhi = Math.acos(2 * Math.random() - 1);
    const exX = exR * Math.sin(exPhi) * Math.cos(exTheta);
    const exY = exR * Math.sin(exPhi) * Math.sin(exTheta);
    const exZ = exR * Math.cos(exPhi);

    return {
      posTree: new THREE.Vector3(x, y, z),
      posExplode: new THREE.Vector3(exX, exY, exZ),
      color: COLORS_LETTERS[index % COLORS_LETTERS.length],
      rotSpeed: 0.5 + Math.random() * 1.0,
      rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize()
    };
  }, [index]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Position Lerp
    const target = isTreeMode ? posTree : posExplode;
    const lerpFactor = isTreeMode ? 2.5 : 1.0;
    groupRef.current.position.lerp(target, delta * lerpFactor);
    
    if (isTreeMode) {
        groupRef.current.position.y += Math.sin(time * 2 + index) * 0.005;
    }
    groupRef.current.rotateOnAxis(rotAxis, delta * rotSpeed);
    
    const scaleBase = isTreeMode ? 1 : 0.5;
    const scale = scaleBase + Math.sin(time * 3 + index) * 0.1;
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      <Center>
        <Text3D 
          font={fontUrl} 
          size={0.6} height={0.15} curveSegments={12}
          bevelEnabled bevelThickness={0.02} bevelSize={0.02} bevelOffset={0} bevelSegments={3}
        >
          {char}
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} toneMapped={false} roughness={0.2} metalness={0.8} />
        </Text3D>
      </Center>
    </group>
  );
};

// Specific User Name Letters (Big, centered under Star)
const NameLetter: React.FC<{ char: string; index: number; total: number; isTreeMode: boolean }> = ({ char, index, total, isTreeMode }) => {
    const groupRef = useRef<THREE.Group>(null);
    const fontUrl = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';

    const { posTree, posExplode, color, rotAxis } = useMemo(() => {
        // Calculate centered position
        const spacing = 1.5;
        // Center the text block
        const xOffset = (index - (total - 1) / 2) * spacing;
        
        // Tree: Under the star (Star is at ~11.5)
        const treeVec = new THREE.Vector3(xOffset, 9.5, 3.5); 
        
        // Explode: Randomly scattered
        const exR = 25 + Math.random() * 15;
        const exTheta = Math.random() * Math.PI * 2;
        const exPhi = Math.acos(2 * Math.random() - 1);
        const exVec = new THREE.Vector3(
            exR * Math.sin(exPhi) * Math.cos(exTheta),
            exR * Math.sin(exPhi) * Math.sin(exTheta),
            exR * Math.cos(exPhi)
        );

        // Use a stride of 5 to jump around the color spectrum (which is ordered in COLORS_LETTERS)
        // This ensures adjacent letters have high contrast (e.g., Red -> Yellow -> Blue)
        const colorIndex = (index * 5) % COLORS_LETTERS.length;

        return {
            posTree: treeVec,
            posExplode: exVec,
            color: COLORS_LETTERS[colorIndex],
            rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize()
        };
    }, [index, total, char]); // Recalculate if text changes

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;

        // Position
        const target = isTreeMode ? posTree : posExplode;
        // Snap fast to name position
        const lerpFactor = isTreeMode ? 4.0 : 1.5; 
        groupRef.current.position.lerp(target, delta * lerpFactor);

        // Rotation
        if (isTreeMode) {
            // Face forward but bob slightly
            groupRef.current.rotation.set(0, 0, Math.sin(time * 3 + index) * 0.1);
        } else {
            // Spin wildly when exploded
            groupRef.current.rotateOnAxis(rotAxis, delta * 2);
        }

        // Scale
        const scaleBase = isTreeMode ? 2.0 : 0.5; // BIGGER when assembled
        const scale = THREE.MathUtils.lerp(groupRef.current.scale.x, scaleBase, delta * 3);
        groupRef.current.scale.setScalar(scale);
    });

    return (
        <group ref={groupRef}>
            <Center>
                <Text3D 
                    font={fontUrl} 
                    size={0.6} height={0.2} curveSegments={12}
                    bevelEnabled bevelThickness={0.03} bevelSize={0.02} bevelOffset={0} bevelSegments={3}
                >
                    {char}
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} roughness={0.1} metalness={1} />
                </Text3D>
            </Center>
        </group>
    );
}

export const TreeParticles: React.FC<TreeParticlesProps> = ({ isTreeMode, rotationVelocity, userName }) => {
  // We separate geometry types for correct material/shape assignment
  const leafMeshRef = useRef<THREE.InstancedMesh>(null);
  const decorMeshRef = useRef<THREE.InstancedMesh>(null);
  const ribbonMeshRef = useRef<THREE.InstancedMesh>(null);
  
  const groupRef = useRef<THREE.Group>(null);

  // --- Generation Logic ---
  const { leaves, decors, ribbons } = useMemo(() => {
    const _leaves: ParticleData[] = [];
    const _decors: ParticleData[] = [];
    const _ribbons: ParticleData[] = [];

    const totalLeaves = 5000;
    const totalDecor = 500;
    const totalRibbon = 1500;

    const dummy = new THREE.Object3D();

    // 1. Generate Leaves (Cone Volume)
    for (let i = 0; i < totalLeaves; i++) {
      const y = Math.random() * 20; // Height 0 to 20
      const maxR = 8 * (1 - y / 20); // Base radius 8, tip 0
      const r = Math.sqrt(Math.random()) * maxR; // Uniform distribution in circle
      const theta = Math.random() * Math.PI * 2;
      
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      // Tree Position
      const posTree: [number, number, number] = [x, y - 10, z];
      
      // Explode Position (Random Sphere)
      const exR = 15 + Math.random() * 25;
      const exTheta = Math.random() * Math.PI * 2;
      const exPhi = Math.acos(2 * Math.random() - 1);
      const exX = exR * Math.sin(exPhi) * Math.cos(exTheta);
      const exY = exR * Math.sin(exPhi) * Math.sin(exTheta);
      const exZ = exR * Math.cos(exPhi);

      _leaves.push({
        id: i,
        positionTree: posTree,
        positionExplode: [exX, exY, exZ],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
        scale: 0.15 + Math.random() * 0.15,
        color: COLORS_LEAVES[Math.floor(Math.random() * COLORS_LEAVES.length)],
        speed: 0.02 + Math.random() * 0.05
      });
    }

    // 2. Generate Decor (Surface of Cone)
    for (let i = 0; i < totalDecor; i++) {
      const y = Math.random() * 19;
      const r = (8 * (1 - y / 20)) + 0.2; // Slightly outside
      const theta = Math.random() * Math.PI * 2;
      
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      const exR = 20 + Math.random() * 20;
       // Random explosion dir
      const dir = new THREE.Vector3(x, y - 10, z).normalize().multiplyScalar(exR);

      _decors.push({
        id: i,
        positionTree: [x, y - 10, z],
        positionExplode: [dir.x, dir.y, dir.z],
        rotation: [Math.random(), Math.random(), Math.random()],
        scale: 0.2 + Math.random() * 0.3,
        color: COLORS_DECOR[Math.floor(Math.random() * COLORS_DECOR.length)],
        speed: 0.01 + Math.random() * 0.02
      });
    }

    // 3. Generate Ribbon (Spiral Helix)
    for (let i = 0; i < totalRibbon; i++) {
      const t = i / totalRibbon;
      const y = t * 20;
      const revolutions = 3.5;
      const r = (8 * (1 - y / 20)) + 0.5; // Outside leaves
      const theta = t * Math.PI * 2 * revolutions;
      
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      const exR = 10 + Math.random() * 30;
      const exTheta = Math.random() * Math.PI * 2;
      
      _ribbons.push({
        id: i,
        positionTree: [x, y - 10, z],
        positionExplode: [exR * Math.cos(exTheta), (Math.random() - 0.5) * 40, exR * Math.sin(exTheta)],
        rotation: [Math.random(), Math.random(), Math.random()],
        scale: 0.1, // Tiny tetrahedrons
        color: COLOR_RIBBON,
        speed: 0.03 + Math.random() * 0.02
      });
    }

    return { leaves: _leaves, decors: _decors, ribbons: _ribbons };
  }, []);

  // --- Animation Loop ---
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const currentPositionsLeaves = useMemo(() => new Float32Array(leaves.length * 3), [leaves]);
  const currentPositionsDecor = useMemo(() => new Float32Array(decors.length * 3), [decors]);
  const currentPositionsRibbon = useMemo(() => new Float32Array(ribbons.length * 3), [ribbons]);
  
  // Initialize current positions
  useEffect(() => {
     leaves.forEach((d, i) => {
        currentPositionsLeaves[i*3] = d.positionExplode[0];
        currentPositionsLeaves[i*3+1] = d.positionExplode[1];
        currentPositionsLeaves[i*3+2] = d.positionExplode[2];
     });
  }, []);

  useFrame((state, delta) => {
    // 1. Group Rotation (Hand Control)
    if (groupRef.current) {
        groupRef.current.rotation.y += rotationVelocity * delta;
        // Constant slow spin
        groupRef.current.rotation.y += 0.05 * delta; 
    }

    // 2. Update Instances
    const updateMesh = (
        mesh: THREE.InstancedMesh | null, 
        data: ParticleData[], 
        currentPosBuffer: Float32Array
    ) => {
      if (!mesh) return;

      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        
        // Target Logic
        const target = isTreeMode ? d.positionTree : d.positionExplode;
        
        // Lerp factor
        const lerpSpeed = isTreeMode ? 3.0 : 1.5; // Snap back fast, explode slower
        const t = Math.min(1, delta * lerpSpeed * (1 + d.speed));

        // Interpolate Logic
        const idx = i * 3;
        currentPosBuffer[idx] += (target[0] - currentPosBuffer[idx]) * t;
        currentPosBuffer[idx+1] += (target[1] - currentPosBuffer[idx+1]) * t;
        currentPosBuffer[idx+2] += (target[2] - currentPosBuffer[idx+2]) * t;

        // Add some noise/wobble when in Explode mode
        if (!isTreeMode) {
             currentPosBuffer[idx] += Math.sin(state.clock.elapsedTime + d.id) * 0.02;
             currentPosBuffer[idx+1] += Math.cos(state.clock.elapsedTime + d.id * 0.5) * 0.02;
        }

        dummy.position.set(currentPosBuffer[idx], currentPosBuffer[idx+1], currentPosBuffer[idx+2]);
        
        // Rotation
        dummy.rotation.set(
            d.rotation[0] + state.clock.elapsedTime * d.speed,
            d.rotation[1] + state.clock.elapsedTime * d.speed,
            d.rotation[2]
        );
        
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    updateMesh(leafMeshRef.current, leaves, currentPositionsLeaves);
    updateMesh(decorMeshRef.current, decors, currentPositionsDecor);
    updateMesh(ribbonMeshRef.current, ribbons, currentPositionsRibbon);
  });

  // Apply colors once
  useEffect(() => {
    const applyColors = (mesh: THREE.InstancedMesh | null, data: ParticleData[]) => {
      if (!mesh) return;
      for (let i = 0; i < data.length; i++) {
        mesh.setColorAt(i, new THREE.Color(data[i].color));
      }
      mesh.instanceColor!.needsUpdate = true;
    };
    applyColors(leafMeshRef.current, leaves);
    applyColors(decorMeshRef.current, decors);
    applyColors(ribbonMeshRef.current, ribbons);
  }, [leaves, decors, ribbons]);

  return (
    <group ref={groupRef} position={[0, -2, 0]} scale={[1.5, 1.5, 1.5]}>
      {/* Star at the top */}
      <Star isTreeMode={isTreeMode} />

      {/* 1. Ambient Background Letters (A-Z) */}
      {LETTERS.map((char, i) => (
        <FloatingLetter 
            key={`ambient-${char}`} 
            char={char} 
            index={i} 
            isTreeMode={isTreeMode} 
        />
      ))}

      {/* 2. User Name Letters (Highlighted) */}
      {userName.split('').map((char, i) => (
          <NameLetter 
            key={`name-${i}-${char}`}
            char={char}
            index={i}
            total={userName.length}
            isTreeMode={isTreeMode}
          />
      ))}

      {/* Leaves: Octahedron */}
      <instancedMesh ref={leafMeshRef} args={[undefined, undefined, leaves.length]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          metalness={0.7} 
          roughness={0.2} 
          flatShading={true}
        />
      </instancedMesh>

      {/* Decor: Box */}
      <instancedMesh ref={decorMeshRef} args={[undefined, undefined, decors.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial 
          metalness={0.9} 
          roughness={0.1} 
          emissive="#004040"
          emissiveIntensity={0.5}
        />
      </instancedMesh>

      {/* Ribbon: Tetrahedron */}
      <instancedMesh ref={ribbonMeshRef} args={[undefined, undefined, ribbons.length]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshBasicMaterial 
          color="#ffffff" 
          toneMapped={false} // Make it super bright for bloom
        />
      </instancedMesh>
    </group>
  );
};