// Convierte la sesión de champ select del cliente de League (LCU, solo lectura) al estado que dibuja la interfaz.
import { NO_BAN, type ChampSelectState, type PlayerSlot } from '../types';

type RawPlayer = { cellId: number; championId?: number; championPickIntent?: number; assignedPosition?: string; team?: number };
type RawAction = { id: number; actorCellId: number; championId: number; completed: boolean; isInProgress: boolean; type: string };
export type RawSession = {
  myTeam?: RawPlayer[]; theirTeam?: RawPlayer[]; actions?: RawAction[][];
  timer?: { adjustedTimeLeftInPhase?: number; isInfinite?: boolean; phase?: string };
};
export type LiveDraft = { state: ChampSelectState; phase: string | null; selection: number | null };

const POS = ['top', 'jungle', 'middle', 'bottom', 'utility'];
// Un draft profesional tiene 20 acciones: bans 1 (6), picks 1 (6), bans 2 (4), picks 2 (4).
const PRO_PHASES: [number, string][] = [[6, 'BAN PHASE 1'], [12, 'PICK PHASE 1'], [16, 'BAN PHASE 2'], [20, 'PICK PHASE 2']];

/**
 * `names`: nombres de jugador por línea de cada equipo (los que el usuario configuró); la sesión puede traerlos ocultos.
 * Blue = equipo 1 del cliente, red = equipo 2. Sin ese dato, mi equipo es blue.
 */
export function normalizeSession(raw: RawSession, names: { blue: string[]; red: string[] }, now = Date.now()): LiveDraft {
  const tagged = [
    ...(raw.myTeam ?? []).map((p) => ({ p, side: p.team === 2 ? 'red' : p.team === 1 ? 'blue' : 'blue' as 'blue' | 'red' })),
    ...(raw.theirTeam ?? []).map((p) => ({ p, side: p.team === 1 ? 'blue' : 'red' as 'blue' | 'red' })),
  ];
  const sideOf = new Map<number, 'blue' | 'red'>();
  const slots = new Map<number, PlayerSlot>();
  const build = (side: 'blue' | 'red'): PlayerSlot[] =>
    tagged.filter((t) => t.side === side).sort((a, b) => a.p.cellId - b.p.cellId).map(({ p }, i) => {
      const given = (p.assignedPosition ?? '').toLowerCase();
      const position = POS.includes(given) ? given : POS[i % 5]; // en customs el cliente no asigna líneas: se usa el orden de celdas
      const slot: PlayerSlot = {
        cell_id: p.cellId, champion_id: null, pick_intent: p.championPickIntent && p.championPickIntent > 0 ? p.championPickIntent : null,
        display_name: names[side][Math.max(0, POS.indexOf(position))] ?? null, position, is_locked: false,
      };
      sideOf.set(p.cellId, side); slots.set(p.cellId, slot);
      return slot;
    });
  const allies = build('blue'), enemies = build('red');

  const acts = (raw.actions ?? []).flat().filter((a) => a.type === 'ban' || a.type === 'pick');
  const bans = { ally_bans: [] as number[], enemy_bans: [] as number[] };
  let selection: number | null = null;
  for (const a of acts) {
    const slot = slots.get(a.actorCellId);
    if (a.type === 'ban') {
      if (a.completed) (sideOf.get(a.actorCellId) === 'red' ? bans.enemy_bans : bans.ally_bans).push(a.championId > 0 ? a.championId : NO_BAN);
    } else if (slot) {
      if (a.completed && a.championId > 0) { slot.champion_id = a.championId; slot.pick_intent = null; slot.is_locked = true; }
      else if (a.isInProgress && a.championId > 0) slot.pick_intent = a.championId;
    }
    if (a.isInProgress && a.championId > 0) selection = a.championId;
  }
  for (const s of slots.values()) if (!s.is_locked && !s.pick_intent) { // campeón mostrado sin acción de pick aún (planificación)
    const raw0 = tagged.find((t) => t.p.cellId === s.cell_id)?.p.championId;
    if (raw0 && raw0 > 0) s.pick_intent = raw0;
  }

  const cur = acts.findIndex((a) => a.isInProgress);
  const timer = raw.timer ?? {};
  const turn = cur >= 0 ? { action_id: acts[cur].id, action_type: acts[cur].type as 'ban' | 'pick', actor_cell_id: acts[cur].actorCellId, is_my_turn: true } : null;
  const left = timer.adjustedTimeLeftInPhase ?? 0;
  let phase: string | null = null;
  if (cur >= 0) phase = acts.length === 20 ? (PRO_PHASES.find(([end]) => cur < end)?.[1] ?? null) : acts[cur].type === 'ban' ? 'BAN PHASE' : 'PICK PHASE';
  else if (timer.phase === 'PLANNING') phase = 'PREPICK';
  else if (timer.phase === 'FINALIZATION') phase = 'FINALIZATION';

  return {
    state: {
      allies, enemies, my_cell_id: -1, bans, turn,
      ends_at_ms: !timer.isInfinite && left > 0 ? BigInt(now + left) : null, is_infinite_timer: !!timer.isInfinite,
    },
    phase, selection,
  };
}
