# AlbumTrack - Seguimiento de Álbumes

Aplicación premium para el seguimiento de colecciones de cromos, integrada con Supabase y procesamiento inteligente.

## Características

- 📊 **Dashboard de Progreso**: Visualiza tus álbumes y estadísticas de completitud.
- 🧩 **Seguimiento Detallado**: Marca cromos como pegados, faltantes o repetidos.
- 📸 **Escaneo OCR**: Carga fotos de tus álbumes para detectar cromos automáticamente.
- 📥 **Importación Masiva**: Carga datos desde JSON o listas de números.
- 📤 **Exportación**: Genera listas de faltantes y repetidas para intercambios.

## Tecnologías

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org)
- **Base de Datos**: [Supabase](https://supabase.com)
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com)
- **Iconos**: [Lucide React](https://lucide.dev)
- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/)

## Configuración Local

1. Clona el repositorio.
2. Instala las dependencias: `npm install`.
3. Configura el archivo `.env.local` con tus credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```
4. Ejecuta el servidor de desarrollo: `npm run dev`.

## Despliegue

Despliega fácilmente en [Vercel](https://vercel.com) conectando tu repositorio de GitHub.
