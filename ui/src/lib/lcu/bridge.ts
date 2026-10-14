// API que expone electron/preload.cjs en la versión broadcast.
export type LcuStatus = 'searching' | 'no-session' | 'connected';
declare global {
  interface Window {
    lcu?: {
      start(): Promise<void>; stop(): Promise<void>;
      onSession(cb: (session: unknown | null) => void): () => void;
      onStatus(cb: (status: LcuStatus) => void): () => void;
    };
  }
}
