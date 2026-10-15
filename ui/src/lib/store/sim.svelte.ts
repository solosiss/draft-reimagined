// Simulación local del draft (solo navegador, sin LCU), todo manual: el coach elige por ambos lados (blue y red).
// Estructura profesional: prepick (15 s, el coach declara intenciones por jugador) → ban phase 1 (3 y 3) → pick phase 1 → ban phase 2 (2 y 2) → pick phase 2 → 60 s de finalización. Todos los turnos duran 30 s.
// En la app real estas fases las decide el LCU; esto existe para probar la UI sin League.
import { NO_BAN, type ChampSelectState, type PlayerSlot } from '../types';
import { champions, preloadSplash, splashUrl } from '../champions.svelte';
import { TEAMS } from '../teams.svelte';
import lanes from '../lanes.json';
import { bestOrder, swapsFor } from './assign';

const PREPICK_MS = 15000;
const TURN_MS = 30000, BAN_GRACE_MS = 2000; // 30 s por turno (bans y picks); un ban sin fijar a los 32 s se salta sin banear
const FINAL_MS = 60000; // finalización: periodo de gracia para los trades
const BAN_GAP = 3300, PICK_GAP = 2800, SKIP_GAP = 600; // pausa tras cada acción (showcase del ban ~2,9 s; el pick abre su panel ~2,2 s)
const POS = ['top', 'jungle', 'middle', 'bottom', 'utility'];
const BOT_THINK = [2000, 5000], BOT_LOCK_GAP = 600, BOT_SWAP_START = 3000, BOT_SWAP_GAP = 1800; // bots (demo del broadcast): tiempo de "pensar", pausa entre señalar y fijar, y ritmo de los swaps de la final

type Action = { kind: 'ban' | 'pick'; cell: number; phase: string; done: boolean };
// B = blue (celdas 0-4), R = red (celdas 5-9); cada equipo usa sus celdas en orden de aparición. Las líneas se cambian a mano con el swap.
const PLAN: [string, 'ban' | 'pick', ...('B' | 'R')[]][] = [
  ['BAN PHASE 1', 'ban', 'B', 'R', 'B', 'R', 'B', 'R'],
  ['PICK PHASE 1', 'pick', 'B', 'R', 'R', 'B', 'B', 'R'],
  ['BAN PHASE 2', 'ban', 'R', 'B', 'R', 'B'],
  ['PICK PHASE 2', 'pick', 'R', 'B', 'B', 'R'],
];
const buildActions = (): Action[] => {
  const used = { ban: { B: 0, R: 0 }, pick: { B: 0, R: 0 } };
  return PLAN.flatMap(([phase, kind, ...sides]) => sides.map((s) => ({ kind, phase, cell: (s === 'B' ? 0 : 5) + used[kind][s]++, done: false })));
};

const slot = (cell: number): PlayerSlot => ({
  cell_id: cell, champion_id: null, pick_intent: null,
  display_name: cell < 5 ? TEAMS.blue.players[cell] : TEAMS.red.players[cell - 5],
  position: POS[cell % 5], is_locked: false,
});

export class Sim {
  st = $state<ChampSelectState>({
    allies: [0, 1, 2, 3, 4].map(slot), enemies: [5, 6, 7, 8, 9].map(slot),
    my_cell_id: 0, bans: { ally_bans: [], enemy_bans: [] }, turn: null,
    ends_at_ms: null, is_infinite_timer: true,
  });
  sel = $state<number | null>(null);
  phase = $state<string | null>(null);
  prepickCell = $state(0); // jugador al que se asigna la intención durante el prepick
  private prepick = true;
  private acts = buildActions();
  private timers: number[] = [];
  private idx = 0;

  // `bots`: demo del broadcast; ambos lados juegan solos (picks al azar) y en la final se ordenan por línea. El coach siempre es manual.
  constructor(skipToFinal = false, private bots = false) {
    if (skipToFinal) { // ?sim=final: draft ya completo, para ver la fase final sin jugarlo
      const ids = [266, 64, 103, 202, 412, 122, 254, 238, 81, 53];
      [...this.st.allies, ...this.st.enemies].forEach((s, i) => Object.assign(s, { champion_id: ids[i], is_locked: true }));
      this.st.bans.ally_bans = [1, 22, 51, 25, 18]; this.st.bans.enemy_bans = [89, 99, 21, 119, 67];
      this.acts.forEach((a) => (a.done = true)); this.prepick = false; this.advance();
      return;
    }
    if (this.bots) { this.prepick = false; this.advance(); return; } // los bots no hacen prepick
    this.st.is_infinite_timer = false; this.st.ends_at_ms = BigInt(Date.now() + PREPICK_MS);
    this.after(PREPICK_MS, () => { this.prepick = false; this.advance(); });
  }

  // Prepick: elige qué jugador recibe la intención (click en su panel); el campeón se elige en la grilla.
  selectCell(cell: number) {
    if (!this.prepick) return;
    this.prepickCell = cell; this.st.my_cell_id = cell;
    this.sel = this.slotOf(cell).pick_intent;
  }

  private disposed = false;
  private after(ms: number, fn: () => void) { if (!this.disposed) this.timers.push(window.setTimeout(fn, ms)); }
  dispose() { this.disposed = true; this.clear(); }
  private clear() { this.timers.forEach(clearTimeout); this.timers = []; }
  private slotOf(cell: number) { return (cell < 5 ? this.st.allies : this.st.enemies).find((s) => s.cell_id === cell)!; }
  private taken() {
    return new Set([...this.st.bans.ally_bans, ...this.st.bans.enemy_bans,
      ...[...this.st.allies, ...this.st.enemies].map((s) => s.champion_id ?? 0)]);
  }

