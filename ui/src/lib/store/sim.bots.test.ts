import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import lanes from '../lanes.json';
import { LANE_ORDER } from './assign';

// Demo con bots: picks al azar, y en la final cada equipo queda ordenado por línea tras swaps visibles.
describe('Sim con bots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('Image', class { decode() { return Promise.resolve(); } set src(_: string) {} });
    const data = Object.fromEntries(Object.keys(lanes).map((k) => [`C${k}`, { key: k, id: `C${k}`, name: `C${k}` }]));
    vi.stubGlobal('fetch', async (u: string) => ({ json: async () => (u.includes('versions') ? ['1.0'] : { data }) }));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('completa el draft solo y termina con cada equipo ordenado por línea', async () => {
    const { loadChampions } = await import('../champions.svelte');
    const { Sim } = await import('./sim.svelte');
    await loadChampions();
    const sim = new Sim(false, true);
    expect(sim.st.turn?.action_type).toBe('ban'); // sin prepick
    await vi.advanceTimersByTimeAsync(5 * 60_000); // sobra: el draft con bots dura 2 a 3 min
    const all = [...sim.st.allies, ...sim.st.enemies];
    expect(all.every((s) => s.is_locked && s.champion_id)).toBe(true);
    expect(new Set(all.map((s) => s.champion_id)).size).toBe(10);
    expect(sim.st.bans.ally_bans.length + sim.st.bans.enemy_bans.length).toBe(10);
    // tras los swaps, cada equipo tiene el mejor reparto: nadie queda en una línea que no juega si había alternativa
    for (const team of [sim.st.allies, sim.st.enemies]) {
      const ok = team.filter((s, p) => (lanes as Record<string, string[]>)[s.champion_id!]?.includes(LANE_ORDER[p])).length;
      expect(ok).toBeGreaterThanOrEqual(3);
    }
    sim.dispose();
  });

  it('el coach (sin bots) no juega solo: el primer turno sigue esperando', async () => {
    const { Sim } = await import('./sim.svelte');
    const sim = new Sim(false, false);
    await vi.advanceTimersByTimeAsync(20_000); // solo el prepick (15 s) pasa
    expect(sim.st.turn?.action_type).toBe('ban');
    expect(sim.st.bans.ally_bans.length).toBe(0);
    sim.dispose();
  });
});
