
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // These are injected into the client bundle at build time
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.DISCORD_WEBHOOK_URL': JSON.stringify(process.env.DISCORD_WEBHOOK_URL),
    'process.env.DATABASE_URL_EXISTS': JSON.stringify(!!process.env.DATABASE_URL),
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html'
      }
    }
  }
});