  // Pick por tiempo agotado sin campeón señalado: uno al azar entre los disponibles.
  private randomFree(): number {
    const free = champions.list.filter((c) => !this.taken().has(c.id));
    return free[Math.floor(Math.random() * free.length)].id;
  }

  // Abre la primera acción pendiente. Siempre es "tu turno": el coach opera el lado que toca, y my_cell_id sigue al que actúa.
  private advance() {
    const i = this.acts.findIndex((a) => !a.done);
    if (i < 0) { // finalización: 30 s para los swaps de línea
      this.st.turn = null; this.phase = null;
      this.st.is_infinite_timer = false; this.st.ends_at_ms = BigInt(Date.now() + FINAL_MS);
      if (this.bots) this.after(BOT_SWAP_START, () => this.sortLanes());
      return;
    }
    const a = this.acts[i];
    this.idx = i; this.phase = a.phase;
    this.st.my_cell_id = a.cell;
    const intent = this.slotOf(a.cell).pick_intent;
    this.sel = a.kind === 'pick' && intent && !this.taken().has(intent) ? intent : null; // el prepick deja el campeón preseleccionado
    this.st.turn = { action_id: i, action_type: a.kind, actor_cell_id: a.cell, is_my_turn: true };
    if (a.kind === 'ban') {
      this.st.is_infinite_timer = false; this.st.ends_at_ms = BigInt(Date.now() + TURN_MS);
      this.after(TURN_MS + BAN_GRACE_MS, () => this.endBan(i, null));
    } else { // al acabar el tiempo se fija el campeón señalado; sin ninguno, uno al azar
      this.st.is_infinite_timer = false; this.st.ends_at_ms = BigInt(Date.now() + TURN_MS);
      this.after(TURN_MS, () => this.endPick(i, this.sel && !this.taken().has(this.sel) ? this.sel : this.randomFree()));
    }
    if (this.bots) this.botTurn(i, a);
  }

  // Bot: piensa un rato, señala un campeón al azar (se ve la intención) y lo fija un momento después.
  private botTurn(i: number, a: Action) {
    const id = this.randomFree();
    const think = BOT_THINK[0] + Math.random() * (BOT_THINK[1] - BOT_THINK[0]);
    this.after(think, () => {
      if (a.kind === 'pick') this.slotOf(a.cell).pick_intent = id;
      this.sel = id;
      this.after(BOT_LOCK_GAP, () => (a.kind === 'ban' ? this.endBan(i, id) : this.endPick(i, id)));
    });
  }

  // Final con bots: cada equipo reparte sus picks por línea con swaps visibles, uno tras otro (azul y rojo alternados).
  private sortLanes() {
    const queue = ([0, 5] as const).map((base) => {
      const team = (base === 0 ? this.st.allies : this.st.enemies);
      const cur = team.map((s) => s.champion_id ?? 0);
      return swapsFor(cur, bestOrder(cur, lanes as Record<string, string[]>)).map(([p, q]) => [base + p, base + q] as const);
    });
    const order = Array.from({ length: Math.max(...queue.map((q) => q.length)) }, (_, k) => queue.map((q) => q[k]).filter(Boolean)).flat();
    order.forEach(([x, y], k) => this.after(k * BOT_SWAP_GAP, () => this.swap(x, y)));
  }

  private swap(cellA: number, cellB: number) {
    const a = this.slotOf(cellA), b = this.slotOf(cellB);
    [a.champion_id, b.champion_id] = [b.champion_id, a.champion_id];
    [a.pick_intent, b.pick_intent] = [b.pick_intent, a.pick_intent];
  }

  private async endBan(i: number, id: number | null) {
    this.clear();
    const a = this.acts[i];
    this.st.turn!.is_my_turn = false;
    this.st.ends_at_ms = BigInt(Date.now()); // fin instantáneo al banear
    if (id) await Promise.race([preloadSplash(id), new Promise((r) => setTimeout(r, 1500))]);
    (a.cell < 5 ? this.st.bans.ally_bans : this.st.bans.enemy_bans).push(id ?? NO_BAN); // ban saltado: queda marcado en su hueco
    a.done = true;
    this.after(id ? BAN_GAP : SKIP_GAP, () => this.advance());
  }

  private async endPick(i: number, id: number) {
    this.clear();
    const a = this.acts[i];
    this.st.turn!.is_my_turn = false;
    const img = new Image(); img.src = splashUrl(id); // precarga el splash para que aparezca ya cargado
    await Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
    const s = this.slotOf(a.cell); s.champion_id = id; s.pick_intent = null; s.is_locked = true;
    a.done = true;
    this.after(PICK_GAP, () => this.advance());
  }

  hover(id: number) {
    if (this.prepick) { this.slotOf(this.prepickCell).pick_intent = id; this.sel = id; return; }
    if (!this.st.turn?.is_my_turn || this.taken().has(id)) return;
    if (this.acts[this.idx].kind === 'pick') this.slotOf(this.st.turn.actor_cell_id).pick_intent = id;
    this.sel = id;
  }
  lock(id: number) {
    if (!this.st.turn?.is_my_turn || this.taken().has(id)) return;
    if (this.acts[this.idx].kind === 'ban') this.endBan(this.idx, id);
    else this.endPick(this.idx, id);
  }
}
