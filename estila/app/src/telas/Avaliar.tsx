import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { OCASIOES, amostraDeCor, formatarNota, linksDeCompra, perfilVazio, rotuloNota, type Analise, type Ocasiao, type Perfil } from '../logica';
import type { FotoPronta } from '../servicos';
import { Botao, C, Chip, Foto, SERIFA, u } from '../ui';

export type EstadoAvaliar =
  | { tipo: 'inicio' }
  | { tipo: 'analisando'; foto: FotoPronta }
  | { tipo: 'resultado'; foto: FotoPronta; analise: Analise; demo: boolean }
  | { tipo: 'erro'; mensagem: string };

export function Avaliar(p: {
  estado: EstadoAvaliar; ocasiao: Ocasiao | null; perfil: Perfil;
  setOcasiao: (o: Ocasiao | null) => void; iniciar: (o: 'camera' | 'galeria') => void; voltar: () => void; irParaPerfil: () => void;
}) {
  const { estado } = p;
  if (estado.tipo === 'analisando') {
    return (
      <View>
        <Foto uri={estado.foto.uri} />
        <View style={s.carregando}><ActivityIndicator color={C.coral} /><Text style={u.p}>Analisando o look…</Text></View>
      </View>
    );
  }
  if (estado.tipo === 'resultado') {
    return (
      <View>
        {estado.demo && <View style={u.aviso}><Text style={u.avisoTexto}>Modo demonstração: resultado de exemplo, a IA ainda não está ligada.</Text></View>}
        <DetalheAnalise uri={estado.foto.uri} analise={estado.analise} />
        <Botao texto={estado.analise.valido ? 'Avaliar outro look' : 'Tentar outra foto'} onPress={p.voltar} />
      </View>
    );
  }
  return (
    <View>
      <Text style={u.h1}>Seu look, avaliado em segundos.</Text>
      <Text style={u.p}>Tire uma foto de corpo inteiro com boa luz. A IA dá uma nota, identifica seu estilo e sugere ajustes.</Text>
      {estado.tipo === 'erro' && <View style={u.erro}><Text style={u.erroTexto}>{estado.mensagem}</Text></View>}
      <Text style={u.rotulo}>Para qual ocasião? (opcional)</Text>
      <View style={u.chips}>
        {OCASIOES.map((o) => <Chip key={o} texto={o} ativo={p.ocasiao === o} onPress={() => p.setOcasiao(p.ocasiao === o ? null : o)} />)}
      </View>
      <Botao texto="Tirar foto" onPress={() => p.iniciar('camera')} />
      <Botao texto="Escolher da galeria" secundario onPress={() => p.iniciar('galeria')} />
      {perfilVazio(p.perfil) ? (
        <Pressable onPress={p.irParaPerfil} style={s.dica} accessibilityRole="button">
          <Text style={s.dicaTitulo}>Sugestões com a sua cara</Text>
          <Text style={u.item}>Responda o quiz de estilo (1 minuto) e a IA passa a sugerir peças do jeito que você gosta.</Text>
        </Pressable>
      ) : (
        <Text style={u.nota}>Usando seu perfil: {[...p.perfil.estilos, ...p.perfil.cores].join(', ') || 'preferências salvas'}.</Text>
      )}
    </View>
  );
}

// Usado no resultado e no detalhe do histórico. Sem foto (histórico), mostra um cartão com a nota.
export function DetalheAnalise({ uri, analise }: { uri?: string; analise: Analise }) {
  if (!analise.valido) {
    return (
      <View>
        {uri && <Foto uri={uri} />}
        <View style={u.erro}><Text style={u.erroTexto}>{analise.motivo}</Text></View>
      </View>
    );
  }
  const nota = (
    <View style={uri ? s.notaFlutuante : s.notaCartao}>
      <Text style={s.notaNumero}>{formatarNota(analise.nota)}</Text>
      <Text style={s.notaRotulo}>{rotuloNota(analise.nota)}</Text>
    </View>
  );
  return (
    <View>
      {uri ? <View><Foto uri={uri} />{nota}</View> : nota}
      <Text style={u.h2}>{analise.estilo}</Text>
      <View style={u.chips}>{analise.cores.map((c) => <Chip key={c} texto={c} cor={amostraDeCor(c)} />)}</View>
      {analise.pontos_fortes.length > 0 && <Text style={u.rotulo}>Pontos fortes</Text>}
      {analise.pontos_fortes.map((t) => <Text key={t} style={u.item}>• {t}</Text>)}
      {analise.sugestoes.length > 0 && <Text style={u.rotulo}>Sugestões</Text>}
      {analise.sugestoes.map((sg) => (
        <View key={sg.titulo} style={u.cartao}>
          <Text style={u.cartaoTitulo}>{sg.titulo}</Text>
          <Text style={u.p}>{sg.detalhe}</Text>
          <PecasReais busca={sg.busca} />
        </View>
      ))}
      {analise.combina_com.length > 0 && <Text style={u.nota}>Combina com: {analise.combina_com.join(', ')}</Text>}
    </View>
  );
}

function PecasReais({ busca }: { busca?: string }) {
  const links = linksDeCompra(busca);
  if (!links.length) return null;
  return (
    <View style={s.lojas}>
      <Text style={s.lojasRotulo}>Ver peças reais: “{busca}”</Text>
      <View style={u.chips}>
        {links.map((l) => (
          <Pressable key={l.loja} onPress={() => Linking.openURL(l.url).catch(() => {})} style={s.loja} accessibilityRole="link" accessibilityLabel={`Ver ${busca} no ${l.loja}`}>
            <Text style={s.lojaTexto}>{l.loja} ↗</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  lojas: { marginTop: 6, gap: 8 },
  lojasRotulo: { fontSize: 13, color: C.suave },
  loja: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.linha, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 12 },
  lojaTexto: { fontSize: 14, fontWeight: '600', color: C.cobalto },
  carregando: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  notaFlutuante: { position: 'absolute', right: 14, top: 14, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  notaCartao: { backgroundColor: C.painel, borderRadius: 18, paddingVertical: 18, alignItems: 'center' },
  notaNumero: { fontFamily: SERIFA, fontSize: 36, fontWeight: '700', color: C.coral, lineHeight: 40 },
  notaRotulo: { fontSize: 12, fontWeight: '600', color: C.tinta },
  dica: { marginTop: 20, borderWidth: 1, borderColor: C.linha, borderLeftWidth: 4, borderLeftColor: C.cobalto, borderRadius: 14, padding: 14 },
  dicaTitulo: { fontSize: 16, fontWeight: '700', color: C.cobalto, marginBottom: 4 },
});
