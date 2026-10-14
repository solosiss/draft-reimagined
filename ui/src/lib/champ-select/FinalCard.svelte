<script lang="ts">
  import type { PlayerSlot } from '../types';
  import Lane from '../Lane.svelte';
  import { championName, splashUrl } from '../champions.svelte';

  let { slot, side, swapSource = false, onswap, onselect, fixable = false }: { slot: PlayerSlot; side: 'ally' | 'enemy'; swapSource?: boolean; onswap?: () => void; onselect?: () => void; fixable?: boolean } = $props();
  const LANE: Record<string, string> = { top: 'TOP', jungle: 'JUNGLE', middle: 'MIDDLE', bottom: 'BOTTOM', utility: 'SUPPORT' };
  const champ = $derived(slot.champion_id);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
<article class="card {side}" class:fixable onclick={onselect} data-cell={slot.cell_id}>
  {#if champ}{#key champ}<img src={splashUrl(champ)} alt="" />{/key}{/if}
  <div class="shade"></div>
  <span class="line"></span>
  <div class="info">
    {#if LANE[slot.position]}<Lane lane={LANE[slot.position]} size={30} />{/if}
    <div class="txt">
      <h3>{championName(champ) || '...'}</h3>
      {#if slot.display_name}<span>{slot.display_name}</span>{/if}
    </div>
  </div>
  {#if onswap}
    <button class="swap" class:src={swapSource} onclick={(e) => { e.stopPropagation(); onswap?.(); }} aria-pressed={swapSource} title="Swap lanes" aria-label="Swap lanes">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
      </svg>
    </button>
  {/if}
</article>

<style>
  .card { position: relative; flex: 1; min-height: 0; overflow: hidden; z-index: 1; background: var(--bg-1); border-bottom: 1px solid rgb(7 9 13 / 0.6); }
  .fixable { cursor: pointer; box-shadow: inset 0 0 0 2px var(--accent); animation: fixpulse 1.2s ease-in-out infinite alternate; }
  @keyframes fixpulse { to { box-shadow: inset 0 0 0 2px color-mix(in oklch, var(--accent) 35%, transparent); } }
  @media (prefers-reduced-motion: reduce) { .fixable { animation: none; } }
  .card:last-child { border-bottom: 0; }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 24%; }
  .shade { position: absolute; inset: 0; background: linear-gradient(to right, rgb(7 9 13 / 0.82), rgb(7 9 13 / 0.15) 70%); }
  .enemy .shade { background: linear-gradient(to left, rgb(7 9 13 / 0.82), rgb(7 9 13 / 0.15) 70%); }
  .line { position: absolute; top: 0; bottom: 0; width: 4px; }
  .ally .line { left: 0; background: linear-gradient(to bottom, var(--team-blue), var(--team-blue-2)); }
  .enemy .line { right: 0; background: linear-gradient(to bottom, var(--team-red), var(--team-red-2)); }
  .info { position: absolute; bottom: 12px; display: flex; align-items: center; gap: 12px; }
  .ally .info { left: 20px; }
  .enemy .info { right: 20px; flex-direction: row-reverse; text-align: right; }
  .txt { display: flex; flex-direction: column; }
  h3 { font-size: clamp(26px, 3.7vh, 46px); line-height: 0.95; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; text-shadow: 0 2px 6px rgb(0 0 0 / 0.9), 0 3px 22px rgb(0 0 0 / 0.9); }
  span { font-size: 15px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dim); }
  .swap {
    position: absolute; top: 10px; right: 10px; display: grid; place-items: center; width: 34px; height: 34px; padding: 0; cursor: pointer;
    color: var(--text); background: rgb(7 9 13 / 0.6); border: 1px solid var(--line); transition: border-color 0.2s, background 0.2s, color 0.2s;
  }
  .enemy .swap { right: auto; left: 10px; }
  .swap:hover { border-color: var(--accent); }
  .swap.src { color: var(--bg-0); background: var(--accent); border-color: var(--accent); }
  .swap:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
