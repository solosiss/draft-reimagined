<script lang="ts">
  import Timer from './Timer.svelte';
  import { gsap } from 'gsap';
  import BanTile from './BanTile.svelte';
  import { champSelect, lockIn } from '../store/champSelect.svelte';
  import type { ChampSelectState } from '../types';
  import { TEAMS } from '../teams.svelte';

  let { cs }: { cs: ChampSelectState } = $props();
  const done = $derived([...cs.allies, ...cs.enemies].every((s) => s.is_locked));
  const phase = $derived(
    cs.turn ? (champSelect.phase ?? (cs.turn.action_type === 'ban' ? 'BAN PHASE' : 'PICK PHASE'))
      : !done && cs.ends_at_ms !== null ? 'PREPICK' : 'FINALIZATION',
  );
  const prepick = $derived(!cs.turn && !done && cs.ends_at_ms !== null);
  // Coach: el turno es del lado que actúa (blue o red), no de un jugador propio.
  const side = $derived(cs.turn && cs.allies.some((s) => s.cell_id === cs.turn!.actor_cell_id) ? 'BLUE' : 'RED');
  const me = $derived(cs.allies.find((s) => s.cell_id === cs.my_cell_id));
  const pick = $derived(champSelect.selection);
  const canLock = $derived(!!cs.turn?.is_my_turn && !!pick && !me?.is_locked);

  // Cuando termina mi fase de baneo personal, los bans aparecen en el centro.
  let wasMyBan = false;
  let myBanDone = $state(false);
  $effect(() => {
    const myBanNow = !!cs.turn?.is_my_turn && cs.turn.action_type === 'ban';
    if (wasMyBan && !myBanNow) myBanDone = true;
    wasMyBan = myBanNow;
  });
  let squares = $state<HTMLElement>();
  $effect(() => {
    if (!myBanDone || !squares) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(squares!, { opacity: 0, y: 12, duration: 0.5, ease: 'power3.out' });
    });
    return () => mm.revert();
  });
</script>

