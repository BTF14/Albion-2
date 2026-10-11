# Reglas y Roadmap Oficial del Proyecto (Albion Farm & Economy Tracker)

## Reglas Inquebrantables del Proyecto
0. **Lectura Obligatoria Previa de Documentación (`PROJECT_DOCUMENTATION.md` y `ALBION_KNOWLEDGE.md`)**:
   - Todo agente de IA, LLM o desarrollador tiene el **requisito bloqueante e inviolable** de ejecutar `view_file` sobre `/PROJECT_DOCUMENTATION.md` y `/ALBION_KNOWLEDGE.md` antes de crear, editar o proponer cualquier código o funcionalidad.
   - En `/PROJECT_DOCUMENTATION.md` se encuentra el mapa completo de los 21 módulos, todas las claves de `localStorage`, el estándar Clean Architecture (Gentleman Programming) y las reglas de seguridad de Cloudflare. Prohibido asumir o inventar arquitecturas sin consultar el manual.
1. **Precios Manuales como Núcleo Principal**: El sistema siempre funciona en base a los precios introducidos manualmente por el jugador. No se debe forzar ni depender de APIs externas. Si en el futuro se añade consulta a Albion Data Project, será estrictamente un botón secundario y opcional que jamás sobreescriba ni interfiera con los datos manuales del usuario.
2. **Fidelidad Estricta a las Mecánicas de Albion Online**:
   - Consultar obligatoriamente `/ALBION_KNOWLEDGE.md` antes de cualquier cálculo o propuesta técnica.
   - **NO inventar mecánicas**: En Albion Online los trabajadores (labourers) de casas NO tienen diarios ni libros para agricultura, herboristería, crianza de animales, cocina ni alquimia. (Solo existen para recolección de mundo abierto: leñador, cantero, prospector, cosechador de fibra, desollador, pescador; o crafteo de equipo: herrero, flechero, mago, hojalatero; o mercenario).
   - Los cultivos y hierbas crecen en 22 horas con Premium.
   - Los animales de granja comen 10 unidades de grano/hierbas cada 22h y producen carne/leche/huevos.
   - Las monturas (caballos, bueyes en pastizal; garrasprestas, lobos en criadero/kennel) requieren crías, alimento diario (grano para herbívoros, carne para carnívoros) y ensillado.
   - La cocina se beneficia de Caerleon (+15% RRR) y la alquimia de Brecilien (+15% RRR).
   - Los encantamientos de comida usan Salsas de Pescado (.1 Menor, .2 Media, .3 Mayor producidas con pescado picado y algas). Las pociones usan Esencias Arcanas.
3. **Estándar Inviolable de Arquitectura Gentleman Programming (Alan Buscaglia)**:
   - **Regla del Ámbito (Scope Rule)**: Los componentes de interfaz de usuario nunca deben contener fórmulas matemáticas de cálculo económico ni reglas de negocio acopladas al renderizado.
   - **Capa de Dominio Puro (`/src/domain/`)**: Toda la lógica matemática, modelos de datos de Albion Online y casos de uso financieros viven en `/src/domain/models/` y `/src/domain/use-cases/`. Deben ser funciones y entidades puras, 100% testeables y agnósticas de React, JSX y del DOM.
   - **Patrón Hook / Contenedor (`/src/hooks/`)**: El estado, la reactividad, las sincronizaciones multidispositivo y las suscripciones a eventos de almacenamiento se desacoplan en Custom Hooks (`usePriceMemory`, `useDestinyMastery`, `useFocusOptimizer`).
   - **Tipado Fuerte y Código Defensivo**: Prohibido usar `any`. Todas las entradas numéricas deben sanitizarse con validaciones estrictas (`Number.isFinite`, `Math.max`) para prevenir `NaN` o divisiones por cero. Exportaciones limpias mediante barrel files (`src/domain/index.ts`, `src/hooks/index.ts`).
   - **Cero Tolerancia a Errores de Tipos**: El compilador TypeScript se ejecuta con `"strict": true`, `"forceConsistentCasingInFileNames": true` y `"noFallthroughCasesInSwitch": true`. Prohibido el uso de directivas `@ts-ignore` o `@ts-nocheck` en archivos de producción.
