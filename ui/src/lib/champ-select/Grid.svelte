<script lang="ts">
  import { champions, preloadSplash, tileUrl } from '../champions.svelte';
  import { gsap } from 'gsap';
  import Lane from '../Lane.svelte';

  // unavailable: baneados o ya elegidos
  let { unavailable, selected = null, onpick }: {
    unavailable: Set<number>; selected?: number | null; onpick: (id: number) => void;
  } = $props();

  const LANES = [
    ['TOP', 'Top'], ['JUNGLE', 'Jungle'], ['MIDDLE', 'Mid'], ['BOTTOM', 'Bot'], ['SUPPORT', 'Support'],
  ];

  let query = $state('');
  let lane = $state<string | null>(null);
  const shown = $derived(
    champions.list.filter(
      (c) => (!lane || c.lanes.includes(lane)) && c.name.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  );

  // Al cambiar de lane, los tiles entran en cascada como la tira al cargar (solo transform/opacity).
  let gridEl = $state<HTMLElement>();
  let prevLane: string | null = null;
  $effect(() => {
    const changed = lane !== prevLane;
    prevLane = lane;
    shown; // re-ejecuta tras actualizar el DOM
    if (!changed || !gridEl) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(gridEl!.querySelectorAll('.tile'), {
        yPercent: 12, opacity: 0, duration: 0.45, ease: 'power3.out',
        stagger: { amount: 0.4, from: 'start' }, clearProps: 'transform,opacity',
      });
    });
    return () => mm.revert();
  });
</script>

<section class="grid-wrap">
  <header>
    <input type="search" placeholder="Search champion" bind:value={query} aria-label="Search champion" />
    <div class="lanes">
      {#each LANES as [key, label]}
        <button class:on={lane === key} onclick={() => (lane = lane === key ? null : key)}
                aria-pressed={lane === key} title={label} aria-label={label}>
          <Lane lane={key} size={26} {label} />
        </button>
      {/each}
    </div>
  </header>
  <div class="grid" bind:this={gridEl}>
    {#each shown as c (c.id)}
      <button class="tile" class:off={unavailable.has(c.id)} class:sel={selected === c.id} onclick={() => onpick(c.id)} onpointerenter={() => preloadSplash(c.id)} onfocus={() => preloadSplash(c.id)} disabled={unavailable.has(c.id)} title={c.name}>
        <img src={tileUrl(c.id)} alt={c.name} loading="lazy" decoding="async" />
        <span>{c.name}</span>
      </button>
    {:else}
      <p class="empty">{champions.list.length ? 'No results' : 'Loading champions…'}</p>
    {/each}
  </div>
</section>

<style>
  .grid-wrap { position: relative; z-index: 1; flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 0 16px; }
  header { display: flex; gap: 16px; align-items: center; padding: 8px 0; }
  input {
    width: 240px; padding: 6px 10px; background: var(--bg-2); color: var(--text);
    border: 1px solid var(--line); font: inherit; font-size: 18px;
  }
  input:focus-visible, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  .lanes { display: flex; gap: 14px; }
  .lanes button { padding: 2px; background: none; border: 0; color: var(--text-dim); cursor: pointer; }
  .lanes button :global(.lane) { opacity: 0.55; transition: opacity 0.15s; }
  .lanes button:hover :global(.lane), .lanes button.on :global(.lane) { opacity: 1; }
  .grid {
    flex: 1; min-height: 0; overflow-y: auto; padding: 4px 0 8px;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 6px; align-content: start;
  }
  .tile {
    background: var(--bg-2); border: 1px solid var(--line); padding: 0; cursor: pointer; color: var(--text);
    display: flex; flex-direction: column; font: inherit; content-visibility: auto; contain-intrinsic-size: 76px 96px;
  }
  .tile:hover:not(:disabled) { border-color: var(--accent); }
  .tile img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
  .tile span { font-size: 13px; padding: 2px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tile.sel { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .tile.off { cursor: not-allowed; }
  .tile.off img { filter: grayscale(1) brightness(0.5); }
  .tile.off span { color: var(--ban); }
  .empty { color: var(--text-dim); letter-spacing: 0.15em; grid-column: 1 / -1; padding: 16px 0; }
</style>
