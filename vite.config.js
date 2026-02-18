import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['xlsx', 'jszip', 'pdfjs-dist', 'tesseract.js']
  },
  build: {
    commonjsOptions: {
      include: [/xlsx/, /jszip/, /pdfjs-dist/, /tesseract/]
    }
  }
});
