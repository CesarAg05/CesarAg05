import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adicionarAoHistorico, amostraDeCor, formatarNota, lerHistorico, lerResposta, novoTamanho, type ItemHistorico } from '../src/logica.ts';

test('reduz fotos grandes mantendo a proporção e não amplia as pequenas', () => {
  assert.deepEqual(novoTamanho(4000, 3000), { width: 1024 });
  assert.deepEqual(novoTamanho(3000, 4000), { height: 1024 });
  assert.equal(novoTamanho(800, 600), null);
});

test('lê resposta válida e recusa respostas quebradas', () => {
  const r = lerResposta({ demo: true, analise: { valido: true, motivo: '', nota: 12, estilo: 'x', cores: ['a', 3], pontos_fortes: [], sugestoes: [{ titulo: 't', detalhe: 'd' }, { titulo: 1 }], combina_com: [] } });
  assert.equal(r.analise.nota, 10);
  assert.deepEqual(r.analise.cores, ['a']);
  assert.equal(r.analise.sugestoes.length, 1);
  assert.throws(() => lerResposta({ erro: 'Foto grande demais.' }), /Foto grande demais/);
  assert.throws(() => lerResposta(null));
  assert.throws(() => lerResposta({ analise: {} }));
});

test('histórico guarda no máximo 30 itens e ignora dados corrompidos', () => {
  const item = (id: string): ItemHistorico => ({ id, data: '', ocasiao: null, demo: false, analise: lerResposta({ analise: { valido: true, nota: 7 } }).analise });
  let l: ItemHistorico[] = [];
  for (let i = 0; i < 40; i++) l = adicionarAoHistorico(l, item(String(i)));
  assert.equal(l.length, 30);
  assert.equal(l[0].id, '39');
  assert.deepEqual(lerHistorico('{quebrado'), []);
  assert.deepEqual(lerHistorico('[{"id":1}]'), []);
});

test('formata nota e reconhece cores comuns', () => {
  assert.equal(formatarNota(8.4), '8,4');
  assert.equal(amostraDeCor('azul cobalto'), '#2643ff');
  assert.equal(amostraDeCor('creme'), '#efe4cf');
  assert.equal(amostraDeCor('fúcsia'), '#c9c4be');
});
