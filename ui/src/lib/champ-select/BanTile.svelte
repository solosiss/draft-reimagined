<script lang="ts">
  import { gsap } from 'gsap';
  import { championName, tileUrl } from '../champions.svelte';

  let { id, side, size = 44, showName = false }: { id: number; side: 'ally' | 'enemy'; size?: number; showName?: boolean } = $props();
  let img = $state<HTMLElement>();
  let line = $state<HTMLElement>();
  let label = $state<HTMLElement>();
  let gray = $state(false);

  // La imagen cae con rebote, a color, a los 0,75 s pasa a gris de golpe y una línea la tacha.
  $effect(() => {
    if (!img || !line) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline()
        .from(img!, { yPercent: -160, opacity: 0, duration: 0.55, ease: 'bounce.out' }, 0)
        .from(label ?? [], { opacity: 0, y: -6, duration: 0.3 }, 0.3)
        .call(() => { gray = true; }, [], 0.75)
        .from(line!, { scaleX: 0, duration: 0.25, ease: 'power2.out' }, 0.75);
    });
    mm.add('(prefers-reduced-motion: reduce)', () => { gray = true; });
    return () => mm.revert();
  });
</script>

<div class="wrap" style="width:{size}px">
  <div class="tile {side}" style="width:{size}px;height:{size}px">
    <img bind:this={img} class:gray src={tileUrl(id)} alt="" />
    <span class="line" bind:this={line}></span>
  </div>
  {#if showName}<span class="label" bind:this={label}>{championName(id)}</span>{/if}
</div>

<style>
  .tile { position: relative; overflow: hidden; border: 1px solid var(--line); background: var(--bg-2); }
  .ally { border-color: var(--team-blue); }
  .enemy { border-color: var(--team-red); }
  .wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .label { max-width: 64px; font-size: 12px; line-height: 1; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  img.gray { filter: grayscale(1) brightness(0.8); }
  .line {
    position: absolute; left: -10%; top: 50%; width: 120%; height: 3px; margin-top: -1.5px;
    background: var(--ban-red);
    transform: rotate(-45deg);
  }
</style>
