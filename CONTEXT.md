# CONTEXT — memória resumida do projeto

## Objetivo
Site estático de ferramentas gratuitas para MEI/autônomos (atrai tráfego orgânico) + produtos digitais pagos (planilhas) vendidos via plataforma terceira.

## Restrições do dono
- Custo zero por 6 meses; reavaliar com dados (visitas/vendas) depois disso.
- Sem imagem/voz/identidade pública. Contas de pagamento exigem CPF (privado).
- Publicação, contas, pagamentos e permissões: só com aprovação humana.

## Arquitetura (planejada)
- HTML + JavaScript puro (sem build, sem dependências) + node:test. Hugo só se o site crescer.
- Hospedagem: Cloudflare Workers (static assets, wrangler.jsonc), subdomínio workers.dev gratuito. Deploy automático a cada push.
- Analytics: Cloudflare Web Analytics (sem cookies). SEO: Google Search Console.
- Vendas: Hotmart/Kiwify (taxa só por venda). Sem backend, sem segredos no repo.
- IA usada só no desenvolvimento, nunca em runtime (sem custo de API).

## Implementado
- Plano, nicho (MEI/autônomos) e lista de ferramentas aprovados em 2026-11-20.
- site/: index, preco.html (calculadora de preço), recibo.html (recibo + extenso + PDF via impressão), privacidade.html.
- Lógica testável em site/js/*-logica.js e extenso.js; testes em tests/ (`npm test`). CI em .github/workflows/ci.yml.
- App instalável (PWA), aprovado em 2026-11-26: site/manifest.webmanifest, site/sw.js (offline; aumentar VERSAO a cada mudança no site), site/js/pwa.js (botão "Instalar app" + dica iPhone), ícones em site/icons/. Testes em tests/pwa.test.js.
- Ver local: `npm run serve` → http://localhost:8080
- NO AR: https://ferramentas-mei.ferramentasmei.workers.dev (subdomínio neutro; nunca usar nome/e-mail do dono).

## Pendências
- Código no GitHub (branch claude/digital-business-ai-plan-9238fj). Repo ainda sem branch main.
- Ferramentas 2 (limite MEI) e 3 (quanto sobra) — dependem de tabelas oficiais atualizadas.
- Produto: planilha de gestão MEI. Nome definitivo do site.
- Publicação (Cloudflare/GitHub Pages) — exige autorização do dono.

## Riscos conhecidos
- Tráfego SEO lento (6–12 meses).
- Cálculos errados → testes com casos oficiais + aviso "estimativa" + data de atualização.
- Tabelas legais mudam todo ano (salário mínimo, DAS, teto MEI).

## Próxima tarefa
Planilha de gestão MEI (produto pago). Search Console opcional: só o dono pode (login Google); sitemap.xml + robots.txt já publicados.

---

# Estila (segundo projeto, iniciado em 2026-11-26)
App grátis de avaliação de looks por foto com IA. Detalhes em estila/README.md; plano em https://claude.ai/artifact/JPk9WTtp8a4E3SuFiBF7LW
- Divisão: Claude constrói o app; ChatGPT só para tarefas simples. Sem monetização por enquanto.
- Prioridade máxima: segurança. Banco de dados e política de privacidade só quando abrir para outras pessoas.
- Feito: etapa 1 (app Expo em estila/app + servidor Cloudflare em estila/server, modo demonstração sem chave da IA).
- Pendente (decisão do dono): ligar a IA (custo por análise, escolher modelo e limite), repositório próprio, nome definitivo.
- Próximas etapas: 2 perfil de estilo/histórico, 3 vitrine social (moderação, 18+), 4 provador virtual + lojas.