4. **Estándar Oficial de Seguridad y Auditoría (Cloudflare Security Audit Skill - `/skills/security-audit/`)**:
   - Todo el framework oficial de auditoría y defensa de Cloudflare (`cloudflare/security-audit-skill`) está incorporado en `./skills/security-audit/` y activo en la memoria operativa permanente del proyecto.
   - **Metodología de Auditoría en 6 Fases**:
     1. *Reconocimiento (`RECONNAISSANCE.md`)*: Mapeo continuo de superficie de ataque, límites de confianza, fuentes no confiables (archivos JSON importados por el usuario, respuestas remotas de Albion Data Project, inputs numéricos, eventos de temporizador).
     2. *Caza guiada por cobertura (`HUNTING.md`)*: Registro y revisión exhaustiva de fuentes y sinks de datos en componentes, hooks y casos de uso.
     3. *Vectores y Clases de Ataque (`ATTACK-CLASSES.md`)*:
        - *Cliente y Navegador (`CLIENT-SIDE.md`)*: Blindaje contra DOM-XSS, *Prototype Pollution* en deserialización de JSON (`__proto__`, `constructor`, `prototype`), inyecciones en URLs.
        - *Aislamiento y Ciclo de Vida de Datos (`DATA-ISOLATION-AND-LIFECYCLE.md`)*: Validación estricta de esquemas antes de persistir o mutar `localStorage`.
        - *Agotamiento de Recursos y Disponibilidad (`RESOURCE-EXHAUSTION-AND-AVAILABILITY.md`)*: Prevención de DoS por payloads masivos, bucles de re-render en React, fugas de memoria en `setInterval`/`ResizeObserver`, timeouts defensivos en peticiones HTTP.
        - *Cadena de Suministro (`SUPPLY-CHAIN-AND-RELEASE.md`)*: Cero dependencias superfluas o vulnerables.
        - *Protocolos, Red y Nube (`WEB-PROTOCOL-AND-AUTH.md`, `CLOUD-AND-DEPLOYMENT.md`)*: Manejo de CORS, mitigación de fallos de red y fallbacks seguros sin degradación silenciosa.
        - *Guías Especializadas*: `AI-AND-LLM.md`, `PROTOCOLS-RPC-AND-MESSAGING.md`, `DESKTOP-MOBILE-AND-LOCAL-IPC.md`, `MEMORY-SAFETY-AND-BINARY.md`.
     4. *Validación Adversarial (`VALIDATION-AND-REPORTING.md`)*: Todo reporte o sospecha de fallo debe confirmarse con vectores concretos de reproducción antes de clasificarlo como vulnerabilidad real.
     5. *Validadores de Esquema*: Scripts activos ejecutables (`validate-findings.cjs`, `validate-coverage-ledger.cjs`, `report-schema.json`) ejecutables con `npm run audit:test`.
5. **Rendimiento de Empaquetado y Partición de Módulos (Vite Chunk Splitting)**:
   - El empaquetado de producción en `vite.config.ts` debe preservar la estrategia de `manualChunks` para segregar proveedores de terceros pesados (`vendor-react`, `vendor-charts`, `vendor-icons`), garantizando tiempos de carga óptimos y almacenamiento en caché independiente en el navegador.
6. **Soberanía Local-First y Operatividad Offline**:
   - La aplicación está diseñada bajo el paradigma **Local-First**: el 100% de la experiencia de usuario (cálculos, balance, inventario de islas, registro de precios y tareas) funciona de manera autónoma en el navegador mediante `localStorage` sin requerir conectividad de red ni servidores externos.
   - Cualquier integración de red (ej. consulta a Albion Data Project) es puramente un complemento asíncrono secundario y jamás debe bloquear o degradar el flujo de trabajo del jugador ante desconexión o fallos de red.
7. **Ergonomía Visual y Jerarquía Numérica de Albion Online**:
   - **Contraste y Estética de Albion**: Fondos en escala de grises oscuros profundos (`slate-950` a `slate-800`) con bordes sutiles y acentos cromáticos fieles al cliente oficial de Albion.
   - **Codificación Oficial de Tiers y Encantamientos**: Badges distintivos por tier (T3 Bronce, T4 Azul, T5 Rojo, T6 Naranja, T7 Amarillo, T8 Marfil) y niveles de encantamiento (.0 Plano, .1 Verde Esmeralda, .2 Azul Zafiro, .3 Púrpura Amatista, .4 Dorado Celestial).
   - **Tipografía Numérica Defensiva**: Todas las cantidades de plata, costes, tasas y puntos de foco deben utilizar tipografía con números tabulares (`tabular-nums`) y separadores de miles para garantizar legibilidad instantánea sin saltos de maquetación.
