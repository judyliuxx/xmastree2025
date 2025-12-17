import React from 'react';
import { Canvas, ThreeElements } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { TreeParticles } from './TreeParticles';
import { SnowParticles } from './SnowParticles';
import '../types';

interface SceneProps {
  isTreeMode: boolean;
  rotationVelocity: number;
  userName: string;
}

export const Scene: React.FC<SceneProps> = ({ isTreeMode, rotationVelocity, userName }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, toneMapping: 3 }} // NoAA for better performance with PP, ACESFilmic
    >
      {/* Adjusted camera from 60 to 50 to make tree slightly bigger */}
      <PerspectiveCamera makeDefault position={[0, 0, 50]} fov={45} />
      
      {/* Lighting - Tiffany Blue / Cool Tones */}
      <ambientLight intensity={0.5} color="#001010" />
      <pointLight position={[10, 20, 10]} intensity={2} color="#0ABAB5" /> {/* Tiffany Blue */}
      <pointLight position={[-10, 5, -10]} intensity={2} color="#40E0D0" /> {/* Turquoise */}
      <spotLight 
        position={[0, 30, 0]} 
        angle={0.5} 
        penumbra={1} 
        intensity={5} 
        color="#E0FFFF" 
      />
      {/* Rim light effect */}
      <spotLight position={[0, 10, -20]} intensity={10} color="#00CED1" /> {/* Dark Turquoise */}

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Content */}
      <SnowParticles />
      <TreeParticles isTreeMode={isTreeMode} rotationVelocity={rotationVelocity} userName={userName} />

      {/* Controls (Mouse fallback) */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={20} 
        maxDistance={100}
        autoRotate={false}
      />

      {/* Post Processing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.8} // Lower threshold slightly for purple glow
          mipmapBlur 
          intensity={1.5} 
          radius={0.7}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
};