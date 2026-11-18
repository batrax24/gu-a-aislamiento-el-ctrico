import type { SourceKey } from './bibliography';

export type StageId = 'sobretensiones' | 'mecanismos' | 'torre' | 'propagacion';

export type Stage = {
  id: StageId;
  step: number;
  title: string;
  subtitle: string;
  color: 'surge' | 'phase' | 'porcelain' | 'guard';
  topicIds: number[];
};

export const STAGES: Stage[] = [
  {
    id: 'sobretensiones',
    step: 1,
    title: 'Sobretensiones y rayo',
    subtitle: '¿Qué picos atacan la línea y cómo se caracteriza el rayo?',
    color: 'surge',
    topicIds: [1, 2, 3],
  },
  {
    id: 'mecanismos',
    step: 2,
    title: 'Mecanismos y cadena',
    subtitle: '¿Cómo falla el dieléctrico y cuántos discos necesita la cadena?',
    color: 'phase',
    topicIds: [4, 5],
  },
  {
    id: 'torre',
    step: 3,
    title: 'Geometría y tierra en la torre',
    subtitle: '¿Cuánto separar, dónde poner la guarda y cómo evacuar la corriente?',
    color: 'porcelain',
    topicIds: [6, 7, 8],
  },
  {
    id: 'propagacion',
    step: 4,
    title: 'Propagación, corona y cierre',
    subtitle: '¿Cómo viajan las ondas, por qué zumba el conductor y cómo se integra todo?',
    color: 'guard',
    topicIds: [9, 10, 11],
  },
];

export type TopicIcon =
  | 'balance'
  | 'wave'
  | 'lightning'
  | 'spark'
  | 'mountain'
  | 'insulator'
  | 'wind'
  | 'shield'
  | 'ground'
  | 'bounce'
  | 'arrester'
  | 'corona'
  | 'check';

export type Topic = {
  id: number;
  stage: StageId;
  icon: TopicIcon;
  title: string;
  question: string;
  whereOnLine: string;
  minutes: string;
  slides: string;
  idea: string;
  realWorld: string;
  keys: string[];
  experiments: string[];
  sources: SourceKey[];
};

