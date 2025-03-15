// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // La porta su cui gira il server di sviluppo di Vite (va bene 3000)
    host: true,
    proxy: { // Aggiungi questa sezione per il proxy
      '/api': { // Tutte le richieste che iniziano con /api
        target: 'http://localhost:5000', // ...saranno inoltrate a questo URL (il tuo server Express)
        changeOrigin: true,  // Imposta changeOrigin a true
        secure: false,      // Se il tuo backend usa HTTPS, imposta questo a true.  Per lo sviluppo locale con HTTP, lascialo a false.
        // Non è necessario rewrite, in questo caso semplice.
      },
    },
  },
});