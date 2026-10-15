// Ordena los 5 picks de un equipo en sus líneas (demo con bots): elige la permutación con mejor encaje y la convierte en swaps.
export const LANE_ORDER = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'SUPPORT'];

// 3 si es su línea principal, 2 si es secundaria, 0 si no juega ahí (o no hay datos).
const fit = (lanes: string[] | undefined, lane: string) => { const i = lanes?.indexOf(lane) ?? -1; return i < 0 ? 0 : i === 0 ? 3 : 2; };

const perms = (xs: number[]): number[][] => xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
const ALL = perms([0, 1, 2, 3, 4]); // 120 combinaciones: fuerza bruta basta

/** `current[p]` = campeón en la línea p. Devuelve el reparto con mejor encaje; a igual puntaje gana el que menos mueve. */
export function bestOrder(current: number[], lanes: Record<string, string[]>): number[] {
  let best = current, bestScore = -1, bestMoves = 99;
  for (const p of ALL) {
    const order = p.map((i) => current[i]);
    const score = order.reduce((s, id, lane) => s + fit(lanes[id], LANE_ORDER[lane]), 0);
    const moves = order.filter((id, lane) => id !== current[lane]).length;
    if (score > bestScore || (score === bestScore && moves < bestMoves)) { best = order; bestScore = score; bestMoves = moves; }
  }
  return best;
}

/** Pares de líneas a intercambiar, en orden, para pasar de `current` a `target`. */
export function swapsFor(current: number[], target: number[]): [number, number][] {
  const cur = [...current], out: [number, number][] = [];
  for (let p = 0; p < cur.length; p++) {
    if (cur[p] === target[p]) continue;
    const q = cur.indexOf(target[p]);
    [cur[p], cur[q]] = [cur[q], cur[p]];
    out.push([p, q]);
  }
  return out;
}
