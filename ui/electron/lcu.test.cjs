const test = require('node:test');
const assert = require('node:assert');
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseLockfile, parseArgs, createReader } = require('./lcu.cjs');

test('parseLockfile', () => {
  assert.deepStrictEqual(parseLockfile('LeagueClient:1234:50123:s3cr3t:https\n'), { port: 50123, password: 's3cr3t', protocol: 'https' });
  assert.strictEqual(parseLockfile(''), null);
});

test('parseArgs', () => {
  const line = '"C:/Riot Games/League of Legends/LeagueClientUx.exe" --app-port=51234 --remoting-auth-token=Ab_c-12 --install-directory=C:/Riot Games';
  assert.deepStrictEqual(parseArgs(line), { port: 51234, password: 'Ab_c-12', protocol: 'https' });
  assert.strictEqual(parseArgs('otra cosa'), null);
});

test('reader: emite solo cuando cambia y avisa cuando termina el champ select', async () => {
  const sessions = [{ a: 1, timer: { adjustedTimeLeftInPhase: 20000, phase: 'BAN_PICK' } }, { a: 1, timer: { adjustedTimeLeftInPhase: 19600, phase: 'BAN_PICK' } }, { a: 2, timer: { adjustedTimeLeftInPhase: 19200, phase: 'BAN_PICK' } }];
  let i = 0; const got = [], states = [];
  await new Promise((resolve) => {
    const r = createReader({
      onSession: (s) => { got.push(s); if (s === null) { r.stop(); resolve(); } },
      onStatus: (s) => states.push(s),
      find: async () => ({ port: 1, password: 'x', protocol: 'https' }),
      fetchSession: async () => (i < sessions.length ? { status: 200, body: JSON.stringify(sessions[i++]) } : { status: 404, body: '' }),
      interval: 5,
    });
  });
  assert.deepStrictEqual(got.map((s) => s && s.a), [1, 2, null]); // el segundo sondeo (mismo contenido) no se emite
  assert.deepStrictEqual(states, ['connected', 'no-session']);
});

test('reader: cliente no encontrado → searching', async () => {
  const states = [];
  await new Promise((resolve) => {
    const r = createReader({ onSession() {}, onStatus: (s) => { states.push(s); r.stop(); resolve(); }, find: async () => null, retry: 5 });
  });
  assert.deepStrictEqual(states, ['searching']);
});

// Prueba de punta a punta: servidor HTTPS autofirmado con autenticación básica, como el cliente real. Se omite si no hay openssl.
test('reader: lee la sesión de un servidor HTTPS local con certificado autofirmado', async (t) => {
  let key, cert;
  try {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lcu-'));
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', path.join(dir, 'k.pem'), '-out', path.join(dir, 'c.pem'), '-days', '1', '-subj', '/CN=127.0.0.1'], { stdio: 'ignore' });
    key = fs.readFileSync(path.join(dir, 'k.pem')); cert = fs.readFileSync(path.join(dir, 'c.pem'));
  } catch { return t.skip('openssl no disponible'); }
  const expected = 'Basic ' + Buffer.from('riot:pw').toString('base64');
  const server = https.createServer({ key, cert }, (req, res) => {
    if (req.headers.authorization !== expected) { res.statusCode = 401; return res.end(); }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ myTeam: [], theirTeam: [], actions: [], timer: { phase: 'PLANNING', adjustedTimeLeftInPhase: 15000 } }));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const session = await new Promise((resolve) => {
    const r = createReader({ onSession: (s) => { r.stop(); resolve(s); }, onStatus() {}, find: async () => ({ port, password: 'pw', protocol: 'https' }), interval: 5 });
  });
  server.close();
  assert.strictEqual(session.timer.phase, 'PLANNING');
});
