import * as THREE from "three";
import { ThreeElements } from "@react-three/fiber";

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      ambientLight: any;
      pointLight: any;
      directionalLight: any;
      spotLight: any;
      mesh: any;
      group: any;
      boxGeometry: any;
      sphereGeometry: any;
      planeGeometry: any;
      line: any;
    }
  }
}
