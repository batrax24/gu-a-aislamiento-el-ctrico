# AislaLab · Guía interactiva de aislamiento eléctrico — edición exposición

**Edición exposición v4.0.0.** Una guía visual e interactiva de coordinación de aislamiento centrada en tu exposición: los **7 temas de la Expo 77** más los **fundamentos de sobretensiones (39 diapositivas)**, sobre **una misma línea real de 245 kV en Bogotá**: nube de tormenta, cable de guarda, cadena de discos, vano con viento, puesta a tierra, ondas viajeras, niveles IEC 71-1 y transformador. Todos los ejemplos numéricos provienen de las dos exposiciones.

En lugar de empezar con fórmulas sueltas, AislaLab nombra primero el objeto físico, permite mover sus variables y muestra después la ecuación con los números del caso.

---

## Contenido

| Bloque | Cantidad | Qué incluye |
| --- | ---: | --- |
| Temas | 11 | Introducción + sobretensiones + rayo + 7 temas de la exposición (01–07) + cierre IEC e integración |
| Etapas físicas | 4 | Sobretensiones y rayo → mecanismos y cadena → geometría y tierra en la torre → propagación, corona y cierre |
| Simuladores | 18 | `e01`–`e18`: escena canvas animada, gráfica SVG, controles, lecturas, ecuaciones, semáforos, reto, guía de aprendizaje y fuentes |
| Mapa físico | 10 puntos | Hotspots numerados y activables por teclado, con enlace al tema y a los simuladores relacionados |
| Glosario visual | 27 fichas | Símbolo, explicación en lenguaje llano, ejemplo numérico y enlace al banco donde se mueve |
| Diagnósticos | 8 casos | Situaciones de campo con explicación y simulador de origen |
| Banco numérico | Generado | Preguntas desde los presets reales, con tolerancia del 2 % y solución paso a paso |
| Fuentes | 2 | Las dos exposiciones del curso (Expo 77 y Sobretensiones 39) como única fuente de ejemplos y cifras |

### Mapa de la exposición

| Tema de la guía | Exposición | Simuladores |
| --- | --- | --- |
| T1 Introducción y coordinación | Expo 77 pp. 1–3 · Sobretensiones p. 2 (definición formal + tradeoff p. 13) | Mini-simulador balanza |
| T2 Sobretensiones: parámetros y clasificación | Sobretensiones pp. 3–12 | `e01`, `e02`, `e03` |
| T3 El rayo: fenómeno y caracterización | Sobretensiones pp. 18–33 | `e04` |
| T4 01 Mecanismos disruptivos | Expo 77 pp. 4–8 · Sobretensiones pp. 34–38 | `e05`, `e06`, `e07` |
| T5 02 Longitud de la cadena | Expo 77 pp. 9–17 | `e08`, `e09` |
| T6 03 Separaciones eléctricas | Expo 77 pp. 18–28 | `e10`, `e11` |
| T7 04 Cable de guarda | Expo 77 pp. 29–33 | `e12` |
| T8 05 Puesta a tierra | Expo 77 pp. 34–47 · Sobretensiones p. 32 | `e13`, `e14` |
| T9 06 Ondas viajeras | Expo 77 pp. 48–54 | `e15` |
| T10 07 Efecto corona | Expo 77 pp. 55–61 | `e17` |
| T11 Cierre: niveles IEC e integración | Expo 77 pp. 62–77 · Sobretensiones pp. 14–17 | `e16`, `e18` |

---

## Inicio rápido

Requiere **Node ≥ 20.19** (probado con Node 22).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas: números, render de los 18 bancos e interacciones DOM
npm run build      # tsc -b + Vite, salida en dist/
npm run preview    # vista previa de producción en :4173
```

El proyecto no depende de fuentes, imágenes, iconos ni APIs externas: todo se dibuja con canvas/SVG y el progreso se guarda en `localStorage`.

---

## Cómo se usa

1. **Inicio:** explora el mapa físico de la línea o entra por el Tema 1, que incluye una balanza «esfuerzo vs. soporte vs. pararrayos».
2. **Catálogo:** busca un fenómeno (`Bogotá`, `viento`, `pararrayos`, `corona`…) o filtra por etapa física.
3. **Tema:** lee el caso real y la analogía; abre los simuladores asociados.
4. **Simulador:** carga un preset, mueve controles, pausa/repite la escena, observa lecturas y gráfica, y cierra el reto. Los «requisitos» deben cumplirse en el estado actual; los «hitos» quedan registrados al alcanzarlos una vez.
5. **Simulacro:** 8 preguntas por ronda (5 cálculos + 3 diagnósticos), con soluciones que enlazan de vuelta al laboratorio.
6. **Fuentes:** consulta las dos exposiciones y la bitácora de esta edición.

Rutas por hash: `#/`, `#/catalogo`, `#/glosario`, `#/tema/1`…`#/tema/11`, `#/exp/e01`…`#/exp/e18`, `#/practica`, `#/fuentes`.

