# WikIA

Catálogo público de modelos de IA con búsqueda y paginación resueltas en el servidor, y un CRUD de modelos protegido con Supabase Auth y RLS. Construido con Astro sobre la arquitectura híbrida de Cloudflare: el listado se genera por request (SSR) y las páginas de administración se pre-renderizan en build time (SSG).

**Sitio desplegado:** https://wikia.davidsalcedohiguita.workers.dev

## Rutas

| Ruta | Render | Descripción |
| --- | --- | --- |
| `/` | SSG | Página pública "Acerca de" |
| `/main/` | SSR | Listado, búsqueda por nombre y paginación (`?q=`, `?page=`, `?id=`) |
| `/auth/login/` | SSG | Inicio de sesión |
| `/auth/registro/` | SSG | Registro de usuarios |
| `/admin/` | SSG | CRUD de modelos, requiere sesión activa |

> Las rutas con redirect `307` (`/admin` → `/admin/`) son la normalización de barra final de Cloudflare. Usá siempre la ruta con `/` final.

## Levantar el proyecto localmente

Requiere **Node.js >= 22.12.0**.

```bash
npm install
cp .env.example .env    # en Windows: copy .env.example .env
```

Completá en `.env` los valores de tu proyecto de Supabase (Panel → Project Settings → API):

```ini
PUBLIC_SUPABASE_URL=https://<tu-ref>.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu-publishable-key>
```

```bash
npm run dev        # http://localhost:4321
```

## Desplegar en Cloudflare Workers

```bash
npx wrangler login # una vez; abre el navegador
npm run deploy     # astro build && wrangler deploy
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo sobre el runtime real de Cloudflare (`workerd`) |
| `npm run build` | Build de producción a `./dist/` |
| `npm run preview` | Sirve el build local en `workerd` |
| `npm run deploy` | Build + `wrangler deploy` a Cloudflare Workers |
| `npm run deploy:dry` | Igual que `deploy` pero **no sube nada**; solo empaqueta y muestra el tamaño |

**El build siempre precede al deploy, y no es opcional.** El adaptador de Cloudflare escribe `dist/server/wrangler.json` durante `astro build` y redirige ahí la configuración de `wrangler deploy`. Desplegar sin un build fresco hace que Wrangler use el `wrangler.jsonc` raíz, cuyo `main` apunta a un entrypoint que importa módulos virtuales de Vite y no se puede empaquetar fuera del build.

Verificá el tamaño antes de desplegar:

```bash
npm run deploy:dry
# Total Upload: 1513.04 KiB / gzip: 349.99 KiB
```

## Variables de entorno

| Variable | Ámbito | ¿Obligatoria? | Dónde se define |
| --- | --- | --- | --- |
| `PUBLIC_SUPABASE_URL` | Build time | **Sí** | `.env` local · *Build time variables* en Cloudflare |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Build time | **Sí** | `.env` local · *Build time variables* en Cloudflare |
| `SUPABASE_URL` | Runtime | No | `wrangler secret put SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | Runtime | No | `wrangler secret put SUPABASE_ANON_KEY` |

Las dos `PUBLIC_*` **deben existir en tiempo de build**: el código del navegador no puede leer el `env` del Worker, así que el SDK de Supabase recibe los valores que Vite inyecta en el bundle. Si el build corre en Cloudflare y esas variables no están definidas, el listado público y la autenticación fallan.

Las dos de runtime son opcionales. El listado SSR las prefiere cuando existen y, si no, cae a los valores `PUBLIC_*`. Configurarlas permite que el SSR funcione aunque el build no tenga nada.

> Guardar `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_PUBLISHABLE_KEY` como **secrets del Worker no sirve** para el bundle del navegador. Solo alcanzan a código que corre dentro del Worker.

## Arquitectura

