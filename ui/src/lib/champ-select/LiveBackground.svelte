<!-- 3 capas grandes; solo se animan transform y opacity (compositor). -->
<div class="bg" aria-hidden="true">
  <div class="layer a"></div><div class="layer b"></div><div class="layer c"></div>
</div>

<style>
  .bg { position: absolute; inset: 0; overflow: hidden; background: var(--bg-0); }
  .layer { position: absolute; inset: -25%; will-change: transform, opacity; }
  .a { background: radial-gradient(circle at 25% 40%, color-mix(in oklch, var(--team-blue) 35%, transparent), transparent 55%);
       animation: drift 18s ease-in-out infinite alternate; }
  .b { background: radial-gradient(circle at 75% 60%, color-mix(in oklch, var(--team-red) 30%, transparent), transparent 55%);
       animation: drift 22s ease-in-out infinite alternate-reverse; }
  .c { background: radial-gradient(circle at 50% 100%, color-mix(in oklch, var(--accent) 18%, transparent), transparent 60%);
       animation: breathe 14s ease-in-out infinite; }
  @keyframes drift { from { transform: translate(-4%, -2%) rotate(0deg); opacity: .7; }
                     to   { transform: translate(4%, 3%) rotate(6deg); opacity: 1; } }
  @keyframes breathe { 50% { opacity: .4; transform: scale(1.1); } }
  @media (prefers-reduced-motion: reduce) { .layer { animation: none; } }
</style>