8. **Validación Defensiva de Respaldos e Integridad de Datos (Schema-Guarded Backup System)**:
   - Todo archivo JSON cargado por el usuario debe someterse a una validación estructural estricta antes de ser procesado por el motor de la aplicación.
   - Se prohíbe inyectar o sobrescribir datos sin verificación previa de campos requeridos (`harvests`, `priceMemory`, `characters`, `masteries`, `ledger`), evitando daños por esquemas desactualizados, campos truncados o ataques de Prototype Pollution.
9. **Estándar Metodológico MoureDev: "El Nuevo Programador" & Spec-Driven Development (SDD)**:
   - Todo agente, LLM o desarrollador que opere en este repositorio debe trabajar con la disciplina de las **6 capas concéntricas de MoureDev** guiadas por el **Criterio de Ingeniería**:
     - **00 - Fundamentos de Programación**: Dominio y respeto estricto de Clean Architecture (Alan Buscaglia / Gentleman Programming), desacoplamiento total entre Dominio Puro (`/src/domain/`) y componentes React, pruebas unitarias y TypeScript estricto sin `any`.
     - **01 - Fundamentos de IA**: Comprensión técnica de ventanas de contexto, límites de tokens y prompting estructurado.
     - **02 - Harness Engineering**: Respeto inviolable del "arnés" del agente: guardarraíles duros, contexto curado (`PROJECT_DOCUMENTATION.md`, `ALBION_KNOWLEDGE.md`, `HARNESS.md`) y planificación previa antes de modificar código.
     - **03 - Harness Avanzado**: Empleo de herramientas y Agent Skills modulares (ej. framework Cloudflare Security Audit en `/skills/security-audit/`) con scripts reproducibles (`npm run audit:test`).
     - **04 - Spec-Driven Development (SDD)**: Prohibido el "vibe coding" o desarrollo por ocurrencias al vuelo. Todo módulo o refactorización relevante se define mediante especificaciones formales (`/specs/`) con sintaxis EARS (`RF-x`), análisis de casos borde y criterios de aceptación binarios (`CA-x`).
     - **05 - Multiagentes y Subagentes**: Especialización y separación de responsabilidades: Arquitecto de Dominio, Implementador Frontend, Auditor Adversarial de Seguridad y Verificador de Criterios de Aceptación.

---

## Lista Oficial de Mejoras Acordadas con el Usuario

- [x] **1. Crianza de Monturas y Pastizales Avanzados (Caballos, Bueyes, Garrasprestas, Lobos, Jabalíes)**
  - Cálculo de costes de crías compradas o criadas.
  - Alimento necesario por ciclo (10 unidades por animal/día de grano o carne).
  - Probabilidad de retorno de cría con foco vs sin foco.
  - Coste de ensillado en Guarnicionero vs venta final de la montura.

- [x] **2. Encantamientos de Comida y Pociones (.1, .2, .3)**
  - Salsas de pescado (Salsa Básica .1, Elegante .2 y Especial .3 con algas y pescado picado).
  - Esencias y extractos arcanos para pociones encantadas.
  - Taller de salsas y extractos con comparación de coste de crafteo propio vs compra directa en mercado.
  - Comparador directo lado a lado: Rentabilidad neta, margen ROI %, Plata/Foco y diferencia en plata vs .0 plano con precios manuales del mercado.

- [x] **3. Optimizador de Foco Diario ("¿En qué gastar mi foco hoy?")**
  - Basado 100% en los precios manuales que tengas guardados en la app.
  - Calcula la Plata neta ganada por cada Punto de Foco gastado (`Plata / Foco`).
  - Te muestra el ranking claro de tus actividades más rentables para los 10.000 puntos diarios.
  - Arquitectura limpia con Dominio Puro, Caso de Uso desacoplado y Custom Hook siguiendo los principios de Gentleman Programming.

- [x] **4. Gestor Multi-Personaje y Multi-Isla (Alts)**
  - Crear perfiles para diferentes personajes o islas (ej. "Principal - Martlock", "Alt 1 - Caerleon").
  - Monitoreo del contador de foco (0 a 10.000) con reloj de regeneración (recarga completa en 24h / ~416 foco por hora con Premium).
  - Rutina de cosechas e islas vinculadas por personaje, con cambio ágil desde la barra superior y sincronización en la calculadora de maestría y lista de tareas.

