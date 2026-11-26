// Resultado de exemplo usado quando o app roda sem servidor (EXPO_PUBLIC_API_URL=demo),
// por exemplo na página de teste. Igual ao modo demonstração do servidor.
import type { Analise, Ocasiao } from './logica';

export function analiseDemo(ocasiao: Ocasiao | null): Analise {
  return {
    valido: true,
    motivo: '',
    nota: 8.4,
    estilo: 'Casual chique',
    cores: ['azul cobalto', 'creme', 'marrom'],
    pontos_fortes: ['Cores bem combinadas: o azul vibrante equilibra com o creme neutro.', 'Calça de cintura alta alonga a silhueta do look.'],
    sugestoes: [
      { titulo: 'Marque a cintura', detalhe: 'Um cinto caramelo liga a calça ao sapato e deixa o look mais intencional.', busca: 'cinto caramelo couro fino' },
      { titulo: 'Acessório de destaque', detalhe: 'Brincos dourados médios ou um relógio de pulseira fina completam sem pesar.', busca: 'relógio pulseira fina dourado' },
      ocasiao === 'trabalho'
        ? { titulo: 'Terceira peça', detalhe: 'Um blazer creme aberto deixa o look pronto para reuniões.', busca: 'blazer creme alfaiataria' }
        : { titulo: 'Calçado', detalhe: 'Um mocassim ou tênis branco limpo mantém o ar casual e arrumado.', busca: 'tênis branco couro casual' },
    ],
    combina_com: ['dia a dia', 'trabalho', 'encontro'],
  };
}
