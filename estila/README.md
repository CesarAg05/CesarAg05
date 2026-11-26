# Estila

App grátis que avalia o look a partir de uma foto: nota, estilo, cores, pontos fortes e sugestões. Android, iPhone e web com um único código (Expo/React Native). Por enquanto fica dentro deste repositório, até ganhar um repositório próprio.

Plano completo (pesquisa, etapas, custos): https://claude.ai/artifact/JPk9WTtp8a4E3SuFiBF7LW

## Estado atual: etapas 1 e 2, versão de teste

- `app/`: o aplicativo, com quatro abas:
  - **Avaliar:** foto e nota do look, com consentimento antes da primeira foto.
  - **Armário:** fotos das peças, com categoria e cor, guardadas só no aparelho (até 60).
  - **Histórico:** lista dos looks avaliados; tocar num deles abre a avaliação completa.
  - **Meu estilo:** resumo da evolução (média, melhor nota, estilo e cores mais usados), quiz de estilo e privacidade.
- O quiz de estilo é enviado junto com a foto e personaliza as sugestões da IA.
- `server/`: servidor na Cloudflare que recebe a foto, valida e pede a análise à IA (Claude).
- **Sem a chave da IA, o servidor responde em modo demonstração** (resultado de exemplo, custo zero).

## Segurança já implementada

| Onde | O quê |
|---|---|
| App | Foto reduzida para no máximo 1024 px e regravada em JPEG antes do envio, sem metadados (localização, aparelho). |
| App | A foto não é salva. O histórico guarda só notas e sugestões, no próprio aparelho, com botão "Apagar meus dados". |
| App | A resposta do servidor é conferida campo a campo antes de aparecer na tela. |
| Servidor | Aceita só `POST /analisar` com JSON, só JPEG, até cerca de 1,5 MB. A ocasião precisa estar numa lista fixa. |
| Servidor | O perfil de estilo só aceita valores de listas fixas, iguais às do app (um teste confere). Assim, ninguém consegue mandar instruções para a IA pelo perfil. |
| App | Perfil, histórico e armário ficam só no aparelho. As fotos do armário nunca são enviadas. "Apagar meus dados" apaga tudo. |
| Servidor | Até 10 análises por minuto por IP. Sites não autorizados (CORS) são bloqueados. |
| Servidor | A chave da IA fica só como segredo da Cloudflare, nunca no app nem no código. |
| Servidor | A foto não é gravada nem registrada em log. Os logs guardam só o tipo do erro. |
| Servidor | A IA avalia só as roupas e é proibida de comentar corpo, rosto ou identidade. Textos escritos na foto são ignorados como instrução. |
| Servidor | A resposta da IA tem formato fixo (structured outputs) e ainda é limpa: nota entre 0 e 10, tamanhos limitados. |

## Como rodar

```bash
# servidor (modo demonstração) em http://localhost:8787
cd estila/server && npm install && npm run dev

# app no navegador; no celular, use o app Expo Go e leia o QR code
cd estila/app && npm install && npx expo start
```

Testes: `npm test` e `npm run check` em cada pasta (também rodam no CI).

## Ligar a IA de verdade (decisão do dono, tem custo)

1. Crie uma conta em platform.claude.com e defina um **limite de gasto mensal** no Console.
2. `cd estila/server && npx wrangler secret put ANTHROPIC_API_KEY`
3. `npx wrangler deploy`. No app, defina `EXPO_PUBLIC_API_URL` com o endereço publicado e coloque o site do app em `ORIGENS` no `wrangler.jsonc`.

Modelo padrão: `claude-opus-5-5` (mais preciso, cerca de US$ 0,02 por análise). Para gastar bem menos, troque `MODELO` para `claude-haiku-5-5`. As estimativas são aproximadas e precisam ser medidas com fotos reais.

## Antes de abrir para outras pessoas

- Política de privacidade completa e termos de uso (LGPD).
- Banco de dados e contas de usuário, só quando entrarem a vitrine e o histórico na nuvem.
- Proteção extra contra robôs (Cloudflare Turnstile) e limite diário de gasto no servidor.
- Publicação nas lojas (Google Play US$ 25 uma vez; App Store US$ 99/ano).
