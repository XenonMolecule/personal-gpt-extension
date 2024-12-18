import { defineConfig } from 'vite';
import { sharedConfig } from './vite.config';
import { isDev, r } from './scripts/utils';
import packageJson from './package.json';

// Bundling the background script using Vite
export default defineConfig({
  ...sharedConfig,
  define: {
    '__DEV__': isDev,
    '__NAME__': JSON.stringify(packageJson.name),
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
  },
  build: {
    watch: isDev ? {} : undefined,
    outDir: r('extension/dist/background'),
    cssCodeSplit: false,
    emptyOutDir: false,
    sourcemap: isDev ? 'inline' : false,
    lib: {
      entry: r('src/background/main.ts'), // Entry point for the background script
      name: packageJson.name,
      formats: ['esm'], // Use 'esm' format for compatibility with MV3
    },
    rollupOptions: {
      output: {
        entryFileNames: 'index.mjs',
        format: 'esm', // Ensure 'esm' format
        extend: true,
      },
    },
  },
});