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
- Ver local: `npm run serve` → http://localhost:8080

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
Publicar no Cloudflare Pages (dono cria a conta). Nome mantido: "Ferramentas para MEI".
