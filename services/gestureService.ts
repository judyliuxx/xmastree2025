import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { HandData } from "../types";

export class GestureService {
  private handLandmarker: HandLandmarker | null = null;
  private lastVideoTime = -1;
  private isInitializing = false;

  async initialize() {
    if (this.handLandmarker || this.isInitializing) return;
    this.isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      console.log("MediaPipe HandLandmarker loaded");
    } catch (error) {
      console.error("Failed to load MediaPipe:", error);
    } finally {
      this.isInitializing = false;
    }
  }

  detect(video: HTMLVideoElement): HandData | null {
    if (!this.handLandmarker) return null;
    if (video.currentTime === this.lastVideoTime) return null;
    
    this.lastVideoTime = video.currentTime;
    const result = this.handLandmarker.detectForVideo(video, performance.now());

    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];
      // result.handedness is Category[][], so we need the first category of the first hand
      const handednessStr = result.handedness[0][0].categoryName;
      
      // Calculate Pinch (Distance between Thumb Tip [4] and Index Tip [8])
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) + 
        Math.pow(thumbTip.y - indexTip.y, 2)
      );

      // Threshold for pinch detection (normalized coordinates)
      const isPinching = distance < 0.08;

      // Calculate Centroid (avg of all points for stability)
      let sumX = 0, sumY = 0;
      landmarks.forEach(p => { sumX += p.x; sumY += p.y; });
      const centroid = { x: sumX / landmarks.length, y: sumY / landmarks.length };

      return {
        landmarks,
        handedness: handednessStr === 'Left' ? 'Right' : 'Left', // Mirror correction
        isPinching,
        gesture: isPinching ? 'TREE' : 'EXPLODE',
        centroid
      };
    }

    return null;
  }
}

export const gestureService = new GestureService();