- [x] **5. Respaldo Completo de Datos (Exportar e Importar JSON)**
  - Descargar copia de seguridad con todo tu historial de cosechas, configuración, perfiles de alts, maestría del destino y precios manuales guardados (formato JSON v2).
  - Inspección previa con validación estricta de estructura antes de aplicar cambios.
  - Opciones de restauración segura: "Combinar y Fusionar" (preserva datos locales agregando novedades) o "Reemplazo Total" con confirmación de seguridad.
  - Acceso directo desde la barra de navegación superior y desde la pestaña de Historial y Balance.

- [x] **6. Consulta Referencial Opcional de Precios (Albion Data Project)**
  - Botón secundario puramente opcional de consulta para ver cómo cotiza un ítem en el mercado según los últimos registros públicos.
  - Solo como ayuda de consulta rápida, sin alterar ni sobreescribir tus precios manuales a menos que tú lo decidas explícitamente.
  - Soporte para los 3 servidores oficiales: Europa (Ámsterdam), América (Washington) y Asia (Singapur).
  - Cotizaciones discriminadas por ciudad real (Martlock, Thetford, Fort Sterling, Lymhurst, Bridgewatch, Caerleon, Brecilien), comparando órdenes de venta vs órdenes de compra y antigüedad del registro.
  - Botón "Usar en Manual" con confirmación visual rápida, permitiendo transferir cualquier precio encontrado a la memoria de precios manuales solo cuando el usuario lo determine.
  - Acceso directo desde la barra superior (`Mercado ADP`) y botones directos integrados `[ADP]` al lado de cada campo de precio en el Registro Diario.

- [x] **7. Monitor de Eventos Diarios y Bonos de Producción (Reinicio 10:00 UTC)**
  - Reloj oficial en tiempo real con cuenta regresiva al mantenimiento y reinicio del servidor de Albion (10:00 UTC).
  - Selector y panel de Eventos Diarios y Bonos de Producción (+10% o +20% de Retorno de Recursos RRR en Cocina, Alquimia, etc.).
  - Integración directa con el motor de dominio económico (`calculateCraftingEconomy` y Optimizador de Foco) para aplicar la bonificación de RRR activa en tiempo real.
  - Expiración y rotación automática diaria sincronizada con el reloj UTC de Albion.

- [x] **8. Generador de Rutinas Diarias Automáticas y Plantillas de Albion Online**
  - Sincronización en 1 clic de todas las islas registradas en tus personajes (Alts) a la lista de cosas por hacer sin duplicados.
  - Catálogo de Plantillas Rápidas de Albion (Gasto de foco antes del tope de 30k, compras en mercado, alimentación de criaderos y pastizales, transporte a Caerleon con +15% RRR, revisión de órdenes expiradas).
  - Reinicio seguro de jornada diaria alineado con el reinicio de las 10:00 UTC con preservación de configuración.

- [x] **9. Calculadora de Rutas de Transporte, Capacidad de Carga y Arbitraje de Mercado (Inter-Ciudades & Caerleon)**
  - Cálculo de ganancia neta y arbitraje al transportar cosechas, alimentos o monturas producidas/compradas en una ciudad hacia otra (ej. Ciudades Reales -> Caerleon por zona roja con bonificaciones, o entre Mercados Reales).
  - Selector de capacidad de carga de monturas de transporte oficiales de Albion (Buey T3 a T8, Mamut de Transporte, Caballo de Carga, Oso Polar, Lagarto de Plagas) + bonos de bolsa y pastel de cerdo.
  - Base de datos de pesos reales en kg por unidad (cultivos, hierbas, productos de animales, monturas, comidas, pociones) para cálculo exacto de unidades máximas transportables antes de la sobrecarga.
  - Indicador de plata por kg (`Plata / kg`), ganancia neta total del viaje, impuestos de venta en destino (4% con Premium / 8% sin Premium + 2.5% tasa de orden) y nivel de riesgo de la ruta (Zona Segura vs Zona Roja/Negra).

- [x] **10. Exportador Oficial de Historial y Balances a Formato CSV / Excel**
  - Descarga instantánea en archivo `.csv` compatible con Microsoft Excel, Google Sheets y LibreOffice.
  - Exportación granular: cosechas registradas, ingresos, costes de semillas y ganancia neta calculada.
  - Blindaje estricto contra inyecciones de fórmulas CSV (`=`, `+`, `-`, `@`) en conformidad con Cloudflare Security Audit.

