import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PERFIL_VAZIO, type ItemHistorico, type Ocasiao, type Peca, type Perfil as TPerfil } from './src/logica';
import {
  analisar, apagarTudo, carregarArmario, carregarHistorico, carregarPerfil, darConsentimento, escolherFoto,
  guardarPeca, removerPeca, salvarNoHistorico, salvarPerfil, temConsentimento, type FotoPronta,
} from './src/servicos';
import { Botao, C, SERIFA, u } from './src/ui';
import { Avaliar, type EstadoAvaliar } from './src/telas/Avaliar';
import { Armario } from './src/telas/Armario';
import { Historico } from './src/telas/Historico';
import { Perfil } from './src/telas/Perfil';

type Aba = 'avaliar' | 'armario' | 'historico' | 'perfil';
const ABAS: [Aba, string][] = [['avaliar', 'Avaliar'], ['armario', 'Armário'], ['historico', 'Histórico'], ['perfil', 'Meu estilo']];

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
  const [estado, setEstado] = useState<EstadoAvaliar>({ tipo: 'inicio' });
  const [ocasiao, setOcasiao] = useState<Ocasiao | null>(null);
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const [perfil, setPerfil] = useState<TPerfil>(PERFIL_VAZIO);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [pendente, setPendente] = useState<null | (() => void)>(null);

  useEffect(() => {
    carregarHistorico().then(setHistorico);
    carregarPerfil().then(setPerfil);
    carregarArmario().then(setPecas);
  }, []);

  // Antes da primeira foto enviada (look ou peça), pede o consentimento e depois continua a ação.
  async function comConsentimento(acao: () => void) {
    if (await temConsentimento()) acao();
    else setPendente(() => acao);
  }

  async function iniciar(origem: 'camera' | 'galeria') {
    if (!(await temConsentimento())) { setPendente(() => () => iniciar(origem)); return; }
    let foto: FotoPronta | null = null;
    try {
      foto = await escolherFoto(origem);
      if (!foto) return;
      setEstado({ tipo: 'analisando', foto });
      const { analise, demo } = await analisar(foto, ocasiao, perfil);
      setEstado({ tipo: 'resultado', foto, analise, demo });
      if (analise.valido) {
        setHistorico(await salvarNoHistorico({ id: String(Date.now()), data: new Date().toISOString(), ocasiao, demo, analise }));
      }
    } catch (e) {
      setEstado({ tipo: 'erro', mensagem: e instanceof Error ? e.message : 'Algo deu errado.' });
    }
  }

  async function aceitar() {
    const acao = pendente;
    await darConsentimento();
    setPendente(null);
    acao?.();
  }

  return (
    <View style={[s.raiz, { paddingTop: ins.top }]}>
      <View style={s.topo}>
        <Text style={s.marca}>Estila</Text>
        <Text style={s.selo}>versão de teste</Text>
      </View>

      <ScrollView key={aba} contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
        {aba === 'avaliar' && (
          <Avaliar estado={estado} ocasiao={ocasiao} perfil={perfil} setOcasiao={setOcasiao} iniciar={iniciar}
            voltar={() => setEstado({ tipo: 'inicio' })} irParaPerfil={() => setAba('perfil')} />
        )}
        {aba === 'armario' && (
          <Armario pecas={pecas} comConsentimento={comConsentimento} guardar={async (p) => setPecas(await guardarPeca(p))} remover={async (id) => setPecas(await removerPeca(id))} />
        )}
        {aba === 'historico' && <Historico itens={historico} />}
        {aba === 'perfil' && (
          <Perfil perfil={perfil} historico={historico}
            salvar={async (p) => { await salvarPerfil(p); setPerfil(p); }}
            apagarTudo={async () => { await apagarTudo(); setHistorico([]); setPecas([]); setPerfil(PERFIL_VAZIO); setEstado({ tipo: 'inicio' }); }} />
        )}
      </ScrollView>

      <View style={[s.abas, { paddingBottom: Math.max(ins.bottom, 10) }]} accessibilityRole="tablist">
        {ABAS.map(([id, nome]) => (
          <Pressable key={id} onPress={() => setAba(id)} style={s.aba} accessibilityRole="tab" accessibilityState={{ selected: aba === id }}>
            <View style={[s.abaPonto, aba === id && { backgroundColor: C.coral }]} />
            <Text style={[s.abaTexto, aba === id && s.abaAtiva]}>{nome}</Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={pendente !== null} transparent animationType="none" onRequestClose={() => setPendente(null)}>
        <View style={s.veu}>
          <View style={s.dialogo}>
            <Text style={u.h2}>Antes da primeira foto</Text>
            <Text style={u.p}>Para avaliar o look ou conferir uma peça do armário, a foto é enviada com segurança ao nosso servidor e analisada por inteligência artificial.</Text>
            <Text style={u.item}>• No servidor, a foto é descartada logo após a análise. Nada fica guardado lá.</Text>
            <Text style={u.item}>• Avaliamos só a roupa. Nunca o corpo, o rosto ou quem você é.</Text>
            <Text style={u.item}>• Localização e dados escondidos da foto são removidos antes do envio.</Text>
            <Text style={u.item}>• Histórico e armário ficam só neste aparelho e você pode apagar quando quiser.</Text>
            <Botao texto="Concordo e continuar" onPress={aceitar} />
            <Botao texto="Agora não" secundario onPress={() => setPendente(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.fundo },
  topo: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.linha },
  marca: { fontFamily: SERIFA, fontSize: 28, fontWeight: '700', color: C.tinta, letterSpacing: -0.5 },
  selo: { fontSize: 12, color: C.suave },
  conteudo: { padding: 20, paddingBottom: 40, width: '100%', maxWidth: 560, alignSelf: 'center' },
  abas: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.linha, paddingTop: 8, backgroundColor: C.fundo },
  aba: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  abaPonto: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  abaTexto: { fontSize: 13, color: C.suave },
  abaAtiva: { color: C.tinta, fontWeight: '700' },
  veu: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'center', padding: 20 },
  dialogo: { backgroundColor: '#fff', borderRadius: 22, padding: 22, width: '100%', maxWidth: 480, alignSelf: 'center' },
});
