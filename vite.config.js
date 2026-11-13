import { defineConfig } from 'vite';

// three ocupa casi todo el paquete; el límite del proyecto es 700 KB
export default defineConfig({
  build: { chunkSizeWarningLimit: 700 },
});
