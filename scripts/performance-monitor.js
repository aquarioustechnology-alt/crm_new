// Performance monitoring utilities for production
// Add this to your app layout for monitoring

export const performanceLogger = {
  // Monitor Web Vitals
  logWebVitals: (metric) => {
    if (process.env.NODE_ENV === 'production') {
      // Log to your analytics service
      console.log('WebVital:', metric);
      
      // Example: Send to analytics
      // analytics.track('Web Vital', {
      //   name: metric.name,
      //   value: metric.value,
      //   id: metric.id,
      // });
    }
  },

  // Monitor component render times
  measureComponentRender: (componentName, renderFn) => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      const result = renderFn();
      const endTime = performance.now();
      
      if (endTime - startTime > 100) {
        console.warn(`Slow render detected in ${componentName}: ${endTime - startTime}ms`);
      }
      
      return result;
    }
    return renderFn();
  },

  // Monitor API response times
  measureApiCall: async (apiName, apiFn) => {
    const startTime = performance.now();
    try {
      const result = await apiFn();
      const endTime = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`API ${apiName}: ${endTime - startTime}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.error(`API ${apiName} failed after ${endTime - startTime}ms:`, error);
      }
      throw error;
    }
  },

  // Memory usage monitoring
  checkMemoryUsage: () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = performance.memory;
      const usage = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        allocated: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      };
      
      if (usage.used > 100) {
        console.warn('High memory usage detected:', usage);
      }
      
      return usage;
    }
    return null;
  }
};