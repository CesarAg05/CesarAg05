# CONTEXT — memória resumida do projeto

## Objetivo
Site estático de ferramentas gratuitas para MEI/autônomos (atrai tráfego orgânico) + produtos digitais pagos (planilhas) vendidos via plataforma terceira.

## Restrições do dono
- Custo zero por 6 meses; reavaliar com dados (visitas/vendas) depois disso.
- Sem imagem/voz/identidade pública. Contas de pagamento exigem CPF (privado).
- Publicação, contas, pagamentos e permissões: só com aprovação humana.

## Arquitetura (planejada)
- Hugo (site) + JavaScript puro (ferramentas) + node:test (testes).
- Hospedagem: Cloudflare Pages ou GitHub Pages, subdomínio gratuito.
- Analytics: Cloudflare Web Analytics (sem cookies). SEO: Google Search Console.
- Vendas: Hotmart/Kiwify (taxa só por venda). Sem backend, sem segredos no repo.
- IA usada só no desenvolvimento, nunca em runtime (sem custo de API).

## Implementado
- Nada ainda. Plano aprovado em 2026-11-20.

## Pendências
- Dono aprovar lista de ferramentas/produto da Etapa 0.

## Riscos conhecidos
- Tráfego SEO lento (6–12 meses).
- Cálculos errados → testes com casos oficiais + aviso "estimativa" + data de atualização.
- Tabelas legais mudam todo ano (salário mínimo, DAS, teto MEI).

## Próxima tarefa
Etapa 1: estrutura do repo, .gitignore, CI de testes, primeira ferramenta (após aprovação da Etapa 0).