| Requisito | Implementación | Dónde |
| --- | --- | --- |
| Listado desde el servidor en cada request | `prerender = false` + queries `await` en el frontmatter | `src/pages/main/index.astro:2,53-106` |
| Búsqueda y paginación por query params | `?q=` con `.ilike()` (línea 69), `?page=` con `.range()` (línea 87), 5 por página | `src/pages/main/index.astro:33-35,60-93` |
| Elementos siempre visibles en el HTML | El componente se renderiza en el servidor, **sin** directiva `client:*`; los formularios usan `<form method="get">` nativo; no hay ningún `fetch()` en `src/` | `src/pages/main/index.astro:122` · `src/components/BusquedaIA.vue` |
| Registro, login y administración pre-renderizados | `export const prerender = true` | `src/pages/admin/index.astro:2` · `src/pages/auth/login.astro:2` · `src/pages/auth/registro.astro:2` |
| Operaciones Supabase desde el cliente | `client:only="vue"` monta el CRUD; el HTML es igual para todos los usuarios y los datos llegan tras autenticar | `src/components/admin/ModeloAdmin.vue` · `src/composables/useAuth.ts` |
| Redirección al login sin sesión | `requireSession()` en `onMounted` | `src/composables/useAuth.ts:70-77` · `src/components/admin/ModeloAdmin.vue:48` |
| RLS sobre la escritura | Policies en el panel de Supabase | Ver abajo |
| "Acerca de" pre-renderizada | `export const prerender = true` | `src/pages/index.astro:2` |
| Layout común con `ClientRouter` y `<title>` por página | Layout único con `<title>{title}</title>`; 5 páginas, 5 títulos distintos | `src/layouts/Layout.astro:7,19,20` |

## CRUD de modelos

La tabla `modelo` de Supabase tiene **12 columnas**. El formulario de administración administra **7**:

| Campo en el form | Columna | Tipo |
| --- | --- | --- |
| Nombre | `nombre` | texto, obligatorio |
| URL de la imagen | `imagen_link` | url, obligatorio |
| Descripción | `descripcion` | texto, obligatorio |
| Fecha de lanzamiento | `fecha_lanzamiento` | date, obligatorio |
| Tipo de arquitectura | `tipo_arquitectura` | texto, opcional |
| Sitio web | `sitio_web` | url, opcional |
| ¿Tiene capa gratuita? | `tiene_capa_gratuita` | boolean, opcional |

Las 5 columnas restantes (`parametros_billones`, `ventana_contexto`, `id_compania`, `id_licencia`, `id`) no se editan desde el admin: las dos últimas son claves foráneas que requerirían formularios aparte.

Los campos opcionales tienen una opción **"Sin especificar"** y se envían como `null`, nunca como cadena vacía. Postgres rechaza `''` en una columna `date`, y un `<select>` siempre devuelve texto, así que la capa gratuita se traduce a booleano antes de enviarse.

## Cómo verificar que el listado no usa JavaScript

El listado público tiene que entregar los datos **ya escritos en el HTML**. Si al desactivar JavaScript el buscador sigue funcionando, es que no hay ningún script dibujando la tabla.

### Paso 1 — Abrí el listado

```
https://wikia.davidsalcedohiguita.workers.dev/main/
```

### Paso 2 — Abrí las herramientas de desarrollo

Hacé **click derecho** sobre la página y elegí **Inspeccionar**. También sirve el atajo `F12`.

### Paso 3 — Abrí el menú de comandos

Con las herramientas abiertas, presioná:

```
Ctrl + Shift + P
```

Aparece un cuadro de texto arriba. Es el **menú de comandos** de DevTools, donde viven las acciones que no están en los botones de la barra.

### Paso 4 — Desactivá JavaScript

Escribí en ese cuadro:

```
Disable JavaScript
```

y elegí la opción que aparece. DevTools avisa con una cinta amarilla arriba: *"JavaScript is disabled"*.

### Paso 5 — Recargá la página

Presioná `F5`. El recargar es importante: la desactivación se aplica al código nuevo que se carga, no a los scripts que ya estaban corriendo.

### Paso 6 — Probá el buscador

Escribí `llama` en el campo **Buscar por nombre** y presioná **Buscar**. Después probá la paginación con los botones del listado.

### Qué tenés que ver

