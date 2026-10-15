<script lang="ts">
  import { championName, splashUrl } from '../champions.svelte';

  let { id, side, ondone }: { id: number; side: 'ally' | 'enemy'; ondone: () => void } = $props();

  // Con prefers-reduced-motion no hay animación CSS: se muestra fijo y se cierra solo.
  $effect(() => {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(ondone, 2200);
    return () => clearTimeout(t);
  });
</script>

<!-- Ban: abre desde el centro (0,7 s) ya en gris, se queda hasta los 2,2 s y cierra en 0,7 s. Todo en CSS. -->
<div class="showcase {side}" aria-live="polite"
     onanimationend={(e) => e.target === e.currentTarget && ondone()}>
  <img src={splashUrl(id)} alt="" />
  <div class="veil"></div>
  <!-- tachado: diagonal de arriba-izquierda a abajo-derecha, se dibuja casi a la vez que abre la imagen -->
  <div class="strike" aria-hidden="true"></div>
  <span class="edge"></span>
  <h2>{championName(id)}</h2>
</div>

<style>
  .showcase {
    position: absolute; inset: 0; z-index: 5; background: var(--bg-0); overflow: hidden;
    clip-path: inset(0 50% 0 50%); animation: sc 2.9s linear forwards;
  }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 22%; filter: grayscale(1) brightness(0.85); }
  .veil { position: absolute; inset: 0; background: linear-gradient(to right, rgb(7 9 13 / 0.85), transparent 60%); }
  .enemy .veil { background: linear-gradient(to left, rgb(7 9 13 / 0.85), transparent 60%); }
  .strike {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to top right, transparent calc(50% - 6px), var(--ban-red) calc(50% - 6px), var(--ban-red) calc(50% + 6px), transparent calc(50% + 6px));
    clip-path: inset(0 100% 0 0); animation: strike 0.35s cubic-bezier(0.5, 0, 0.2, 1) 0.3s forwards;
  }
  @keyframes strike { to { clip-path: inset(0 0 0 0); } }
  .edge { position: absolute; top: 0; bottom: 0; width: 4px; }
  .edge { background: var(--ban); }
  .ally .edge { left: 0; }
  .enemy .edge { right: 0; }
  h2 {
    position: absolute; bottom: 24px; font-size: clamp(56px, 9vw, 120px); line-height: 0.9; font-weight: 700;
    letter-spacing: 0.04em; text-transform: uppercase; text-shadow: 0 4px 24px rgb(0 0 0 / 0.7);
    animation: nameIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both;
  }
  .ally h2 { left: 40px; --from: -40px; }
  .enemy h2 { right: 40px; --from: 40px; }

  @keyframes sc {
    0% { clip-path: inset(0 50% 0 50%); animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1); }
    24% { clip-path: inset(0 0 0 0); }
    76% { clip-path: inset(0 0 0 0); animation-timing-function: cubic-bezier(0.7, 0, 0.8, 0.2); }
    100% { clip-path: inset(0 50% 0 50%); }
  }
  @keyframes nameIn { from { opacity: 0; transform: translateX(var(--from)); } }
  @media (prefers-reduced-motion: reduce) {
    .showcase { animation: none; clip-path: none; }
    .strike { animation: none; clip-path: none; }
    h2 { animation: none; }
  }
</style>
