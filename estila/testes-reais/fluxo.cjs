// Teste de ponta a ponta com fotos reais, num iPhone simulado (Playwright).
// Antes: `python3 -I baixar.py`, servidor em http://localhost:8787 (npm run dev em estila/server)
// e o app web em http://localhost:8081 (npx expo export --platform web, servido pela pasta dist).
// Uso: node fluxo.cjs
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const pasta = path.join(__dirname, 'fotos');
const saida = path.join(__dirname, 'saida');
fs.mkdirSync(saida, { recursive: true });
const looks = fs.readdirSync(pasta).filter((f) => f.startsWith('look-'));
const pecas = fs.readdirSync(pasta).filter((f) => f.startsWith('peca-'));
const falhas = [];
const confere = (ok, msg) => { if (!ok) falhas.push(msg); };

// Lê largura e altura de um JPEG pelo marcador SOF.
function tamanhoJpeg(b) {
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xc3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

async function rodar(b, look, peca) {
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage();
  const erros = [], envios = [];
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  p.on('request', (r) => {
    if (r.method() !== 'POST') return;
    const bytes = Buffer.from(JSON.parse(r.postData()).imagem, 'base64');
    envios.push({ rota: new URL(r.url()).pathname, bytes });
  });
  await p.goto('http://localhost:8081/');

  const fc = p.waitForEvent('filechooser');
  await p.getByText('Escolher da galeria').click();
  await p.getByText('Concordo e continuar').click();
  await (await fc).setFiles(path.join(pasta, look));
  await p.getByText('Pontos fortes').waitFor({ timeout: 30000 });
  await p.screenshot({ path: path.join(saida, `${look}.png`) });
  const links = await p.getByRole('link').count();

  await p.getByRole('tab', { name: 'Armário' }).click();
  const fc2 = p.waitForEvent('filechooser');
  await p.getByText('Adicionar da galeria').click();
  await (await fc2).setFiles(path.join(pasta, peca));
  await p.getByText('Que peça é?').waitFor({ timeout: 30000 });
  await ctx.close();

  confere(erros.length === 0, `${look}: erros na página ${erros.join(' | ')}`);
  confere(links >= 2, `${look}: sem links de peças reais`);
  for (const e of envios) {
    const t = tamanhoJpeg(e.bytes);
    const limite = e.rota === '/analisar' ? 1024 : 320;
    confere(!e.bytes.includes(Buffer.from('Exif')), `${e.rota} (${look}): foi enviada com metadados EXIF`);
    confere(!e.bytes.includes(Buffer.from('CelularTeste')), `${e.rota} (${look}): foi enviada com o modelo do celular`);
    confere(t && Math.max(t.w, t.h) <= limite, `${e.rota} (${look}): tamanho ${t && `${t.w}x${t.h}`} acima de ${limite}px`);
    console.log(`${look.padEnd(26)} ${e.rota.padEnd(16)} ${t.w}x${t.h} ${Math.round(e.bytes.length / 1024)} KB, sem EXIF`);
  }
  confere(envios.length === 2, `${look}: esperava 2 envios, houve ${envios.length}`);
}

(async () => {
  if (!looks.length || !pecas.length) throw new Error('Sem fotos: rode antes `python3 -I baixar.py`.');
  const b = await chromium.launch();
  for (const [i, look] of looks.entries()) await rodar(b, look, pecas[i % pecas.length]);
  await b.close();
  if (falhas.length) { console.error('FALHAS:\n' + falhas.join('\n')); process.exit(1); }
  console.log(`OK: ${looks.length} looks e ${pecas.length} peças reais, telas em ${saida}`);
})().catch((e) => { console.error('FALHOU', e.message); process.exit(1); });
