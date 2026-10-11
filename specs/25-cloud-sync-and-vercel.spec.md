# SPEC-025: Sincronización en la Nube Multidispositivo & Configuración de Despliegue en Vercel

- **Estado**: Implementado
- **Módulo**: Soporte de Infraestructura & Cloud Sync (`cloud_sync`)
- **Taxonomía SDD**: Spec-Anchored
- **Autor**: Agente Lead Engineer / Orquestador
- **Fecha**: 2026-10-06
- **Versión**: 1.0.0

---

## 1. Contexto y Justificación

El jugador de Albion Online necesita consultar y actualizar sus precios, temporizadores de cosechas y cálculos económicos tanto desde su PC de sobremesa mientras juega como desde su teléfono móvil o portátil cuando está fuera de casa.
Aunque la soberanía Local-First (almacenamiento en el navegador a 0ms de latencia) es inquebrantable, se requiere un puente de sincronización en la nube asíncrono y una infraestructura de despliegue en CDN global (Vercel) con soporte para HTTPS y PWA.

---

## 2. Requisitos Funcionales (Sintaxis EARS)

### RF-01: Preparación y Empaquetado de Datos para la Nube
- **Cuándo** el usuario solicita una sincronización manual o el temporizador automático se activa:
- **El sistema deberá** generar un paquete `CloudSyncPayload` v2 que contenga el respaldo completo de cosechas, precios manuales, perfiles de personajes y configuraciones junto con una firma de dispositivo (`deviceId`) y marca de tiempo atómica (`timestamp`).

### RF-02: Recepción y Resolución Defensiva de Conflictos
- **Cuando** se reciba un paquete proveniente de la nube:
- **El sistema deberá** someter el objeto a validación estructural defensiva descartando cualquier payload que contenga claves maliciosas (`__proto__`, `constructor`, `prototype`).
- **Si** la marca de tiempo remota es más reciente que el último estado sincronizado local:
- **El sistema deberá** aplicar una fusión no destructiva (modo `merge`) integrando las novedades sin borrar datos locales.

### RF-03: Tolerancia a Desconexión (Modo Offline)
- **Mientras** el navegador carezca de conexión a internet (`navigator.onLine === false`):
- **El sistema deberá** operar al 100% en modo Local-First sin emitir bloqueos ni errores fatales, indicando el estado `offline` en la interfaz y difiriendo la sincronización para cuando se recupere la red.

### RF-04: Enrutamiento y Despliegue en Vercel
- **Cuando** la aplicación sea compilada y desplegada en la red de Vercel:
- **El sistema deberá** utilizar el archivo de configuración `vercel.json` para reescribir todas las solicitudes SPA hacia `/index.html` y aplicar políticas de cabecera de seguridad (`nosniff`, `SAMEORIGIN`).

---

## 3. Requisitos No Funcionales (RNF)

- **RNF-01 (Latencia Local)**: La sincronización en la nube jamás debe bloquear el hilo principal de renderizado ni la velocidad de escritura local.
- **RNF-02 (Cero `any`)**: Todo el flujo de datos de sincronización debe estar estrictamente tipado con `CloudSyncConfig` y `CloudSyncPayload`.
- **RNF-03 (Seguridad Cloudflare)**: Protección activa contra inyecciones y *Prototype Pollution*.

---

## 4. Criterios de Aceptación Binarios (Acceptance Criteria)

- [x] **CA-01**: Existe el archivo `vercel.json` con reglas de reescritura SPA y cabeceras de caché inmutable para `/assets/`.
- [x] **CA-02**: Existe el modelo de dominio puro `src/domain/models/cloudSync.ts` exportado en `src/domain/index.ts`.
- [x] **CA-03**: Existe el caso de uso puro `src/domain/use-cases/cloudSyncEngine.ts` con funciones deterministas de validación y fusión.
- [x] **CA-04**: Existe el custom hook `src/hooks/useCloudSync.ts` con limpieza de listeners de red y temporizadores en `useEffect`.
- [x] **CA-05**: El componente `CloudSyncModal.tsx` está conectado en la barra superior (`Navbar.tsx`) y en la aplicación principal (`App.tsx`).
- [x] **CA-06**: La guía oficial `VERCEL_DEPLOYMENT_GUIDE.md` está creada y documenta los pasos de despliegue por GitHub y CLI.