{#snippet logo(t: 'blue' | 'red', on: unknown, off: unknown)}
  {#if TEAMS[t].logo}
    <img class="tl {t}" class:on class:off src={TEAMS[t].logo} alt={TEAMS[t].name} />
  {:else}
    <span class="tl mono {t}" class:on class:off role="img" aria-label={TEAMS[t].name}>{TEAMS[t].name[0]}</span>
  {/if}
{/snippet}

<section class="hub">
  <span class="phase">{phase}</span>
  <!-- logos de los equipos flanqueando el cronómetro; el del lado que actúa se enciende -->
  <div class="clock">
    {@render logo('blue', cs.turn && side === 'BLUE', cs.turn && side === 'RED')}
    <Timer endsAtMs={cs.ends_at_ms} isInfinite={cs.is_infinite_timer} />
    {@render logo('red', cs.turn && side === 'RED', cs.turn && side === 'BLUE')}
  </div>
  <span class="turn" class:mine={cs.turn?.is_my_turn}>
    {#if myBanDone}
    <div class="squares" bind:this={squares}>
      <div>{#each cs.bans.ally_bans.filter((b) => b > 0) as id (id)}<BanTile {id} side="ally" size={30} />{/each}</div>
      <div>{#each cs.bans.enemy_bans.filter((b) => b > 0) as id (id)}<BanTile {id} side="enemy" size={30} />{/each}</div>
    </div>
  {/if}
  {#if cs.turn?.is_my_turn}{side} TURN{:else if cs.turn}IN PROGRESS{:else if prepick}SELECT A CHAMPION{:else if done}ADJUST LANES{/if}
  </span>
  {#if cs.turn?.is_my_turn}
    <button class="lock" class:ban={cs.turn.action_type === 'ban'} disabled={!canLock} onclick={() => pick && lockIn(pick)}>
      {#if cs.turn.action_type === 'ban'}
        <svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" /><path d="M6 18L18 6" />
        </svg>
      {/if}
      <span class="txt">{cs.turn.action_type === 'ban' ? 'BAN' : 'LOCK IN'}</span>
    </button>
  {/if}
</section>

<style>
  .hub {
    isolation: isolate; flex: 0 0 17%; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 10px; background: var(--bg-1);
    border-right: 1px solid var(--line); position: relative;
  }
  .clock { display: flex; align-items: center; justify-content: center; gap: clamp(8px, 0.9vw, 18px); width: 100%; }
  .tl { width: clamp(46px, 3.8vw, 84px); height: clamp(46px, 3.8vw, 84px); object-fit: contain; transition: opacity 0.4s, filter 0.4s; }
  .tl.mono { display: grid; place-items: center; border-radius: 50%; border: 2px solid var(--c); color: var(--c); font-size: clamp(24px, 2vw, 40px); font-weight: 700; }
  .tl.off { opacity: 0.35; filter: grayscale(0.6); }
  .tl.on { filter: drop-shadow(0 0 10px var(--c)); }
  .tl.blue { --c: var(--team-blue); } .tl.red { --c: var(--team-red); }
  .phase { font-size: 16px; letter-spacing: 0.25em; color: var(--text-dim); }
  .turn { font-size: 18px; letter-spacing: 0.2em; color: var(--text-dim); min-height: 1.2em; }
  .turn.mine { color: var(--accent); }
  .lock {
    padding: 8px 28px; font: inherit; font-size: 20px; font-weight: 700; letter-spacing: 0.2em;
    color: var(--bg-0); background: var(--accent); border: 0; cursor: pointer;
  }
  .lock:disabled { opacity: 0.35; cursor: not-allowed; }
  .lock:focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }
  .squares { display: flex; flex-direction: column; gap: 6px; }
  .squares div { display: flex; gap: 4px; justify-content: center; }
  /* Botón de ban estilo broadcast: esquinas cortadas, filo rojo, cara oscura y trazos diagonales. */
  .lock.ban {
    --cut: 14px;
    position: relative; display: inline-flex; align-items: center; gap: 10px;
    padding: 12px 34px 12px 26px; color: #fff; overflow: hidden;
    background: linear-gradient(100deg, #ff4d5e, #b3182b 60%, #ff4d5e); /* filo */
    clip-path: polygon(var(--cut) 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%, 0 var(--cut));
    text-shadow: 0 0 10px rgb(255 77 94 / 0.8);
  }
  .lock.ban::before { /* cara: más oscura que el filo, con rayas diagonales y brillo rojo a la izquierda */
    content: ''; position: absolute; inset: 2px; z-index: -1;
    clip-path: polygon(calc(var(--cut) - 1px) 0, 100% 0, 100% calc(100% - var(--cut) + 1px), calc(100% - var(--cut) + 1px) 100%, 0 100%, 0 calc(var(--cut) - 1px));
    background:
      repeating-linear-gradient(115deg, transparent 0 9px, rgb(255 77 94 / 0.08) 9px 11px),
      linear-gradient(100deg, #5a0c18, #1a0509 70%);
  }
  .lock.ban::after { /* barrido de luz que respira: solo transform/opacity */
    content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none;
    background: linear-gradient(100deg, transparent 30%, rgb(255 120 130 / 0.45) 50%, transparent 70%);
    transform: translateX(-70%); animation: sweep 3.2s ease-in-out infinite;
  }
  .lock.ban .ico { color: var(--ban-red); filter: drop-shadow(0 0 4px var(--ban-red)); }
  .lock.ban:hover:not(:disabled) { filter: brightness(1.2); }
  .lock.ban:active:not(:disabled) { transform: translateY(1px) scale(0.98); }
  .lock.ban:disabled { filter: saturate(0.3) brightness(0.7); }
  .lock.ban:disabled::after { animation: none; opacity: 0; }
  @keyframes sweep { 0% { transform: translateX(-70%); opacity: 0; } 30% { opacity: 1; } 70%, 100% { transform: translateX(70%); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .lock.ban::after { animation: none; opacity: 0; } }
</style>
