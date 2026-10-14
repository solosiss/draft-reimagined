<script lang="ts">
  let { endsAtMs, isInfinite }: { endsAtMs: bigint | null; isInfinite: boolean } = $props();
  let fill = $state<HTMLElement>();
  let total = 0; // duración de la fase: se re-fija cuando el tiempo restante sube (fase nueva)
  let lastRem = 0;

  $effect(() => {
    if (!fill || isInfinite || endsAtMs === null) return;
    const end = Number(endsAtMs);
    const rem = end - Date.now();
    if (rem > lastRem + 1000 || total === 0) total = rem;
    let raf = 0;
    const tick = () => {
      lastRem = Math.max(0, end - Date.now());
      fill!.style.transform = `scaleX(${total > 0 ? Math.min(1, lastRem / total) : 0})`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="bar" class:infinite={isInfinite || endsAtMs === null} role="presentation">
  <div class="fill" bind:this={fill}></div>
</div>

<style>
  .bar { position: relative; z-index: 2; height: 5px; background: var(--bg-0); border-block: 1px solid #5c4a24; }
  .fill {
    height: 100%; transform-origin: center; will-change: transform;
    background: linear-gradient(to bottom, #f0d58c, #c8a24a 50%, #8a6a24);
    box-shadow: 0 0 10px color-mix(in oklch, var(--accent) 60%, transparent);
  }
  .infinite .fill { transform: none !important; opacity: 0.35; }
</style>
