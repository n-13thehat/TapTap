// Global React types for Next.js generated files
import * as React from 'react';

declare global {
  namespace React {
    export type ReactNode = React.ReactNode;
    export type ComponentType<P = {}> = React.ComponentType<P>;
    export type FC<P = {}> = React.FC<P>;
    export type Component<P = {}, S = {}> = React.Component<P, S>;
    export type PureComponent<P = {}, S = {}> = React.PureComponent<P, S>;
    export type ReactElement<P = any> = React.ReactElement<P>;
    export type ReactFragment = React.ReactFragment;
    export type ReactPortal = React.ReactPortal;
    export type ReactText = React.ReactText;
    export type ReactChild = React.ReactChild;
    export type ReactChildren = React.ReactChildren;
    export type Key = React.Key;
    export type Ref<T> = React.Ref<T>;
    export type RefObject<T> = React.RefObject<T>;
    export type MutableRefObject<T> = React.MutableRefObject<T>;
    export type Context<T> = React.Context<T>;
    export type Provider<T> = React.Provider<T>;
    export type Consumer<T> = React.Consumer<T>;
    export type HTMLAttributes<T> = React.HTMLAttributes<T>;
    export type CSSProperties = React.CSSProperties;
    export type MouseEvent<T = Element> = React.MouseEvent<T>;
    export type KeyboardEvent<T = Element> = React.KeyboardEvent<T>;
    export type ChangeEvent<T = Element> = React.ChangeEvent<T>;
    export type FormEvent<T = Element> = React.FormEvent<T>;
    export type FocusEvent<T = Element> = React.FocusEvent<T>;
    export type SyntheticEvent<T = Element> = React.SyntheticEvent<T>;
  }
}

export {};
