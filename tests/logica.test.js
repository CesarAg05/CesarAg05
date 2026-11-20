import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPreco } from '../site/js/preco-logica.js';
import { reaisPorExtenso } from '../site/js/extenso.js';

test('preço: caso básico', () => {
  // custo 60, 6% imposto, 4% taxas, 30% margem → 60 / 0,6 = 100
  const r = calcularPreco({ custo: 60, impostoPct: 6, taxasPct: 4, margemPct: 30 });
  assert.deepEqual(r, { preco: 100, imposto: 6, taxas: 4, lucro: 30 });
});

test('preço: sem percentuais devolve o custo', () => {
  assert.equal(calcularPreco({ custo: 12.5 }).preco, 12.5);
});

test('preço: rejeita entradas inválidas', () => {
  assert.throws(() => calcularPreco({ custo: 0 }));
  assert.throws(() => calcularPreco({ custo: -1 }));
  assert.throws(() => calcularPreco({ custo: NaN }));
  assert.throws(() => calcularPreco({ custo: 10, margemPct: 60, impostoPct: 40 }));
});

test('extenso: casos comuns', () => {
  const casos = [
    [0, 'zero reais'],
    [1, 'um real'],
    [0.01, 'um centavo'],
    [0.5, 'cinquenta centavos'],
    [2.35, 'dois reais e trinta e cinco centavos'],
    [100, 'cem reais'],
    [101, 'cento e um reais'],
    [1000, 'mil reais'],
    [1500, 'mil e quinhentos reais'],
    [1234.56, 'mil duzentos e trinta e quatro reais e cinquenta e seis centavos'],
    [21000, 'vinte e um mil reais'],
    [1000000, 'um milhão de reais'],
    [2500000, 'dois milhões e quinhentos mil reais'],
    [1001001, 'um milhão, mil e um reais'],
    [1200000, 'um milhão e duzentos mil reais'],
    [1000001, 'um milhão e um reais'],
  ];
  for (const [v, esperado] of casos) assert.equal(reaisPorExtenso(v), esperado, `valor ${v}`);
});

test('extenso: arredondamento de ponto flutuante', () => {
  assert.equal(reaisPorExtenso(0.1 + 0.2), 'trinta centavos');
});

test('extenso: fora do intervalo', () => {
  assert.throws(() => reaisPorExtenso(-1));
  assert.throws(() => reaisPorExtenso(1e9));
});
