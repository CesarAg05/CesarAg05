// Cálculo de preço de venda por markup sobre o preço final.
// preço = custo / (1 - (imposto% + taxas% + margem%) / 100)

export function calcularPreco({ custo, impostoPct = 0, taxasPct = 0, margemPct = 0 }) {
  const valores = { custo, impostoPct, taxasPct, margemPct };
  for (const [nome, v] of Object.entries(valores)) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
      throw new Error(`Valor inválido em "${nome}".`);
    }
  }
  if (custo <= 0) throw new Error('O custo deve ser maior que zero.');
  const somaPct = impostoPct + taxasPct + margemPct;
  if (somaPct >= 100) {
    throw new Error('Imposto + taxas + margem precisam somar menos de 100%.');
  }
  const preco = arred(custo / (1 - somaPct / 100));
  return {
    preco,
    imposto: arred(preco * impostoPct / 100),
    taxas: arred(preco * taxasPct / 100),
    lucro: arred(preco * margemPct / 100),
  };
}

function arred(n) {
  return Math.round(n * 100) / 100;
}
