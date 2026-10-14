<script lang="ts">
  // Iconos de línea de Riot Games (Community Dragon), usados bajo la política de contenido de fans: sin fines comerciales ni respaldo de Riot.
  // Claves: TOP, JUNGLE, MIDDLE, BOTTOM, SUPPORT.
  import top from './lanes/top.svg';
  import jungle from './lanes/jungle.svg';
  import middle from './lanes/middle.svg';
  import bottom from './lanes/bottom.svg';
  import utility from './lanes/utility.svg';

  let { lane, size = 22, label }: { lane: string; size?: number; label?: string } = $props();
  const SRC: Record<string, string> = { TOP: top, JUNGLE: jungle, MIDDLE: middle, BOTTOM: bottom, SUPPORT: utility };
</script>

<img class="lane" src={SRC[lane]} alt={label ?? lane} width={size} height={size} />
