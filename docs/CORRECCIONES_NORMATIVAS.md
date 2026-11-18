# Bitácora y convenciones de cálculo — AislaLab v4 (edición exposición)

Esta edición reescribió la guía usando **las dos exposiciones del curso como única fuente** de ejemplos, fórmulas y cifras:

- **Expo 77** — `Coordinacion_Aislamiento_77_Portada_Actualizada.pdf` (77 diapositivas, 7 temas + cierre).
- **Sobretensiones 39** — `Aislamiento Fundamentos de sobretensiones (2)_compressed.pdf` (39 diapositivas).

Se retiraron del texto y de las fuentes las normas y la bibliografía externa (IEC 60060/60071/60099/60815, Cardona, Velasco, Martínez, documentos de la asignatura): donde las láminas citan esos orígenes, la guía atribuye el contenido a la exposición, no a la norma. Las cifras que las láminas no fijan se declaran como **adopción del curso** o **ilustrativas** en el punto de uso.

## 1. Qué cambió en esta edición

| Origen | Situación anterior | Corrección en v4 |
| --- | --- | --- |
| Fuentes | 16 fuentes (normas IEC y bibliografía externa). | 2 fuentes: las dos exposiciones. La bitácora histórica v2→v3 se reemplaza por este registro. |
| `e04` | Mezcla de fórmulas externas (α − η de Townsend, 31 kA/σ = 0,65 como mediana declarada). | Modelo 100 % de láminas: lognormales (negativas Ī = 29,96 kA, σ_ln = 0,65; positivas 35,16/1,23; p. 25), forma cerrada 1/(1 + (I/31)^2,6) (p. 26), r_c = 10·I^0,65 (Expo 77, p. 40), N_s = N_g·(28·h^0,6 + b)/10 (Expo 77, p. 35), N_g = 0,04·T_d^1,25 (p. 30), v = c/√(1 + W/I) (p. 31). |
| `e05` | Modelo de avalancha/Townsend y escena con corte δ incoherente. | Tres regímenes DC / AC / impulso (pp. 34–36), retardos t_s y t_f (p. 36), curva V–t cualitativa de la lámina 12 y clasificación por duración/frecuencia (pp. 5–6). |
| `e11` | Criterio NESC con factores 1,15 y 2,3 externos. | Solo la expresión del curso D ≈ K·√(F + L) + Vₙ/150 con K = 0,75 (Expo 77, pp. 25–26; da ≈ 4,02 m). |
| `e16` | Selección de descargador ZnO según IEC 60099-4/5 (U_c, U_r, TOV, 1,05/0,02, cap. 195). | Procedimiento IEC 71-1 de la lámina 17: NPR/NPM → K_i, K_m → BIL = K_i·NPR → BIL_n ≥ BIL → BSL = K·BIL_n (K = 0,83 aceite / 0,75 aire) → K_b = BSL/NPM ≥ K_m; si falla, se incrementa BIL_n. |
| `e18` | Proyecto integral con verificaciones de pararrayos ZnO y α ≤ 30° como criterio. | Cadena (fuga/maniobra, Expo 77 pp. 13–16), altitud δ (Sobretensiones p. 38), guarda α = arctan(Δx/Δh) con ejemplo 38,7° (p. 31), V_torre = R·i + L·di/dt (pp. 53–57) y niveles IEC 71-1 (Sobretensiones pp. 14–17). Los factores sin fuente en láminas (p. ej. 1,25/1,15/20 %, acoplamiento kc) se declaran como hipótesis adoptadas. |
| `e19` | Megóhmetro: DAR/PI, ley (1 + t/τ)^−1,2. | **Eliminado**: no aparece en ninguna exposición. Referencias actualizadas: diagnóstico d5 (ahora flujo IEC 71-1), glosario, mapa físico, temas, README y pruebas. |
| Fuentes normativas | Sección «Norma IEC» en tarjetas de fuentes. | Sin normas: todas las fichas son material del curso. |

## 2. Convenciones numéricas declaradas

