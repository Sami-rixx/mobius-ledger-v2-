/**
 * Performance Optimization Utilities
 * Image loading, debouncing, throttling, and memoization helpers
 */

/**
 * Memoize function results to avoid expensive recalculations
 * @param {Function} fn - Function to memoize
 * @returns {Function} - Memoized function
 */
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time to wait in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to ensure a function is called at most once per period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Batch multiple function calls into a single call after a delay
 * @param {Function} callback - Function to call with batched data
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Function to add items to batch
 */
export const batch = (callback, delay) => {
  let batchData = [];
  let timeout;
  
  return (data) => {
    batchData.push(data);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      callback(batchData);
      batchData = [];
    }, delay);
  };
};

/**
 * Lazy load images with Intersection Observer
 * @param {string} src - Image source
 * @param {Object} options - Options for loading
 * @returns {Object} - ref and inView for tracking
 */
export const useLazyImage = (src, options = {}) => {
  // This is a hook-like utility, in vanilla JS we return an object
  return {
    src: src,
    loading: 'lazy',
    ...options
  };
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user has slow connection
 * @returns {boolean}
 */
export const isSlowConnection = () => {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const connection = window.navigator.connection || {};
  return connection.saveData || 
         connection.effectiveType === 'slow-2g' ||
         connection.effectiveType === '2g';
};

/**
 * Optimize image URL based on device and connection
 * @param {string} url - Original image URL
 * @param {Object} options - Optimization options
 * @returns {string} - Optimized URL
 */
export const optimizeImageUrl = (url, options = {}) => {
  if (!url) return url;
  
  const { width, quality = 80, format = 'webp' } = options;
  
  // If URL is already optimized or local, return as-is
  if (url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }
  
  // For external URLs, we could add query parameters for optimization
  // This is a placeholder - actual implementation depends on your CDN/image service
  const separator = url.includes('?') ? '&' : '?';
  let optimized = url;
  
  if (width) {
    optimized += `${separator}w=${width}`;
  }
  if (quality) {
    optimized += `${separator}q=${quality}`;
  }
  if (format) {
    optimized += `${separator}format=${format}`;
  }
  
  return optimized;
};

/**
 * Preconnect to external resources for performance
 * @param {string|string[]} urls - URLs to preconnect to
 */
export const preconnect = (urls) => {
  if (typeof document === 'undefined') return;
  
  const links = Array.isArray(urls) ? urls : [urls];
  links.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Prefetch external resources
 * @param {string|string[]} urls - URLs to prefetch
 */
export const prefetch = (urls) => {
  if (typeof document === 'undefined') return;
  
  const links = Array.isArray(urls) ? urls : [urls];
  links.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
};

export default {
  memoize,
  debounce,
  throttle,
  batch,
  useLazyImage,
  prefersReducedMotion,
  isSlowConnection,
  optimizeImageUrl,
  preconnect,
  prefetch
};
