import { JSX as ReactJSX } from 'react';
import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements, ReactJSX.IntrinsicElements {}
  }
}
export {};
