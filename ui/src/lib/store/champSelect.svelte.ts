import type { ChampSelectState } from '../types';
import { Sim } from './sim.svelte';

// Estado del draft (Svelte 5 runes). Hoy lo produce la simulación manual; el coach opera ambos lados.
let _state = $state<ChampSelectState | null>(null);
let _sim: Sim | null = null;

export const champSelect = {
  get state() { return _state; },
  // Nombre de la fase del draft: PREPICK, BAN PHASE 1, PICK PHASE 1, BAN PHASE 2, PICK PHASE 2.
  get phase() { return _sim?.phase ?? null; },
  get prepickCell() { return _sim?.prepickCell ?? null; },
  // Campeón señalado en la grilla (ban o pick en curso).
  get selection() { return _sim?.sel ?? null; },
};

/** Arranca un draft nuevo. `?sim=final` salta a la fase final con un draft ya completo (para pruebas). */
export function startChampSelect() {
  _sim = new Sim(new URLSearchParams(location.search).get('sim') === 'final');
  _state = _sim.st;
}

/** Vuelve al home: detiene la simulación y borra el estado del draft. */
export function resetChampSelect() {
  _sim?.dispose();
  _sim = null; _state = null;
}

export const hoverChampion = (championId: number) => _sim?.hover(championId);
export const lockIn = (championId: number) => _sim?.lock(championId);
// Coach (prepick): elige a qué jugador se le asigna la intención de campeón.
export const selectPrepickCell = (cell: number) => _sim?.selectCell(cell);

// Coach: intercambia los campeones de dos jugadores (cambio de línea). Manual; solo entre picks ya fijados.
export function swapSlots(cellA: number, cellB: number) {
  const all = [...(_state?.allies ?? []), ...(_state?.enemies ?? [])];
  const a = all.find((s) => s.cell_id === cellA), b = all.find((s) => s.cell_id === cellB);
  if (!a || !b || !a.is_locked || !b.is_locked) return;
  [a.champion_id, b.champion_id] = [b.champion_id, a.champion_id];
  [a.pick_intent, b.pick_intent] = [b.pick_intent, a.pick_intent];
}

// Coach: cambia el campeón de un pick ya fijado sin tocar el turno ni los tiempos.
export function replacePick(cell: number, championId: number) {
  const s = [...(_state?.allies ?? []), ...(_state?.enemies ?? [])].find((x) => x.cell_id === cell);
  if (s?.is_locked) { s.champion_id = championId; s.pick_intent = null; }
}