1. **Unidades.** Frecuencia industrial en kV eficaces (RMS); impulsos en kV de cresta. 1,2/50 µs es voltaje; las ondas de corriente no se usan en esta edición (no aparecen en las láminas).
2. **Formato es-CO.** `fmt()` usa coma decimal, punto de miles y signo − tipográfico. No devuelve `NaN`: un valor no finito se muestra como `—`.
3. **Atmósfera.** `p(h) = 101,325·(1 − 2,25577·10⁻⁵·h)^5,25588` kPa; `δ = (p/p₀)·(T₀/T)` con `T₀ = 293,15 K` y T₀ C^0 = 20 °C (Sobretensiones, p. 38). Bogotá (2.640 m, 14 °C): p = 73,378 kPa, δ = 0,7393.
4. **CFO y discos.** N = 6,6485·10⁻⁶·CFO² + 7,9192·10⁻³·CFO + 0,4219 (Expo 77, p. 16); válida hasta 20 discos según la propia lámina. CFO = Usoporte/(1 − kσ), k = 1,30, σ = 0,06 (p. 15); CFO corregido por altitud = CFO/δ (p. 15, corrección del documento).
5. **Línea de fuga.** L_f = k_f·Uₘ con el coeficiente de la lámina 13 (k_f = 25 mm/kV, hipótesis entre fases del ejemplo); ⌈6.125/292⌉ = 21 discos → fuga real 6.132 mm; longitud 21 × 0,146 = 3,066 m.
6. **Impulso normalizado.** t₁ = 1,67·(t₉₀ − t₃₀) con origen virtual t₀; t₂ hasta la semiamplitud de la cola (Sobretensiones, p. 36). Con τ₁ = 0,41 µs y τ₂ = 66 µs: t₁ ≈ 1,2 µs, t₂ ≈ 48,5 µs.
7. **Disrupción U₅₀/CFO.** U_p = U₅₀ + z_p·σ, σ = (σ%/100)·U₅₀ (probabilidad normal, expo p. 8). Para U₅₀ = 700 kV, σ = 6 %, p = 10 %: U₁₀ ≈ 646,2 kV.
8. **EGM.** r_c = 10·I^0,65 (Expo 77, p. 40; I = 31 kA → 93,2 m); r_g = [3,6 + 1,7·ln(43 − yᶜ)]·I^0,65 si yᶜ < 40 m, si no 5,51·I^0,65 (p. 42); yᶜ = H − (2/3)f (p. 41).
9. **Ondas viajeras.** Z_c = √(L′/C′); v = 1/√(L′·C′); Γ = (Z₂ − Z₁)/(Z₂ + Z₁); τ = 2Z₂/(Z₂ + Z₁) (Expo 77, pp. 60–64). Ejemplo: 400 → 100 Ω, Γ = −0,6, τ = +0,4, V_t = 40 kV para V_i = 100 kV.
10. **Corona.** Peek P_cor = (242/δ)·(f + 25)·√(r/s)·(U − U₀)²·10⁻⁵ para U > U₀ (Expo 77, p. 58); ejemplo de la actividad 13: U = 150 kV, U₀ = 120 kV (dato del ejemplo, etiquetado como tal), f = 60 Hz, δ = 0,90, r = 1,5 cm, s = 600 cm → P_cor ≈ 10,29 kW/km por conductor (pp. 59–60). La incepción con E₀ = 21,1·δ·m es una **adopción del curso** (las láminas no fijan E₀).
11. **Constantes adoptadas.** Factores de la misión final que no figuran en las láminas (1,25 / 1,15 / 20 %, acoplamiento guarda–fase k_c = 0,25, índice K del flujo IEC según aceite/aire) se muestran siempre como hipótesis adoptadas o valores por defecto de catálogo-tipo, y nunca como cifras de las exposiciones.
12. **IEC 71-1 (flujo).** BIL = K_i·NPR; BIL_n ≥ BIL; BSL = K·BIL_n; K_b = BSL/NPM ≥ K_m; si K_b < K_m, incrementar BIL_n (Sobretensiones, pp. 14–17). K = 0,83 (aceite) / 0,75 (aire); K_M = 1,15; K_I = 1,2–1,4 (común 1,25; 1,4 si < 52 kV).

## 3. Anclas verificadas por pruebas

| Caso | Valor |
| --- | --- |
| `Uₘ = 245 kV` | `U_f = 141,45 kV` RMS; `Û_f = 200,04 kV` cresta |
| Maniobra `2,5 p.u. × 1,15` | `575,12 kV` |
| `CFO = 575,1/(1 − 1,3 × 0,06)` | `623,8 kV` → `N = 7,95` → 8 discos (gana fuga: 21) |
| Bogotá `2.640 m`, `14 °C` | `p = 73,378 kPa`, `δ = 0,7393` |
| `245 kV`, `k_f = 25 mm/kV` | `6.125 mm` → `⌈6125/292⌉ = 21` discos → `6.132 mm` → `3,066 m` |
| `U₅₀ = 700 kV`, `σ = 6 %`, `P = 10 %` | `646,17 kV` |
| Varilla `s = 3 m`, `r = 0,008 m`, `ρ = 100 Ω·m` | `R ≈ 35,1 Ω` (p. 49) |
| Contrapeso `s = 20 m`, `r = 0,005 m`, `d = 0,5 m`, `ρ = 100 Ω·m` | `R ≈ 7,94 Ω` |
| `Z₁ = 400 Ω`, `Z₂ = 100 Ω` | `Γ = −0,60`, `τ = 0,40`, `V_t = 40 kV` |
| Peek (actividad 13) | `10,29 kW/km` |

Las pruebas `src/lib/num.test.ts`, `src/app.render.test.tsx` y `src/app.dom.test.tsx` verifican estas anclas, los 18 simuladores con todos sus presets, la ausencia de `NaN`/errores en canvas y las interacciones DOM.

> Las cifras y modelos son modelos didácticos de las exposiciones: no sustituyen normas vigentes, catálogos ni estudios de diseño.
