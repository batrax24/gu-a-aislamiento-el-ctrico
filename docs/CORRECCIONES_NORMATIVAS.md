# Bitácora de correcciones y convenciones normativas — AislaLab v3

Este registro documenta qué se corrigió respecto a la versión 2 del laboratorio y qué convención se usa en cada cálculo. Es una bitácora didáctica: **no sustituye la consulta de normas, catálogos de fabricante ni estudios de diseño**.

## 1. Correcciones funcionales y de modelo

| Origen | Situación en v2 | Corrección aplicada en v3 |
| --- | --- | --- |
| Navegación | El botón «Siguiente» saltaba 7 simuladores al cambiar de tema (`e02`, `e03`, `e06`, `e09`, `e11`, `e14`, `e19`). | `src/experiments/index.ts` fija el orden secuencial `e01 → e19`; `experimentNeighbors()` entrega vecinos estrictos. |
| Miga de pan | La ruta del tema volvía siempre al Tema 1. | Las rutas `#/tema/:id` y `#/exp/:id` tienen un botón «Inicio» que lleva a `#/`. |
| `e02` | El caso de 500 kV con `Uₘ = 550 kV` quedaba limitado por un deslizador que llegaba a 420 kV. | El rango de `Uₘ` llega a 550 kV y las pruebas verifican que todo preset cae dentro de `[mín, máx]`. |
| `e05` | La escena y la nota contradecían el cálculo al bajar `δ`. | `U₀`, la tensión aplicada, el estado físico y la lectura usan el mismo `compute()`. |
| `e07` | La torre bajaba al aumentar la altitud. | La torre sube por la ladera; se muestran cota, presión `p`, densidad `δ` y moléculas de aire. |
| `e09` | El CFO corregido se etiquetaba como «nivel del mar» y se dividía por `δ` dos veces. | `cfoRequired()` aplica una sola corrección por altitud; las etiquetas distinguen `CFO_mar` de `CFO_sitio`. |
| `e10` | La cadena se alejaba de la torre con viento. | La cadena se mece **hacia** el acero y `d_h = d₀ − L·sen θ` se reduce; se añadió un hito de falla con 28°. |
| `e11` | Faltaba separar claramente fórmula empírica y criterio NESC corregido por altitud. | El banco muestra `D ≈ K√(F+L) + Vₙ/150` y el claro NESC `3 + 0,2(V/δ − 8,7)` pulgadas, convirtiendo con `0,0254 × 1,15 × 2,3`. Se declara que es predimensionamiento. |
| `e12` | No se dibujaban arcos electrogeométricos a escala. | La escena diferencia intercepción por guarda/torre de falla de apantallamiento usando `r_c = 10·I^0,65` y `α_crítico`. |
| `e13` | La estacionalidad del suelo no se relacionaba con el flameo inverso. | El banco declara época seca/húmeda, paralelo de varillas `R₁/n^0,78` y contrapesos; el diagnóstico `d7` usa la condición crítica. |
| `e15` | `z2` tenía mínimo 5 Ω (impidía el cortocircuito `Z₂ = 0`) y se graficaba `|Γ|`, ocultando la inversión. | `Γ = (Z₂ − Z₁)/(Z₂ + Z₁)` conserva su signo; `Z₂ = 0` es reachable; la gráfica Bewley muestra reflexiones positivas y negativas. Se declara `v ≤ c`. |
| `e16` | El BIL se mostraba con una expresión duplicada en el estado en vivo. | El mensaje usa `p.bil` directamente. Las 4 verificaciones son `U_c`, TOV, `U_r` y margen con `U_equipo = U_res + L_c·d·di/dt`. |
| `e17` | El umbral de corona se tomaba como dato fijo. | `U₀ = E₀·r_eq·ln(s/r_eq)` se calcula con `E₀ = 21,1·δ·m`, y `r_eq` se calcula para haces de 1–4 subconductores. |
| `e18` | Se comprobaba `d.margin` en vez de `d.marginOk`, se comparaba contra `1400 kV` fijo y se dibujaban líneas inclinadas en vez de barras. | Se usan las seis banderas `chain, guard, ground, uc, tov, marginOk`; la comparación usa `p.cfo` y `BarComparisonPlot` dibuja pares esfuerzo vs. soporte. |
| `e19` | La absorción se escribía como exponencial y la gráfica mostraba un eje `0..5` en bruto. | Se usa `(1 + t/τ)^−1,2`; la gráfica es logarítmica en MΩ con marcadores de 30 s, 60 s y 600 s. Humedad > 80 % se declara «ensayo no concluyente». |

## 2. Correcciones de interfaz y accesibilidad

- El catálogo y el glosario tienen búsqueda, filtros por etapa/familia y estado pendiente.
- El mapa físico usa 10 puntos numerados con `role="button"`, `tabIndex`, `aria-label` y activación por teclado.
- Todas las escenas canvas incluyen pausa y repetición; las gráficas SVG incluyen leyenda, referencias, bandas y `caption`.
- El progreso se guarda en `localStorage` con copia de seguridad y migración desde `labca.v2.progress`. Exportar/importar usa JSON; reiniciar pide confirmación dentro de la interfaz.
- `ErrorBoundary` evita que una vista rota deje la página en blanco.

