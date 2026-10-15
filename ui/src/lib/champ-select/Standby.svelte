<script lang="ts">
  import { gsap } from 'gsap';
  import { TEAMS } from '../teams.svelte';

  let root = $state<HTMLElement>();

  // Entrada (tras subir la interfaz): el color florece desde los bordes, los logos salen del desenfoque hacia su sitio y el VS cierra (transform/opacity/filter, una sola vez).
  $effect(() => {
    if (!root) return;
    const q = (s: string) => root!.querySelectorAll(s);
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ delay: 1.0, timeScale: 1.4, defaults: { ease: 'power2.out' } }) // espera a que la interfaz termine de subir desde abajo
        .from(q('.wash'), { opacity: 0, duration: 1.6, ease: 'power1.inOut' }, 0)
        .from(q('.blue .art'), { opacity: 0, scale: 1.18, xPercent: -6, filter: 'blur(24px)', duration: 1.4 }, 0.2)
        .from(q('.red .art'), { opacity: 0, scale: 1.18, xPercent: 6, filter: 'blur(24px)', duration: 1.4 }, 0.2)
        .from(q('h2'), { y: () => root!.clientHeight * 0.45, duration: 1.1, ease: 'power3.out' }, 0.9)
        .from(q('.vs'), { opacity: 0, scale: 0.85, duration: 1, ease: 'power1.inOut' }, 1.1);
    });
    return () => mm.revert();
  });
</script>

<!-- Centro de la pantalla mientras aún no hay ningún pick (versión broadcast): los dos equipos enfrentados, una mitad cada uno, con el color fundido en el medio. -->
<div class="standby" bind:this={root} style:--cb={TEAMS.blue.c1} style:--cr={TEAMS.red.c1}>
  <div class="wash" aria-hidden="true"></div>
  {#each [TEAMS.blue, TEAMS.red] as t, i (i)}
    <div class="team {i ? 'red' : 'blue'}" style:--c={t.c1}>
      {#if t.logo}
        <div class="art">
          <img class="glow" src={t.logo} alt="" aria-hidden="true" />
          <img class="logo" src={t.logo} alt="" />
        </div>
      {:else}
        <span class="art mono" style:color={t.c1}>{t.name[0]}</span>
      {/if}
      <h2>{t.name}</h2>
    </div>
  {/each}
  <span class="vs">VS</span>
</div>

<style>
  .standby { position: relative; margin-top: -84px; /* sube por detrás de la fila de bans (84 px, ver BanRow) */ flex: 1; min-height: 0; display: flex; }
  /* un solo fondo continuo: cada color nace en su borde y se mezcla en el medio, sin corte */
  .wash {
    position: fixed; inset: 0; z-index: 0; /* a pantalla completa, por detrás de los bans y la tira */
    background:
      radial-gradient(75% 130% at 0% 40%, color-mix(in srgb, var(--cb) 50%, transparent), transparent 100%),
      radial-gradient(75% 130% at 100% 40%, color-mix(in srgb, var(--cr) 50%, transparent), transparent 100%);
  }
  .team { position: relative; flex: 1; min-width: 0; display: grid; place-items: center; }
  .team.blue { --to: right; --corner: 0% 0%; --edge: 0%; } .team.red { --to: left; --corner: 100% 0%; --edge: 100%; }
  .art { position: absolute; inset: 0; padding-top: 60px; display: grid; place-items: center; will-change: transform, opacity; }
  /* el mismo logo estirado a toda la mitad (esquina exterior → centro, de arriba a abajo) y muy difuminado;
     la máscara elíptica deja el color ancho en el borde exterior y estrecho en el centro (forma de reloj de arena) */
  .glow { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; transform: scale(1.2); filter: blur(44px) saturate(1.3); opacity: 0.9;
    mask-image: radial-gradient(ellipse 100% 50% at var(--edge) 50%, #000 45%, transparent 100%); }
  /* el logo ocupa el 100 % de su mitad: su punta exterior toca el borde y su final llega al centro, con un fundido corto */
  .logo { position: relative; width: 100%; height: 100%; object-fit: contain; object-position: var(--edge) 50%;
    mask-image: linear-gradient(to var(--to), #000 85%, transparent 100%); }
  .mono { font-size: clamp(160px, 70vh, 700px); font-weight: 700; line-height: 1; opacity: 0.4;
    mask-image: linear-gradient(to var(--to), #000 55%, transparent 100%); }
  /* velo inferior continuo para que el nombre se lea sobre cualquier logo */
  .standby::after { content: ''; position: absolute; inset: auto 0 0 0; height: 40%; background: linear-gradient(transparent, var(--bg-0)); pointer-events: none; }
  /* nombre con volumen: relleno en degradado blanco→color del equipo, borde fino y brillo de color */
  h2 {
    position: absolute; z-index: 1; bottom: clamp(16px, 5vh, 56px); left: 0; right: 0; text-align: center; font-size: clamp(32px, 6vh, 72px); font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
    background: linear-gradient(180deg, #fff 25%, color-mix(in srgb, var(--c) 55%, #fff) 70%, color-mix(in srgb, var(--c) 80%, #000) 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.6)) drop-shadow(0 6px 14px rgb(0 0 0 / 0.55)) drop-shadow(0 0 22px color-mix(in srgb, var(--c) 55%, transparent));
  }
  .vs {
    position: absolute; z-index: 2; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: clamp(48px, 9vh, 112px); font-weight: 700; letter-spacing: 0.2em; text-indent: 0.2em;
    background: linear-gradient(180deg, #fff 20%, #aeb8c8 55%, #5d6779 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
    filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.7)) drop-shadow(0 8px 18px rgb(0 0 0 / 0.7)) drop-shadow(0 0 26px rgb(255 255 255 / 0.18));
  }
</style>
