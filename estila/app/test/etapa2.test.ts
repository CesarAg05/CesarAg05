import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adicionarPeca, alternar, contarPorCategoria, lerArmario, lerPerfil, perfilVazio, resumir, LIMITE_ARMARIO, type ItemHistorico, type Peca } from '../src/logica.ts';

test('perfil aceita só valores das listas e respeita limites', () => {
  const p = lerPerfil(JSON.stringify({ estilos: ['casual', 'casual', 'hacker', 'boho', 'clássico', 'elegante'], cores: ['azul', '<script>'], evitar: ['saltos'] }));
  assert.deepEqual(p.estilos, ['casual', 'boho', 'clássico']);
  assert.deepEqual(p.cores, ['azul']);
  assert.deepEqual(p.evitar, ['saltos']);
  assert.ok(perfilVazio(lerPerfil('{quebrado')));
  assert.ok(perfilVazio(lerPerfil(null)));
});

test('alternar seleciona, desmarca e não passa do máximo', () => {
  assert.deepEqual(alternar(['a'], 'b', 3), ['a', 'b']);
  assert.deepEqual(alternar(['a', 'b'], 'a', 3), ['b']);
  assert.deepEqual(alternar(['a', 'b', 'c'], 'd', 3), ['a', 'b', 'c']);
});

const item = (nota: number, estilo: string, cores: string[], valido = true): ItemHistorico => ({
  id: String(Math.random()), data: '', ocasiao: null, demo: false,
  analise: { valido, motivo: '', nota, estilo, cores, pontos_fortes: [], sugestoes: [], combina_com: [] },
});

test('resumo calcula média, melhor nota, estilo frequente, cores e tendência', () => {
  // mais novo primeiro
  const h = [item(9, 'Casual chique', ['azul', 'creme']), item(8, 'casual chique', ['azul']), item(8.5, 'Minimalista', ['preto']),
    item(6, 'Esportivo', ['cinza']), item(6, 'Casual chique', ['azul']), item(6.5, 'Minimalista', ['branco']), item(0, '', [], false)];
  const r = resumir(h)!;
  assert.equal(r.total, 6);
  assert.equal(r.media, 7.3);
  assert.equal(r.melhor, 9);
  assert.equal(r.estiloFrequente, 'casual chique');
  assert.deepEqual(r.cores[0], { nome: 'azul', vezes: 3 });
  assert.deepEqual(r.recentes, [6.5, 6, 6, 8.5, 8, 9]);
  assert.equal(r.tendencia, 2.3);
  assert.equal(resumir([]), null);
  assert.equal(resumir([item(0, '', [], false)]), null);
});

const peca = (id: string, extra: Partial<Peca> = {}): Peca => ({ id, categoria: 'calçado', cor: 'preto', miniatura: 'data:image/jpeg;base64,AAAA', data: '', ...extra });

test('armário valida peças salvas, conta por categoria e tem limite', () => {
  const salvo = JSON.stringify([peca('1'), peca('2', { categoria: 'casaco' }), { ...peca('3'), miniatura: 'javascript:alert(1)' }, { ...peca('4'), cor: 'neon' }]);
  const lista = lerArmario(salvo);
  assert.deepEqual(lista.map((p) => p.id), ['1', '2']);
  assert.equal(contarPorCategoria(lista)['calçado'], 1);
  assert.equal(contarPorCategoria(lista)['casaco'], 1);
  const cheio = Array.from({ length: LIMITE_ARMARIO }, (_, i) => peca(String(i)));
  assert.throws(() => adicionarPeca(cheio, peca('x')), /até 60 peças/);
  assert.equal(adicionarPeca([], peca('x'))[0].id, 'x');
});
