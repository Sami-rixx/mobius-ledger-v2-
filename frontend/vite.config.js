import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to backend server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps for production to reduce bundle size
    chunkSizeWarningLimit: 1000, // Increase from default 500KB to 1MB to suppress warnings for large bundles
    minify: 'esbuild', // Use esbuild for faster minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@hooks': '/src/hooks',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@styles': '/src/styles',
    },
  },
  // Vitest configuration ("npm test" -> "vitest" in package.json). This did
  // not previously exist anywhere in the project (no `test` block here, no
  // separate vitest.config.*), and there were zero test files anywhere
  // under src/ - running `vitest` always failed immediately with "No test
  // files found, exiting with code 1" before it ever got a chance to run
  // anything. `environment: 'jsdom'` (jsdom was already an installed
  // devDependency, apparently anticipating component tests that were never
  // written) and `setupFiles` are required for React Testing Library-based
  // component tests to be able to render into a DOM at all.
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
});
