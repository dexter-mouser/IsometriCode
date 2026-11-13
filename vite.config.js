import { defineConfig } from 'vite';

// En producción el sitio vive en https://dexter-mouser.github.io/IsometriCode/
// three ocupa casi todo el paquete; el límite del proyecto es 700 KB
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/IsometriCode/' : '/',
  build: { chunkSizeWarningLimit: 700 },
}));