---

## Arquitectura

```
index.html
vite.config.ts            Vite + Vitest (jsdom), base './', host 0.0.0.0
src/
  main.tsx                Entrada React 19 + StrictMode
  App.tsx                 Rutas por hash, progreso, XP, export/import, topbar
  styles.css              Atlas de ingeniería diurno, responsive, sin recursos externos
  lib/
    num.ts                Modelos numéricos compartidos y anclas del curso
    draw.ts               Toolkit de ilustración física 2D para canvas
    storage.ts            Progreso v2 + copia de seguridad + migración LAB·CA v2
  content/
    topics.ts             11 temas, 4 etapas, mapa tema→experimentos (edición exposición)
    bibliography.ts       2 fuentes (las dos exposiciones del curso)
    glossary.ts           27 fichas visuales
    lineMap.ts            10 hotspots del panorama físico
    practica.ts           8 diagnósticos + banco numérico sembrado
  experiments/
    types.ts              Contrato de Experiment, Goal, Quiz, ParamDef…
    index.ts              Orden secuencial e01→e18 y vecinos
    common.tsx            Clasificación de frentes de onda
    defs/                 e01–e18 en 6 archivos temáticos
  components/
    Icons.tsx             Iconos vectoriales y emblema
    ui.tsx                Canvas, Plot, BarComparisonPlot, controles, lecturas…
    LineMap.tsx           Panorama SVG interactivo
    Home.tsx              Hero, blueprint, mapa, progreso, currículo
    CatalogView.tsx       Catálogo con búsqueda y filtros
    TopicView.tsx         Ficha de tema + mini-simulador del Tema 1
    ExperimentView.tsx    Bancada completa de cada simulador
    GlossaryView.tsx      Diccionario visual
    PracticeView.tsx      Simulacro de sustentación
    SourcesView.tsx       Fuentes y bitácora de correcciones
    ErrorBoundary.tsx     Pantalla de recuperación
  test/setup.ts           Stub de canvas, rAF y matchMedia para jsdom
  *.test.ts / *.test.tsx  Pruebas
docs/
  CORRECCIONES_NORMATIVAS.md  Bitácora detallada y convenciones de cálculo
  EXPOSICION_MAPA.md            Mapa exposición → temas → simuladores
```

---

## Anclas numéricas verificadas

| Caso | Resultado |
| --- | --- |
| `Uₘ = 245 kV` | `U_f = 141,45 kV` RMS · `Û_f = 200,04 kV` cresta |
| Maniobra `2,5 p.u. × 1,15` | `575,12 kV` |
| `τ₁ = 0,41 µs`, `τ₂ = 66 µs` | `1,2/48,5 µs` · `t_p ≈ 2,1 µs` |
| Bogotá 2.640 m, 14 °C | `p = 73,378 kPa` · `δ = 0,7393` · `700·δ^0,75 = 558,11 kV` |
| `245 kV`, `k_f = 25 mm/kV` | `6.125 mm` · 21 discos · `3,066 m` |
| `U₅₀ = 700 kV`, `σ = 6 %`, `P = 10 %` | `646,17 kV` |
| Varilla `s = 3 m`, `r = 0,008 m`, `ρ = 100 Ω·m` | `R ≈ 35,1 Ω` |
| `Z₁ = 400 Ω`, `Z₂ = 100 Ω` | `Γ = −0,60` · `τ = 0,40` |
| IEC 71-1 (lámina 17) | `BIL = K_i·NPR` → `BIL_n ≥ BIL` → `BSL = K·BIL_n` → `K_b = BSL/NPM ≥ K_m` |
| Peek `U = 150`, `U₀ = 120` | `10,29 kW/km` |

---

## Progreso y despliegue

- Clave actual: `aislalab.progress`; copia: `aislalab.progress.backup`; migración desde `labca.v2.progress`.
- Visitar un simulador nuevo suma 5 XP; cerrar un reto por primera vez suma 20 XP. Las estrellas dependen de intentos fallidos y uso de pista.
- Exportar/importar avance en JSON; reiniciar con confirmación. En modo privado o iframe restringido la app sigue funcionando en memoria.
- `vite.config.ts` usa `base: './'`, `host: 0.0.0.0` y `allowedHosts: true` para previsualizaciones y GitHub Pages.
- `.github/workflows/deploy.yml` ejecuta `npm ci`, `npm test`, `npm run build` y publica `dist/` en Pages.

> Las cifras y modelos son didácticos y están acotados en cada simulador. Para un proyecto real se consultan las normas vigentes, catálogos de fabricante y estudios de coordinación de aislamiento.
