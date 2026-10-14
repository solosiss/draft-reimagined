<script lang="ts">
  import { gsap } from 'gsap';
  import { fade } from 'svelte/transition';
  import type { ChampSelectState } from '../types';
  import FinalCard from './FinalCard.svelte';
  import Timer from './Timer.svelte';
  import TimeBar from './TimeBar.svelte';
  import Lane from '../Lane.svelte';
  import { tileUrl } from '../champions.svelte';
  import { TEAMS, SERIES } from '../teams.svelte';

  let { cs, swapFrom, onswap, fixMode = false, onfix }: { cs: ChampSelectState; swapFrom: number | null; onswap?: (cell: number) => void; fixMode?: boolean; onfix?: (cell: number) => void } = $props();
  let root = $state<HTMLElement>();
  const LANE: Record<string, string> = { top: 'TOP', jungle: 'JUNGLE', middle: 'MIDDLE', bottom: 'BOTTOM', utility: 'SUPPORT' };
  const wins = $derived(Math.ceil(SERIES.bestOf / 2));
  const slots = (b: number[]) => Array.from({ length: 5 }, (_, i) => b[i] ?? null);

  // Entrada tras salir la interfaz: columnas desde sus esquinas, color que se enciende, cabecera, enfrentamientos, bans y VS.
  $effect(() => {
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const from = { y: 180, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: { each: 0.08, from: 'end' as const } };
      gsap.timeline({ delay: 0.5 })
        .from('.cards.blue .card', { ...from, x: -160 }, 0)
        .from('.cards.red .card', { ...from, x: 160 }, 0)
        .from('.wash', { opacity: 0, duration: 1.2, ease: 'power2.out' }, 0.2)
        .from('.team', { opacity: 0, y: -24, duration: 0.6, ease: 'power3.out' }, 0.4)
        .from('.series, .clock, .bottom', { opacity: 0, duration: 0.6 }, 0.7)
        .from('.vs .txt', { opacity: 0, y: 10, letterSpacing: '0.7em', duration: 1.1, ease: 'power2.out' }, 0.9)
        .from('.vs .rule', { scaleX: 0, duration: 0.9, ease: 'power2.out' }, 1.0)
        .from('.mrow .hl', { scaleX: 0, duration: 0.8, ease: 'power2.out', stagger: 0.07 }, 1.0)
        .from('.mrow .lane', { opacity: 0, scale: 0.6, duration: 0.5, ease: 'back.out(2)', stagger: 0.07 }, 1.1)
        .from('.ban', { opacity: 0, y: 14, scale: 0.8, duration: 0.45, ease: 'power3.out', stagger: 0.04 }, 1.2);
    }, root);
    return () => ctx.revert();
  });
</script>

