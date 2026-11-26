// Regras do app sem dependência de React Native (testáveis com `npm test`).

export const OCASIOES = ['dia a dia', 'trabalho', 'entrevista', 'festa', 'casamento', 'encontro', 'academia', 'viagem'] as const;
export type Ocasiao = (typeof OCASIOES)[number];

export const LADO_MAXIMO = 1024; // a foto é reduzida antes de sair do aparelho

export interface Sugestao { titulo: string; detalhe: string; busca?: string }
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
export function novoTamanho(largura: number, altura: number, lado = LADO_MAXIMO): { width?: number; height?: number } | null {
  if (largura <= lado && altura <= lado) return null;
  return largura >= altura ? { width: lado } : { height: lado };
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
      sugestoes: (Array.isArray(a.sugestoes) ? a.sugestoes : [])
        .filter((s): s is Sugestao => !!s && typeof s.titulo === 'string' && typeof s.detalhe === 'string')
        .map((s) => ({ titulo: s.titulo, detalhe: s.detalhe, busca: limparBusca(s.busca) })),
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

// ---------- Etapa 2: perfil de estilo ----------
// Listas fixas: o servidor aceita só estes valores (as mesmas listas existem em server/src/regras.ts e um teste confere).
export const ESTILOS = ['clássico', 'casual', 'minimalista', 'esportivo', 'romântico', 'streetwear', 'boho', 'elegante', 'criativo', 'alternativo'] as const;
export const CORES = ['preto', 'branco', 'cinza', 'bege', 'marrom', 'azul', 'marinho', 'verde', 'vermelho', 'rosa', 'amarelo', 'laranja', 'roxo', 'estampas'] as const;
export const EVITAR = ['decotes', 'transparência', 'saltos', 'peças justas', 'cores fortes', 'estampas', 'shorts e saias curtas'] as const;
export type Estilo = (typeof ESTILOS)[number];
export type Cor = (typeof CORES)[number];
export type Evitar = (typeof EVITAR)[number];
export interface Perfil { estilos: Estilo[]; cores: Cor[]; evitar: Evitar[] }
export const PERFIL_VAZIO: Perfil = { estilos: [], cores: [], evitar: [] };

const filtrar = <T extends string>(v: unknown, lista: readonly T[], max: number): T[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is T => (lista as readonly string[]).includes(x)))].slice(0, max) : [];

export function lerPerfil(texto: string | null): Perfil {
  if (!texto) return PERFIL_VAZIO;
  try {
    const v = JSON.parse(texto);
    return { estilos: filtrar(v?.estilos, ESTILOS, 3), cores: filtrar(v?.cores, CORES, 5), evitar: filtrar(v?.evitar, EVITAR, EVITAR.length) };
  } catch {
    return PERFIL_VAZIO;
  }
}

export function alternar<T>(lista: T[], valor: T, max: number): T[] {
  if (lista.includes(valor)) return lista.filter((x) => x !== valor);
  return lista.length >= max ? lista : [...lista, valor];
}

export const perfilVazio = (p: Perfil) => !p.estilos.length && !p.cores.length && !p.evitar.length;

// ---------- Etapa 2: resumo do histórico ----------
export interface Resumo {
  total: number;
  media: number;
  melhor: number;
  estiloFrequente: string | null;
  cores: { nome: string; vezes: number }[];
  recentes: number[]; // últimas notas, da mais antiga para a mais nova
  tendencia: number; // média das 3 últimas menos a média das 3 anteriores
}

const contar = (valores: string[]) => {
  const m = new Map<string, number>();
  for (const v of valores) { const k = v.trim().toLowerCase(); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};
const mediaDe = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0);

