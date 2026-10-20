import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno de Node / Vite sin lanzar errores de TypeScript
  const env = loadEnv(mode, process.cwd(), '');
  const isHmrDisabled = env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // Si DISABLE_HMR es true, desactiva HMR
      hmr: !isHmrDisabled,
      // Desactiva la observación de archivos si DISABLE_HMR es true
      watch: isHmrDisabled ? null : {},
    },
  };
});


