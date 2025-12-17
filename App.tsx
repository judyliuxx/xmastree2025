import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Scene } from './components/Scene';
import { HandController } from './components/HandController';
import { HandData } from './types';

const App: React.FC = () => {
  const [isTreeMode, setIsTreeMode] = useState(false); // Default to exploded
  const [rotationVelocity, setRotationVelocity] = useState(0);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false); // Default Camera Off
  const [userName, setUserName] = useState('');
  
  // Use refs for tracking previous hand position to calculate delta
  const prevHandX = useRef<number | null>(null);

  const handleHandUpdate = useCallback((data: HandData | null) => {
    if (!data) {
        prevHandX.current = null;
        setRotationVelocity(0);
        return;
    }

    // 1. Mode Switching
    if (data.gesture === 'TREE') {
        setIsTreeMode(true);
    } else {
        setIsTreeMode(false);
    }

    // 2. Rotation Logic (Only when hand is open/moving)
    // We map X screen coordinate (0-1) to rotation velocity
    if (data.gesture === 'EXPLODE') {
        if (prevHandX.current !== null) {
            // Sensitivity factor
            const delta = data.centroid.x - prevHandX.current;
            // Mirror logic: moving hand right (screen left) should rotate one way
            setRotationVelocity(delta * -15); 
        }
        prevHandX.current = data.centroid.x;
    } else {
        // If pinching (TREE mode), stop manual rotation or dampen it
        setRotationVelocity(0);
        prevHandX.current = null;
    }
  }, []);

  const toggleCamera = () => {
    setIsCameraEnabled(prev => !prev);
    // Reset state when toggling
    setIsTreeMode(false);
    setRotationVelocity(0);
  };

  // Mouse Handlers for fallback control
  const handlePointerDown = () => {
    if (!isCameraEnabled) {
      setIsTreeMode(true);
    }
  };

  const handlePointerUp = () => {
    if (!isCameraEnabled) {
      setIsTreeMode(false);
    }
  };

  return (
    <div 
      className="relative w-full h-screen bg-[#010505] text-white overflow-hidden font-sans select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene 
            isTreeMode={isTreeMode} 
            rotationVelocity={rotationVelocity} 
            userName={userName} 
        />
      </div>

      {/* Hand Controller (Camera & Logic) */}
      <HandController 
        onHandUpdate={handleHandUpdate} 
        isCameraEnabled={isCameraEnabled}
        onToggleCamera={toggleCamera}
      />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 p-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 drop-shadow-[0_0_10px_rgba(10,186,181,0.5)]">
          MERRY<br/>CHRISTMAS
        </h1>
        <div className="mt-4 space-y-2 text-sm text-cyan-200/70 font-mono border-l-2 border-cyan-500/50 pl-4">
          <p><span className="text-cyan-400">STATUS:</span> {isTreeMode ? 'ASSEMBLED' : 'DISPERSED'}</p>
          <p><span className="text-cyan-400">ENTITIES:</span> 7000+</p>
        </div>
      </div>

      {/* Name Input */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 w-full max-w-xs text-center pointer-events-auto">
        <label className="block text-xs text-cyan-500/70 font-mono mb-2 uppercase tracking-widest">
            Customize Your Tree
        </label>
        <input 
            type="text" 
            value={userName}
            onChange={(e) => {
                // Limit length to prevent it going off screen
                if (e.target.value.length <= 10) setUserName(e.target.value.toUpperCase());
            }}
            placeholder="ENTER YOUR NAME"
            className="w-full bg-black/40 backdrop-blur-md border border-cyan-500/30 text-center text-xl text-white placeholder-white/20 rounded-lg py-2 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all font-bold tracking-widest uppercase"
        />
      </div>

      <div className="absolute bottom-8 left-8 z-10 pointer-events-none text-xs text-white/40 font-mono">
        <p className="mb-2 uppercase tracking-widest text-cyan-500">Gestures</p>
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isCameraEnabled ? 'bg-teal-400' : 'bg-gray-500'}`}></div>
                <span>{isCameraEnabled ? 'PINCH & HOLD to Assemble' : 'CLICK & HOLD to Assemble'}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isCameraEnabled ? 'bg-cyan-200' : 'bg-gray-500'}`}></div>
                <span>{isCameraEnabled ? 'OPEN HAND to Explode' : 'RELEASE to Explode'}</span>
            </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <span>{isCameraEnabled ? 'MOVE (Open) to Rotate' : 'DRAG to Rotate'}</span>
            </div>
        </div>
      </div>

    </div>
  );
};

export default App;