- [x] **11. Analítica Visual y Gráficos de Evolución de Patrimonio y Rentabilidad**
  - Gráficos interactivos de evolución histórica de plata (ingresos brutos, costes y balance neto por día/semana).
  - Gráfico de distribución de ganancias por categoría (Cultivos vs Animales vs Comida/Pociones vs Monturas).
  - Indicadores clave de rendimiento (ROI promedio, margen neto y actividad económica líder).

- [x] **12. Gestor y Calculadora de Inversión y Retorno de Casas y Trabajadores (Labourers)**
  - Catálogo oficial de trabajadores de recolección (Leñador, Cantero, Prospector, Cosechador, Desollador, Pescador), artesanía (Herrero, Flechero, Mago, Hojalatero) y combate (Mercenario).
  - Cálculo de felicidad según tier de casa, cama, mesa y trofeos generales y específicos (rendimiento del 100% al 150% en recolectores o 125% en crafteo cuando la casa y trabajador superan en 1 tier al diario).
  - Balance financiero diario (22h) y mensual (30 ciclos): coste de diarios llenos vs reventa de diarios vacíos + recursos devueltos con precios manuales.
  - Coste de construcción de casas T2 a T8 (180 bloques de piedra por tier + troncos y piedra bruta) y cálculo de días de amortización de la inversión.

- [x] **13. Calculadora de Crafteo de Equipo y Llenado de Diarios de Trabajador (Blacksmith, Fletcher, Imbuer, Tinker)**
  - Catálogo oficial de armas, armaduras, manos secundarias, herramientas, bolsas y capas en las 4 estaciones de forja (Forja del Guerrero, Cabaña del Cazador, Torre del Mago y Taller de Hojalatero).
  - Integración de bonos de producción por Ciudad Real (Fort Sterling, Lymhurst, Bridgewatch, Martlock, Thetford) y RRR oficial (15.2% base sin foco / 24.8% con bono; 43.5% con foco / 47.9% con bono + foco, y bonos de eventos diarios de Albion).
  - Cálculo automático de fama de crafteo ganada y diarios de trabajador llenados con precisión matemática.
  - Comparativa de estrategia de libros de crafteo: Venta directa del diario lleno en mercado vs entrega a trabajadores (Labourers) en tus islas/casas.
  - Desglose financiero completo: costes de materiales brutos, valor de materiales devueltos por RRR, tasa de nutrición de la estación, impuestos de venta de mercado, inversión en diarios vacíos, ganancia neta, ROI y Plata por Punto de Foco.

- [x] **14. Calculadora Integral de Refinado de Recursos Brutos (Mineral, Madera, Pieles, Fibra, Piedra)**
  - Tiers 2 a 8 y encantamientos (.0 a .4) con bonos de Ciudad Real (Fort Sterling para madera, Thetford para mineral, Lymhurst para fibra, Martlock para pieles, Bridgewatch para piedra).
  - Simulación exacta de RRR en cascada (hasta 53.9% de retorno), cálculo de materiales devueltos y consumo efectivo real.
  - Simulador de Tabla del Destino: FCE por maestría general y especializaciones de tier con reducción exponencial del foco y Plata/Foco generada.

- [x] **15. Taller de Encantamiento y Fusión de Equipo (.0 a .1, .2, .3, .4)**
  - Requisitos oficiales de Runas, Almas, Reliquias y Fragmentos Avalonianos por tipo de ranura (Armas 1H, 2H, Armaduras, Cascos, Botas, Mano Secundaria, Capas).
  - Comparativa directa lado a lado: "¿Conviene encantar tú mismo en taller vs comprar directo en mercado?".
  - Arbitraje de reventa de equipo encantado en subastas con desglose de tasas e impuestos.

- [x] **16. Libro Mayor de Ventas & Mercado Negro de Caerleon (Crafting & Sales Ledger)**
  - Registro auditable de lotes crafteados y entregados: trazabilidad de costes unitarios, ingresos brutos, tasas e impuestos netos.
  - Soporte discriminado para Mercado Negro de Caerleon (sin tasa de venta directa por orden de compra) y Ciudades Reales.
  - Filtros por destino, buscador dinámico y estadísticas acumuladas de volumen y ganancia neta.

