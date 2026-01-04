import * as THREE from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      directionalLight: any;
      group: any;
      mesh: any;
      primitive: any;
      boxGeometry: any;
      sphereGeometry: any;
      planeGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhongMaterial: any;
      perspectiveCamera: any;
      orbitControls: any;
    }
  }
}
