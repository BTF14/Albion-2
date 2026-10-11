# Guía Oficial de Despliegue en Vercel & Sincronización en la Nube
## Albion Farm & Economy Tracker
<!-- Arquitectura: Vite SPA + Vercel Hosting + Local-First Cloud Sync Engine -->

Esta guía detalla el procedimiento paso a paso para desplegar **Albion Farm & Economy Tracker** en **Vercel** en menos de 2 minutos, habilitar HTTPS gratuito, configurar dominios personalizados y sincronizar tus datos en la nube entre PC y móvil.

---

## 🌟 1. ¿Por qué Vercel para este Proyecto?

1. **Despliegues Instantáneos en Edge Network**: Vercel distribuye la aplicación a través de CDN global ultrarrápido con latencias inferiores a 20ms.
2. **Compatibilidad Nativa con Vite 6**: El proyecto ya incluye `vercel.json` optimizado para enrutamiento SPA y compresión gzip/brotli.
3. **PWA Instalable con HTTPS**: Vercel provee certificados SSL automáticos, lo que permite instalar la aplicación como una app nativa en tu teléfono Android, iPhone o PC.
4. **Cero Coste (Free Tier Generoso)**: El plan gratuito de Vercel cubre con holgura el tráfico de la aplicación sin límites de ancho de banda prácticos para uso personal o de gremio.

---

## 🚀 2. Método 1: Despliegue con GitHub (Recomendado - 2 Clics)

Este es el método más rápido y cómodo. Cada vez que actualices tu código en GitHub, Vercel compilará y actualizará tu web automáticamente.

### Paso 1: Subir el Proyecto a tu GitHub
1. Abre tu terminal o cliente Git en la carpeta del proyecto.
2. Si no has inicializado git:
   ```bash
   git init
   git add .
   git commit -m "feat: albion farm tracker production release"
   ```
3. Crea un repositorio en [GitHub](https://github.com/new) (puede ser Público o Privado).
4. Vincula y sube el código:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/albion-farm-tracker.git
   git branch -M main
   git push -u origin main
   ```

### Paso 2: Importar en Vercel
1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en el botón azul **"Add New..."** ➔ **"Project"**.
3. En la lista de repositorios, busca `albion-farm-tracker` y pulsa **"Import"**.
4. Vercel detectará automáticamente la configuración:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Haz clic en **"Deploy"**.
6. En ~40 segundos tu web estará en vivo en una URL como:
   `https://albion-farm-tracker.vercel.app`

---

## 💻 3. Método 2: Despliegue Directo por Terminal (Vercel CLI)

Si prefieres desplegar directamente desde tu terminal sin pasar por GitHub:

1. Instala Vercel CLI globalmente o úsalo con npx:
   ```bash
   npx vercel
   ```
2. La terminal te pedirá iniciar sesión la primera vez:
   - Sigue el enlace que aparece en pantalla para autenticarte.
3. Responde a las preguntas de configuración:
   - *Set up and deploy?* ➔ `Y`
   - *Which scope?* ➔ Selecciona tu usuario.
   - *Link to existing project?* ➔ `N`
   - *Project name?* ➔ `albion-farm-tracker` (o el nombre que elijas).
   - *Directory?* ➔ `./`
   - *Want to modify settings?* ➔ `N` (la configuración ya está en `vercel.json`).
4. Para desplegar a producción final con tu dominio permanente:
   ```bash
   npx vercel --prod
   ```

---

## ⚙️ 4. Explicación del Archivo `vercel.json` Incluido

El repositorio ya contiene el archivo `vercel.json` en la raíz con la siguiente arquitectura:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

- **Reescritura SPA (`rewrites`)**: Redirige todas las rutas hacia `index.html` para que al recargar la página nunca veas un error 404.
- **Caché Inmutable (`Cache-Control`)**: Los archivos empaquetados (`/assets/`) se almacenan en caché por 1 año, reduciendo el consumo de datos en móviles.
- **Cabeceras de Seguridad**: Protección contra *MIME type sniffing*, *Clickjacking* y fugas de *Referrer*.

---

## ☁️ 5. Cómo Funciona la Sincronización en la Nube (Cloud Sync)

1. En la barra superior de la app, haz clic en el botón **"☁️ Nube"**.
2. Se abrirá el modal de **Sincronización en la Nube Multidispositivo**.
3. Puedes:
   - Activar la sincronización automática (cada 5, 15 o 60 minutos).
   - Pulsar **"Sincronizar"** para hacer un respaldo instantáneo del estado completo de tu cuenta.
   - Conectar tu proyecto con **Firebase Firestore** o **Supabase** introduciendo el Project ID o la URL de API.
4. Si juegas sin conexión a internet o con señal débil, la app sigue funcionando al 100% en modo Local-First y se sincroniza en cuanto recuperas red.

---

## 📱 6. Cómo Instalar la App en Móvil o PC desde Vercel (PWA)

Una vez desplegada en Vercel con HTTPS:

- **En Android (Chrome / Brave)**: Abre tu enlace de Vercel, toca el menú de 3 puntos (⋮) y selecciona **"Instalar aplicación"** o **"Añadir a la pantalla de inicio"**. Se creará un icono independiente en tu móvil sin barra de navegador.
- **En iOS (iPhone / iPad - Safari)**: Abre tu enlace, toca el botón de Compartir (el cuadrado con la flecha hacia arriba) y selecciona **"Añadir a la pantalla de inicio"**.
- **En Windows / Mac (Chrome / Edge)**: En la barra de direcciones aparecerá un icono de monitor con una flecha hacia abajo: haz clic en **"Instalar Albion Tracker"**.

---

## 🛠️ 7. Comandos de Verificación antes de Subir a Vercel

Antes de hacer `git push` o desplegar, siempre puedes verificar la salud del proyecto en tu máquina local:

```bash
# 1. Compilación de producción (idéntica a la que ejecutará Vercel)
npm run build

# 2. Verificación estricta de TypeScript (0 errores)
npm run lint

# 3. Auditoría de calidad y calificación de MVP (100/100)
npm run qa:audit
```
