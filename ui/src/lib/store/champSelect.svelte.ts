import type { ChampSelectState } from '../types';
import { Sim } from './sim.svelte';
import { BROADCAST } from '../mode';
import { normalizeSession, type LiveDraft } from '../lcu/normalize';
import type { LcuStatus } from '../lcu/bridge';
import { TEAMS } from '../teams.svelte';

// Estado del draft (Svelte 5 runes). Dos fuentes: la simulación manual (coach y demo) o el cliente de League en vivo (broadcast).
let _state = $state<ChampSelectState | null>(null);
let _sim: Sim | null = null;
let _live = $state.raw<LiveDraft | null>(null);
let _status = $state<LcuStatus | 'unavailable'>('searching');
let _stopLive: (() => void) | null = null;

export const champSelect = {
  get state() { return _live?.state ?? _state; },
  // Nombre de la fase del draft: PREPICK, BAN PHASE 1, PICK PHASE 1, BAN PHASE 2, PICK PHASE 2.
  get phase() { return _live ? _live.phase : (_sim?.phase ?? null); },
  get prepickCell() { return _sim?.prepickCell ?? null; },
  // Campeón señalado (ban o pick en curso).
  get selection() { return _live ? _live.selection : (_sim?.sel ?? null); },
  // Estado de la conexión con el cliente (solo broadcast en vivo).
  get status() { return _status; },
  get live() { return _stopLive !== null; },
};

/** Arranca un draft simulado. `?sim=final` salta a la fase final con un draft ya completo (para pruebas). */
export function startChampSelect() {
  _sim = new Sim(new URLSearchParams(location.search).get('sim') === 'final');
  _state = _sim.st;
}

/** Broadcast: se conecta al cliente de League (solo lectura) y refleja su champ select en tiempo real. */
export function startLive() {
  if (!BROADCAST || !window.lcu) { _status = 'unavailable'; return; }
  const names = () => ({ blue: $state.snapshot(TEAMS.blue.players), red: $state.snapshot(TEAMS.red.players) });
  const offSession = window.lcu.onSession((raw) => { _live = raw ? normalizeSession(raw as never, names()) : null; });
  const offStatus = window.lcu.onStatus((s) => { _status = s; });
  _stopLive = () => { offSession(); offStatus(); window.lcu?.stop(); _stopLive = null; };
  _status = 'searching';
  window.lcu.start();
}

/** Vuelve al home: detiene la simulación y la lectura del cliente, y borra el estado del draft. */
export function resetChampSelect() {
  _sim?.dispose();
  _stopLive?.();
  _sim = null; _state = null; _live = null;
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
