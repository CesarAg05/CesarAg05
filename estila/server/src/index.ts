// Servidor do Estila (Cloudflare Worker). Recebe a foto, valida, pede a análise à IA e devolve o resultado.
// A foto nunca é gravada nem registrada em log: existe só na memória durante a requisição.
import Anthropic from '@anthropic-ai/sdk';
import {
  ErroEntrada, ESQUEMA_ANALISE, ESQUEMA_PECA, INSTRUCOES, INSTRUCOES_PECA, LIMITE_BYTES_CORPO, LIMITE_BYTES_MINIATURA,
  analiseDemo, decodificarImagem, limparAnalise, limparPeca, montarPedido, validarOcasiao, validarPerfil,
} from './regras.ts';

interface Env {
  ANTHROPIC_API_KEY?: string; // segredo: `wrangler secret put ANTHROPIC_API_KEY`. Sem ele, modo demonstração.
  MODELO?: string; // padrão claude-opus-5-5; claude-haiku-5-5 custa bem menos
  ORIGENS?: string; // sites autorizados a chamar o servidor, separados por vírgula
  LIMITE?: { limit(o: { key: string }): Promise<{ success: boolean }> }; // limite por IP (wrangler.jsonc)
}

const MODELOS_COM_FALLBACK = new Set(['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-fable-5-2']);

const SEGURANCA: Record<string, string> = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};

function resposta(corpo: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...SEGURANCA, ...cors } });
}

function cabecalhosCors(req: Request, env: Env): Record<string, string> | null {
  const origem = req.headers.get('Origin');
  if (!origem) return {}; // apps nativos não enviam Origin
  const permitidas = (env.ORIGENS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!permitidas.includes(origem)) return null;
  return { 'Access-Control-Allow-Origin': origem, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600', Vary: 'Origin' };
}

// Uma chamada à IA com imagem e resposta em formato fixo. Devolve null se a IA recusar.
async function chamarIA(env: Env, instrucoes: string, esquema: object, imagem: string, pedido: string, maxTokens: number): Promise<unknown | null> {
  const modelo = env.MODELO || 'claude-opus-5-5';
  const cliente = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 60_000 });
  const msg = await cliente.beta.messages.create({
    model: modelo,
    max_tokens: maxTokens,
    system: instrucoes,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: esquema as Record<string, unknown> } },
    ...(MODELOS_COM_FALLBACK.has(modelo) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imagem } },
      { type: 'text', text: pedido },
    ] }],
  });
  if (msg.stop_reason === 'refusal') return null;
  const bloco = msg.content.find((b) => b.type === 'text');
  if (!bloco || bloco.type !== 'text') throw new Error('resposta sem texto');
  return JSON.parse(bloco.text);
}

async function lerCorpo(req: Request, env: Env): Promise<Record<string, unknown>> {
  if (!(req.headers.get('Content-Type') ?? '').startsWith('application/json')) throw new ErroEntrada(415, 'Envie JSON.');
  if (Number(req.headers.get('Content-Length') ?? 0) > LIMITE_BYTES_CORPO) throw new ErroEntrada(413, 'Foto grande demais.');
  if (env.LIMITE) {
    const { success } = await env.LIMITE.limit({ key: req.headers.get('CF-Connecting-IP') ?? 'sem-ip' });
    if (!success) throw new ErroEntrada(429, 'Muitos pedidos seguidos. Espere um minuto.');
  }
  const texto = await req.text();
  if (texto.length > LIMITE_BYTES_CORPO) throw new ErroEntrada(413, 'Foto grande demais.');
  let corpo: unknown;
  try { corpo = JSON.parse(texto); } catch { throw new ErroEntrada(400, 'JSON inválido.'); }
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) throw new ErroEntrada(400, 'JSON inválido.');
  return corpo as Record<string, unknown>;
}

async function rotaAnalisar(corpo: Record<string, unknown>, env: Env) {
  decodificarImagem(corpo.imagem);
  const ocasiao = validarOcasiao(corpo.ocasiao);
  const perfil = validarPerfil(corpo.perfil);
  if (!env.ANTHROPIC_API_KEY) return { demo: true, analise: analiseDemo(ocasiao) };
  const bruto = await chamarIA(env, INSTRUCOES, ESQUEMA_ANALISE, corpo.imagem as string, montarPedido(ocasiao, perfil), 4000);
  const analise = bruto === null ? limparAnalise({ valido: false, motivo: 'Não consegui avaliar esta foto. Tente outra, mostrando a roupa.' }) : limparAnalise(bruto);
  return { demo: false, analise };
}

// Armário: a miniatura (até 150 KB) é conferida e descartada. Nada é guardado.
async function rotaVerificarPeca(corpo: Record<string, unknown>, env: Env) {
  decodificarImagem(corpo.imagem, LIMITE_BYTES_MINIATURA);
  if (!env.ANTHROPIC_API_KEY) return { demo: true, verificado: false, peca: null };
  const bruto = await chamarIA(env, INSTRUCOES_PECA, ESQUEMA_PECA, corpo.imagem as string, 'Confira esta foto para o armário.', 1500);
  return { demo: false, verificado: true, peca: limparPeca(bruto === null ? { e_roupa: false } : bruto) };
}

const ROTAS: Record<string, (c: Record<string, unknown>, env: Env) => Promise<unknown>> = {
  '/analisar': rotaAnalisar,
  '/verificar-peca': rotaVerificarPeca,
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = cabecalhosCors(req, env);
    if (cors === null) return resposta({ erro: 'Origem não autorizada.' }, 403, {});
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...SEGURANCA, ...cors } });
    if (url.pathname === '/saude' && req.method === 'GET') return resposta({ ok: true, demo: !env.ANTHROPIC_API_KEY }, 200, cors);
    const rota = Object.hasOwn(ROTAS, url.pathname) ? ROTAS[url.pathname] : undefined;
    if (!rota) return resposta({ erro: 'Não encontrado.' }, 404, cors);
    if (req.method !== 'POST') return resposta({ erro: 'Use POST.' }, 405, cors);

    try {
      return resposta(await rota(await lerCorpo(req, env), env), 200, cors);
    } catch (e) {
      if (e instanceof ErroEntrada) return resposta({ erro: e.message }, e.status, cors);
      if (e instanceof Anthropic.RateLimitError) return resposta({ erro: 'Serviço ocupado. Tente de novo em instantes.' }, 503, cors);
      // Registra só o tipo do erro, nunca a foto nem o conteúdo.
      console.error('falha na análise:', e instanceof Error ? e.name : 'desconhecido');
      return resposta({ erro: 'Não foi possível analisar agora. Tente de novo.' }, 502, cors);
    }
  },
};
