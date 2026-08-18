import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

// En produccion cada entrada apunta al CDN del dominio y se versiona aparte
// (/v1.2.0/remoteEntry.js). En local cada remoto sirve la suya en su puerto.
const REMOTOS = {
  mfTurno: 'http://localhost:5001/assets/remoteEntry.js',
  mfAts: 'http://localhost:5002/assets/remoteEntry.js',
  mfPermiso: 'http://localhost:5003/assets/remoteEntry.js',
}

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: REMOTOS,
      shared: ['react', 'react-dom', 'zustand', '@siso/nucleo'],
    }),
  ],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
  build: { target: 'esnext', minify: false, cssCodeSplit: false },
})
