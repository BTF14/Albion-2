# SPEC-024: Planificador de Envíos Masivos por Zona Roja & Arbitraje de Riesgo a Caerleon

- **Estado**: Implementado
- **Módulo**: 24 (`red_zone_transport`)
- **Taxonomía SDD**: Spec-Anchored
- **Autor**: Agente Arquitecto
- **Fecha**: 2026-10-05
- **Versión**: 1.1.0

---

## 1. Contexto y Justificación
Caerleon está situada en el centro del Continente Real de Albion Online, aislada por Zonas Rojas donde rige el combate PvP con pérdida total de inventario y equipo (*Full Loot*). Transportar mercadería de las Ciudades Reales a Caerleon o al Mercado Negro (*Black Market*) ofrece márgenes de ganancia masivos, pero conlleva el riesgo de ser emboscado por grupos organizados de gankers (*PKs*). El jugador necesita un modelo cuantitativo de Valor Esperado (EV) y ratio Plata/kg para tomar decisiones informadas sin arriesgar su banca.

---

## 2. Actores y Casos de Uso
- **Actor Principal**: Transportista / Comerciante de Albion Online.
- **Historias de Usuario**:
  - **HU-01**: Como transportista, quiero clasificar mi cargamento por ratio Valor/Peso (Plata/kg) para priorizar ítems de alto valor que ocupen poco peso.
  - **HU-02**: Como comerciante, quiero simular el Valor Esperado (EV) considerando mi probabilidad estimada de supervivencia y el coste de mi equipo de escape.
  - **HU-03**: Como jugador defensivo, quiero saber si mi montura mantiene la capacidad de carga al ser desmontado (montura Courier) o si quedaré inmovilizado con 200% de sobrecarga.

---

## 3. Requisitos Funcionales (Sintaxis EARS)
- **RF-01**: Al ingresar la lista de carga, el sistema **DEBE** calcular automáticamente el peso acumulado en kg y compararlo contra la montura seleccionada.
- **RF-02**: Si el usuario activa el consumo de *Pastel de Cerdo*, el sistema **DEBE** incrementar la capacidad de carga efectiva de la montura en un 30% exacto.
- **RF-03**: Mientras la carga supere el límite pasivo del personaje y la montura NO sea de tipo Courier, el sistema **DEBE** emitir una alerta visual de peligro crítico de inmovilidad al ser desmontado.
- **RF-04**: Al calcular las finanzas, el sistema **DEBE** restar la tasa de mercado correspondiente (0% en órdenes de compra del Mercado Negro, o 6.5%/10.5% en subasta de Caerleon).
- **RF-05**: Cuando la inversión total en riesgo supere el 15% de la reserva declarada de plata del jugador, el sistema **DEBE** emitir una advertencia de gestión de banca.

---

## 4. Requisitos No Funcionales y Guardarraíles de Arquitectura
- **RNF-01**: Toda la matemática de probabilidad, EV y capacidad de monturas debe residir en `/src/domain/use-cases/calculateRedZoneTransport.ts`.
- **RNF-02**: Prohibido el uso de `any`; todos los inputs y outputs deben adherirse estrictamente a `RedZoneTransportInput` y `RedZoneTransportResult`.
- **RNF-03**: La exportación a CSV debe escapar caracteres vulnerables a Formula Injection (`=`, `+`, `-`, `@`, `\t`, `\r`).
- **RNF-04**: Persistencia reactiva en `localStorage` bajo la clave `albion_red_zone_transport_config_v1` con validación defensiva.

---

## 5. Criterios de Aceptación (Acceptance Criteria)
- [x] **CA-01**: Cálculo de ratio Plata/kg ordenado descendentemente para priorizar la carga óptima.
- [x] **CA-02**: Simulación de Valor Esperado ($EV = P_{\text{sup}} \times \text{Beneficio} - P_{\text{muerte}} \times \text{Riesgo}$) con umbral de equilibrio (*Break-Even*).
- [x] **CA-03**: Distinción técnica entre monturas Courier (Jabalí, Oso Grizzly) y estándar (Bueyes).
- [x] **CA-04**: Integración con el gestor de tareas diarias para exportar el viaje como tarea programada.
- [x] **CA-05**: Pasa la suite de auditoría de seguridad Cloudflare (`npm run audit:test`) con 100% de éxito.
