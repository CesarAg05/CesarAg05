import { reaisPorExtenso } from './extenso.js';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const $ = (id) => document.getElementById(id);
const val = (id) => $(id).value.trim();

const hoje = new Date();
$('data').value = [hoje.getFullYear(), String(hoje.getMonth() + 1).padStart(2, '0'), String(hoje.getDate()).padStart(2, '0')].join('-');

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const erro = $('erro');
  const valor = Number(val('valor'));
  const faltando = ['pagador', 'referente', 'emitente', 'data'].filter((id) => !val(id));
  if (!(valor > 0) || valor >= 1e9) faltando.unshift('valor');
  if (faltando.length) {
    erro.textContent = 'Preencha corretamente: ' + faltando.map((id) => $(id).previousElementSibling.textContent).join(', ') + '.';
    erro.hidden = false;
    $('area').hidden = true;
    return;
  }
  erro.hidden = true;
  // textContent em tudo: nada digitado é interpretado como HTML.
  $('r-valor').textContent = brl.format(valor);
  $('r-valor-ext').textContent = `${brl.format(valor)} (${reaisPorExtenso(valor)})`;
  $('r-pagador').textContent = val('pagador');
  $('r-referente').textContent = val('referente');
  $('r-emitente').textContent = val('emitente');
  $('r-documento').textContent = val('documento');
  const [a, m, d] = val('data').split('-');
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const dataTxt = `${Number(d)} de ${meses[Number(m) - 1]} de ${a}`;
  $('r-local-data').textContent = val('cidade') ? `${val('cidade')}, ${dataTxt}.` : `${dataTxt}.`;
  $('area').hidden = false;
});

$('imprimir').addEventListener('click', () => window.print());
