import { describe, expect, it } from 'vitest';
import { normalizeSession, type RawSession } from './normalize';
import { NO_BAN } from '../types';

const names = { blue: ['B-top', 'B-jg', 'B-mid', 'B-bot', 'B-sup'], red: ['R-top', 'R-jg', 'R-mid', 'R-bot', 'R-sup'] };
const team = (start: number, t: number, pos = true) =>
  [0, 1, 2, 3, 4].map((i) => ({ cellId: start + i, championId: 0, championPickIntent: 0, assignedPosition: pos ? ['top', 'jungle', 'middle', 'bottom', 'utility'][i] : '', team: t }));
const act = (id: number, cell: number, type: string, championId: number, completed: boolean, isInProgress = false) =>
  ({ id, actorCellId: cell, type, championId, completed, isInProgress });

describe('normalizeSession', () => {
  const base: RawSession = { myTeam: team(0, 1), theirTeam: team(5, 2), actions: [], timer: { adjustedTimeLeftInPhase: 20000, isInfinite: false, phase: 'BAN_PICK' } };

  it('reparte los equipos por su número (blue = 1, red = 2) y pone los nombres por línea', () => {
    const r = normalizeSession({ ...base, myTeam: team(5, 2), theirTeam: team(0, 1) }, names, 0); // yo estoy en red
    expect(r.state.allies.map((s) => s.cell_id)).toEqual([0, 1, 2, 3, 4]);
    expect(r.state.enemies.map((s) => s.display_name)).toEqual(names.red);
  });

  it('usa el orden de celdas cuando la sesión no trae líneas (custom)', () => {
    const r = normalizeSession({ ...base, myTeam: team(0, 1, false) }, names, 0);
    expect(r.state.allies.map((s) => s.position)).toEqual(['top', 'jungle', 'middle', 'bottom', 'utility']);
  });

  it('bans: respeta el orden, separa por equipo y marca el ban saltado', () => {
    const r = normalizeSession({ ...base, actions: [[act(0, 0, 'ban', 10, true), act(1, 5, 'ban', 0, true), act(2, 1, 'ban', 11, true), act(3, 6, 'ban', 12, true)]] }, names, 0);
    expect(r.state.bans.ally_bans).toEqual([10, 11]);
    expect(r.state.bans.enemy_bans).toEqual([NO_BAN, 12]);
  });

  it('pick fijado, pick en curso y turno', () => {
    const r = normalizeSession({ ...base, actions: [[act(0, 0, 'pick', 64, true), act(1, 5, 'pick', 103, false, true)]] }, names, 1000);
    expect(r.state.allies[0]).toMatchObject({ champion_id: 64, is_locked: true });
    expect(r.state.enemies[0]).toMatchObject({ champion_id: null, pick_intent: 103, is_locked: false });
    expect(r.state.turn).toMatchObject({ action_type: 'pick', actor_cell_id: 5 });
    expect(r.selection).toBe(103);
    expect(r.state.ends_at_ms).toBe(21000n);
  });

  it('ban en curso expone el campeón señalado', () => {
    const r = normalizeSession({ ...base, actions: [[act(0, 0, 'ban', 22, false, true)]] }, names, 0);
    expect(r.selection).toBe(22);
    expect(r.state.bans.ally_bans).toEqual([]);
  });

  it('nombra las fases de un draft profesional de 20 acciones', () => {
    const acts = Array.from({ length: 20 }, (_, i) => act(i, i % 10, i < 6 || (i >= 12 && i < 16) ? 'ban' : 'pick', 0, i < 7, i === 7));
    expect(normalizeSession({ ...base, actions: [acts] }, names, 0).phase).toBe('PICK PHASE 1');
    const early = acts.map((a, i) => ({ ...a, completed: i < 2, isInProgress: i === 2 }));
    expect(normalizeSession({ ...base, actions: [early] }, names, 0).phase).toBe('BAN PHASE 1');
  });

  it('planificación y finalización sin turno', () => {
    expect(normalizeSession({ ...base, timer: { phase: 'PLANNING', adjustedTimeLeftInPhase: 15000 } }, names, 0).phase).toBe('PREPICK');
    const fin = normalizeSession({ ...base, timer: { phase: 'FINALIZATION', adjustedTimeLeftInPhase: 60000 } }, names, 0);
    expect(fin.phase).toBe('FINALIZATION');
    expect(fin.state.turn).toBeNull();
  });

  it('ignora acciones que no son ban ni pick', () => {
    const r = normalizeSession({ ...base, actions: [[act(0, 0, 'ten_bans_reveal', 0, true)]] }, names, 0);
    expect(r.state.turn).toBeNull();
    expect(r.state.bans.ally_bans).toEqual([]);
  });
});
