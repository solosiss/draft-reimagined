import { describe, expect, it } from 'vitest';
import { bestOrder, swapsFor } from './assign';

const lanes = { 1: ['BOTTOM'], 2: ['TOP'], 3: ['MIDDLE'], 4: ['JUNGLE'], 5: ['SUPPORT'] };
const apply = (cur: number[], swaps: [number, number][]) => { const c = [...cur]; for (const [a, b] of swaps) [c[a], c[b]] = [c[b], c[a]]; return c; };

describe('bestOrder / swapsFor', () => {
  it('el adc pickeado en top acaba en bottom', () => {
    const current = [1, 2, 3, 4, 5]; // top=adc, jungle=top, mid=mid, bot=jungle, sup=sup
    const target = bestOrder(current, lanes);
    expect(target).toEqual([2, 4, 3, 1, 5]);
    expect(apply(current, swapsFor(current, target))).toEqual(target);
  });
  it('ya ordenado: sin swaps', () => {
    const current = [2, 4, 3, 1, 5];
    expect(swapsFor(current, bestOrder(current, lanes))).toEqual([]);
  });
  it('campeones sin datos de línea no rompen y no se mueven', () => {
    const current = [90, 91, 92, 93, 94];
    expect(bestOrder(current, {})).toEqual(current);
  });
  it('prefiere la línea principal a la secundaria', () => {
    const l = { 10: ['MIDDLE', 'TOP'], 11: ['TOP'] };
    expect(bestOrder([10, 11, 0, 0, 0], l).slice(0, 3)).toEqual([11, 0, 10]);
  });
});
