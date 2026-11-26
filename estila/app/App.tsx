import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { OCASIOES, amostraDeCor, formatarNota, rotuloNota, type Analise, type ItemHistorico, type Ocasiao } from './src/logica';
import { analisar, apagarTudo, carregarHistorico, darConsentimento, escolherFoto, salvarNoHistorico, temConsentimento, type FotoPronta } from './src/servicos';

const C = { fundo: '#ffffff', tinta: '#141414', suave: '#6b6661', painel: '#f5f3f1', linha: '#e6e1dc', coral: '#ff4f3a', cobalto: '#2643ff' };
const SERIFA = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

type Aba = 'avaliar' | 'historico' | 'privacidade';
type Estado =
  | { tipo: 'inicio' }
  | { tipo: 'analisando'; foto: FotoPronta }
  | { tipo: 'resultado'; foto: FotoPronta; analise: Analise; demo: boolean }
  | { tipo: 'erro'; mensagem: string; foto?: FotoPronta };

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Tela />
    </SafeAreaProvider>
  );
}

function Tela() {
  const ins = useSafeAreaInsets();
  const [aba, setAba] = useState<Aba>('avaliar');
  const [estado, setEstado] = useState<Estado>({ tipo: 'inicio' });
  const [ocasiao, setOcasiao] = useState<Ocasiao | null>(null);
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const [pedindoConsentimento, setPedindoConsentimento] = useState<null | 'camera' | 'galeria'>(null);

  useEffect(() => { carregarHistorico().then(setHistorico); }, []);

  async function iniciar(origem: 'camera' | 'galeria') {
    if (!(await temConsentimento())) { setPedindoConsentimento(origem); return; }
    let foto: FotoPronta | null = null;
    try {
      foto = await escolherFoto(origem);
      if (!foto) return;
      setEstado({ tipo: 'analisando', foto });
      const { analise, demo } = await analisar(foto, ocasiao);
      setEstado({ tipo: 'resultado', foto, analise, demo });
      if (analise.valido) {
        setHistorico(await salvarNoHistorico({ id: String(Date.now()), data: new Date().toISOString(), ocasiao, demo, analise }));
      }
    } catch (e) {
      setEstado({ tipo: 'erro', mensagem: e instanceof Error ? e.message : 'Algo deu errado.', foto: foto ?? undefined });
    }
  }

  async function aceitar() {
    const origem = pedindoConsentimento;
    await darConsentimento();
    setPedindoConsentimento(null);
    if (origem) iniciar(origem);
  }

  return (
    <View style={[s.raiz, { paddingTop: ins.top }]}>
      <View style={s.topo}>
        <Text style={s.marca}>Estila</Text>
        <Text style={s.selo}>versão de teste</Text>
      </View>

      <ScrollView contentContainerStyle={s.conteudo}>
        {aba === 'avaliar' && (
          <Avaliar estado={estado} ocasiao={ocasiao} setOcasiao={setOcasiao} iniciar={iniciar} voltar={() => setEstado({ tipo: 'inicio' })} />
        )}
        {aba === 'historico' && <Historico itens={historico} />}
        {aba === 'privacidade' && (
          <Privacidade apagar={async () => { await apagarTudo(); setHistorico([]); setEstado({ tipo: 'inicio' }); }} />
        )}
      </ScrollView>

      <View style={[s.abas, { paddingBottom: Math.max(ins.bottom, 10) }]}>
        {([['avaliar', 'Avaliar'], ['historico', 'Histórico'], ['privacidade', 'Privacidade']] as const).map(([id, nome]) => (
          <Pressable key={id} onPress={() => setAba(id)} style={s.aba} accessibilityRole="tab" accessibilityState={{ selected: aba === id }}>
            <View style={[s.abaPonto, aba === id && { backgroundColor: C.coral }]} />
            <Text style={[s.abaTexto, aba === id && s.abaAtiva]}>{nome}</Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={pedindoConsentimento !== null} transparent animationType="none" onRequestClose={() => setPedindoConsentimento(null)}>
        <View style={s.veu}>
          <View style={s.dialogo}>
            <Text style={s.h2}>Antes da primeira foto</Text>
            <Text style={s.p}>Para avaliar o look, a foto é enviada com segurança ao nosso servidor e analisada por inteligência artificial.</Text>
            <Text style={s.item}>• A foto é apagada logo após a análise. Nada fica guardado.</Text>
            <Text style={s.item}>• Avaliamos só a roupa. Nunca o corpo, o rosto ou quem você é.</Text>
            <Text style={s.item}>• Localização e dados escondidos da foto são removidos antes do envio.</Text>
            <Text style={s.item}>• Seu histórico fica só neste aparelho e você pode apagar quando quiser.</Text>
            <Botao texto="Concordo e continuar" onPress={aceitar} />
            <Botao texto="Agora não" secundario onPress={() => setPedindoConsentimento(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Avaliar(p: { estado: Estado; ocasiao: Ocasiao | null; setOcasiao: (o: Ocasiao | null) => void; iniciar: (o: 'camera' | 'galeria') => void; voltar: () => void }) {
  const { estado } = p;
  if (estado.tipo === 'analisando') {
    return (
      <View>
        <Foto uri={estado.foto.uri} />
        <View style={s.carregando}><ActivityIndicator color={C.coral} /><Text style={s.p}>Analisando o look…</Text></View>
      </View>
    );
  }
  if (estado.tipo === 'resultado') return <Resultado {...estado} voltar={p.voltar} />;
  return (
    <View>
      <Text style={s.h1}>Seu look, avaliado em segundos.</Text>
      <Text style={s.p}>Tire uma foto de corpo inteiro com boa luz. A IA dá uma nota, identifica seu estilo e sugere ajustes.</Text>
      {estado.tipo === 'erro' && <View style={s.erro}><Text style={s.erroTexto}>{estado.mensagem}</Text></View>}
      <Text style={s.rotulo}>Para qual ocasião? (opcional)</Text>
      <View style={s.chips}>
        {OCASIOES.map((o) => (
          <Pressable key={o} onPress={() => p.setOcasiao(p.ocasiao === o ? null : o)} style={[s.chip, p.ocasiao === o && s.chipAtivo]} accessibilityState={{ selected: p.ocasiao === o }}>
            <Text style={[s.chipTexto, p.ocasiao === o && { color: '#fff' }]}>{o}</Text>
          </Pressable>
        ))}
      </View>
      <Botao texto="Tirar foto" onPress={() => p.iniciar('camera')} />
      <Botao texto="Escolher da galeria" secundario onPress={() => p.iniciar('galeria')} />
      <Text style={s.nota}>Dica: fundo simples e o look inteiro aparecendo, dos ombros aos pés.</Text>
    </View>
  );
}

function Resultado({ foto, analise, demo, voltar }: { foto: FotoPronta; analise: Analise; demo: boolean; voltar: () => void }) {
  if (!analise.valido) {
    return (
      <View>
        <Foto uri={foto.uri} />
        <View style={s.erro}><Text style={s.erroTexto}>{analise.motivo}</Text></View>
        <Botao texto="Tentar outra foto" onPress={voltar} />
      </View>
    );
  }
  return (
    <View>
      {demo && <View style={s.demo}><Text style={s.demoTexto}>Modo demonstração: resultado de exemplo, a IA ainda não está ligada.</Text></View>}
      <View>
        <Foto uri={foto.uri} />
        <View style={s.notaCaixa}>
          <Text style={s.notaNumero}>{formatarNota(analise.nota)}</Text>
          <Text style={s.notaRotulo}>{rotuloNota(analise.nota)}</Text>
        </View>
      </View>
      <Text style={s.h2}>{analise.estilo}</Text>
      <View style={s.chips}>
        {analise.cores.map((c) => (
          <View key={c} style={s.cor}><View style={[s.corBola, { backgroundColor: amostraDeCor(c) }]} /><Text style={s.chipTexto}>{c}</Text></View>
        ))}
      </View>
      {analise.pontos_fortes.length > 0 && <Text style={s.rotulo}>Pontos fortes</Text>}
      {analise.pontos_fortes.map((t) => <Text key={t} style={s.item}>• {t}</Text>)}
      {analise.sugestoes.length > 0 && <Text style={s.rotulo}>Sugestões</Text>}
      {analise.sugestoes.map((sg) => (
        <View key={sg.titulo} style={s.cartao}>
          <Text style={s.cartaoTitulo}>{sg.titulo}</Text>
          <Text style={s.p}>{sg.detalhe}</Text>
        </View>
      ))}
      {analise.combina_com.length > 0 && <Text style={s.nota}>Combina com: {analise.combina_com.join(', ')}</Text>}
      <Botao texto="Avaliar outro look" onPress={voltar} />
    </View>
  );
}

function Historico({ itens }: { itens: ItemHistorico[] }) {
  if (!itens.length) {
    return (
      <View>
        <Text style={s.h1}>Histórico</Text>
        <Text style={s.p}>Seus looks avaliados aparecem aqui. As fotos não são guardadas, só as notas e sugestões.</Text>
      </View>
    );
  }
  return (
    <View>
      <Text style={s.h1}>Histórico</Text>
      {itens.map((i) => (
        <View key={i.id} style={s.linhaHist}>
          <Text style={s.histNota}>{formatarNota(i.analise.nota)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.cartaoTitulo}>{i.analise.estilo || 'Look'}</Text>
            <Text style={s.nota}>{new Date(i.data).toLocaleDateString('pt-BR')}{i.ocasiao ? ` · ${i.ocasiao}` : ''}{i.demo ? ' · exemplo' : ''}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Privacidade({ apagar }: { apagar: () => void }) {
  const [confirmar, setConfirmar] = useState(false);
  const [feito, setFeito] = useState(false);
  return (
    <View>
      <Text style={s.h1}>Privacidade</Text>
      <Text style={s.p}>Esta é uma versão de teste. A política de privacidade completa será publicada antes da abertura ao público.</Text>
      <Text style={s.item}>• Sem cadastro: não pedimos nome, e-mail nem telefone.</Text>
      <Text style={s.item}>• A foto é reduzida no aparelho, enviada por conexão segura, analisada e descartada.</Text>
      <Text style={s.item}>• A IA avalia só as roupas. Não fazemos reconhecimento facial.</Text>
      <Text style={s.item}>• O histórico (sem fotos) fica só neste aparelho.</Text>
      {feito ? (
        <Text style={[s.p, { marginTop: 16 }]}>Pronto: histórico e consentimento apagados deste aparelho.</Text>
      ) : confirmar ? (
        <>
          <Text style={[s.p, { marginTop: 16 }]}>Apagar histórico e consentimento deste aparelho? Não dá para desfazer.</Text>
          <Botao texto="Sim, apagar tudo" perigo onPress={() => { apagar(); setFeito(true); }} />
          <Botao texto="Cancelar" secundario onPress={() => setConfirmar(false)} />
        </>
      ) : (
        <Botao texto="Apagar meus dados" secundario onPress={() => setConfirmar(true)} />
      )}
    </View>
  );
}

function Foto({ uri }: { uri: string }) {
  return <Image source={{ uri }} style={s.foto} resizeMode="cover" accessibilityLabel="Sua foto" />;
}

function Botao({ texto, onPress, secundario, perigo }: { texto: string; onPress: () => void; secundario?: boolean; perigo?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.botao, secundario && s.botaoSec, perigo && { backgroundColor: '#c0392b' }, pressed && { opacity: 0.8 }]}>
      <Text style={[s.botaoTexto, secundario && { color: C.tinta }]}>{texto}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.fundo },
  topo: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.linha },
  marca: { fontFamily: SERIFA, fontSize: 28, fontWeight: '700', color: C.tinta, letterSpacing: -0.5 },
  selo: { fontSize: 12, color: C.suave },
  conteudo: { padding: 20, paddingBottom: 40, width: '100%', maxWidth: 560, alignSelf: 'center' },
  h1: { fontFamily: SERIFA, fontSize: 34, lineHeight: 38, fontWeight: '700', color: C.tinta, marginBottom: 12, letterSpacing: -0.5 },
  h2: { fontFamily: SERIFA, fontSize: 26, fontWeight: '700', color: C.tinta, marginTop: 18, marginBottom: 10 },
  p: { fontSize: 16, lineHeight: 23, color: C.tinta, marginBottom: 8 },
  item: { fontSize: 15, lineHeight: 22, color: C.tinta, marginBottom: 6 },
  nota: { fontSize: 14, color: C.suave, marginTop: 12 },
  rotulo: { fontSize: 14, fontWeight: '700', color: C.tinta, marginTop: 20, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: C.linha, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14 },
  chipAtivo: { backgroundColor: C.tinta, borderColor: C.tinta },
  chipTexto: { fontSize: 14, color: C.tinta },
  cor: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.linha, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 10 },
  corBola: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,.12)' },
  botao: { backgroundColor: C.coral, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
  botaoSec: { backgroundColor: C.painel },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  foto: { width: '100%', aspectRatio: 3 / 4, borderRadius: 22, backgroundColor: C.painel },
  carregando: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  notaCaixa: { position: 'absolute', right: 14, top: 14, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  notaNumero: { fontFamily: SERIFA, fontSize: 36, fontWeight: '700', color: C.coral, lineHeight: 40 },
  notaRotulo: { fontSize: 12, fontWeight: '600', color: C.tinta },
  cartao: { backgroundColor: C.painel, borderRadius: 16, padding: 14, marginBottom: 10 },
  cartaoTitulo: { fontSize: 16, fontWeight: '700', color: C.tinta, marginBottom: 4 },
  erro: { backgroundColor: '#fff1ef', borderRadius: 14, padding: 14, marginVertical: 12 },
  erroTexto: { color: '#a5281b', fontSize: 15, fontWeight: '600' },
  demo: { backgroundColor: '#eef0ff', borderRadius: 12, padding: 12, marginBottom: 12 },
  demoTexto: { color: C.cobalto, fontSize: 14, fontWeight: '600' },
  abas: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.linha, paddingTop: 8, backgroundColor: C.fundo },
  aba: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  abaPonto: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  abaTexto: { fontSize: 13, color: C.suave },
  abaAtiva: { color: C.tinta, fontWeight: '700' },
  veu: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'center', padding: 20 },
  dialogo: { backgroundColor: '#fff', borderRadius: 22, padding: 22, width: '100%', maxWidth: 480, alignSelf: 'center' },
  linhaHist: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.linha },
  histNota: { fontFamily: SERIFA, fontSize: 26, fontWeight: '700', color: C.coral, width: 56 },
});
