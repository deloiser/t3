import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx()],
  vite: {
    server: {
      headers: {
        // Allow iframe embedding from any origin
        'Content-Security-Policy': "frame-ancestors *",
        // Don't set X-Frame-Options (allows iframe embedding)
        // Disable caching for dev server
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      },
    },
  },
});
