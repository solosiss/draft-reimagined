<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  // Capas: .btn (resplandor y gemas, sin recorte) > .ring (marco cónico) > .plate (placa) > .fx / .label / .chev
  let { variant = 'default', class: cls = '', children, ...rest }: { variant?: 'default' | 'primary' | 'danger'; class?: string; children: Snippet } & HTMLButtonAttributes = $props();
  let el = $state<HTMLButtonElement>();

  // La posición del mouse alimenta el foco de luz y el origen de la onda del clic.
  function track(e: PointerEvent) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px');
    el.style.setProperty('--my', e.clientY - r.top + 'px');
  }
  function press(e: PointerEvent) {
    track(e);
    el?.classList.remove('pressed');
    void el?.offsetWidth; // reinicia la animación si se pulsa dos veces seguidas
    el?.classList.add('pressed');
  }
</script>

<button bind:this={el} class="btn {variant} {cls}" onpointermove={track} onpointerdown={press} {...rest}>
  <span class="ring"><span class="plate"><i class="fx"></i><span class="label">{@render children()}</span><span class="chev"></span></span></span>
</button>

<style>
  .btn {
    --tone: var(--gold); --tone-hi: var(--gold-hi);
    --mx: 50%; --my: 50%;
    position: relative; display: inline-block; padding: 0; border: 0; background: none; cursor: pointer; font: inherit; color: var(--tone-hi);
    filter: drop-shadow(0 0 calc(3px + var(--breath) * 9px + var(--lift) * 9px) color-mix(in oklch, var(--tone) calc(22% + var(--breath) * 28% + var(--lift) * 25%), transparent));
    animation: breathe 3.6s ease-in-out infinite, spin 9s linear infinite;
    transition: --lift 0.4s cubic-bezier(0.16, 1, 0.3, 1), scale 0.12s, color 0.25s;
  }
  .ring {
    display: block; padding: 1.5px;
    background: conic-gradient(from var(--a), var(--gold-lo), var(--tone-hi) 10%, var(--gold-lo) 26%, var(--gold-lo) 70%, var(--tone) 86%, var(--gold-lo));
    clip-path: polygon(15px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 6px 100%, 0 calc(100% - 6px), 0 15px);
  }
  .plate {
    position: relative; isolation: isolate; overflow: hidden; display: flex; align-items: center; justify-content: center; gap: 14px; padding: 16px 34px;
    background:
      linear-gradient(0deg, color-mix(in oklch, var(--tone) calc(30% + var(--breath) * 30% + var(--lift) * 25%), transparent) 0, transparent 2px),
      radial-gradient(120% 150% at 50% 135%, color-mix(in oklch, var(--tone) calc(16% + var(--breath) * 22% + var(--lift) * 20%), transparent), transparent 70%),
      linear-gradient(180deg, #1d2d3a, #0a1520);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.1), inset 0 0 0 1px rgb(255 240 200 / 0.06), inset 0 -10px 18px -12px rgb(0 0 0 / 0.8);
    clip-path: polygon(14px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 5px 100%, 0 calc(100% - 5px), 0 14px);
  }
  /* foco que sigue al mouse */
  .plate::before { content: ''; position: absolute; inset: 0; z-index: -1; opacity: 0; transition: opacity 0.3s;
    background: radial-gradient(150px circle at var(--mx) var(--my), color-mix(in oklch, var(--tone-hi) 36%, transparent), transparent 70%); }
  .btn:hover:not(:disabled) .plate::before { opacity: 1; }
  /* destello diagonal blanco: solo al entrar el mouse */
  .plate::after { content: ''; position: absolute; top: -30%; bottom: -30%; left: 0; width: 34%; pointer-events: none; transform: skewX(-22deg); translate: -140% 0;
    background: linear-gradient(90deg, transparent, rgb(255 244 214 / 0.38), transparent); }
  .btn:hover:not(:disabled) .plate::after { animation: shine 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
  /* onda al hacer clic: nace donde pulsaste */
  .fx { position: absolute; z-index: -1; left: var(--mx); top: var(--my); width: 10px; height: 10px; translate: -50% -50%; border-radius: 50%; opacity: 0; pointer-events: none;
    background: radial-gradient(circle, color-mix(in oklch, var(--tone-hi) 75%, transparent), transparent 65%); }
  .btn:global(.pressed) .fx { animation: ripple 0.65s cubic-bezier(0.16, 1, 0.3, 1); }

  .label { position: relative; z-index: 1; font-size: 20px; line-height: 1; letter-spacing: calc(0.2em + var(--lift) * 0.05em); text-indent: 0.2em; text-transform: uppercase; font-weight: 700;
    text-shadow: 0 0 calc(4px + var(--breath) * 10px) color-mix(in oklch, var(--tone) 55%, transparent); }
  /* chevron hecho con bordes, avanza al pasar el mouse */
  .chev { position: relative; z-index: 1; width: 8px; height: 8px; border: solid currentColor; border-width: 2px 2px 0 0; rotate: 45deg; translate: calc(var(--lift) * 5px) 0; opacity: calc(0.55 + var(--lift) * 0.45); }

  /* gemas incrustadas en los lados */
  .btn::before, .btn::after { content: ''; position: absolute; z-index: 2; top: 50%; width: 9px; height: 9px; rotate: 45deg; pointer-events: none;
    background: linear-gradient(135deg, var(--tone-hi), var(--tone) 60%, var(--gold-lo)); box-shadow: 0 0 calc(3px + var(--breath) * 6px + var(--lift) * 8px) var(--tone);
    opacity: calc(0.7 + var(--breath) * 0.3); scale: calc(1 + var(--lift) * 0.35); transition: scale 0.3s, filter 0.15s; }
  .btn::before { left: -5px; translate: 0 -50%; }
  .btn::after { right: -5px; translate: 0 -50%; }

  .btn:hover:not(:disabled) { --lift: 1; color: #fff; animation-duration: 2.2s, 3.5s; }
  .btn:active:not(:disabled) { scale: 0.965; }
  .btn:active:not(:disabled) .plate { box-shadow: inset 0 3px 10px rgb(0 0 0 / 0.65), inset 0 0 0 1px rgb(255 240 200 / 0.12); }
  .btn:active:not(:disabled)::before, .btn:active:not(:disabled)::after { filter: brightness(1.8); scale: 1.7; }
  .btn:focus-visible { outline: 2px solid var(--tone-hi); outline-offset: 5px; }
  .btn:disabled { cursor: not-allowed; opacity: 0.4; filter: saturate(0.4); animation: none; }

  .primary { color: #1a1206; }
  .primary .ring { background: conic-gradient(from var(--a), #fff6dc, var(--gold-lo) 28%, var(--gold-hi) 58%, var(--gold-lo)); }
  .primary .plate { background:
      radial-gradient(90% 170% at 50% -45%, rgb(255 255 255 / calc(0.06 + var(--lift) * 0.3)), transparent 60%),
      linear-gradient(180deg, color-mix(in oklch, var(--gold-hi) calc(70% + var(--breath) * 30%), var(--gold)), var(--gold) 55%, #a98a4a); }
  .primary .label { text-shadow: 0 1px 0 rgb(255 255 255 / 0.35); }
  .primary:hover:not(:disabled) { color: #0d0803; }
  .danger { --tone: var(--ban-red); --tone-hi: #ffb3ba; }

  @keyframes ripple { from { opacity: 0.9; scale: 1; } to { opacity: 0; scale: 30; } }
  @keyframes shine { from { translate: -140% 0; } to { translate: 420% 0; } }
  /* @keyframes breathe y spin se definen en app.css: animan propiedades registradas con @property */

  @media (prefers-reduced-motion: reduce) {
    .btn { animation: none; --breath: 0.5; transition: color 0.15s; }
    .plate::after, .fx { display: none; }
    .btn:active:not(:disabled) { scale: 1; }
  }
</style>
