declare module "react" {
  export const useState: <T>(initialState: T | (() => T)) => [T, (newState: T | ((prevState: T) => T)) => void]
  export const useEffect: (effect: () => void | (() => void), deps?: any[]) => void
  export const useCallback: <T extends (...args: any[]) => any>(callback: T, deps: any[]) => T
  export const useMemo: <T>(factory: () => T, deps: any[]) => T
  export const useRef: <T>(initialValue: T) => { current: T }
  export const useContext: <T>(context: React.Context<T>) => T
  export const useReducer: <S, A>(reducer: (state: S, action: A) => S, initialState: S) => [S, (action: A) => void]
  export const useLayoutEffect: (effect: () => void | (() => void), deps?: any[]) => void
  export const useImperativeHandle: <T>(ref: React.Ref<T>, init: () => T, deps?: any[]) => void
  export const useDebugValue: <T>(value: T, format?: (value: T) => any) => void
  export const useId: () => string
  export const useTransition: () => [boolean, (callback: () => void) => void]
  export const useDeferredValue: <T>(value: T) => T
  export const useSyncExternalStore: <T>(subscribe: (callback: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T) => T
  export const useInsertionEffect: (effect: () => void | (() => void), deps?: any[]) => void
  export const Fragment: React.ComponentType
  export const StrictMode: React.ComponentType<{ children: React.ReactNode }>
  export const Suspense: React.ComponentType<{ children: React.ReactNode, fallback: React.ReactNode }>
  export const createElement: (type: any, props?: any, ...children: any[]) => React.ReactElement
  export const cloneElement: (element: React.ReactElement, props?: any, ...children: any[]) => React.ReactElement
  export const createContext: <T>(defaultValue: T) => React.Context<T>
  export const createRef: <T>() => React.RefObject<T>
  export const forwardRef: <T, P = {}>(render: (props: P, ref: React.Ref<T>) => React.ReactElement | null) => React.ForwardRefExoticComponent<P & React.RefAttributes<T>>
  export const memo: <P extends object>(Component: React.ComponentType<P>, areEqual?: (prevProps: P, nextProps: P) => boolean) => React.MemoExoticComponent<P>
  export const lazy: <T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) => React.LazyExoticComponent<T>
  export const startTransition: (callback: () => void) => void
  export const use: <T>(promise: Promise<T>) => T
  export const Children: {
    map: (children: React.ReactNode, fn: (child: React.ReactNode, index: number) => React.ReactNode) => React.ReactNode[]
    forEach: (children: React.ReactNode, fn: (child: React.ReactNode, index: number) => void) => void
    count: (children: React.ReactNode) => number
    toArray: (children: React.ReactNode) => React.ReactNode[]
    only: (children: React.ReactNode) => React.ReactElement
  }
  export const isValidElement: (object: any) => object is React.ReactElement
  export const version: string
}

declare module "~src/components/WalletConnectionButton" {
  const WalletConnectionButton: React.ComponentType
  export default WalletConnectionButton
}

declare module "~src/components/ui/button" {
  export const Button: React.ComponentType<any>
}

declare module "~src/lib/metamask" {
  export const connectWallet: () => Promise<string>
  export const disconnectWallet: () => Promise<void>
}

declare module 'express' {
  const express: any;
  export default express;
}

declare module 'node-fetch' {
  const fetch: any;
  export default fetch;
}

// Déclarations pour les assets
declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
} 