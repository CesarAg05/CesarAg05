// Servidor do Estila (Cloudflare Worker). Recebe a foto, valida, pede a análise à IA e devolve o resultado.
// A foto nunca é gravada nem registrada em log: existe só na memória durante a requisição.
import Anthropic from '@anthropic-ai/sdk';
import { ErroEntrada, ESQUEMA_ANALISE, INSTRUCOES, LIMITE_BYTES_CORPO, analiseDemo, decodificarImagem, limparAnalise, validarOcasiao } from './regras.ts';

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

async function analisarComIA(env: Env, imagem: string, ocasiao: string | null) {
  const modelo = env.MODELO || 'claude-opus-5-5';
  const cliente = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 60_000 });
  const pedido = ocasiao ? `Avalie este look para a ocasião: ${ocasiao}.` : 'Avalie este look.';
  const msg = await cliente.beta.messages.create({
    model: modelo,
    max_tokens: 4000,
    system: INSTRUCOES,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA_ANALISE as unknown as Record<string, unknown> } },
    ...(MODELOS_COM_FALLBACK.has(modelo) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imagem } },
      { type: 'text', text: pedido },
    ] }],
  });
  if (msg.stop_reason === 'refusal') return limparAnalise({ valido: false, motivo: 'Não consegui avaliar esta foto. Tente outra, mostrando a roupa.' });
  const bloco = msg.content.find((b) => b.type === 'text');
  if (!bloco || bloco.type !== 'text') throw new Error('resposta sem texto');
  return limparAnalise(JSON.parse(bloco.text));
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = cabecalhosCors(req, env);
    if (cors === null) return resposta({ erro: 'Origem não autorizada.' }, 403, {});
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...SEGURANCA, ...cors } });
    if (url.pathname === '/saude' && req.method === 'GET') return resposta({ ok: true, demo: !env.ANTHROPIC_API_KEY }, 200, cors);
    if (url.pathname !== '/analisar') return resposta({ erro: 'Não encontrado.' }, 404, cors);
    if (req.method !== 'POST') return resposta({ erro: 'Use POST.' }, 405, cors);

    try {
      if (!(req.headers.get('Content-Type') ?? '').startsWith('application/json')) throw new ErroEntrada(415, 'Envie JSON.');
      const tamanho = Number(req.headers.get('Content-Length') ?? 0);
      if (tamanho > LIMITE_BYTES_CORPO) throw new ErroEntrada(413, 'Foto grande demais.');

      if (env.LIMITE) {
        const ip = req.headers.get('CF-Connecting-IP') ?? 'sem-ip';
        const { success } = await env.LIMITE.limit({ key: ip });
        if (!success) throw new ErroEntrada(429, 'Muitas análises seguidas. Espere um minuto.');
      }

      const texto = await req.text();
      if (texto.length > LIMITE_BYTES_CORPO) throw new ErroEntrada(413, 'Foto grande demais.');
      let corpo: { imagem?: unknown; ocasiao?: unknown };
      try { corpo = JSON.parse(texto); } catch { throw new ErroEntrada(400, 'JSON inválido.'); }
      decodificarImagem(corpo.imagem);
      const ocasiao = validarOcasiao(corpo.ocasiao);

      if (!env.ANTHROPIC_API_KEY) return resposta({ demo: true, analise: analiseDemo(ocasiao) }, 200, cors);
      const analise = await analisarComIA(env, corpo.imagem as string, ocasiao);
      return resposta({ demo: false, analise }, 200, cors);
    } catch (e) {
      if (e instanceof ErroEntrada) return resposta({ erro: e.message }, e.status, cors);
      if (e instanceof Anthropic.RateLimitError) return resposta({ erro: 'Serviço ocupado. Tente de novo em instantes.' }, 503, cors);
      // Registra só o tipo do erro, nunca a foto nem o conteúdo.
      console.error('falha na análise:', e instanceof Error ? e.name : 'desconhecido');
      return resposta({ erro: 'Não foi possível analisar agora. Tente de novo.' }, 502, cors);
    }
  },
};
