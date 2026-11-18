# Mapa de la exposición → guía interactiva

Esta guía está centrada en dos documentos de exposición:

- **Expo 77** — `Coordinacion_Aislamiento_77_Portada_Actualizada.pdf` (77 diapositivas, 7 temas + cierre).
- **Sobretensiones 39** — `Aislamiento Fundamentos de sobretensiones (2)_compressed.pdf` (39 diapositivas).

## 1. Expo 77: los 7 temas

| Tema Expo 77 | Pregunta de ingeniería | Tema en la guía | Simuladores |
| --- | --- | --- | --- |
| 01 Mecanismos disruptivos (pp. 4–8) | ¿Cómo falla un material aislante? | T4 | `e05` ruptura DC/AC/impulso, `e06` U₅₀, `e07` atmósfera δ |
| 02 Longitud de la cadena (pp. 9–17) | ¿Cuánto aislamiento superficial se necesita? | T5 | `e08` fuga 21 discos, `e09` maniobra/CFO |
| 03 Separaciones eléctricas (pp. 18–28) | ¿Qué espacio debe conservar la línea? | T6 | `e10` viento, `e11` fase–fase |
| 04 Cable de guarda (pp. 29–33) | ¿Cómo interceptamos el rayo? | T7 | `e12` α y EGM |
| 05 Puesta a tierra (pp. 34–47) | ¿Cómo circula la corriente hacia el suelo? | T8 | `e13` varillas, `e14` flameo inverso |
| 06 Ondas viajeras (pp. 48–54) | ¿Qué ocurre al cambiar de impedancia? | T9 | `e15` Γ/τ |
| 07 Efecto corona (pp. 55–61) | ¿Por qué se ioniza el aire y qué pérdidas causa? | T10 | `e17` Peek |
| Cierre (pp. 62–77) | ¿Qué conecta los siete bloques? | T11 | `e16` flujo IEC 71-1, `e18` misión final |

## 2. Sobretensiones 39: fundamentos

| Bloque | Diapositivas | Tema en la guía | Simuladores |
| --- | --- | --- | --- |
| Importancia y definición formal | p. 2 | T1 | Mini-simulador balanza |
| Sobretensiones: parámetros | pp. 3–4 | T2 | `e01`, `e02` |
| Clasificación por duración | p. 5 | T2 | `e01` |
| Clasificación por frecuencia | p. 6 | T2 | `e01` |
| Ejemplos (Ferranti, maniobra, falla a tierra) | pp. 8–11 | T2 | `e01`, `e02` |
| Tradeoff E_aplicado vs. E_max/K_s | p. 13 | T1, T11 | `e01` |
| BIL/BSL/K, NPM/NPR, K_M/K_I (IEC 71-1) | pp. 14–17 | T11 | `e16` flujo del diagrama |
| Fenómeno del rayo: 4 tipos y fases I–IV | pp. 18–23 | T3 | `e04` |
| Rampa y característico estadístico (α, I) | pp. 24–29 | T3 | `e04` |
| N_g y velocidad de retorno | pp. 30–31 | T3 | `e04` |
| Efecto en líneas (directo, flameo inverso, inducidas) | pp. 32–33 | T3, T8 | `e04`, `e14` |
| Ruptura en gases DC/AC/impulso (t_s, t_f) | pp. 34–36 | T4 | `e05` |
| Probabilidad de disrupción U₅₀/CFO | p. 37 | T4 | `e06` |
| Atmósfera δ y altitud (T₀, B₀) | p. 38 | T4 | `e07` |

## 3. Errores frecuentes de la exposición (p. 74)

La guía los convierte en diagnósticos del simulacro:

- **21 discos** solo satisfacen la fuga del ejemplo, no todos los soportes → `e08`/`e09`.
- **38,7°** es un ángulo geométrico, no garantía de apantallamiento → `e12`.
- **25 Ω** no certifica seguridad ni respuesta impulsiva universal → `e13`.
- **U₅₀** es 50 % de disrupción, no un umbral sin fallas → `e06`.
- **Peek** es estimación empírica con condiciones y unidades → `e17`.
- El **megóhmetro** no aparece en las exposiciones; esta edición no lo usa → (retirado de `e19`).

## 4. Pregunta de discusión (p. 77)

> ¿Qué criterio controla el diseño cuando las exigencias se contradicen?

Se responde en la misión final `e18`: cadena, altitud/δ, guarda, tierra y niveles IEC deben estar en verde a la vez; un solo criterio en rojo invalida el diseño.
