/**
 * Lazy Load Utility
 * Performance optimization for code splitting and lazy loading
 */

import { lazy, Suspense } from 'react';

/**
 * Lazy load a component with fallback
 * @param {Function} importFn - Dynamic import function
 * @returns {React.LazyExoticComponent}
 */
export const lazyLoad = (importFn) => {
  return lazy(() => {
    // Add a small delay to prevent loading too many chunks at once
    return new Promise((resolve) => {
      setTimeout(() => resolve(importFn()), 100);
    });
  });
};

/**
 * Lazy load with custom loading fallback
 * @param {Function} importFn - Dynamic import function
 * @param {React.ReactNode} LoadingComponent - Loading component to show while loading
 * @returns {React.ComponentType}
 */
export const LazyComponent = ({ importFn, LoadingComponent }) => {
  const Component = lazy(() => importFn());
  
  const Wrapper = (props) => {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <Component {...props} />
      </Suspense>
    );
  };
  
  return Wrapper;
};

/**
 * Preload a module for better performance
 * @param {Function} importFn - Dynamic import function
 */
export const preload = (importFn) => {
  importFn().catch(() => {});
};

/**
 * Prefetch a module when mouse enters over a link/component
 * @param {Function} importFn - Dynamic import function
 */
export const prefetchOnHover = (importFn) => {
  return () => {
    importFn().catch(() => {});
  };
};

export default lazyLoad;
