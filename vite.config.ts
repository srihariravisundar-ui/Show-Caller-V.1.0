import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Show-Caller-V.1.0/',
  plugins: [react()],
  server: { port: 5173, strictPort: false },
  build: { target: 'es2020', sourcemap: true },
});