- [x] **17. Simulador de Pedidos del Mercado Negro de Caerleon con Umbral de Ganancia Automático**
  - Cálculo de coste neto real de fabricación por unidad (materiales brutos, RRR local de ciudad de origen, devolución de recursos, tasa de nutrición y diarios de artesano).
  - Cálculo del Precio Umbral de Equilibrio (Break-Even) y Precio Objetivo para tu meta de ROI deseada (ej. +25%).
  - Soporte para órdenes de compra directa (Buy Order instantánea con 0% de impuestos de mercado) vs órdenes de venta (Sell Order con tasas de subasta y tarifa de orden).
  - Veredicto estratégico en tiempo real: Venta Inmediata Recomendada vs Esperar a que el tick del Mercado Negro suba el precio.
  - Integración directa con el Libro Mayor de Ventas (CraftingSalesLedger) para registrar operaciones con 1 solo clic.

- [x] **18. Taller de Transmutación y Arbitraje de Recursos Refinados, Brutos y Esquirlas**
  - Soporte completo para los 5 recursos en variantes Refinadas (Lingote, Cuero, Tela, Tablas, Bloques) y Brutas Recolectadas (Mineral, Piel, Fibra, Madera, Piedra).
  - Transmutación de Encantamiento (.0 -> .1, .2, .3, .4) y Transmutación de Tier (T4 -> T5 -> T6 -> T7 -> T8) con tablas oficiales de plata del sistema.
  - Fundidor de Artefactos: Transmutación de 5 Runas -> 1 Alma y 5 Almas -> 1 Reliquia con tarifa oficial.
  - Veredicto de arbitraje económico: Comparación de coste de base + plata del sistema vs compra directa en mercado o reventa con ROI.

- [x] **19. Detector & Auditor de Fugas de Plata (Silver Leak Detector)**
  - Auditoría integral de costes ocultos: Tasas abusivas de nutrición en talleres de ciudades, pérdida por compra de semillas sin retorno de foco, degradación de RRR por craftear fuera de la ciudad con bono.
  - Puntuación de Eficiencia Económica (0-100) y semáforo de riesgo con acciones correctivas recomendadas en un clic.

- [x] **20. Portafolio de Foco Multi-Actividad (Daily Focus Portfolio)**
  - Consolidación del imperio de foco en múltiples personajes (Alts) con monitoreo simultáneo de regeneración (10.000 pts/día).
  - Asignación porcentual de foco por actividad (Agricultura, Refinado, Crafteo de Equipo, Alquimia/Cocina).
  - Cálculo de Plata neta proyectada por cada punto gastado y cronómetro de prevención de tope (30.000 pts).

- [x] **21. Planificador de Logística de Almacén & Control de Carga (Warehouse Logistics)**
  - Inventario de almacén con pesos unitarios oficiales en kg de Albion Online.
  - Selector de monturas de transporte de alta capacidad (Bueyes, Mamut de Transporte, Oso Polar) + bonificaciones de Pastel de Cerdo (+30%) y bolsas.
  - Cálculo de viajes necesarios, alertas preventivas de sobrecarga crítica (200% inmovilidad) y optimización de lotes de transporte.

- [x] **22. Carnicería & Matadero de Animales (Butcher & Meat Yield Optimizer)**
  - Sacrificio de animales adultos T3 a T8 (Pollo, Cabra, Ganso, Oveja, Cerdo, Vaca) con base oficial de 20 u. de carne cruda.
  - Integración de bonos de Ciudad Real (Fort Sterling para pollo, Bridgewatch para cabra, Lymhurst para ganso, Martlock para vaca, Thetford para cerdo y Caerleon +15% RRR).
  - Comparativa triple: "¿Sacrificar en carnicería vs vender animal vivo en mercado vs mantener vivo para leche y huevos?".
  - Integración de nutrición de la estación de matanza, tasas de mercado y veredicto estratégico.

- [x] **23. Expansión de Isla del Gremio & Casa Gremial para Trabajadores (Guild Island & Guild Hall Labourers Optimizer)**
  - Expansión de Isla de Gremio Nivel 1 a Nivel 6 con costes oficiales en plata y hasta 14 solares estándar de construcción.
  - Construcción de Casa Gremial (Guild Hall) T2 a T8 para albergar hasta 15 trabajadores bajo un mismo techo (frente a 3 de una casa personal).
  - Equipamiento gremial: 15 camas, mesas gremiales y trofeos generales/específicos para maximizar felicidad (hasta 150% en recolectores o 125% en crafteo).
  - Cálculo de inversión inicial total, ganancia neta diaria/mensual y días exactos de amortización (Payback Period).

