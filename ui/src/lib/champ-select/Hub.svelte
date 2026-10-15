<script lang="ts">
  import Button from '../Button.svelte';
  import { champSelect, lockIn } from '../store/champSelect.svelte';
  import type { ChampSelectState } from '../types';
  import { SERIES } from '../teams.svelte';
  import { isDarkLogo } from '../images';
  import { BROADCAST } from '../mode';

  let { cs }: { cs: ChampSelectState } = $props();
  const done = $derived([...cs.allies, ...cs.enemies].every((s) => s.is_locked));
  const phase = $derived(
    cs.turn ? (champSelect.phase ?? (cs.turn.action_type === 'ban' ? 'BAN PHASE' : 'PICK PHASE'))
      : !done && cs.ends_at_ms !== null ? 'PREPICK' : 'FINALIZATION',
  );
  let darkLogo = $state(false);
  $effect(() => { if (SERIES.tournamentLogo) isDarkLogo(SERIES.tournamentLogo).then((v) => (darkLogo = v)); else darkLogo = false; });
  const wins = $derived(Math.ceil(SERIES.bestOf / 2));
  const line = $derived([SERIES.tournament, SERIES.stage].filter(Boolean).join(' / '));
  const prepick = $derived(!cs.turn && !done && cs.ends_at_ms !== null);
  // Coach: el turno es del lado que actúa (blue o red), no de un jugador propio.
  const side = $derived(cs.turn && cs.allies.some((s) => s.cell_id === cs.turn!.actor_cell_id) ? 'BLUE' : 'RED');
  const me = $derived(cs.allies.find((s) => s.cell_id === cs.my_cell_id));
  const pick = $derived(champSelect.selection);
  const canLock = $derived(!!cs.turn?.is_my_turn && !!pick && !me?.is_locked);

</script>

<section class="hub">
  <span class="phase">{phase}</span>
  {#if SERIES.tournamentLogo}<img class="tlogo" class:dark={darkLogo} src={SERIES.tournamentLogo} alt={SERIES.tournament} />{/if}
  {#if line}<span class="tline">{line}</span>{/if}
  <!-- marcador de la serie -->
  <div class="series" aria-label="Game {SERIES.game}, best of {SERIES.bestOf}">
    <span class="g">{#if SERIES.bestOf > 1}Game {SERIES.game} · {/if}BO{SERIES.bestOf}</span>
    {#if SERIES.bestOf > 1}
      <div class="score">
        <span class="pips blue">{#each Array(wins) as _, i}<i class:on={i < SERIES.score[0]}></i>{/each}</span>
        <span class="sc">{SERIES.score[0]} : {SERIES.score[1]}</span>
        <span class="pips red">{#each Array(wins) as _, i}<i class:on={i < SERIES.score[1]}></i>{/each}</span>
      </div>
    {/if}
  </div>
  <span class="turn" class:mine={cs.turn?.is_my_turn}>
  {#if cs.turn?.is_my_turn}{side} TURN{:else if cs.turn}IN PROGRESS{:else if prepick}SELECT A CHAMPION{:else if done}ADJUST LANES{/if}
  </span>
  {#if !BROADCAST && cs.turn?.is_my_turn}
    {#if cs.turn.action_type === 'ban'}
      <button class="lock ban" disabled={!canLock} onclick={() => pick && lockIn(pick)}>
        <svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" /><path d="M6 18L18 6" />
        </svg>
        <span class="txt">BAN</span>
      </button>
    {:else}
      <Button variant="primary" disabled={!canLock} onclick={() => pick && lockIn(pick)}>Lock in</Button>
    {/if}
  {/if}
</section>

<style>
  .hub {
    isolation: isolate; flex: 0 0 17%; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 10px; background: var(--bg-1);
    border-right: 1px solid var(--line); position: relative;
  }
  .tlogo { max-width: 80%; max-height: clamp(80px, 16vh, 180px); object-fit: contain; filter: drop-shadow(0 4px 14px rgb(0 0 0 / 0.5)); }
  .tlogo.dark { filter: drop-shadow(0 0 3px rgb(255 255 255 / 0.9)) drop-shadow(0 0 18px rgb(255 255 255 / 0.45)); }
  .tline { font-size: 15px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--text); opacity: 0.85; text-align: center; padding: 0 8px; }
  .series { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .g { font-size: 14px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--text-dim); }
  .score { display: flex; align-items: center; gap: 10px; }
  .sc { font-size: 24px; font-weight: 600; letter-spacing: 0.1em; font-variant-numeric: tabular-nums; }
  .pips { display: flex; gap: 5px; }
  .pips i { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid var(--text-dim); transition: background 0.3s, border-color 0.3s; }
  .pips.blue i.on { background: var(--team-blue); border-color: var(--team-blue); }
  .pips.red i.on { background: var(--team-red); border-color: var(--team-red); }
  .phase { font-size: 16px; letter-spacing: 0.25em; color: var(--text-dim); }
  .turn { font-size: 18px; letter-spacing: 0.2em; color: var(--text-dim); min-height: 1.2em; }
  .turn.mine { color: var(--accent); }
  .lock {
    padding: 8px 28px; font: inherit; font-size: 20px; font-weight: 700; letter-spacing: 0.2em;
    color: var(--bg-0); background: var(--accent); border: 0; cursor: pointer;
  }
  .lock:disabled { opacity: 0.35; cursor: not-allowed; }
  .lock:focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }
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
