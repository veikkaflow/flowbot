import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // API-avain on nyt Firebase Functionsissa, ei client-puolella
        'process.env.SCRAPE_URL': JSON.stringify(env.SCRAPE_URL),
        'process.env.SCRAPEDEMO_URL': JSON.stringify(env.SCRAPEDEMO_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          input: {
            main: './index.html',
            embed: './embed.tsx'
          },
          output: {
            entryFileNames: (chunkInfo) => {
              // Embed bundle: use fixed name so wrapper can find it easily
              // Note: public/embed.js (wrapper) will be copied to dist/embed.js by Vite
              // and the bundle will be embed-bundle.js in assets folder
              return chunkInfo.name === 'embed' ? 'assets/embed-bundle.js' : 'assets/[name]-[hash].js';
            },
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: (assetInfo) => {
              // Keep CSS files in assets folder
              if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                return 'assets/[name]-[hash][extname]';
              }
              return 'assets/[name]-[hash][extname]';
            }
          }
        }
      }
    };
});
