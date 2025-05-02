declare module 'react-intersection-observer' {
  export interface UseInViewOptions {
    threshold?: number | number[];
    root?: Element | null;
    rootMargin?: string;
    triggerOnce?: boolean;
    skip?: boolean;
    initialInView?: boolean;
    fallbackInView?: boolean;
    trackVisibility?: boolean;
    delay?: number;
  }

  export type InViewHookResponse = {
    ref: (element?: Element | null) => void;
    inView: boolean;
    entry?: IntersectionObserverEntry;
  };

  export function useInView(options?: UseInViewOptions): InViewHookResponse;
} 