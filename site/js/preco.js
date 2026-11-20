import { calcularPreco } from './preco-logica.js';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const $ = (id) => document.getElementById(id);
const num = (id) => ($(id).value.trim() === '' ? 0 : Number($(id).value));

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const out = $('resultado');
  out.hidden = false;
  out.replaceChildren();
  try {
    const r = calcularPreco({ custo: num('custo'), impostoPct: num('imposto'), taxasPct: num('taxas'), margemPct: num('margem') });
    const h = document.createElement('h2');
    h.textContent = `Preço sugerido: ${brl.format(r.preco)}`;
    const t = document.createElement('table');
    for (const [rotulo, v] of [['Custo', num('custo')], ['Imposto', r.imposto], ['Taxas', r.taxas], ['Lucro', r.lucro]]) {
      const tr = t.insertRow();
      tr.insertCell().textContent = rotulo;
      tr.insertCell().textContent = brl.format(v);
    }
    out.append(h, t);
  } catch (err) {
    const p = document.createElement('p');
    p.className = 'erro';
    p.textContent = err.message;
    out.append(p);
  }
});
