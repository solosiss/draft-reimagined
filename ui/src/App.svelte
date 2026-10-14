<script lang="ts">
  import { onMount } from 'svelte';
  import ChampSelect from './lib/champ-select/ChampSelect.svelte';
  import Home from './lib/Home.svelte';
  import { startChampSelect, resetChampSelect } from './lib/store/champSelect.svelte';
  import { loadChampions } from './lib/champions.svelte';

  let screen = $state<'home' | 'draft'>('home');
  let closeHint = $state(false);

  function start() {
    startChampSelect();
    screen = 'draft';
  }
  function home() {
    if (!confirm('End the draft and go back to the home screen?')) return;
    resetChampSelect();
    screen = 'home';
  }
  function close() {
    window.close(); // un navegador solo cierra pestañas abiertas por script
    closeHint = true;
  }

  onMount(() => {
    loadChampions();
    if (new URLSearchParams(location.search).has('sim')) start(); // atajo de pruebas: ?sim salta el home
  });
</script>

<main>
  {#if screen === 'home'}
    <Home onstart={start} onclose={close} />
    {#if closeHint}<p class="hint">You can close this tab now.</p>{/if}
  {:else}
    <ChampSelect />
    <button class="menu" onclick={home} title="Back to home" aria-label="Back to home">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" /></svg>
    </button>
    <footer>league-client-reimagined · not endorsed by Riot Games</footer>
  {/if}
</main>

<style>
  main { width: 100vw; height: 100vh; position: relative; }
  footer {
    position: fixed; top: 84px; right: 16px; z-index: 10;
    font-size: 12px; letter-spacing: 0.06em; color: var(--text-dim); opacity: 0.6;
    pointer-events: none;
  }
  .menu {
    position: fixed; z-index: 11; left: 4px; top: 4px; display: grid; place-items: center; width: 26px; height: 26px; padding: 0; cursor: pointer;
    color: var(--text-dim); background: rgb(7 9 13 / 0.7); border: 1px solid var(--line); transition: color 0.2s, border-color 0.2s;
  }
  .menu:hover { color: var(--text); border-color: var(--accent); }
  .menu:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .hint { position: fixed; z-index: 5; left: 50%; bottom: 56px; translate: -50% 0; font-size: 16px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-dim); }
</style>
