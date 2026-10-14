// Estado del draft que consume la interfaz (lo produce la simulación en store/sim.svelte.ts).
export type PlayerSlot = {
  cell_id: number; champion_id: number | null; pick_intent: number | null;
  display_name: string | null; position: string; is_locked: boolean;
};
export type ActiveTurn = { action_id: number; action_type: 'ban' | 'pick'; actor_cell_id: number; is_my_turn: boolean };
export type ChampSelectState = {
  allies: PlayerSlot[]; enemies: PlayerSlot[]; my_cell_id: number;
  bans: { ally_bans: number[]; enemy_bans: number[] }; // -1 marca un ban que no se hizo a tiempo
  turn: ActiveTurn | null; ends_at_ms: bigint | null; is_infinite_timer: boolean;
};
