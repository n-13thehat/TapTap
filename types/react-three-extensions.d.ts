import { Object3DNode } from '@react-three/fiber';
import * as THREE from 'three';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        group: Object3DNode<THREE.Group, typeof THREE.Group>;
      }
    }
  }
}

export {};
