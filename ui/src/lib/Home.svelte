<script lang="ts">
  import { gsap } from 'gsap';
  import LiveBackground from './champ-select/LiveBackground.svelte';
  import Button from './Button.svelte';
  import { TEAMS, SERIES, saveTeams, type Teams, type BestOf } from './teams.svelte';
  import { toDataUrl, dominantColor } from './images';

  import { BROADCAST } from './mode';

  let { onstart, ondemo, onclose }: { onstart: () => void; ondemo: () => void; onclose: () => void } = $props();
  let view = $state<'menu' | 'teams'>('menu');
  let box = $state<HTMLElement>();
  let draft = $state<Teams>($state.snapshot(TEAMS) as Teams);
  let bestOf = $state<BestOf>(SERIES.bestOf);
  let error = $state('');
  const FORMATS: BestOf[] = [1, 3, 5];
  const LANES = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];
  const SIDES = [{ key: 'blue', label: 'Blue side' }, { key: 'red', label: 'Red side' }] as const;

  // Cada vista entra con sus elementos escalonados (solo transform y opacidad).
  $effect(() => {
    view; // se re-ejecuta al cambiar de vista
    if (!box || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from(box.querySelectorAll('.anim'), { opacity: 0, y: 18, duration: 0.55, ease: 'power3.out', stagger: 0.08 });
  });

  function openSetup() { draft = $state.snapshot(TEAMS) as Teams; bestOf = SERIES.bestOf; error = ''; view = 'teams'; }
  function save() {
    if (!saveTeams(draft, bestOf)) { error = 'Not enough storage for these images. Try smaller logos.'; return; }
    view = 'menu';
  }
  // Sube un logo: se reduce, se guarda en el borrador y (para el logo principal) propone el color del equipo.
  async function upload(side: 'blue' | 'red', field: 'logo' | 'wordmark', e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    error = '';
    try {
      const url = await toDataUrl(file);
      draft[side][field] = url;
      if (field === 'logo') draft[side].c1 = await dominantColor(url);
    } catch { error = 'That file could not be read as an image.'; }
  }
</script>

{#snippet picker(side: 'blue' | 'red', field: 'logo' | 'wordmark', title: string, hint: string)}
  <div class="pick">
    <div class="thumb">{#if draft[side][field]}<img src={draft[side][field]} alt="" />{:else}<span>None</span>{/if}</div>
    <div class="pc">
      <strong>{title}</strong><small>{hint}</small>
      <div class="pb">
        <label class="mini">Upload<input type="file" accept="image/*" onchange={(e) => upload(side, field, e)} /></label>
        {#if draft[side][field]}<button type="button" class="mini" onclick={() => (draft[side][field] = null)}>Remove</button>{/if}
      </div>
    </div>
  </div>
{/snippet}

<div class="home">
  <div class="bg"><LiveBackground /></div>
  <div class="box" class:wide={view === 'teams'} bind:this={box}>
    {#key view}
      {#if view === 'menu'}
        <h1 class="anim">Draft Reimagined</h1>
        {#if BROADCAST}<p class="tag anim">Broadcast</p>{/if}
        <p class="sub anim">{TEAMS.blue.name} <i>vs</i> {TEAMS.red.name}<span class="fmt">Best of {SERIES.bestOf}</span></p>
        <nav>
          {#if BROADCAST}
            <Button variant="primary" class="anim" onclick={onstart}>Connect to League client</Button>
            <Button class="anim" onclick={ondemo}>Demo draft</Button>
          {:else}
            <Button variant="primary" class="anim" onclick={onstart}>Start draft</Button>
          {/if}
          <Button class="anim" onclick={openSetup}>Team setup</Button>
          <Button class="anim" onclick={onclose}>Close</Button>
        </nav>
      {:else}
        <h1 class="anim small">Team setup</h1>
        <form onsubmit={(e) => { e.preventDefault(); save(); }}>
          <div class="format anim" role="radiogroup" aria-label="Match format">
            <span>Match format</span>
            {#each FORMATS as n}
              <button type="button" role="radio" aria-checked={bestOf === n} class:on={bestOf === n} onclick={() => (bestOf = n)}>BO{n}</button>
            {/each}
          </div>
          <div class="cols">
            {#each SIDES as s (s.key)}
              <section class="card anim {s.key}">
                <h2>{s.label}</h2>
                <label class="fld">Team name<input bind:value={draft[s.key].name} maxlength="28" autocomplete="off" spellcheck="false" /></label>
                {@render picker(s.key, 'logo', 'Logo', 'Square or round emblem, transparent PNG or SVG works best.')}
                {@render picker(s.key, 'wordmark', 'Logo with letters (optional)', 'Wide version, shown in the final header.')}
                <div class="colors">
                  <label class="fld">Main color<input type="color" bind:value={draft[s.key].c1} /></label>
                  <label class="fld">Accent<input type="color" bind:value={draft[s.key].c2} /></label>
                </div>
                <div class="players">
                  {#each LANES as lane, i}
                    <label class="fld p">{lane}<input bind:value={draft[s.key].players[i]} maxlength="20" autocomplete="off" spellcheck="false" /></label>
                  {/each}
                </div>
              </section>
            {/each}
          </div>
          {#if error}<p class="err" role="alert">{error}</p>{/if}
          <p class="note anim">Images are stored on this computer only and never uploaded.</p>
          <div class="row anim">
            <Button type="button" onclick={() => (view = 'menu')}>Back</Button>
            <Button variant="primary" type="submit">Save</Button>
          </div>
        </form>
      {/if}
    {/key}
  </div>
  <footer><span class="by">by Tomás Salas</span><span>league-client-reimagined / not endorsed by Riot Games</span></footer>
</div>

<style>
  .home { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; overflow: auto; }
  .bg { position: fixed; inset: 0; }
  .box { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 14px; width: min(440px, 88vw); padding: 24px 0; margin: auto 0; flex: none; }
  .box.wide { width: min(1000px, 94vw); }
  h1 { font-size: clamp(44px, 7.4vh, 80px); font-weight: 700; letter-spacing: 0.2em; white-space: nowrap; text-transform: uppercase; line-height: 1; text-indent: 0.2em; text-shadow: 0 4px 30px rgb(0 0 0 / 0.6); }
  h1.small { font-size: clamp(36px, 5.4vh, 56px); margin-bottom: 4px; }
  .tag { font-size: 18px; letter-spacing: 0.5em; text-indent: 0.5em; text-transform: uppercase; color: var(--accent); margin-top: -6px; }
  .sub { font-size: 20px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 26px; }
  .fmt { display: block; margin-top: 6px; font-size: 15px; letter-spacing: 0.3em; opacity: 0.75; }
  .sub i { font-style: normal; margin: 0 10px; opacity: 0.6; }
  nav, form { display: flex; flex-direction: column; gap: 12px; width: 100%; }
  input:focus-visible, .mini:focus-within { outline: 2px solid var(--accent); outline-offset: 3px; }

  .format { display: flex; align-items: center; justify-content: center; gap: 10px; }
  .format span { font-size: 14px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--text-dim); margin-right: 8px; }
  .format button { font: inherit; font-size: 20px; letter-spacing: 0.16em; color: var(--text-dim); padding: 6px 22px; background: rgb(13 17 23 / 0.7); border: 1px solid var(--line); cursor: pointer; transition: color 0.2s, border-color 0.2s, background 0.2s; }
  .format button:hover { color: var(--text); border-color: var(--text-dim); }
  .format button.on { color: var(--bg-0); background: var(--accent); border-color: var(--accent); font-weight: 700; }
  .format button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .card { display: flex; flex-direction: column; gap: 12px; padding: 18px 20px; background: rgb(13 17 23 / 0.78); border: 1px solid var(--line); border-top: 3px solid var(--c); backdrop-filter: blur(8px); }
  .card.blue { --c: var(--team-blue); } .card.red { --c: var(--team-red); }
  h2 { font-size: 18px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--c); }
  .fld { display: flex; flex-direction: column; gap: 4px; font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--text-dim); }
  input:not([type]) { font: inherit; font-size: 20px; letter-spacing: 0.05em; text-transform: none; color: var(--text); padding: 7px 10px; background: rgb(7 9 13 / 0.8); border: 1px solid var(--line); }
  input[type='color'] { width: 100%; height: 36px; padding: 2px; background: rgb(7 9 13 / 0.8); border: 1px solid var(--line); cursor: pointer; }
  .colors { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .players { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
  .players .p:last-child { grid-column: span 2; }
  .players input { font-size: 17px; padding: 5px 8px; }

  .pick { display: flex; gap: 12px; align-items: center; }
  .thumb { flex: none; width: 76px; height: 76px; display: grid; place-items: center; background: rgb(7 9 13 / 0.8); border: 1px dashed var(--line); }
  .thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .thumb span { font-size: 13px; letter-spacing: 0.16em; color: var(--text-dim); text-transform: uppercase; }
  .pc { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .pc strong { font-size: 15px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 600; }
  .pc small { font-size: 13px; line-height: 1.2; color: var(--text-dim); letter-spacing: 0.02em; }
  .pb { display: flex; gap: 8px; margin-top: 4px; }
  .mini { position: relative; font: inherit; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text); padding: 4px 12px; background: none; border: 1px solid var(--line); cursor: pointer; }
  .mini:hover { border-color: var(--accent); }
  .mini input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }

  .err { color: var(--ban-red); font-size: 17px; letter-spacing: 0.06em; text-align: center; }
  .note { font-size: 14px; letter-spacing: 0.06em; color: var(--text-dim); text-align: center; }
  .row { display: flex; gap: 12px; margin-top: 4px; } .row :global(.btn) { flex: 1; }
  footer { position: relative; flex: none; z-index: 1; padding: 12px 0 18px; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 13px; letter-spacing: 0.1em; color: var(--text-dim); opacity: 0.6; }
  .by { font-size: 17px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--text); opacity: 0.95; }
  @media (max-width: 760px) { .cols { grid-template-columns: 1fr; } }
</style>
