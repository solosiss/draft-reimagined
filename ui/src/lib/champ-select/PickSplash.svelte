<script lang="ts">
  import { gsap } from 'gsap';
  import { fade } from 'svelte/transition';
  import { championName, splashUrl } from '../champions.svelte';

  let { id, side, player }: { id: number; side: 'ally' | 'enemy'; player: string | null } = $props();
  let root = $state<HTMLElement>();

  // Entrada del pick: el arte entra con un leve zoom-out, el nombre desliza desde su lado.
  $effect(() => {
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.art', { scale: 1.1, opacity: 0, duration: 0.9, ease: 'power3.out' });
      gsap.from('.name', { x: side === 'ally' ? -56 : 56, opacity: 0, duration: 0.7, delay: 0.15, ease: 'power3.out' });
      gsap.from('.who', { opacity: 0, duration: 0.5, delay: 0.45 });
    }, root);
    return () => ctx.revert();
  });
</script>

<div class="pick {side}" bind:this={root} out:fade|global={{ duration: 350 }}>
  <img class="bg" src={splashUrl(id)} alt="" />
  <img class="art" src={splashUrl(id)} alt={championName(id)} />
  <div class="text">
    <h2 class="name">{championName(id)}</h2>
    {#if player}<span class="who">{player}</span>{/if}
  </div>
</div>

<style>
  .pick { position: absolute; inset: 0; overflow: hidden; }
  img { position: absolute; }
  .bg { inset: -6%; width: 112%; height: 112%; object-fit: cover; filter: blur(34px) brightness(0.4) saturate(1.15); }
  .art {
    left: 50%; translate: -50% 0; top: 0; height: 100%; width: auto; aspect-ratio: 1215 / 717; object-fit: cover;
    -webkit-mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent);
    mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent);
  }
  .text { position: absolute; bottom: 22px; display: flex; flex-direction: column; gap: 4px; }
  .ally .text { left: 40px; border-left: 4px solid var(--team-blue); padding-left: 16px; }
  .enemy .text { right: 40px; align-items: flex-end; text-align: right; border-right: 4px solid var(--team-red); padding-right: 16px; }
  h2 { font-size: clamp(48px, 8cqh, 110px); line-height: 0.9; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; text-shadow: 0 4px 24px rgb(0 0 0 / 0.7); }
  .who { font-size: 20px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dim); text-shadow: 0 2px 12px rgb(0 0 0 / 0.8); }
</style>
