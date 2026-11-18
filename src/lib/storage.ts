export type Solved = { stars: number; attempts: number; hint: boolean; at: number };

export type Progress = {
  xp: number;
  solved: Record<string, Solved>;
  quiz: Record<string, string>;
  visits: string[];
  version: 2;
};

const KEY = 'aislalab.progress';
const BACKUP = 'aislalab.progress.backup';
const LEGACY_KEY = 'labca.v2.progress';

export const emptyProgress = (): Progress => ({ xp: 0, solved: {}, quiz: {}, visits: [], version: 2 });

function safeParse(raw: string | null): Progress | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<Progress>;
    if (!o || typeof o !== 'object' || o.version !== 2) return null;
    return {
      xp: Number(o.xp) || 0,
      solved: (o.solved && typeof o.solved === 'object' ? o.solved : {}) as Record<string, Solved>,
      quiz: (o.quiz && typeof o.quiz === 'object' ? o.quiz : {}) as Record<string, string>,
      visits: Array.isArray(o.visits) ? (o.visits as string[]) : [],
      version: 2,
    };
  } catch {
    return null;
  }
}

export function loadProgress(): { progress: Progress; recovered: boolean } {
  try {
    const main = safeParse(localStorage.getItem(KEY));
    if (main) return { progress: main, recovered: false };
    const backup = safeParse(localStorage.getItem(BACKUP));
    if (backup) return { progress: backup, recovered: true };
    const legacy = safeParse(localStorage.getItem(LEGACY_KEY));
    if (legacy) return { progress: legacy, recovered: false };
  } catch {
    /* almacenamiento bloqueado: se usa en memoria */
  }
  return { progress: emptyProgress(), recovered: false };
}

export function saveProgress(p: Progress): void {
  try {
    const raw = JSON.stringify(p);
    localStorage.setItem(KEY, raw);
    localStorage.setItem(BACKUP, raw);
  } catch {
    /* modo privado o iframe restringido */
  }
}

export function resetProgress(): Progress {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(BACKUP);
  } catch {
    /* nada */
  }
  return emptyProgress();
}

export function exportProgress(p: Progress): string {
  return JSON.stringify(p, null, 2);
}

export function importProgress(text: string): Progress | null {
  return safeParse(text);
}

export function starsFor(attempts: number, hint: boolean): number {
  if (hint) return attempts <= 2 ? 2 : 1;
  if (attempts <= 0) return 3;
  if (attempts <= 2) return 2;
  return 1;
}

export function totalStars(p: Progress): number {
  return Object.values(p.solved).reduce((acc, s) => acc + (s.stars || 0), 0);
}

export const RANKS = [
  { min: 0, name: 'Aprendiz de campo' },
  { min: 100, name: 'Auxiliar de línea' },
  { min: 220, name: 'Analista de aislamiento' },
  { min: 340, name: 'Ingeniero de coordinación' },
  { min: 450, name: 'Especialista en alta tensión' },
];

export function rankFor(xp: number): { name: string; next?: number; nextName?: string; pct: number; index: number } {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) index = i;
  const current = RANKS[index];
  const next = RANKS[index + 1];
  const span = next ? next.min - current.min : 1;
  const pct = next ? Math.min(100, Math.round(((xp - current.min) / span) * 100)) : 100;
  return { name: current.name, next: next?.min, nextName: next?.name, pct, index };
}
