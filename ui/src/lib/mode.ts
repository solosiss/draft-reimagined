// Producto: "coach" (draft manual, ambos lados) o "broadcast" (lee el champ select del cliente; solo muestra, no opera).
// Se fija al compilar con `vite --mode broadcast` (ver .env.broadcast); en la versión coach el código del lector se descarta.
export const BROADCAST = import.meta.env.VITE_APP_MODE === 'broadcast';
export const APP_NAME = BROADCAST ? 'Draft Reimagined Broadcast' : 'Draft Reimagined';
