// Lector del cliente de League (LCU), SOLO LECTURA: consulta periódicamente la sesión de champ select por HTTPS local.
// No toca el proceso del juego, no lee memoria y no escribe nada en el cliente (ni hover, ni lock, ni ban).
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

/** Contenido del `lockfile` del cliente: nombre:pid:puerto:contraseña:protocolo */
function parseLockfile(text) {
  const [, , port, password, protocol] = String(text).trim().split(':');
  return port && password ? { port: Number(port), password, protocol: protocol || 'https' } : null;
}

/** Argumentos de LeagueClientUx: --app-port=NNN --remoting-auth-token=XXX */
function parseArgs(cmd) {
  const port = /--app-port=(\d+)/.exec(cmd)?.[1];
  const password = /--remoting-auth-token=([\w-]+)/.exec(cmd)?.[1];
  return port && password ? { port: Number(port), password, protocol: 'https' } : null;
}

function lockfileCandidates(env = process.env) {
  if (env.LEAGUE_LOCKFILE) return [env.LEAGUE_LOCKFILE]; // ruta propia (instalaciones fuera de lo habitual y pruebas)
  if (process.platform === 'win32') return ['C:\\Riot Games\\League of Legends\\lockfile'];
  if (process.platform === 'darwin') return ['/Applications/League of Legends.app/Contents/LoL/lockfile'];
  return [];
}

function clientCommandLine() {
  return new Promise((resolve) => {
    const [cmd, args] = process.platform === 'win32'
      ? ['powershell', ['-NoProfile', '-Command', "(Get-CimInstance Win32_Process -Filter \"name='LeagueClientUx.exe'\").CommandLine"]]
      : ['ps', ['-A', '-o', 'args=']];
    execFile(cmd, args, { maxBuffer: 8 * 1024 * 1024, timeout: 5000 }, (err, out) => resolve(err ? '' : String(out)));
  });
}

async function findCredentials() {
  for (const file of lockfileCandidates()) {
    try { const c = parseLockfile(fs.readFileSync(file, 'utf8')); if (c) return c; } catch { /* sin lockfile ahí */ }
  }
  const line = (await clientCommandLine()).split('\n').find((l) => l.includes('LeagueClientUx') || l.includes('--remoting-auth-token'));
  return line ? parseArgs(line) : null;
}

const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true }); // el cliente usa un certificado autofirmado, solo en 127.0.0.1

function get(creds, route) {
  return new Promise((resolve, reject) => {
    const req = https.get({
      host: '127.0.0.1', port: creds.port, path: route, agent, timeout: 3000,
      headers: { Authorization: 'Basic ' + Buffer.from('riot:' + creds.password).toString('base64'), Accept: 'application/json' },
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

/**
 * Sondea la sesión de champ select. Estados: 'searching' (no hay cliente), 'no-session' (cliente abierto, sin champ select), 'connected'.
 * Solo emite una sesión cuando cambia (el temporizador se compara con margen para no emitir en cada sondeo).
 */
function createReader({ onSession, onStatus, find = findCredentials, fetchSession = (c) => get(c, '/lol-champ-select/v1/session'), interval = 1000, retry = 2000 }) {
  let creds = null, stop = false, timer = null, lastSig = null, lastEnd = 0, lastStatus = null;
  const status = (s) => { if (s !== lastStatus) { lastStatus = s; onStatus(s); } };

  async function tick() {
    let wait = interval;
    try {
      if (!creds) creds = await find();
      if (!creds) { status('searching'); wait = retry; }
      else {
        const { status: code, body } = await fetchSession(creds);
        if (code === 200) {
          const session = JSON.parse(body);
          const left = session.timer?.adjustedTimeLeftInPhase ?? 0;
          const { adjustedTimeLeftInPhase, internalNowInEpochMs, ...timerRest } = session.timer ?? {};
          const sig = JSON.stringify({ ...session, timer: timerRest });
          const end = Date.now() + left;
          status('connected');
          if (sig !== lastSig || Math.abs(end - lastEnd) > 1500) { lastSig = sig; lastEnd = end; onSession(session); }
        } else { // 404: el cliente está abierto pero no hay champ select
          status('no-session');
          if (lastSig !== null) { lastSig = null; onSession(null); }
          wait = 1000;
        }
      }
    } catch { creds = null; lastSig = null; status('searching'); wait = retry; } // el cliente se cerró o cambió de puerto
    if (!stop) timer = setTimeout(tick, wait);
  }
  tick();
  return { stop() { stop = true; clearTimeout(timer); } };
}

module.exports = { parseLockfile, parseArgs, lockfileCandidates, createReader };
