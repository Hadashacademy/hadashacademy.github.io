/*
 * Hadash Academy · cofre de contenido
 * Cifra (seal) o descifra (open) el contenido de English Lab y Study Island.
 * La llave NO está en este repositorio: es el secreto CONTENT_KEY del puente en Cloudflare.
 *
 *   HADASH_CONTENT_KEY=<64 hex> node tools/vault/vault.mjs open    # para editar: deja todo en texto normal
 *   HADASH_CONTENT_KEY=<64 hex> node tools/vault/vault.mjs seal    # antes de publicar: vuelve a cifrar
 *
 * Nunca publiques (git push) con el contenido abierto.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const TARGETS = ['english-lab', 'study-island'];
const SKIP_JS = new Set(['study-island/sunny.js']);
const hex = process.env.HADASH_CONTENT_KEY || '';
if (!/^[0-9a-f]{64}$/.test(hex)) { console.error('Falta HADASH_CONTENT_KEY (64 caracteres hex).'); process.exit(1); }
const key = await crypto.subtle.importKey('raw', Uint8Array.from(hex.match(/../g).map(x => parseInt(x, 16))), 'AES-GCM', false, ['encrypt', 'decrypt']);
const b64 = a => Buffer.from(a).toString('base64');
const unb64 = s => new Uint8Array(Buffer.from(s, 'base64'));

async function enc(text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const d = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  return { hzv: 1, iv: b64(iv), d: b64(d) };
}
async function dec(box) {
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.d)));
}
function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const STUB_MARK = 'id="hz-vault"';
const GATE = '<script src="/access.js"></script>';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function sealHtml(file, s) {
  if (s.includes(STUB_MARK)) return false;
  const inner = s.replace(GATE + '\n', '').replace(GATE, '');
  const title = (s.match(/<title>([\s\S]*?)<\/title>/i) || [, 'Hadash Academy'])[1].trim();
  const lang = (s.match(/<html[^>]*\slang="([^"]+)"/i) || [, 'en'])[1];
  const box = await enc(inner);
  fs.writeFileSync(file, `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
${GATE}
</head>
<body>
<p style="font-family:system-ui,sans-serif;text-align:center;margin-top:40vh;color:#5B6478">Abriendo tu lección…</p>
<noscript>Activa JavaScript para usar Hadash Academy.</noscript>
<script type="application/json" ${STUB_MARK}>${JSON.stringify(box)}</script>
</body>
</html>
`);
  return true;
}
async function openHtml(file, s) {
  if (!s.includes(STUB_MARK)) return false;
  const box = JSON.parse(s.match(/<script type="application\/json" id="hz-vault">([\s\S]*?)<\/script>/)[1]);
  let inner = await dec(box);
  // Las páginas del English Lab llevan la puerta en el <head>; Study Island ya tiene su propia línea.
  if (!inner.includes('/access.js')) inner = inner.replace(/<head([^>]*)>/i, `<head$1>\n${GATE}`);
  fs.writeFileSync(file, inner);
  return true;
}

const mode = process.argv[2];
if (!['seal', 'open'].includes(mode)) { console.error('Uso: vault.mjs seal | open'); process.exit(1); }
let n = 0;
for (const t of TARGETS) for (const file of walk(path.join(ROOT, t))) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const s = fs.readFileSync(file, 'utf8');
  if (rel.endsWith('.html')) n += (await (mode === 'seal' ? sealHtml(file, s) : openHtml(file, s))) ? 1 : 0;
  else if ((rel.endsWith('.js') || rel.endsWith('.json')) && !SKIP_JS.has(rel)) {
    if (mode === 'seal' && !s.startsWith('{"hzv":1')) { fs.writeFileSync(file, JSON.stringify(await enc(s))); n++; }
    if (mode === 'open' && s.startsWith('{"hzv":1')) { fs.writeFileSync(file, await dec(JSON.parse(s))); n++; }
  }
}
console.log(`${mode === 'seal' ? 'Cifrados' : 'Abiertos'}: ${n} archivos`);
