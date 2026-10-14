<script lang="ts">
  import type { PlayerSlot } from '../types';
  import Lane from '../Lane.svelte';
  import { splashUrl } from '../champions.svelte';

  let { slot, side, isMe, active, swapSource = false, onswap, onselect, fixable = false }: {
    slot: PlayerSlot; side: 'ally' | 'enemy'; isMe: boolean; active: boolean; swapSource?: boolean; onswap?: () => void; onselect?: () => void; fixable?: boolean;
  } = $props();

  const champ = $derived(slot.champion_id ?? slot.pick_intent);
  // Nombres que se muestran partidos a propósito (el \n lo respeta white-space: pre-line).
  const label = $derived(slot.display_name ?? '');
  const LANE: Record<string, string> = {
    top: 'TOP', jungle: 'JUNGLE', middle: 'MIDDLE', bottom: 'BOTTOM', utility: 'SUPPORT',
  };

  // El splash aparece con fundido cuando termina de cargar (no de golpe).
  const fadeIn = (node: HTMLImageElement) => {
    const show = () => node.classList.add('in');
    if (node.complete) show(); else node.addEventListener('load', show, { once: true });
  };
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
<article class="panel {side}" class:selectable={!!onselect} class:fixable onclick={onselect} class:locked={slot.is_locked} class:me={isMe} class:active data-cell={slot.cell_id}>
  <div class="art">
    {#if champ}
      {#key champ}<img use:fadeIn src={splashUrl(champ)} alt="" class:hover={!slot.is_locked} />{/key}
    {/if}
  </div>
  <div class="shade"></div>
  <span class="line"></span>
  <span class="name">{label}</span>
  {#if slot.is_locked && onswap}
    <button class="swap" class:src={swapSource} onclick={(e) => { e.stopPropagation(); onswap?.(); }} aria-pressed={swapSource} title="Swap lanes" aria-label="Swap lanes">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
      </svg>
    </button>
  {/if}
  {#if LANE[slot.position]}<span class="role"><Lane lane={LANE[slot.position]} size={24} /></span>{/if}
</article>

<style>
  .panel {
    position: relative; flex: 1; min-width: 0; overflow: hidden; background: var(--bg-1);
    border-right: 1px solid var(--line);
  }
  .art, .shade { position: absolute; inset: 0; }
  img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 20%; opacity: 0; transition: opacity 0.4s ease; }
  img:global(.in) { opacity: 1; }
  img:global(.in).hover { opacity: 0.55; transition: none; } /* intención/hover: sin fundido */
  .shade { background: linear-gradient(to bottom, transparent 35%, var(--bg-0) 100%); }
  .line { position: absolute; top: 0; bottom: 0; width: 2px; }
  .ally .line { left: 0; background: linear-gradient(to bottom, var(--team-blue), var(--team-blue-2)); }
  .enemy .line { right: 0; background: linear-gradient(to bottom, var(--team-red), var(--team-red-2)); }
  .name {
    position: absolute; left: 14px; bottom: 56px;
    writing-mode: vertical-rl; transform: rotate(180deg); transform-origin: center;
    font-size: clamp(20px, 2.4vw, 34px); font-weight: 700; letter-spacing: 0.04em; line-height: 1; white-space: pre-line;
    text-transform: uppercase; max-height: calc(100% - 100px); /* si no cabe, parte en otra columna */
  }
  .role {
    position: absolute; bottom: 14px; left: 14px;
    display: flex; color: var(--text-dim);
  }
  .swap {
    position: absolute; top: 10px; right: 10px; z-index: 2; display: grid; place-items: center; width: 34px; height: 34px; padding: 0; cursor: pointer;
    color: var(--text); background: rgb(7 9 13 / 0.6); border: 1px solid var(--line); transition: border-color 0.2s, background 0.2s, color 0.2s;
  }
  .swap:hover { border-color: var(--accent); }
  .swap.src { color: var(--bg-0); background: var(--accent); border-color: var(--accent); }
  .swap:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .selectable { cursor: pointer; }
  .fixable { cursor: pointer; box-shadow: inset 0 0 0 2px var(--accent); animation: fixpulse 1.2s ease-in-out infinite alternate; }
  @keyframes fixpulse { to { box-shadow: inset 0 0 0 2px color-mix(in oklch, var(--accent) 35%, transparent); } }
  @media (prefers-reduced-motion: reduce) { .fixable { animation: none; } }
  .active { box-shadow: inset 0 0 0 2px var(--accent); }
  .role :global(.lane) { opacity: 0.8; }
</style>
