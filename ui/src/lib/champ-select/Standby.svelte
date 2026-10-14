<script lang="ts">
  import { TEAMS } from '../teams.svelte';
</script>

<!-- Centro de la pantalla mientras aún no hay ningún pick (versión broadcast): los dos equipos enfrentados. -->
<div class="standby">
  {#each [TEAMS.blue, TEAMS.red] as t, i (i)}
    {#if i === 1}<span class="vs">VS</span>{/if}
    <div class="team {i ? 'red' : 'blue'}">
      {#if t.logo}<img src={t.logo} alt="" />{:else}<span class="mono">{t.name[0]}</span>{/if}
      <h2>{t.name}</h2>
    </div>
  {/each}
</div>

<style>
  .standby { position: relative; z-index: 1; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; gap: clamp(32px, 6vw, 120px); }
  .team { display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .team.blue { --c: var(--team-blue); } .team.red { --c: var(--team-red); }
  img { width: clamp(100px, 16vh, 200px); height: clamp(100px, 16vh, 200px); object-fit: contain; filter: drop-shadow(0 6px 24px rgb(0 0 0 / 0.5)); }
  .mono { display: grid; place-items: center; width: clamp(100px, 16vh, 200px); aspect-ratio: 1; border-radius: 50%; border: 3px solid var(--c); color: var(--c); font-size: clamp(48px, 8vh, 96px); font-weight: 700; }
  h2 { font-size: clamp(24px, 3.4vh, 40px); letter-spacing: 0.14em; text-transform: uppercase; }
  .vs { font-size: clamp(32px, 5vh, 56px); font-weight: 500; letter-spacing: 0.3em; color: var(--text-dim); }
</style>
