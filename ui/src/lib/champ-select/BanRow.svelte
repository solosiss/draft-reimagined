<script lang="ts">
  import BanTile from './BanTile.svelte';
  import { tileUrl } from '../champions.svelte';

  // intent: campeón señalado para el ban en curso (visible para ambos equipos); ocupa el siguiente hueco de su lado.
  let { allyBans, enemyBans, intent = null }: { allyBans: number[]; enemyBans: number[]; intent?: { id: number; side: 'ally' | 'enemy' } | null } = $props();
  const slots = (b: number[]) => Array.from({ length: 5 }, (_, i) => b[i] ?? null);
</script>

<div class="bans">
  {#each [{ list: allyBans, side: 'ally' }, { list: enemyBans, side: 'enemy' }] as g (g.side)}
    <div class="group {g.side}" aria-label="bans {g.side}">
      {#each slots(g.list) as id, i (i)}
        {#if id && id > 0}
          <BanTile {id} side={g.side as 'ally' | 'enemy'} showName />
        {:else if id === -1}
          <div class="slot skipped" title="No ban"><span class="x"></span></div>
        {:else if intent?.side === g.side && i === g.list.length}
          <div class="slot intent {g.side}"><img src={tileUrl(intent.id)} alt="" /></div>
        {:else}
          <div class="slot"></div>
        {/if}
      {/each}
    </div>
  {/each}
  <span class="label">BANS</span>
</div>

<style>
  .bans {
    position: relative; z-index: 1; height: 84px; padding: 0 16px;
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(var(--bg-1), transparent);
  }
  .group { display: flex; gap: 6px; }
  .slot { width: 44px; height: 44px; background: var(--bg-2); border: 1px solid var(--line); }
  .group { align-items: flex-start; }
  .slot.skipped { position: relative; overflow: hidden; background: #000; }
  .slot.skipped .x { position: absolute; left: -10%; top: 50%; width: 120%; height: 3px; margin-top: -1.5px; background: var(--ban-red); box-shadow: 0 0 6px var(--ban-red); transform: rotate(-45deg); }
  .slot.intent { padding: 0; opacity: 0.75; animation: ghost 1.2s ease-in-out infinite alternate; }
  .slot.intent.ally { border-color: var(--team-blue); }
  .slot.intent.enemy { border-color: var(--team-red); }
  .slot.intent img { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(0.6); }
  @keyframes ghost { to { opacity: 0.4; } }
  @media (prefers-reduced-motion: reduce) { .slot.intent { animation: none; } }
  .label {
    position: absolute; left: 50%; transform: translateX(-50%);
    font-size: 18px; font-weight: 700; letter-spacing: 0.3em; color: var(--text-dim);
  }
</style>
