<script lang="ts">
  let { endsAtMs, isInfinite, size = 72 }: { endsAtMs: bigint | null; isInfinite: boolean; size?: number } = $props();
  let seconds = $state<number | null>(null);

  $effect(() => {
    if (isInfinite || endsAtMs === null) { seconds = null; return; }
    let raf = 0;
    const tick = () => {
      seconds = Math.max(0, Math.ceil((Number(endsAtMs) - Date.now()) / 1000));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="timer" style:font-size="{size}px" class:urgent={seconds !== null && seconds <= 5 && seconds > 0}>
  {seconds ?? '–'}
</div>

<style>
  .timer { font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
  .urgent { color: var(--ban-red); animation: pulse 1s ease-in-out infinite; }
  @keyframes pulse { 50% { transform: scale(1.08); opacity: 0.75; } }
  @media (prefers-reduced-motion: reduce) { .urgent { animation: none; } }
</style>
