import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

// Remoto federado. Publica un unico modulo -la vista del dominio- y se
// despliega solo: el shell lo descubre en tiempo de ejecucion por su
// remoteEntry.js y nunca lo compila.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'mfPermiso',
      filename: 'remoteEntry.js',
      exposes: {
        './PermisoAlturas': './src/PermisoAlturas.tsx',
      },
      // React y zustand van compartidos por peso. El nucleo va compartido por
      // correccion: si cada remoto trajera su copia habria varias bitacoras.
      shared: ['react', 'react-dom', 'zustand', '@siso/nucleo'],
    }),
  ],
  server: { port: 5003, strictPort: true, cors: true },
  preview: { port: 5003, strictPort: true, cors: true },
  build: { target: 'esnext', minify: false, cssCodeSplit: false },
})
