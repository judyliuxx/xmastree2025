export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: HandLandmark[];
  handedness: 'Left' | 'Right';
  isPinching: boolean; // True if thumb and index are close
  gesture: 'TREE' | 'EXPLODE'; // Mapped from pinch state
  centroid: { x: number; y: number }; // Center of the hand
}

export interface ParticleData {
  id: number;
  positionTree: [number, number, number];
  positionExplode: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  speed: number; // For animation variance
}

export enum GeometryType {
  LEAF, // Octahedron
  DECOR, // Cube/Icosahedron
  RIBBON // Tetrahedron
}
