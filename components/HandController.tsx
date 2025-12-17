import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gestureService } from '../services/gestureService';
import { HandData } from '../types';

interface HandControllerProps {
  onHandUpdate: (data: HandData | null) => void;
  isCameraEnabled: boolean;
  onToggleCamera: () => void;
}

export const HandController: React.FC<HandControllerProps> = ({ 
  onHandUpdate, 
  isCameraEnabled, 
  onToggleCamera 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number | null>(null);
  const [streamStarted, setStreamStarted] = useState(false);
  const [handData, setHandData] = useState<HandData | null>(null);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamStarted(false);
    setHandData(null);
    onHandUpdate(null);
    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
    }
  }, [onHandUpdate]);

  const startCamera = useCallback(async () => {
    try {
      await gestureService.initialize();
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
              width: 320, 
              height: 240,
              facingMode: "user" 
          } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
                videoRef.current.play();
                setStreamStarted(true);
            }
        };
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      // We can't easily revert the parent state here without potentially causing loops,
      // but in a real app we might notify parent of error.
      // For now, we just rely on the user seeing it didn't work or console error.
    }
  }, []);

  // Handle Toggle
  useEffect(() => {
    if (isCameraEnabled) {
        startCamera();
    } else {
        stopCamera();
    }
    return () => stopCamera();
  }, [isCameraEnabled, startCamera, stopCamera]);

  const tick = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === 4 && isCameraEnabled) {
      const data = gestureService.detect(videoRef.current);
      if (data) {
        setHandData(data);
        onHandUpdate(data);
      } else {
          onHandUpdate(null);
          setHandData(null);
      }
      requestRef.current = requestAnimationFrame(tick);
    }
  }, [isCameraEnabled, onHandUpdate]);

  useEffect(() => {
    if (streamStarted && isCameraEnabled) {
      requestRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [streamStarted, isCameraEnabled, tick]);

  return (
    <>
        {/* Toggle Button */}
        <button 
            onClick={onToggleCamera}
            className={`fixed top-8 right-8 z-50 px-4 py-2 rounded-full border backdrop-blur-md text-xs font-mono transition-all duration-300 cursor-pointer
                ${isCameraEnabled 
                    ? 'border-cyan-400 bg-cyan-400/20 text-cyan-100 shadow-[0_0_10px_rgba(64,224,208,0.3)]' 
                    : 'border-white/20 bg-black/40 text-white/50 hover:bg-white/10'
                }
            `}
        >
            {isCameraEnabled ? 'CAMERA ON' : 'CAMERA OFF'}
        </button>

        {/* Custom Cursor Overlay - Only show if camera is enabled */}
        {isCameraEnabled && handData && (
            <div 
                className="pointer-events-none fixed z-50 transition-transform duration-75 ease-out"
                style={{
                    left: 0,
                    top: 0,
                    transform: `translate(${ (1 - handData.centroid.x) * window.innerWidth }px, ${ handData.centroid.y * window.innerHeight }px)`
                }}
            >
                <div className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center backdrop-blur-sm
                    ${handData.gesture === 'TREE' 
                        ? 'border-teal-400 bg-teal-400/30 scale-75' 
                        : 'border-white bg-white/20 scale-100'
                    }
                    transition-all duration-300
                `}>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                <div className="absolute top-14 left-1/2 -translate-x-1/2 text-xs font-mono text-white/80 whitespace-nowrap bg-black/50 px-2 rounded">
                    {handData.gesture === 'TREE' ? 'HOLDING' : 'OPEN'}
                </div>
            </div>
        )}

        {/* Camera Preview */}
        {isCameraEnabled && (
            <div className="fixed bottom-4 right-4 w-48 h-36 bg-black/80 rounded-lg border border-cyan-500/30 overflow-hidden shadow-[0_0_20px_rgba(10,186,181,0.2)] z-40 transition-opacity duration-500">
                <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover mirror-video opacity-80" 
                    playsInline 
                    muted
                />
                {!streamStarted && (
                    <div className="absolute inset-0 flex items-center justify-center text-cyan-500 text-xs animate-pulse">
                        Initializing AI...
                    </div>
                )}
                <div className="absolute bottom-1 right-2 text-[10px] text-cyan-300 font-mono">
                    AI VISION
                </div>
            </div>
        )}
    </>
  );
};