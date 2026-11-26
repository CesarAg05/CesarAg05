// Regras do app sem dependência de React Native (testáveis com `npm test`).

export const OCASIOES = ['dia a dia', 'trabalho', 'entrevista', 'festa', 'casamento', 'encontro', 'academia', 'viagem'] as const;
export type Ocasiao = (typeof OCASIOES)[number];

export const LADO_MAXIMO = 1024; // a foto é reduzida antes de sair do aparelho

export interface Sugestao { titulo: string; detalhe: string }
export interface Analise {
  valido: boolean;
  motivo: string;
  nota: number;
  estilo: string;
  cores: string[];
  pontos_fortes: string[];
  sugestoes: Sugestao[];
  combina_com: string[];
}
export interface ItemHistorico { id: string; data: string; ocasiao: Ocasiao | null; demo: boolean; analise: Analise }

// Calcula o novo tamanho mantendo a proporção; nunca aumenta a foto.
export function novoTamanho(largura: number, altura: number): { width?: number; height?: number } | null {
  if (largura <= LADO_MAXIMO && altura <= LADO_MAXIMO) return null;
  return largura >= altura ? { width: LADO_MAXIMO } : { height: LADO_MAXIMO };
}

const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

// Confere a resposta do servidor antes de mostrar: nada de campo faltando ou de tipo errado na tela.
export function lerResposta(j: unknown): { demo: boolean; analise: Analise } {
  const r = j as { demo?: unknown; analise?: Record<string, unknown>; erro?: unknown };
  if (!r || typeof r !== 'object') throw new Error('Resposta inválida do servidor.');
  if (typeof r.erro === 'string') throw new Error(r.erro);
  const a = r.analise;
  if (!a || typeof a !== 'object' || typeof a.valido !== 'boolean') throw new Error('Resposta inválida do servidor.');
  const nota = typeof a.nota === 'number' && Number.isFinite(a.nota) ? Math.min(10, Math.max(0, a.nota)) : 0;
  return {
    demo: r.demo === true,
    analise: {
      valido: a.valido,
      motivo: typeof a.motivo === 'string' ? a.motivo : '',
      nota,
      estilo: typeof a.estilo === 'string' ? a.estilo : '',
      cores: strs(a.cores),
      pontos_fortes: strs(a.pontos_fortes),
      sugestoes: (Array.isArray(a.sugestoes) ? a.sugestoes : []).filter(
        (s): s is Sugestao => !!s && typeof s.titulo === 'string' && typeof s.detalhe === 'string'),
      combina_com: strs(a.combina_com),
    },
  };
}

export function formatarNota(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

export function rotuloNota(n: number): string {
  if (n >= 9) return 'Impecável';
  if (n >= 7.5) return 'Muito bom';
  if (n >= 6) return 'Bom caminho';
  return 'Dá para melhorar';
}

// Histórico guardado só no aparelho, sem fotos, com no máximo 30 itens.
export function adicionarAoHistorico(lista: ItemHistorico[], item: ItemHistorico): ItemHistorico[] {
  return [item, ...lista.filter((i) => i.id !== item.id)].slice(0, 30);
}

export function lerHistorico(texto: string | null): ItemHistorico[] {
  if (!texto) return [];
  try {
    const v = JSON.parse(texto);
    return Array.isArray(v) ? v.filter((i) => i && typeof i.id === 'string' && i.analise && typeof i.analise.nota === 'number') : [];
  } catch {
    return [];
  }
}

const NOMES_CORES: Record<string, string> = {
  azul: '#2f5bd8', cobalto: '#2643ff', marinho: '#1d2a4d', creme: '#efe4cf', bege: '#d9c3a0', branco: '#f7f7f5', preto: '#151515',
  cinza: '#8d8d8d', marrom: '#7a4a2e', caramelo: '#b7712f', vermelho: '#d3312a', vinho: '#6b1d2a', rosa: '#f08fb0', verde: '#2f8a5b',
  oliva: '#6b6b2e', amarelo: '#f2c230', mostarda: '#c99a1d', laranja: '#f07a2a', coral: '#ff4f3a', roxo: '#6b3fa0', lilás: '#b49be0', dourado: '#c9a14a', prata: '#bfc3c8', jeans: '#4a6a95',
};

// Converte "azul cobalto" em uma amostra de cor aproximada para a bolinha da tela.
export function amostraDeCor(nome: string): string {
  const palavras = nome.toLowerCase().split(/\s+/).reverse();
  for (const p of palavras) if (NOMES_CORES[p]) return NOMES_CORES[p];
  for (const p of nome.toLowerCase().split(/\s+/)) if (NOMES_CORES[p]) return NOMES_CORES[p];
  return '#c9c4be';
}
