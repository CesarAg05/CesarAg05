import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const site = new URL('../site/', import.meta.url);
const ler = (f) => readFileSync(new URL(f, site), 'utf8');

test('manifesto tem os campos exigidos para instalar', () => {
  const m = JSON.parse(ler('manifest.webmanifest'));
  for (const campo of ['name', 'short_name', 'start_url', 'display', 'icons']) assert.ok(m[campo], campo);
  const tamanhos = m.icons.map((i) => i.sizes);
  assert.ok(tamanhos.includes('192x192') && tamanhos.includes('512x512'));
  for (const i of m.icons) assert.ok(existsSync(new URL(i.src, site)), i.src);
});

test('todos os arquivos guardados para uso offline existem', () => {
  const lista = ler('sw.js').match(/const ARQUIVOS = \[([\s\S]*?)\]/)[1].match(/'([^']+)'/g).map((s) => s.slice(1, -1));
  for (const f of lista) if (f !== './') assert.ok(existsSync(new URL(f, site)), f);
  for (const js of readdirSync(new URL('js/', site))) assert.ok(lista.includes('js/' + js), 'faltou no sw.js: js/' + js);
  for (const html of readdirSync(site).filter((f) => f.endsWith('.html'))) assert.ok(lista.includes(html), 'faltou no sw.js: ' + html);
});

test('todas as páginas apontam para o manifesto e registram o app', () => {
  for (const html of readdirSync(site).filter((f) => f.endsWith('.html'))) {
    const s = ler(html);
    assert.ok(s.includes('rel="manifest"'), html);
    assert.ok(s.includes('js/pwa.js'), html);
  }
});
