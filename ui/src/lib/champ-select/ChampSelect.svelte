<script lang="ts">
  import { gsap } from 'gsap';
  import { champSelect, hoverChampion, swapSlots, replacePick, selectPrepickCell } from '../store/champSelect.svelte';
  import BanRow from './BanRow.svelte';
  import Panel from './Panel.svelte';
  import TimeBar from './TimeBar.svelte';
  import Showcase from './Showcase.svelte';
  import Hub from './Hub.svelte';
  import LiveBackground from './LiveBackground.svelte';
  import Grid from './Grid.svelte';
  import PickSplash from './PickSplash.svelte';
  import FinalView from './FinalView.svelte';
  import Standby from './Standby.svelte';
  import { BROADCAST } from '../mode';
  import { TEAMS } from '../teams.svelte';

  const cs = $derived(champSelect.state);
  const unavailable = $derived(
    new Set<number>([
      ...(cs?.bans.ally_bans ?? []), ...(cs?.bans.enemy_bans ?? []),
      ...[...(cs?.allies ?? []), ...(cs?.enemies ?? [])].map((p) => p.champion_id ?? 0),
    ]),
  );
  const me = $derived(cs?.allies.find((s) => s.cell_id === cs.my_cell_id));
  let strip = $state<HTMLElement>();
  let entered = false;
  const locked = new Set<number>();
  let initialized = false;
  let showcase = $state<{ id: number; side: 'ally' | 'enemy'; key: number } | null>(null);
  let showcaseKey = 0;
  const seenBans = new Set<number>();

  // Cada ban nuevo abre el showcase (a color → gris → cierre) sobre la tira.
  $effect(() => {
    if (!cs) return;
    const all = [...cs.bans.ally_bans.map((id) => ({ id, side: 'ally' as const })),
                 ...cs.bans.enemy_bans.map((id) => ({ id, side: 'enemy' as const }))];
    for (const b of all) {
      if (b.id <= 0 || seenBans.has(b.id)) continue; // los bans saltados (-1) no abren showcase
      seenBans.add(b.id);
      if (bansInit) showcase = { ...b, key: ++showcaseKey };
    }
    bansInit = true;
  });
  let bansInit = false;

  // Swap de líneas: primer click elige un pick, segundo click sobre otro del mismo equipo los intercambia.
  const prepick = $derived(!!cs && !cs.turn && cs.ends_at_ms !== null && ![...cs.allies, ...cs.enemies].every((s) => s.is_locked));
  const isActive = (cell: number) => prepick ? champSelect.prepickCell === cell : cs?.turn?.actor_cell_id === cell;
  // Ban señalado pero aún sin fijar: lo ven ambos equipos en el siguiente hueco de bans de su lado.
  const banIntent = $derived(
    cs?.turn?.action_type === 'ban' && cs.turn.is_my_turn && champSelect.selection
      ? { id: champSelect.selection, side: cs.allies.some((s) => s.cell_id === cs.turn!.actor_cell_id) ? ('ally' as const) : ('enemy' as const) }
      : null,
  );
  // Fase final: la interfaz baja y sale; entra la vista de torneo (columnas por equipo, logos y VS).
  const finalizing = $derived(!!cs && !cs.turn && [...cs.allies, ...cs.enemies].every((s) => s.is_locked));
  let ui = $state<HTMLElement>();
  $effect(() => {
    if (!ui) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (finalizing) {
      gsap.to(ui, { yPercent: 100, opacity: 0, duration: reduce ? 0 : 0.7, ease: 'power3.in', overwrite: true, onComplete: () => { ui!.style.visibility = 'hidden'; } });
    } else {
      ui.style.visibility = '';
      gsap.to(ui, { yPercent: 0, opacity: 1, duration: reduce ? 0 : 0.5, ease: 'power3.out', overwrite: true });
    }
  });
  // Corregir un pick: el casco activa el modo, se elige el pick equivocado y se reemplaza su campeón; los turnos y tiempos no se tocan.
  let fixMode = $state(false);
  let fixCell = $state<number | null>(null);
  const fixSlot = $derived(fixCell === null ? null : [...(cs?.allies ?? []), ...(cs?.enemies ?? [])].find((s) => s.cell_id === fixCell) ?? null);
  const closeFix = () => { fixMode = false; fixCell = null; };
  function applyFix(id: number) {
    if (fixCell === null || !fixSlot) return;
    if (center?.id === fixSlot.champion_id) center = { ...center, id, key: ++centerKey };
    replacePick(fixCell, id);
    closeFix();
  }
  let swapFrom = $state<number | null>(null);
  function swapClick(cell: number) {
    if (swapFrom === null || swapFrom === cell) { swapFrom = swapFrom === cell ? null : cell; return; }
    const blue = (c: number) => !!cs?.allies.some((s) => s.cell_id === c);
    if (blue(swapFrom) === blue(cell)) { swapSlots(swapFrom, cell); swapFrom = null; } else swapFrom = cell;
  }

  // Splash al medio: cada pick fijado (aliado o rival) se muestra hasta el siguiente; en mi turno vuelve la grilla.
  let center = $state<{ id: number; side: 'ally' | 'enemy'; player: string | null; key: number } | null>(null);
  let centerKey = 0, picksInit = false;
  const picked = new Set<number>();
  $effect(() => {
    if (!cs) return;
    for (const s of [...cs.allies, ...cs.enemies]) {
      if (!s.is_locked) picked.delete(s.cell_id); // pick deshecho: podrá volver a mostrarse al fijarse otro
      if (!s.is_locked || !s.champion_id || picked.has(s.cell_id)) continue;
      picked.add(s.cell_id);
      if (picksInit) center = { id: s.champion_id, side: cs.allies.includes(s) ? 'ally' : 'enemy', player: s.display_name, key: ++centerKey };
    }
    picksInit = true;
  });
  // Solo entre picks: durante un ban (aunque ya se haya fijado) se queda la grilla, no el último pick.
  const showSplash = $derived(!!center && (BROADCAST || (!cs?.turn?.is_my_turn && cs?.turn?.action_type !== 'ban')));

  // Cascada de entrada (una vez) y destello al fijar campeón (por diff, no por evento).
  $effect(() => {
    if (!strip || !cs) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (!entered) {
        entered = true;
        gsap.from(strip!.querySelectorAll('.panel'), {
          yPercent: 8, opacity: 0, duration: 0.6, ease: 'power3.out',
          stagger: { each: 0.05, from: 'end' },
        });
      }
      for (const s of [...cs.allies, ...cs.enemies]) {
        if (s.is_locked && !locked.has(s.cell_id)) {
          // fuera de matchMedia: un cambio de estado a mitad de animación no debe revertirla
          if (initialized && s.champion_id && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // El panel se abre ~50 % en horizontal (los vecinos ceden espacio) y vuelve a su tamaño.
            const panel = strip!.querySelector<HTMLElement>(`[data-cell="${s.cell_id}"]`)!;
            gsap.timeline()
              .to(panel, { flexGrow: 2.25, duration: 0.5, ease: 'power3.out' })
              .to(panel, { flexGrow: 1, duration: 0.5, ease: 'power3.in' }, '+=1.2');
          }
          gsap.fromTo(strip!.querySelector(`[data-cell="${s.cell_id}"] .shade`),
            { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
        }
      }
    });
    locked.clear();
    for (const s of [...cs.allies, ...cs.enemies]) if (s.is_locked) locked.add(s.cell_id);
    initialized = true;
    return () => mm.revert();
  });
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (fixCell !== null ? (fixCell = null) : fixMode ? closeFix() : (swapFrom = null))} />

  <!-- los colores de los equipos solo se aplican en la fase final; antes rigen el azul y rojo por defecto -->
  <div class="screen" style:--team-blue={finalizing ? TEAMS.blue.c1 : null} style:--team-blue-2={finalizing ? TEAMS.blue.c2 : null} style:--team-red={finalizing ? TEAMS.red.c1 : null} style:--team-red-2={finalizing ? TEAMS.red.c2 : null}>
    <LiveBackground />
    {#if cs}
      <div class="ui" bind:this={ui} inert={finalizing}>
      <BanRow allyBans={cs.bans.ally_bans} enemyBans={cs.bans.enemy_bans} intent={banIntent} />
      {#if showSplash && center}
        <div class="mid">
          {#key center.key}<PickSplash id={center.id} side={center.side} player={center.player} />{/key}
        </div>
      {:else if BROADCAST}
        <Standby />
      {:else}
        <Grid {unavailable} selected={champSelect.selection} onpick={hoverChampion} />
      {/if}
      <TimeBar endsAtMs={cs.ends_at_ms} isInfinite={cs.is_infinite_timer} />
      <div class="strip" bind:this={strip}>
        {#if showcase}
          {#key showcase.key}
            <Showcase id={showcase.id} side={showcase.side} ondone={() => (showcase = null)} />
          {/key}
        {/if}
        {#each cs.allies as s (s.cell_id)}
          <Panel slot={s} side="ally" isMe={s.cell_id === cs.my_cell_id}
                 active={isActive(s.cell_id)} fixable={fixMode && s.is_locked} onselect={fixMode ? (s.is_locked ? () => (fixCell = s.cell_id) : undefined) : prepick && champSelect.prepickCell !== null ? () => selectPrepickCell(s.cell_id) : undefined} swapSource={swapFrom === s.cell_id} onswap={BROADCAST ? undefined : () => swapClick(s.cell_id)} />
        {/each}
        <Hub {cs} />
        {#each cs.enemies as s (s.cell_id)}
          <Panel slot={s} side="enemy" isMe={false}
                 active={isActive(s.cell_id)} fixable={fixMode && s.is_locked} onselect={fixMode ? (s.is_locked ? () => (fixCell = s.cell_id) : undefined) : prepick && champSelect.prepickCell !== null ? () => selectPrepickCell(s.cell_id) : undefined} swapSource={swapFrom === s.cell_id} onswap={BROADCAST ? undefined : () => swapClick(s.cell_id)} />
        {/each}
      </div>
      </div>
      {#if finalizing}<FinalView {cs} {swapFrom} onswap={BROADCAST ? undefined : swapClick} {fixMode} onfix={(cell) => (fixCell = cell)} />{/if}
      {#if !BROADCAST}
      <button class="undo" class:on={fixMode} onclick={() => (fixMode ? closeFix() : (fixMode = true))} disabled={!cs.allies.concat(cs.enemies).some((s) => s.is_locked)}
              title="Replace a pick" aria-label="Replace a pick" aria-pressed={fixMode}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 3.4C9.6 1 14.4 1 15 3.4" />
          <path d="M12 3C7.6 3 5 6.4 5 10.6V16c0 1.9 1.1 3 2.6 3.5L9 21h6l1.4-1.5C17.9 19 19 17.9 19 16v-5.4C19 6.4 16.4 3 12 3Z" />
          <path d="M8 11h8M12 11v6" />
        </svg>
      </button>
      {/if}
      {#if fixMode && fixCell === null}<p class="hint">Select the pick to replace · Esc to cancel</p>{/if}
      {#if fixSlot}
        <div class="modal" role="dialog" aria-label="Replace pick">
          <header><h2>Replace {fixSlot.display_name}'s pick</h2><button onclick={() => (fixCell = null)}>Cancel</button></header>
          <Grid {unavailable} selected={null} onpick={applyFix} />
        </div>
      {/if}
    {:else}
      <p class="wait">{#if !BROADCAST}Waiting for Champion Select…{:else if champSelect.status === 'searching'}Looking for the League client…{:else if champSelect.status === 'no-session'}League client found. Waiting for champion select…{:else if champSelect.status === 'connected'}Connected. Waiting for champion select…{:else}Reading the League client is not available here.{/if}</p>
    {/if}
  </div>

<style>
  .ui { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .screen { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; transition: --team-blue 0.8s, --team-blue-2 0.8s, --team-red 0.8s, --team-red-2 0.8s; }
  .undo {
    position: absolute; z-index: 6; right: 16px; bottom: 16px; display: grid; place-items: center; width: 54px; height: 54px; padding: 0; cursor: pointer;
    color: var(--text); background: rgb(7 9 13 / 0.72); border: 1px solid var(--line); border-radius: 50%; backdrop-filter: blur(6px);
    transition: border-color 0.2s, color 0.2s, transform 0.2s;
  }
  .undo:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); transform: translateY(-2px); }
  .undo:active:not(:disabled) { transform: scale(0.96); }
  .undo:disabled { opacity: 0.3; cursor: not-allowed; }
  .undo:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  .undo.on { color: var(--bg-0); background: var(--accent); border-color: var(--accent); }
  .hint { position: absolute; z-index: 7; left: 50%; top: 18px; translate: -50% 0; padding: 8px 20px; font-size: 18px; letter-spacing: 0.18em; text-transform: uppercase; background: rgb(7 9 13 / 0.85); border: 1px solid var(--accent); color: var(--accent); }
  .modal { position: absolute; z-index: 8; inset: 0; display: flex; flex-direction: column; padding: 20px 28px; background: rgb(7 9 13 / 0.94); backdrop-filter: blur(8px); }
  .modal header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
  .modal h2 { font-size: 30px; letter-spacing: 0.14em; text-transform: uppercase; }
  .modal header button { font: inherit; font-size: 17px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text); background: none; border: 1px solid var(--line); padding: 6px 18px; cursor: pointer; }
  .modal header button:hover { border-color: var(--text-dim); }
  .mid { position: relative; z-index: 1; flex: 1; min-height: 0; overflow: hidden; container-type: size; }
  .strip { position: relative; z-index: 1; display: flex; flex: 0 0 min(34vh, 300px); }
  .wait { position: relative; margin: auto; letter-spacing: 0.2em; color: var(--text-dim); text-transform: uppercase; }
</style>