export function resumir(itens: ItemHistorico[]): Resumo | null {
  const validos = itens.filter((i) => i.analise.valido);
  if (!validos.length) return null;
  const notas = validos.map((i) => i.analise.nota); // mais novo primeiro
  const recentes = notas.slice(0, 10).reverse();
  const ult3 = notas.slice(0, 3), ant3 = notas.slice(3, 6);
  return {
    total: validos.length,
    media: Math.round(mediaDe(notas) * 10) / 10,
    melhor: Math.max(...notas),
    estiloFrequente: contar(validos.map((i) => i.analise.estilo))[0]?.[0] ?? null,
    cores: contar(validos.flatMap((i) => i.analise.cores)).slice(0, 5).map(([nome, vezes]) => ({ nome, vezes })),
    recentes,
    tendencia: ant3.length ? Math.round((mediaDe(ult3) - mediaDe(ant3)) * 10) / 10 : 0,
  };
}

// ---------- Etapa 2: armário (fotos das peças, só no aparelho) ----------
export const CATEGORIAS = ['parte de cima', 'parte de baixo', 'vestido / macacão', 'casaco', 'calçado', 'acessório'] as const;
export type Categoria = (typeof CATEGORIAS)[number];
export interface Peca { id: string; categoria: Categoria; cor: Cor; miniatura: string; data: string }
export const LIMITE_ARMARIO = 60;
export const LADO_MINIATURA = 320;

export function lerArmario(texto: string | null): Peca[] {
  if (!texto) return [];
  try {
    const v = JSON.parse(texto);
    return Array.isArray(v)
      ? v.filter((p) => p && typeof p.id === 'string' && typeof p.miniatura === 'string' && p.miniatura.startsWith('data:image/jpeg;base64,')
          && (CATEGORIAS as readonly string[]).includes(p.categoria) && (CORES as readonly string[]).includes(p.cor))
      : [];
  } catch {
    return [];
  }
}

export function adicionarPeca(lista: Peca[], peca: Peca): Peca[] {
  if (lista.length >= LIMITE_ARMARIO) throw new Error(`O armário comporta até ${LIMITE_ARMARIO} peças. Remova alguma para adicionar.`);
  return [peca, ...lista];
}

export function contarPorCategoria(lista: Peca[]): Record<Categoria, number> {
  const r = Object.fromEntries(CATEGORIAS.map((c) => [c, 0])) as Record<Categoria, number>;
  for (const p of lista) r[p.categoria]++;
  return r;
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

// ---------- Peças reais: links de busca em lojas ----------
// O termo vem da IA, então é limpo de novo aqui e entra só como texto de busca em endereços fixos.
export function limparBusca(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N} -]+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60).trim();
}

export function linksDeCompra(busca: unknown): { loja: string; url: string }[] {
  const termo = limparBusca(busca);
  if (termo.length < 3) return [];
  return [
    { loja: 'Google Shopping', url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(termo)}` },
    { loja: 'Mercado Livre', url: `https://lista.mercadolivre.com.br/${encodeURIComponent(termo.replace(/ /g, '-'))}` },
  ];
}

// ---------- Armário: resposta da verificação de peça ----------
export type Verificacao =
  | { tipo: 'roupa'; categoria: Categoria; cor: Cor }
  | { tipo: 'nao-roupa'; motivo: string }
  | { tipo: 'sem-verificacao' }; // modo demonstração: IA desligada

export function lerVerificacao(j: unknown): Verificacao {
  const r = j as { erro?: unknown; verificado?: unknown; peca?: Record<string, unknown> | null };
  if (!r || typeof r !== 'object') throw new Error('Resposta inválida do servidor.');
  if (typeof r.erro === 'string') throw new Error(r.erro);
  if (r.verificado !== true) return { tipo: 'sem-verificacao' };
  const p = r.peca;
  if (p && p.e_roupa === true && (CATEGORIAS as readonly string[]).includes(p.categoria as string) && (CORES as readonly string[]).includes(p.cor as string)) {
    return { tipo: 'roupa', categoria: p.categoria as Categoria, cor: p.cor as Cor };
  }
  return { tipo: 'nao-roupa', motivo: typeof p?.motivo === 'string' && p.motivo ? p.motivo : 'Esta foto não parece ser de uma peça de roupa.' };
}
