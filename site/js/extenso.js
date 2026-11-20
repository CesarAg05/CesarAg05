// Valor em reais por extenso (pt-BR), até 999.999.999,99.

const UNID = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CEM = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos',
  'setecentos', 'oitocentos', 'novecentos'];

function ate999(n) {
  if (n === 100) return 'cem';
  const partes = [];
  const c = Math.floor(n / 100), r = n % 100;
  if (c) partes.push(CEM[c]);
  if (r) {
    if (r < 20) partes.push(UNID[r]);
    else {
      const d = Math.floor(r / 10), u = r % 10;
      partes.push(u ? `${DEZ[d]} e ${UNID[u]}` : DEZ[d]);
    }
  }
  return partes.join(' e ');
}

// "e" antes do último grupo quando ele é < 100 ou centena exata.
function conector(n) {
  return n < 100 || n % 100 === 0 ? ' e ' : ' ';
}

function inteiroPorExtenso(n) {
  if (n === 0) return 'zero';
  const milhoes = Math.floor(n / 1e6), milhares = Math.floor((n % 1e6) / 1000), resto = n % 1000;
  let txt = '';
  if (milhoes) txt = milhoes === 1 ? 'um milhão' : `${ate999(milhoes)} milhões`;
  const abaixoMilhao = n % 1e6;
  if (txt && abaixoMilhao) {
    // "um milhão e duzentos mil", "um milhão e um", "um milhão, mil e um"
    const unico = abaixoMilhao < 1000 ? resto : (resto === 0 ? milhares : null);
    txt += unico === null ? ',' : conector(unico).trimEnd();
    txt += ' ';
  }
  if (milhares) txt += milhares === 1 ? 'mil' : `${ate999(milhares)} mil`;
  if (resto) txt += milhares ? conector(resto) + ate999(resto) : ate999(resto);
  return txt;
}

export function reaisPorExtenso(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor >= 1e9) {
    throw new Error('Valor fora do intervalo suportado.');
  }
  const totalCent = Math.round(valor * 100);
  const reais = Math.floor(totalCent / 100), cent = totalCent % 100;
  if (reais === 0 && cent === 0) return 'zero reais';
  const partes = [];
  if (reais) {
    let txt = inteiroPorExtenso(reais);
    // "um milhão de reais", "dois milhões de reais"
    if (reais % 1e6 === 0) txt += ' de';
    partes.push(`${txt} ${reais === 1 ? 'real' : 'reais'}`);
  }
  if (cent) partes.push(`${inteiroPorExtenso(cent)} ${cent === 1 ? 'centavo' : 'centavos'}`);
  return partes.join(' e ');
}