export const TOPICS: Topic[] = [
  {
    id: 1,
    stage: 'sobretensiones',
    icon: 'balance',
    title: 'Introducción y coordinación de aislamiento',
    question: '¿Qué significa coordinar el aislamiento y qué tradeoff se resuelve al diseñar?',
    whereOnLine: 'Todo el sistema: línea + subestación',
    minutes: '0–10 min',
    slides: 'Expo 77: 1–3 · Sobretensiones: 2',
    idea: 'Coordinar el aislamiento es seleccionar la tensión soportada normalizada de los equipos teniendo en cuenta las sobretensiones que pueden aparecer, los medios de protección y las condiciones ambientales, para obtener un riesgo de fallo aceptable. En el diseño hay un tradeoff entre el campo aplicado E_aplicado, la rigidez E_max y el factor de seguridad K_s: se calcula la solicitación máxima, se verifica E_aplicado ≤ E_max / K_s y se ajusta la geometría al menor costo.',
    realWorld:
      'Es como diseñar el puente de una carretera: calculas el camión más pesado probable (esfuerzo), eliges vigas que lo aguanten con holgura (soporte) y pones un control de peso a la entrada (pararrayos) para que ningún exceso lo rompa.',
    keys: [
      'Definición formal (Sobretensiones, p. 2): tensión soportada normalizada + sobretensiones + protección + ambiente → riesgo aceptable.',
      'Tradeoff (Sobretensiones, p. 13): E_aplicado vs. E_max / K_s. Si el campo aplicado supera la rigidez dividida por el factor de seguridad, se redimensionan distancias o espesores.',
      'Idea clave de la exposición (Expo 77, p. 3): coordinar es comparar esfuerzos esperados con la capacidad real de soporte y protección.',
      'Proceso iterativo: si cambias el pararrayos o subes la línea a Bogotá, debes volver a revisar cadenas y distancias.',
    ],
    experiments: [],
    sources: ['expo39', 'expo77', 'iec60071'],
  },
  {
    id: 2,
    stage: 'sobretensiones',
    icon: 'wave',
    title: 'Sobretensiones: parámetros y clasificación',
    question: '¿En qué se diferencian un rayo, una maniobra de interruptor y una falla a tierra?',
    whereOnLine: 'Conductores de fase y laboratorio de AT',
    minutes: '10–25 min',
    slides: 'Sobretensiones: 3–12',
    idea: 'Una sobretensión es cualquier tensión dependiente del tiempo cuya amplitud pico supera la tensión máxima de operación continua. No basta saber cuántos kilovoltios alcanza: importan la tensión nominal, su pico, el valor por unidad (p.u.), la frecuencia y la duración de las oscilaciones. Por eso cada familia tiene su propia onda de prueba en laboratorio.',
    realWorld:
      'Un martillazo seco (rayo, microsegundos), un empujón brusco (abrir/cerrar un interruptor, milisegundos) y un peso sostenido (falla a tierra, segundos) pueden tener la misma fuerza máxima, pero exigen de forma distinta al material.',
    keys: [
      'Parámetros (Sobretensiones, pp. 3–4): tensión nominal, tensión nominal pico, tensión por unidad, frecuencia y duración de las oscilaciones.',
      'Por duración (p. 5): temporales (ms a segundos, frecuencia de red) · frente lento por maniobras (pocos ms, 2–20 kHz) · frente rápido por rayo (muy corta, amplitud muy superior) · frente muy rápido por SF₆ (pocos µs, > 1 MHz).',
      'Por frecuencia (p. 6): baja frecuencia / temporal (frecuencia industrial) · transitoria (ms, muy amortiguada) · frente lento (20–5000 µs) · frente rápido (0,1–20 µs, unidireccional) · frente muy rápido (< 0,1 µs, hasta 100 MHz).',
      'Ejemplos (pp. 8–11): efecto Ferranti, maniobra y falla a tierra con desplazamiento de neutro (neutro rígido o no rígido a tierra).',
      'Regla de oro de unidades: frecuencia industrial en kV eficaces (RMS); impulsos de rayo y maniobra en kV de cresta (pico).',
    ],
    experiments: ['e01', 'e02', 'e03'],
    sources: ['expo39', 'expo77', 'iec60060'],
  },
  {
    id: 3,
    stage: 'sobretensiones',
    icon: 'lightning',
    title: 'El rayo: fenómeno y caracterización estadística',
    question: '¿Cómo ocurre un rayo, qué tipos hay y por qué no se diseña para «el peor rayo imaginable»?',
    whereOnLine: 'Nube, cable de guarda, torre y fases',
    minutes: '25–40 min',
    slides: 'Sobretensiones: 18–33',
    idea: 'El rayo es una fuente de corriente de polaridad positiva, negativa o bipolar. Se han caracterizado 4 tipos: las descargas negativas forman el 90 % de las que caen a tierra; menos del 10 % son positivas; las categorías 2 y 4 van de tierra a nube y son muy escasas. A diferencia del Ferranti o una falla a tierra (determinísticos), el rayo es puramente probabilístico: no se diseña para 400 kA, sino para un riesgo aceptable con herramientas estadísticas.',
    realWorld:
      'Un rayo puede caer directo en el cable con energía (falla de apantallamiento), caer en el suelo vecino e inducir un pulso, o caer en la torre y elevar tanto el voltaje del acero que la chispa salta «al revés» desde la torre hacia el cable (flameo inverso).',
    keys: [
      'Fases (pp. 19–23): I líder escalonado desde la nube · II trazador ascendente desde objetos puntiagudos (guarda, torres, árboles) · III primera descarga de retorno (30 kA típico, 1/3–1/2 c, ~70 µs) · IV descargas subsiguientes (promedio 4 por rayo, hasta 26, 20–40 ms después).',
      'Característico estadístico (p. 25): polaridad negativa α = 0,65, I = 29,96 kA · polaridad positiva α = 1,23, I = 35,16 kA. Aproximación por rampa (p. 24).',
      'Densidad de descargas N_g (p. 30): 0–20 rayos/km²·año; mapas con promedio de al menos 5 años; sin red de localización se estima con días de tormenta T_d (nivel ceráunico).',
      'Velocidad de retorno (p. 31): las tensiones inducidas por rayos cercanos dependen de la corriente pico I y de la velocidad de retorno v.',
      'Efectos en líneas (pp. 32–33): impacto directo en fase V = ½·Z_c·I (supera el BIL) · impacto en torre/guarda con flameo inverso (backflashover) si R_pt es elevada · sobretensiones inducidas por impactos cercanos.',
    ],
    experiments: ['e04'],
    sources: ['expo39', 'expo77', 'velasco'],
  },
  {
    id: 4,
    stage: 'mecanismos',
    icon: 'spark',
    title: '01 · Mecanismos disruptivos',
    question: '¿Cómo falla un material aislante en sólidos, líquidos y compuestos?',
    whereOnLine: 'Espacio de aire, porcelana, aceite e interfaces',
    minutes: '40–55 min',
    slides: 'Expo 77: 4–8 · Sobretensiones: 34–38',
    idea: 'La disrupción sucede cuando se supera la capacidad aislante local. En sólidos: cavidades, grietas, humedad y contaminación → descargas parciales → erosión → perforación. En líquidos: partículas, agua y burbujas → campo local → trayectoria de descarga. En compuestos: dos o más materiales, interfaz papel–aceite, reparto del campo entre medios diferentes. La trayectoria determina el daño: descarga parcial, perforación, contorneo o arco en aire.',
    realWorld:
      'Es como una bola de nieve bajando una ladera: necesita suficiente pendiente (campo eléctrico) y suficiente recorrido (distancia). Si llega a ~100 millones de electrones (10⁸), abre un canal luminoso y salta el arco.',
    keys: [
      'Sólidos / líquidos / compuestos (Expo 77, pp. 5–6): el defecto crea una zona donde el campo es diferente; importan geometría, humedad, campo local y duración del esfuerzo.',
      'Cuatro caminos (p. 7): descarga parcial (localizada, no puentea) · perforación (atraviesa) · contorneo (recorre superficie contaminada) · arco en aire (canal conductor entre electrodos).',
      'Ruptura en gases (Sobretensiones, pp. 34–36): DC (carga espacial estacionaria) · AC (iones oscilando, no cruzan) · impulso 1,2/50 y 250/2500 µs (retardos estadístico t_s y formativo t_f).',
      'Probabilidad (p. 37 y Expo 77, p. 8): U₅₀ / CFO es la tensión con 50 % de probabilidad de flameo. Caso didáctico: U₅₀ = 700 kV, σ = 6 % → U₁₀ ≈ 646,2 kV. U₅₀ no es un umbral garantizado.',
      'Atmósfera (p. 38): rigidez del aire según presión b (kPa) y temperatura T (°C), con T₀ = 20 °C (293,1 K) y B₀ = 101,3 kPa. Densidad relativa δ: en Bogotá δ ≈ 0,74.',
    ],
    experiments: ['e05', 'e06', 'e07'],
    sources: ['expo77', 'expo39', 'velasco', 'iec60071'],
  },
  {
    id: 5,
    stage: 'mecanismos',
    icon: 'insulator',
    title: '02 · Longitud de la cadena de aisladores',
    question: '¿Cuánto aislamiento superficial se necesita y cuántos discos son necesarios?',
    whereOnLine: 'Cadenas de suspensión y amarre en crucetas',
    minutes: '55–70 min',
    slides: 'Expo 77: 9–17',
    idea: 'La cadena tiene dos funciones simultáneas: eléctrica (separar la fase energizada de la estructura puesta a tierra) y mecánica (transmitir peso y esfuerzos). Distancia de fuga ≠ longitud física ≠ arco en seco. La contaminación exige más camino superficial; la maniobra exige un CFO mínimo. La cantidad final satisface todos los criterios a la vez: fuga, maniobra, rayo, mecánica y ambiente.',
    realWorld:
      'Los discos tienen faldones ondulados por debajo para alargar el camino que debe recorrer el agua sucia o la sal marina: una cadena de 3 m de largo puede tener más de 6 m de recorrido superficial (línea de fuga).',
    keys: [
      'Tres magnitudes (p. 11): distancia de fuga (superficie y faldones, ligada a contaminación) · arco en seco (aire entre extremos) · longitud física (paso y herrajes). Ninguna sustituye a otra.',
      'Ejercicio 245 kV → 21 discos (p. 13): fuga requerida 25 mm/kV × 245 kV = 6.125 mm · N = ⌈6.125 / 292⌉ = 21 discos · fuga real 21 × 292 = 6.132 mm · longitud 21 × 0,146 = 3,066 m (sin herrajes).',
      'Maniobra (pp. 14–16): V̂_fase = 200,04 kV · U_máx = 2,5 p.u. × 200,04 = 500,1 kV · U_soporte = 1,15 × 500,1 = 575,1 kV · CFO = 575,1 / (1 − 1,30 × 0,06) = 623,8 kV pico (P = 10 %) · N = 6,6485×10⁻⁶·CFO² + 7,9192×10⁻³·CFO + 0,4219 = 7,95 → 8 discos (válida hasta 20). Gana contaminación: 21 discos.',
      'Criterios simultáneos (p. 17): fuga, maniobra, rayo, mecánica y ambiente. La selección final satisface todas las comprobaciones.',
    ],
    experiments: ['e08', 'e09'],
    sources: ['expo77', 'cardona', 'iec60815'],
  },
  {
    id: 6,
    stage: 'torre',
    icon: 'wind',
    title: '03 · Separaciones eléctricas',
    question: '¿Qué espacio debe conservar la línea entre conductores y estructura?',
    whereOnLine: 'Ventana de torre y mitad del vano entre torres',
    minutes: '70–85 min',
    slides: 'Expo 77: 18–28',
    idea: 'El diseño debe considerar tensión, sobretensiones, flecha, longitud de la cadena y viento. Hay dos distancias distintas: conductor–estructura (tensión a tierra, impulso y movimiento de la cadena) y conductor–conductor (tensión entre fases, flecha máxima y oscilación del vano). La separación debe ser suficiente en todas las condiciones de operación previstas.',
    realWorld:
      'Una cadena de 3 m parece lejana de la torre en un día calmado (3,5 m), pero si un vendaval la inclina 30°, el cable se acerca 1,5 m al acero aterrizado y puede saltar un arco sin que nadie toque nada.',
    keys: [
      'Conductor–estructura NESC (p. 20): D = 3 + 0,2·(V_max − 8,7) [pulgadas]. Ejemplo V_max = 245 kV → D ≈ 1,28 m. Expresión histórica bibliográfica; corregir V_max por altitud (÷ δ) y verificar con impulsos.',
      'Relación con BIL (p. 21): BIL base 850 kV → corregido 1.050 kV a 1.750 m → D mínima 1,90 m → D diseño 1,90 × 1,15 ≈ 2,19 m. BIL ≠ tensión nominal.',
      'Comparación (p. 22): NESC sin altitud ≈ 1,28 m vs. BIL + 15 % ≈ 2,19 m. No basta escoger la menor: verificar TODOS los requisitos aplicables.',
      'Viento (pp. 23–24): L = 3,066 m, θ = 30°, d₀ = 3,50 m → Δx = L·senθ = 1,533 m → d = 1,967 m < 2,42 m requerido → NO CUMPLE. d(θ) = 3,50 − 3,066·senθ.',
      'Fase–fase (pp. 25–26): D = K·√(F + L) + V_n/150. Ejemplo K = 0,75, F = 8 m, L = 3 m, V_n = 230 kV → D ≈ 4,02 m (estimación preliminar). Vertical 6,0 m según Código de Redes citado; horizontal/vertical/triangular no son equivalentes.',
    ],
    experiments: ['e10', 'e11'],
    sources: ['expo77', 'cardona', 'velasco'],
  },
  {
    id: 7,
    stage: 'torre',
    icon: 'shield',
    title: '04 · Ubicación del cable de guarda',
    question: '¿Cómo interceptamos el rayo antes de que alcance las fases?',
    whereOnLine: 'Cúpula superior de la torre de transmisión',
    minutes: '85–95 min',
    slides: 'Expo 77: 29–33',
    idea: 'El cable de guarda intercepta y deriva parte del rayo: 1) interceptar (reducir impactos directos sobre fases) y 2) conducir (llevar corriente a estructura y puesta a tierra). Su eficacia depende de dónde está y de cómo está conectada la estructura a tierra. El ángulo de apantallamiento se mide desde la vertical; el método electrogeométrico va más allá del ángulo.',
    realWorld:
      'Funciona como un paraguas sobre los cables con energía: si lo abres demasiado (ángulo α grande) o si cae un rayo débil con «esfera de atracción» pequeña, la descarga puede colarse de lado y golpear la fase.',
    keys: [
      'Ángulo (p. 31): α = arctan(Δx / Δh). Ejemplo Δh = 5 m, Δx = 4 m → α = 38,7°. La protección no se garantiza con α por sí solo.',
      'Electrogeométrico (p. 32): representa el alcance del líder según la descarga. Revisar alturas y posiciones relativas, intensidad y modelo de impacto, fallas de apantallamiento y desempeño frente a flameo inverso.',
      'Trabajo conjunto (p. 33): apantallamiento y puesta a tierra trabajan juntos. Intercepción exitosa ≠ ausencia de sobretensión en los aisladores.',
      'Errores frecuentes (p. 74): 38,7° es un ángulo geométrico, no garantía de apantallamiento.',
    ],
    experiments: ['e12'],
    sources: ['expo77', 'expo39', 'cardona', 'velasco'],
  },
  {
    id: 8,
    stage: 'torre',
    icon: 'ground',
    title: '05 · Puesta a tierra',
    question: '¿Cómo circula la corriente hacia el suelo y qué pasa si la tierra es alta?',
    whereOnLine: 'Base de la torre, varillas y contrapesos enterrados',
    minutes: '95–105 min',
    slides: 'Expo 77: 34–47',
    idea: 'La puesta a tierra evacua la corriente del rayo para que el potencial de la torre no se dispare. Si la resistencia es elevada, el potencial sube bruscamente y provoca flameo inverso (backflashover): descarga desde la cruceta hacia el conductor de fase. La seguridad también se evalúa sobre el suelo con tensiones de paso y contacto.',
    realWorld:
      'Si el desagüe al pie de la torre es estrecho (resistencia R_pt alta), la corriente del rayo «se represa», el voltaje del acero sube cientos de kilovoltios y además crea diferencias de voltaje peligrosas en el piso para quien camine cerca.',
    keys: [
      'Flameo inverso (Sobretensiones, p. 32): la corriente drena por estructura y R_pt; si R_pt es elevada, el potencial de la torre sube y salta el arco hacia la fase.',
      'Resistividad vs. resistencia: ρ (Ω·m) es el terreno; R (Ω) es lo que logras con varillas o contrapesos. Diseñar para época seca.',
      'Voltaje de torre: suma resistiva (R_t·i) e inductiva (L·di/dt).',
      'Paso y contacto (Expo 77, p. 47): paso = diferencia entre dos puntos separados por una zancada; contacto = estructura accesible vs. punto de la persona. Analizar distribución del potencial y tiempo de exposición.',
      'Errores frecuentes (p. 74): 25 Ω no certifica seguridad ni respuesta impulsiva universal.',
    ],
    experiments: ['e13', 'e14'],
    sources: ['expo77', 'expo39', 'velasco'],
  },
  {
    id: 9,
    stage: 'propagacion',
    icon: 'bounce',
    title: '06 · Ondas viajeras: reflexión y transmisión',
    question: '¿Qué ocurre al cambiar de impedancia y por qué un pulso puede casi duplicarse?',
    whereOnLine: 'Unión línea aérea – cable subterráneo – subestación',
    minutes: '105–115 min',
    slides: 'Expo 77: 48–54',
    idea: 'Una línea almacena energía en campos eléctricos y magnéticos; su inductancia y capacitancia distribuidas determinan la propagación. En un cambio de impedancia nacen dos ondas: reflejada y transmitida, con la tensión continua en la unión (V_i + V_r = V_t). Una amplitud transmitida mayor que la incidente no implica crear energía.',
    realWorld:
      'Igual que una ola del mar que choca contra un muro vertical y salta al doble de altura: cuando un pulso de rayo llega a un extremo abierto (o a un transformador de alta impedancia), rebota en positivo y suma su voltaje.',
    keys: [
      'Parámetros (p. 49): Z_c = √(L′/C′) — impedancia característica · v = 1/√(L′·C′) — velocidad de propagación.',
      'Coeficientes (p. 50): Γ_v = (Z₂ − Z₁)/(Z₂ + Z₁) · τ_v = 1 + Γ_v · V_r = Γ_v·V_i · V_t = τ_v·V_i.',
      'Ejemplo (p. 51): 100 kV de 400 Ω a 100 Ω → Γ_v = −0,60, τ_v = +0,40, V_r = −60 kV, V_t = +40 kV.',
      'Casos límite (pp. 52–53): corto Γ_v ≈ −1 (tensión terminal → 0) · adaptada Γ_v = 0 (sin reflexión) · abierta Γ_v ≈ +1 (tensión terminal → 2·V_i). Son límites ideales.',
      'Importancia (p. 54): las reflexiones alteran la sobretensión en equipos y subestaciones; la ubicación de protección debe verificarse con el comportamiento transitorio.',
    ],
    experiments: ['e15'],
    sources: ['expo77', 'expo39', 'velasco', 'pararrayos'],
  },
  {
    id: 10,
    stage: 'propagacion',
    icon: 'corona',
    title: '07 · Pérdidas por efecto corona',
    question: '¿Por qué se ioniza el aire y qué pérdidas causa?',
    whereOnLine: 'Superficie del conductor y haces de subconductores',
    minutes: '115–125 min',
    slides: 'Expo 77: 55–61',
    idea: 'La corona es una descarga parcial en el aire, no necesariamente un arco completo entre conductores. Depende de geometría (radio, rugosidad, separación, haz), ambiente (densidad, lluvia, altitud) y operación (tensión, frecuencia, tensión de incepción U₀). La fórmula de Peek aproxima las pérdidas para U > U₀ dentro de su rango de aplicación.',
    realWorld:
      'Un cable muy delgado concentra el campo eléctrico como una aguja. En líneas de 230 o 500 kV se agrupan 2, 3 o 4 cables separados por espaciadores (haz) para que el campo los «vea» como un solo tubo grueso y desaparezca la corona.',
    keys: [
      'Causa y efectos (p. 56): campo intenso cerca de la superficie → ionización, pérdidas, luz, ruido e interferencia.',
      'Peek (p. 58): P_cor = (242/δ)·(f + 25)·√(r/s)·(U − U₀)² × 10⁻⁵. U y U₀ en kV RMS fase–tierra; f en Hz; r y s en cm; δ densidad relativa.',
      'Ejercicio (pp. 59–60): U₀ = 120 kV, U = 150 kV, f = 60 Hz, δ = 0,90, r = 1,5 cm, s = 600 cm → P_cor ≈ 10,29 kW/km por conductor (no por toda la línea).',
      'Mitigación (p. 61): aumentar radio efectivo · conductores en haz · cuidar herrajes y superficies · revisar geometría y ambiente.',
      'Errores frecuentes (p. 74): Peek es estimación empírica con condiciones y unidades; no es fórmula exacta universal.',
    ],
    experiments: ['e17'],
    sources: ['expo77', 'corona'],
  },
  {
    id: 11,
    stage: 'propagacion',
    icon: 'check',
    title: 'Cierre: niveles IEC, pararrayos e integración',
    question: '¿Cómo se verifica que todo funciona junto y qué errores pueden preguntarte?',
    whereOnLine: 'Proyecto integral: línea de 245 kV + subestación',
    minutes: '125–135 min',
    slides: 'Expo 77: 62–77 · Sobretensiones: 14–17',
    idea: 'Las decisiones se verifican como conjunto, no en aislamiento: el objetivo es soportar las solicitaciones previsibles con un riesgo aceptable. La resistencia dieléctrica frente a sobretensiones se expresa con BIL, BSL, K, NPM/NPR, K_M y K_I según IEC 71-1. El pararrayos recorta el pico, pero su ubicación y conexiones determinan el margen real en el equipo.',
    realWorld:
      'En la misión final tomas el rol del ingeniero diseñador de una línea de 245 kV a 2.640 m (Bogotá): ajustas aisladores, guarda, puesta a tierra y pararrayos hasta aprobar las verificaciones simultáneas.',
    keys: [
      'IEC 71-1 (Sobretensiones, pp. 14–16): BIL = soportada a impulso tipo rayo · BSL = soportada a impulso tipo maniobra · K = BSL/BIL (0,83 aceite, 0,75 aire) · NPM/NPR = niveles de protección del descargador · K_M = 1,15 (BSL/NPM) · K_I = 1,2–1,4, común 1,25 (1,4 si < 52 kV).',
      'Pararrayos ZnO: U_c continua, TOV temporal, U_res residual, U_equipo con caída inductiva y margen M frente al BIL. Ubicarlo pegado al equipo.',
      'Siempre comparar peras con peras: misma forma de onda, misma unidad (cresta con cresta, eficaz con eficaz) y misma altitud.',
      'Errores frecuentes (Expo 77, p. 74): 21 discos solo satisfacen la fuga del ejemplo · 38,7° no garantiza apantallamiento · 25 Ω no certifica seguridad · U₅₀ es 50 % de disrupción · Peek es empírica.',
      'Pregunta de discusión (p. 77): ¿qué criterio controla el diseño cuando las exigencias se contradicen?',
    ],
    experiments: ['e16', 'e18', 'e19'],
    sources: ['expo77', 'expo39', 'pararrayos', 'iec60071', 'iec60099'],
  },
];

export function stageForTopic(topicId: number): Stage {
  return STAGES.find((s) => s.topicIds.includes(topicId)) ?? STAGES[0];
}
