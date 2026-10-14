// Líneas: snapshot estático de Meraki Analytics (lanes.json; la CDN no tiene CORS), regenerar por parche.
import lanes from './lanes.json';
// Nombres desde Data Dragon (se cachea por sesión); imágenes desde Community Dragon por id numérico.
export type Champ = { id: number; slug: string; name: string; lanes: string[] };
let list = $state<Champ[]>([]);
const names = $derived(Object.fromEntries(list.map((c) => [c.id, c.name])));

export const champions = { get list() { return list; } };

export const championName = (id: number | null) => (id ? (names[id] ?? '') : '');
export const splashUrl = (id: number) =>
  `https://cdn.communitydragon.org/latest/champion/${id}/splash-art/centered`;
export const tileUrl = (id: number) =>
  `https://cdn.communitydragon.org/latest/champion/${id}/square`;

export async function loadChampions() {
  try {
    const [version] = await (await fetch('https://ddragon.leagueoflegends.com/api/versions.json')).json();
    const { data } = await (
      await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`)
    ).json();
    list = Object.values<{ key: string; id: string; name: string }>(data)
      .map((c) => ({ id: Number(c.key), slug: c.id, name: c.name, lanes: (lanes as Record<string, string[]>)[c.key] ?? [] }))
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));
  } catch (e) {
    console.warn('[champions] sin nombres (offline?)', e);
  }
}

// Precarga el splash en la caché del navegador para que aparezca al instante.
const preloaded = new Set<number>();
export function preloadSplash(id: number) {
  if (preloaded.has(id)) return Promise.resolve();
  preloaded.add(id);
  const img = new Image();
  img.src = splashUrl(id);
  return img.decode().catch(() => preloaded.delete(id));
}
