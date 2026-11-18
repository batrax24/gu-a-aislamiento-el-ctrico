export type SourceKey =
  | 'expo77'
  | 'expo39';

export type Source = {
  key: SourceKey;
  short: string;
  title: string;
  author: string;
  file: string;
  pages: string;
  role: string;
  normative?: boolean;
};

export const SOURCES: Record<SourceKey, Source> = {
  expo77: {
    key: 'expo77',
    short: 'Expo 77 diapositivas',
    title: 'Coordinación de aislamiento: siete temas para comprender cómo falla, se dimensiona y se protege el aislamiento de una línea de transmisión',
    author: 'Santiago Alejandro Campos Mora · Alejandro Diaz Cordoba',
    file: 'Coordinacion_Aislamiento_77_Portada_Actualizada.pdf',
    pages: '77 diapositivas (7 temas + cierre)',
    role: 'Base de esta guía: 01 mecanismos, 02 cadena, 03 separaciones, 04 guarda, 05 tierra, 06 ondas, 07 corona',
  },
  expo39: {
    key: 'expo39',
    short: 'Fundamentos de sobretensiones',
    title: 'G7 Aislamiento: Fundamentos de sobretensiones',
    author: 'Alejandro Díaz Córdoba · Santiago Alejandro Campos Mora',
    file: 'Aislamiento Fundamentos de sobretensiones (2)_compressed.pdf',
    pages: '39 diapositivas',
    role: 'Base de sobretensiones: definición, parámetros, clasificación, tradeoff, BIL/BSL/K/NPM/NPR, rayo estadístico, ruptura en gases, U₅₀ y atmósfera δ',
  },
};

export const ALL_SOURCES = Object.values(SOURCES);

export function cite(keys: SourceKey[]): string {
  return keys.map((k) => SOURCES[k].short).join(' · ');
}
