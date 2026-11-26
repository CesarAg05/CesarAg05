# Testes com fotos reais

Teste de ponta a ponta do Estila com fotos reais de pessoas vestidas e de peças avulsas, num iPhone simulado.

O teste confere quatro coisas:
- O fluxo completo funciona sem erro: consentimento, avaliação, links de peças reais e armário.
- A foto sai do aparelho **sem metadados**. O script grava GPS e modelo de celular falsos nas cópias, e o teste falha se esses dados forem enviados.
- A foto do look sai com no máximo 1024 px e a da peça com no máximo 320 px. Uma versão de 3000 px testa a redução.
- Cada sugestão tem links para lojas reais.

## Como rodar

```bash
cd estila/testes-reais
python3 -I baixar.py                       # baixa as fotos para fotos/ (fora do git)
(cd ../server && npm run dev) &            # servidor em http://localhost:8787
(cd ../app && npx expo export --platform web && npx serve dist -l 8081) &
node fluxo.cjs
```

As fotos não ficam no repositório, porque mostram pessoas reais. Só a lista com os créditos fica aqui, e o script baixa as fotos na hora do teste.

## Créditos (Wikimedia Commons)

| Arquivo | Foto original | Autor | Licença |
|---|---|---|---|
| look-duas-mulheres.jpg | [Dalicam photo archive 3](https://commons.wikimedia.org/wiki/File:Dalicam_photo_archive_3.jpg) | Dalicam photography | CC BY-SA 4.0 |
| look-homem-casaco.jpg | [Dalicam photo archive 4](https://commons.wikimedia.org/wiki/File:Dalicam_photo_archive_4.jpg) | Dalicam photography | CC BY-SA 4.0 |
| look-casal.jpg | [Beautful women and handsome man](https://commons.wikimedia.org/wiki/File:Beautful_women_and_handsome_man.jpg) | Peachyeung316 | CC BY-SA 4.0 |
| look-vestido-florido.jpg | [A Great Day in New York, New York](https://commons.wikimedia.org/wiki/File:A_Great_Day_in_New_York,_New_York_(3605691598).jpg) | Jazz Guy from New Jersey, United States | CC BY 2.0 |
| peca-calca-jeans.jpg | [501xx-back](https://commons.wikimedia.org/wiki/File:501xx-back.jpg) | Tokunori | CC BY-SA 4.0 |
| peca-camiseta.jpg | [Clothes shirts pants in Philippines 05](https://commons.wikimedia.org/wiki/File:02123jfClothes_shirts_pants_in_Philippinesfvf_05.jpg) | Judgefloro | CC0 |

As cópias usadas no teste são reduzidas para 500 px e recebem metadados falsos. O arquivo `fotos.json` tem os links completos das licenças.