## 3. Convenciones numéricas declaradas

1. **Unidades.** Frecuencia industrial en kV eficaces (RMS); impulsos de rayo y maniobra en kV de cresta. `1,2/50 µs` es voltaje; `8/20 µs` es corriente.
2. **Formato es-CO.** `fmt()` usa coma decimal, punto de miles y signo `−` tipográfico. No devuelve `NaN`: un valor no finito se muestra como `—`.
3. **Atmósfera.** `p(h) = 101,325·(1 − 2,25577·10⁻⁵·h)^5,25588` kPa; `δ = (p/p₀)·(T₀/T)` con `T₀ = 293,15 K`. Para Bogotá se usa `h = 2.640 m`, `T = 14 °C`.
4. **Corrección externa.** `U_h = U_ref·δ^0,75` se aplica una sola vez a tensiones soportadas por aire externo.
5. **Disrupción.** `U_p = U₅₀ + z_p·σ`, con `σ = (σ%/100)·U₅₀` y `z_p` del cuantil normal de Acklam. `U₅₀ = 700 kV`, `σ = 6 %`, `p = 10 %` da `646,2 kV`.
6. **Línea de fuga.** `L_f = k_f·Uₘ / (k_a·base)`, donde `base = 1` entre fases y `base = √3` si el coeficiente está referido a fase–tierra. Cambiar de base cambia el resultado en `√3`; se declara en `e08`.
7. **CFO y discos.** El ajuste cuadrático de Cardona se usa en ambos sentidos y se corrige por altitud una sola vez en `e09`.
8. **NESC simplificado.** `3 + 0,2·(V/δ − 8,7)` pulgadas, multiplicado por `0,0254 m/pulg`, `1,15` y `2,3` para claro fase–fase. Es un predimensionamiento didáctico.
9. **EGM.** `r_c = 10·I^0,65` (m, I en kA). El ángulo de apantallamiento describe geometría, no certifica desempeño por sí solo.
10. **Ondas viajeras.** `Γ = (Z₂ − Z₁)/(Z₂ + Z₁)`, `τ = 2Z₂/(Z₂ + Z₁) = 1 + Γ`. El abierto ideal `Γ = +1` es el límite `Z₂ → ∞`, no `Z₂ = 2.000 Ω`.
11. **ZnO.** `U_c`, TOV equivalente, `U_r`, `U_res` y margen `M = (BIL/U_equipo − 1)·100 %`. La caída inductiva de conexiones se suma a `U_res`.
12. **Corona.** `E₀ = 21,1·δ·m` kV/cm eficaces; `U₀ = E₀·r_eq·ln(s/r_eq)`; Peek `P ∝ (U − U₀)²`. El haz aumenta `r_eq` y eleva `U₀`.
13. **Megóhmetro.** `R(t)` usa absorción en ley de potencia; `DAR = R₆₀/R₃₀`, `PI = R₆₀₀/R₆₀`; temperatura `2^((T−20)/10)`; humedad alta invalida la lectura superficial.

## 4. Anclas verificadas por pruebas

| Caso | Valor |
| --- | --- |
| `Uₘ = 245 kV` | `U_f = 141,45 kV` RMS; `Û_f = 200,04 kV` cresta |
| Maniobra `2,5 p.u. × 1,15` | `575,12 kV` |
| `τ₁ = 0,41 µs`, `τ₂ = 66 µs` | `t₁ ≈ 1,21 µs`, `t₂ ≈ 48,5 µs`, `t_p ≈ 2,1 µs` |
| Bogotá | `p = 73,378 kPa`, `δ = 0,7393`, `700·δ^0,75 = 558,11 kV` |
| `245 kV`, `k_f = 25`, 21 discos | `6.125 mm`, `3,066 m` |
| `U₅₀ = 700 kV`, `σ = 6 %`, `P = 10 %` | `646,17 kV` |
| Varilla 3 m, `ρ = 300 Ω·m` | `101,81 Ω` |
| `Z₁ = 400 Ω`, `Z₂ = 100 Ω` | `Γ = −0,60`, `τ = 0,40`, `V_t = 40 kV` para `V_i = 100 kV` |
| `Z₁ = 400 Ω`, `Z₂ = 2.000 Ω` | `Γ = 0,667`, `τ = 1,667`, `V_t = 166,7 kV` |
| ZnO `U_res = 600 kV`, `BIL = 1.050 kV`, `d = 12 m` | `U_equipo = 660 kV`, `M = 59,1 %` |
| Peek `U = 150`, `U₀ = 120`, `r = 1,5 cm`, `s = 60 cm`, `δ = 0,9`, `f = 60 Hz` | `10,29 kW/km` |

Las pruebas `src/lib/num.test.ts`, `src/app.render.test.tsx` y `src/app.dom.test.tsx` verifican estas anclas, los 19 simuladores con todos sus presets, la ausencia de `NaN`/errores en canvas y las interacciones DOM.