- [x] **24. Planificador de Envíos Masivos & Arbitraje de Riesgo a Caerleon (Red Zone Transport & Gank Risk Analyzer)**
  - Cálculo de ganancia neta en Caerleon / Mercado Negro vs coste de compra o fabricación en Ciudades Reales.
  - Clasificación de inventario por ratio Valor / Peso (Plata / kg) para optimizar el espacio de carga.
  - Capacidad efectiva de monturas oficiales de transporte con distinción crucial entre Courier (carga pasiva tras ser desmontado) y monturas normales.
  - Simulador de Valor Esperado (EV) y Umbral de Supervivencia de Equilibrio (Break-Even Survival Rate).
  - Evaluación de pérdida máxima ante emboscadas (Carga + Set de Escape + Montura) y alerta de gestión de banca (% de patrimonio en juego).
  - Generación de manifiesto exportable a CSV y sincronización en 1 clic con las tareas diarias.

- [x] **25. Sincronización en la Nube Multidispositivo & Despliegue en Vercel (Cloud Sync & Vercel Hosting)**
  - Infraestructura lista para despliegue global en Vercel con `vercel.json` (reescrituras SPA, cabeceras de caché inmutable de 1 año y compresión).
  - Guía oficial de despliegue paso a paso en `VERCEL_DEPLOYMENT_GUIDE.md` (repositorio GitHub en 2 clics o Vercel CLI).
  - Modelo de datos puro (`cloudSync.ts`) y motor de sincronización (`cloudSyncEngine.ts`) con resolución defensiva de conflictos y tolerancia a desconexión (Local-First a 0ms).
  - Componente modal `CloudSyncModal.tsx` integrado en la barra de navegación superior con estado de red en tiempo real (Online / Offline).
  - Buscador global y paleta de comandos Spotlight (`Ctrl+K` / `Cmd+K`) en `CommandPaletteModal.tsx` para navegar entre las 26 herramientas del sistema.
  - Hoja de ruta diaria imprimible y exportable en `DailyRoadmapPrintModal.tsx` para control físico de tareas y cosechas.

- [x] **26. Auditoría y Actualización Canónica de Recetas de Cocina y Alquimia (Licores y Destilados de Cultivos - 2ª Revisión Integral)**
  - Incorporación de licores destilados oficiales de Albion: Aguardiente de Patatas (T6), Licor de Maíz (T7) y Licor de Calabaza (T8) con ratio exacto 1:1 (10 cultivos por lote de 10).
  - Corrección canónica de Pasteles (Pies): Pastel de Cerdo T7 (72 Cerdo + 36 Harina + 18 Maíz + 18 Leche Oveja), Pastel de Ganso T5 (24 Ganso + 12 Harina + 6 Repollo + 6 Leche Cabra), Pastel de Pollo T3 (8 Pollo + 4 Harina + 2 Frijoles + 2 Huevos).
  - Corrección canónica de Tortillas (Omelettes): Tortilla de Pollo T3 (8 Pollo + 4 Trigo + 2 Huevos), Tortilla de Ganso T5 (24 Ganso + 12 Repollo + 6 Huevos Ganso), Tortilla de Cerdo T7 (72 Cerdo + 36 Maíz + 18 Huevos Ganso).
  - Normalización de Guisos (Stews): Pan/Trigo en lugar de repollo en Guiso de Cordero T6, Guiso de Cabra T4 y Guiso de Ternera T8.
  - Normalización de Sándwiches (Sandwiches): Cabra T4, Cordero T6, Ternera T8 y adición del prestigioso Sándwich Avaloniano de Ternera T8.
  - Normalización de Asados (Roasts): Asado de Cerdo T7 (72 Cerdo + 36 Maíz + 36 Leche Vaca), Asado de Ganso T5 y Asado de Pollo T3.
  - Catálogo completo de 22 pociones oficiales incluyendo Frasco Pegajoso Mayor T7, Invisibilidad T8, Venenos T6/T8 y pociones de rastreo con licores e ingredientes raros.
  - Incorporación de tareas oficiales de auditoría y revisión en la Lista de Cosas por Hacer (`DailyTodoList`).