| Comprobación | Resultado esperado |
| --- | --- |
| El listado aparece | Los 5 modelos se ven, con imagen y descripción |
| La búsqueda funciona | `Llama 4 Maverick` y los que le corresponden |
| La paginación funciona | Cambian los modelos al cambiar de página |
| La barra de herramientas se ve normal | El JavaScript está apagado y nada falló |

Si el listado o la búsqueda fallaran con JavaScript apagado, significaría que los datos se estaban trayendo desde el navegador, que es justamente lo que el taller prohíbe.

> La barra de direcciones puede mostrar la URL con `?q=llama` al cambiar. Eso es correcto: es un formulario HTML nativo, el navegador pide la página y el servidor la genera. No hay JavaScript en el medio.

### Para volver a habilitar JavaScript

Repetí los pasos 2 a 4 y elegí **Enable JavaScript**, o recargá la página con `Ctrl + Shift + R`.

### Alternativa desde la terminal

`curl` no tiene motor de JavaScript, así que sirve el mismo propósito:

```bash
h=$(curl -s "https://wikia.davidsalcedohiguita.workers.dev/main/?q=llama")

echo "Isos hidratados: $(grep -o 'astro-island' <<< "$h" | wc -l)"   # debe ser 0
grep -o 'Llama 4 Maverick' <<< "$h"                        # debe imprimir el nombre
grep -o 'form method="get" action="/main/"' <<< "$h"       # debe encontrar el form
```

- `astro-island` es la marca que Astro deja al hidratar un componente. **Cero** significa que nada se hidrata.
- `BusquedaIA.vue` no genera chunk de JavaScript: en `dist/client/_astro/` no existe ningún `BusquedaIA.*.js`.
- El único JS que descarga `/main/` es el `ClientRouter`, que el taller exige en el Layout para las View Transitions. Por eso la consulta aparece en la pestaña Network como navegación: baja el **documento HTML**, no los datos.

## RLS en Supabase (obligatorio)

Las políticas se configuran en el panel de Supabase, no en el repositorio. Sin ellas, el CRUD queda expuesto: la clave publicable viaja dentro del bundle del navegador y el control de escritura no existe.

Ejecutá esto en **Panel → SQL Editor → New query**:

```sql
-- El listado público (SSR) lee con la clave anon, así que SELECT debe permitirse.
alter table public.modelo enable row level security;

create policy "modelo: lectura publica"
  on public.modelo for select
  to anon, authenticated
  using (true);

-- La escritura solo la puede hacer un usuario con sesión activa.
create policy "modelo: escritura autenticada"
  on public.modelo for insert
  to authenticated
  with check (true);

create policy "modelo: actualizacion autenticada"
  on public.modelo for update
  to authenticated
  using (true)
  with check (true);

create policy "modelo: borrado autenticado"
  on public.modelo for delete
  to authenticated
  using (true);
```

Con RLS activo, un `update` o `delete` bloqueado **no lanza error**: afecta cero filas. El formulario lo traduce al mensaje *"sin permiso (RLS)"*.

## Estructura

```text
src/
├── components/
│   ├── AcercaDe.vue           # página pública, sin JS
│   ├── BusquedaIA.vue         # listado y búsqueda, renderizado en el servidor
│   ├── admin/ModeloAdmin.vue  # CRUD (client:only), 7 campos del modelo
│   └── auth/                  # LoginForm.vue, RegistroForm.vue
├── composables/useAuth.ts     # sesión, login, registro, requireSession
├── layouts/Layout.astro       # Layout común: ClientRouter + <title>
├── lib/
│   ├── supabase.client.ts     # navegador, valores horneados en build
│   └── supabase.server.ts     # SSR, lee el env del Worker con fallback a build
└── pages/
    ├── index.astro            # Acerca de   (SSG)
    ├── main/index.astro       # Listado     (SSR)
    ├── admin/index.astro      # Admin       (SSG)
    └── auth/                  # login, registro (SSG)
```

`wrangler.jsonc` define `name`, `compatibility_date`, los `compatibility_flags` (`nodejs_compat`, `global_fetch_strictly_public`) y `observability`. `main` y `assets.directory` los sobreescribe el adaptador en cada build, así que no hace falta editarlos.