// Equipos de la serie. No hay equipos ni logos incluidos en el repositorio: cada usuario los configura en Team setup
// (nombre, logo subido, colores y jugadores) y se guardan en este equipo, sin conexión.
export type Team = { name: string; logo: string | null; wordmark: string | null; c1: string; c2: string; players: string[] };
export type Teams = { blue: Team; red: Team };
export type BestOf = 1 | 3 | 5;

const KEY = 'draft-reimagined-teams';
const LANES = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];
export const defaultTeams = (): Teams => ({
  blue: { name: 'Blue Team', logo: null, wordmark: null, c1: '#3d8bff', c2: '#3d8bff', players: [...LANES] },
  red: { name: 'Red Team', logo: null, wordmark: null, c1: '#ff4d5e', c2: '#ff4d5e', players: [...LANES] },
});

const clean = (t: Partial<Team> | undefined, base: Team): Team => ({
  name: typeof t?.name === 'string' && t.name.trim() ? t.name.trim().slice(0, 28) : base.name,
  logo: typeof t?.logo === 'string' ? t.logo : null,
  wordmark: typeof t?.wordmark === 'string' ? t.wordmark : null,
  c1: /^#[0-9a-f]{6}$/i.test(t?.c1 ?? '') ? t!.c1! : base.c1,
  c2: /^#[0-9a-f]{6}$/i.test(t?.c2 ?? '') ? t!.c2! : base.c2,
  players: LANES.map((l, i) => (typeof t?.players?.[i] === 'string' && t.players[i].trim() ? t.players[i].trim().slice(0, 20) : l)),
});

// Datos de la serie (placeholders: se editan aquí). Ganadores necesarios = ceil(bestOf / 2).
export const SERIES = $state({ tournament: 'Tournament', stage: 'Stage', game: 1, bestOf: 3 as BestOf, score: [0, 0] as [number, number] });

export const TEAMS = $state<Teams>(defaultTeams());
try {
  const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
  if (saved) {
    const d = defaultTeams(); Object.assign(TEAMS.blue, clean(saved.blue, d.blue)); Object.assign(TEAMS.red, clean(saved.red, d.red));
    if ([1, 3, 5].includes(saved.bestOf)) SERIES.bestOf = saved.bestOf;
  }
} catch { /* sin almacenamiento o datos dañados: se usan los equipos por defecto */ }

/** Guarda los equipos; devuelve false si el navegador no pudo persistirlos (p. ej. logos demasiado grandes). */
export function saveTeams(next: Teams, bestOf: BestOf = SERIES.bestOf): boolean {
  const d = defaultTeams();
  Object.assign(TEAMS.blue, clean(next.blue, d.blue));
  Object.assign(TEAMS.red, clean(next.red, d.red));
  SERIES.bestOf = bestOf;
  try { localStorage.setItem(KEY, JSON.stringify({ ...$state.snapshot(TEAMS), bestOf })); return true; } catch { return false; }
}
