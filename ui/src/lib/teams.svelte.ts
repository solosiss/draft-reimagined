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
export type Series = { tournament: string; stage: string; game: number; bestOf: BestOf; score: [number, number]; tournamentLogo: string | null };
export const SERIES = $state<Series>({ tournament: 'Tournament', stage: 'Stage', game: 1, bestOf: 3, score: [0, 0], tournamentLogo: null });

const cleanSeries = (x: Partial<Series> | undefined, base: Series): Series => {
  const n = (v: unknown, max: number, d: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max ? (v as number) : d);
  const bo = [1, 3, 5].includes(x?.bestOf as number) ? (x!.bestOf as BestOf) : base.bestOf;
  return {
    tournament: typeof x?.tournament === 'string' ? x.tournament.trim().slice(0, 40) : base.tournament,
    stage: typeof x?.stage === 'string' ? x.stage.trim().slice(0, 40) : base.stage,
    game: Math.max(1, n(x?.game, 5, base.game)), bestOf: bo,
    score: [n(x?.score?.[0], 3, 0), n(x?.score?.[1], 3, 0)],
    tournamentLogo: typeof x?.tournamentLogo === 'string' ? x.tournamentLogo : null,
  };
};

export const TEAMS = $state<Teams>(defaultTeams());
try {
  const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
  if (saved) {
    const d = defaultTeams(); Object.assign(TEAMS.blue, clean(saved.blue, d.blue)); Object.assign(TEAMS.red, clean(saved.red, d.red));
    Object.assign(SERIES, cleanSeries(saved.series ?? { bestOf: saved.bestOf }, SERIES));
  }
} catch { /* sin almacenamiento o datos dañados: se usan los equipos por defecto */ }

/** Guarda equipos y datos de la serie; devuelve false si el navegador no pudo persistirlos (p. ej. logos demasiado grandes). */
export function saveTeams(next: Teams, series: Series = $state.snapshot(SERIES) as Series): boolean {
  const d = defaultTeams();
  Object.assign(TEAMS.blue, clean(next.blue, d.blue));
  Object.assign(TEAMS.red, clean(next.red, d.red));
  Object.assign(SERIES, cleanSeries(series, SERIES));
  try { localStorage.setItem(KEY, JSON.stringify({ ...$state.snapshot(TEAMS), series: $state.snapshot(SERIES) })); return true; } catch { return false; }
}
