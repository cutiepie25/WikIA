// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [vue()],

  // El proyecto no usa la API de Sessions de Astro (la sesion de Supabase va
  // en localStorage desde el navegador). Con esto el adapter no configura el
  // binding SESSION ni provisiona un namespace de KV al desplegar.
  session: false,

  // 'passthrough' en vez del default 'cloudflare-binding': el proyecto usa
  // <img> plano y nunca el componente <Image> de Astro, asi que no hace
  // falta transformar imagenes. Ademas el binding IMAGES pertenece a
  // Cloudflare Images, que es un plan pago.
  adapter: cloudflare({ imageService: 'passthrough' })
});