{#snippet bans(list: number[], team: 'blue' | 'red')}
  <div class="bans {team}" aria-label="{team} bans">
    {#each slots(list) as id, i (i)}
      <div class="ban" class:none={id === -1}>{#if id && id > 0}<img src={tileUrl(id)} alt="" /><span class="x"></span>{:else if id === -1}<span class="x"></span>{/if}</div>
    {/each}
  </div>
{/snippet}

{#snippet pips(team: 'blue' | 'red', score: number)}
  <span class="pips {team}" aria-label="{score} of {wins}">{#each Array(wins) as _, i}<i class:on={i < score}></i>{/each}</span>
{/snippet}

<section class="final" bind:this={root} out:fade|global={{ duration: 250 }}>
  <!-- color de cada equipo, difuminado hacia el centro -->
  <div class="wash left"></div>
  <div class="wash right"></div>

  <!-- fila 1: cabeceras y bloque central (serie, VS, reloj) -->
  <header class="team blue">
    {#if TEAMS.blue.wordmark ?? TEAMS.blue.logo}<img class="mini" src={TEAMS.blue.wordmark ?? TEAMS.blue.logo} alt={TEAMS.blue.name} />{:else}<h2>{TEAMS.blue.name}</h2>{/if}
  </header>
  <div class="top">
    <span class="series">{SERIES.tournament} / {SERIES.stage}</span>
    <div class="vsrow">
      <span class="side">Blue side</span>
      <div class="vs" role="img" aria-label="{TEAMS.blue.name} versus {TEAMS.red.name}">
        <span class="rule l"></span><span class="txt">VS</span><span class="rule r"></span>
      </div>
      <span class="side">Red side</span>
    </div>
    <div class="clock"><Timer endsAtMs={cs.ends_at_ms} isInfinite={cs.is_infinite_timer} size={40} /><div class="bar"><TimeBar endsAtMs={cs.ends_at_ms} isInfinite={cs.is_infinite_timer} /></div></div>
  </div>
  <header class="team red">
    {#if TEAMS.red.wordmark ?? TEAMS.red.logo}<img class="mini" src={TEAMS.red.wordmark ?? TEAMS.red.logo} alt={TEAMS.red.name} />{:else}<h2>{TEAMS.red.name}</h2>{/if}
  </header>

  <!-- fila 2: 5 picks por equipo y, entre ellos, el enfrentamiento de cada línea -->
  <div class="cards blue">
    {#each cs.allies as s (s.cell_id)}<FinalCard slot={s} side="ally" swapSource={swapFrom === s.cell_id} onswap={onswap ? () => onswap(s.cell_id) : undefined} fixable={fixMode} onselect={fixMode ? () => onfix?.(s.cell_id) : undefined} />{/each}
  </div>
  <div class="ladder" aria-label="Lane matchups">
    {#each cs.allies as s (s.cell_id)}
      <div class="mrow"><span class="hl l"></span>{#if LANE[s.position]}<span class="lane"><Lane lane={LANE[s.position]} size={34} /></span>{/if}<span class="hl r"></span></div>
    {/each}
  </div>
  <div class="cards red">
    {#each cs.enemies as s (s.cell_id)}<FinalCard slot={s} side="enemy" swapSource={swapFrom === s.cell_id} onswap={onswap ? () => onswap(s.cell_id) : undefined} fixable={fixMode} onselect={fixMode ? () => onfix?.(s.cell_id) : undefined} />{/each}
  </div>

  <!-- fila 3: bans de cada equipo y marcador de la serie -->
  {@render bans(cs.bans.ally_bans, 'blue')}
  <div class="bottom">
    <span class="game">{#if SERIES.bestOf > 1}Game {SERIES.game} / {/if}Best of {SERIES.bestOf}</span>
    {#if SERIES.bestOf > 1}<div class="score">{@render pips('blue', SERIES.score[0])}<span class="sc">{SERIES.score[0]} : {SERIES.score[1]}</span>{@render pips('red', SERIES.score[1])}</div>{/if}
  </div>
  {@render bans(cs.bans.enemy_bans, 'red')}
</section>

<style>
  .final {
    --hdr: clamp(120px, 19vh, 180px); --ftr: clamp(70px, 10vh, 100px);
    position: absolute; inset: 0; z-index: 4; display: grid; padding: 20px 28px; gap: 0 28px;
    grid-template-columns: minmax(290px, 27vw) 1fr minmax(290px, 27vw); grid-template-rows: var(--hdr) minmax(0, 1fr) var(--ftr);
  }
  .final > :not(.wash) { position: relative; z-index: 1; }

  /* colores de equipo que se difuminan al llegar al centro, con un resplandor mezclado donde se encuentran */
  .wash { position: absolute; top: 0; bottom: 0; width: 62%; pointer-events: none; }
  .wash.left { left: 0; background: linear-gradient(to right, color-mix(in oklch, var(--team-blue) 46%, transparent), color-mix(in oklch, var(--team-blue-2) 14%, transparent) 34%, transparent); }
  .wash.right { right: 0; background: linear-gradient(to left, color-mix(in oklch, var(--team-red) 46%, transparent), color-mix(in oklch, var(--team-red-2) 22%, transparent) 34%, transparent); }
  .final::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 22% 55% at 50% 50%, color-mix(in oklch, var(--team-blue-2) 12%, color-mix(in oklch, var(--team-red-2) 40%, transparent)), transparent 70%);
  }

  .team { grid-row: 1; display: flex; align-items: center; gap: 16px; padding: 0 6px 12px; min-height: 0; }
  .team.blue { grid-column: 1; } .team.red { grid-column: 3; flex-direction: row-reverse; text-align: right; }
  .mini { max-height: 100%; max-width: 100%; object-fit: contain; filter: drop-shadow(0 2px 10px rgb(0 0 0 / 0.5)); }
  .team h2 { font-size: clamp(30px, 4.4vh, 50px); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1; text-shadow: 0 2px 16px rgb(0 0 0 / 0.7); }

  .cards { grid-row: 2; display: flex; flex-direction: column; min-height: 0; }
  .cards.blue { grid-column: 1; } .cards.red { grid-column: 3; }

  /* centro, fila 1: serie, VS y reloj */
  .top { grid-column: 2; grid-row: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding-bottom: 12px; min-width: 0; }
  .series, .game { font-size: 16px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--text-dim); }
  .vsrow { display: flex; align-items: center; gap: clamp(14px, 2vw, 40px); }
  .side { font-size: 13px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--text-dim); opacity: 0.8; }
  .vs { display: flex; align-items: center; gap: clamp(10px, 1.4vw, 26px); }
  .txt { font-size: clamp(38px, 4.8vh, 60px); font-weight: 500; letter-spacing: 0.3em; margin-right: -0.3em; color: rgb(232 236 242 / 0.94); text-shadow: 0 2px 24px rgb(0 0 0 / 0.5); }
  .rule { width: clamp(30px, 4vw, 80px); height: 1px; }
  .rule.l { background: linear-gradient(to right, transparent, rgb(232 236 242 / 0.6)); transform-origin: right; }
  .rule.r { background: linear-gradient(to left, transparent, rgb(232 236 242 / 0.6)); transform-origin: left; }
  .clock { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .bar { width: clamp(120px, 12vw, 220px); }

  /* centro, fila 2: enfrentamiento por línea, alineado con las cartas */
  .ladder { grid-column: 2; grid-row: 2; display: flex; flex-direction: column; min-height: 0; }
  .mrow { flex: 1; min-height: 0; display: flex; align-items: center; gap: 14px; }
  .hl { flex: 1; height: 1px; }
  .hl.l { background: linear-gradient(to right, color-mix(in oklch, var(--team-blue) 70%, transparent), rgb(232 236 242 / 0.12)); transform-origin: left; }
  .hl.r { background: linear-gradient(to left, color-mix(in oklch, var(--team-red-2) 70%, transparent), rgb(232 236 242 / 0.12)); transform-origin: right; }
  .lane { display: grid; place-items: center; width: 54px; height: 54px; border: 1px solid var(--line); border-radius: 50%; background: rgb(7 9 13 / 0.6); }

  /* fila 3: bans por equipo y marcador */
  .bans { grid-row: 3; display: flex; align-items: center; gap: 8px; padding-top: 12px; }
  .bans.blue { grid-column: 1; } .bans.red { grid-column: 3; justify-content: flex-end; }
  .ban { position: relative; width: clamp(44px, 5.6vh, 60px); aspect-ratio: 1; overflow: hidden; background: rgb(7 9 13 / 0.5); border: 1px solid var(--line); }
  .ban.none { background: #000; }
  .ban img { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(1) brightness(0.75); }
  .x { position: absolute; left: -10%; top: 50%; width: 120%; height: 3px; margin-top: -1.5px; background: var(--ban-red); box-shadow: 0 0 6px var(--ban-red); transform: rotate(45deg); }
  .bottom { grid-column: 2; grid-row: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding-top: 12px; }
  .score { display: flex; align-items: center; gap: 14px; }
  .sc { font-size: 28px; font-weight: 600; letter-spacing: 0.12em; font-variant-numeric: tabular-nums; }
  .pips { display: flex; gap: 6px; }
  .pips i { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid var(--text-dim); transition: background 0.3s, border-color 0.3s; }
  .pips.blue i.on { background: var(--team-blue); border-color: var(--team-blue); }
  .pips.red i.on { background: var(--team-red-2); border-color: var(--team-red-2); }
</style>
