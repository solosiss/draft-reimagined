// Utilidades para logos subidos por el usuario: se reducen y se guardan como data URL (sin conexión, sin servidor).

/** Lee un archivo de imagen, lo reduce a `max` px de lado mayor (conserva la transparencia) y lo devuelve como data URL PNG. */
export async function toDataUrl(file: File, max = 640): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('not an image');
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(new Error('unreadable')); i.src = src; });
    const w0 = img.naturalWidth || max, h0 = img.naturalHeight || max; // un SVG sin tamaño intrínseco usa `max`
    const k = Math.min(1, max / Math.max(w0, h0));
    const canvas = Object.assign(document.createElement('canvas'), { width: Math.max(1, Math.round(w0 * k)), height: Math.max(1, Math.round(h0 * k)) });
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally { URL.revokeObjectURL(src); }
}

/** Color más saturado de una imagen (hex), para proponer el color del equipo a partir de su logo. */
export function dominantColor(url: string): Promise<string> {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => {
      const ctx = Object.assign(document.createElement('canvas'), { width: 24, height: 24 }).getContext('2d')!;
      ctx.drawImage(img, 0, 0, 24, 24);
      const d = ctx.getImageData(0, 0, 24, 24).data;
      let r = 0, g = 0, b = 0, w = 0;
      for (let i = 0; i < d.length; i += 4) {
        const sat = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);
        const k = (sat * sat + 1) * (d[i + 3] / 255);
        r += d[i] * k; g += d[i + 1] * k; b += d[i + 2] * k; w += k;
      }
      if (!w) return ok('#d4a64a');
      const m = Math.max(r, g, b) / w, f = m < 170 ? 170 / m : 1; // evita tonos apagados
      const hex = (v: number) => Math.min(255, Math.round((v / w) * f)).toString(16).padStart(2, '0');
      ok(`#${hex(r)}${hex(g)}${hex(b)}`);
    };
    img.onerror = () => ok('#d4a64a');
    img.src = url;
  });
}
