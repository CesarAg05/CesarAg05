import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORIAS, CORES, LIMITE_ARMARIO, amostraDeCor, contarPorCategoria, type Categoria, type Cor, type Peca } from '../logica';
import { fotografarPeca, verificarPeca } from '../servicos';
import { Botao, C, Chip, u } from '../ui';

type Etapa =
  | { tipo: 'lista' }
  | { tipo: 'conferindo'; miniatura: string }
  | { tipo: 'nova'; miniatura: string; categoria: Categoria | null; cor: Cor | null; conferida: boolean }
  | { tipo: 'ver'; peca: Peca; confirmar: boolean };

export function Armario(p: { pecas: Peca[]; guardar: (p: Peca) => Promise<void>; remover: (id: string) => Promise<void>; comConsentimento: (acao: () => void) => void }) {
  const [etapa, setEtapa] = useState<Etapa>({ tipo: 'lista' });
  const [filtro, setFiltro] = useState<Categoria | null>(null);
  const [erro, setErro] = useState('');
  const contagem = contarPorCategoria(p.pecas);

  // Só entram peças de roupa: a IA confere a foto antes. Se não for roupa, a foto é descartada.
  async function adicionar(origem: 'camera' | 'galeria') {
    setErro('');
    let miniatura: string | null = null;
    try {
      miniatura = await fotografarPeca(origem);
      if (!miniatura) return;
      setEtapa({ tipo: 'conferindo', miniatura });
      const v = await verificarPeca(miniatura);
      if (v.tipo === 'nao-roupa') {
        setEtapa({ tipo: 'lista' });
        setErro(`Só roupas, calçados e acessórios podem entrar no armário. ${v.motivo}`);
      } else if (v.tipo === 'roupa') {
        setEtapa({ tipo: 'nova', miniatura, categoria: v.categoria, cor: v.cor, conferida: true });
      } else {
        setEtapa({ tipo: 'nova', miniatura, categoria: filtro, cor: null, conferida: false });
      }
    } catch (e) {
      setEtapa({ tipo: 'lista' });
      setErro(e instanceof Error ? `Não foi possível conferir a peça. ${e.message}` : 'Não foi possível conferir a peça.');
    }
  }

  if (etapa.tipo === 'conferindo') {
    return (
      <View>
        <Image source={{ uri: etapa.miniatura }} style={s.previa} accessibilityLabel="Foto da peça" />
        <View style={s.conferindo}><ActivityIndicator color={C.coral} /><Text style={u.p}>Conferindo se é uma peça de roupa…</Text></View>
      </View>
    );
  }

  if (etapa.tipo === 'nova') {
    const pronta = etapa.categoria && etapa.cor;
    return (
      <View>
        <Pressable onPress={() => setEtapa({ tipo: 'lista' })} style={u.voltar} accessibilityRole="button"><Text style={u.voltarTexto}>‹ Cancelar</Text></Pressable>
        <Image source={{ uri: etapa.miniatura }} style={s.previa} accessibilityLabel="Foto da peça" />
        {etapa.conferida ? (
          <Text style={[u.nota, { color: C.verde }]}>Peça conferida pela IA. Categoria e cor já vieram preenchidas; ajuste se precisar.</Text>
        ) : (
          <View style={[u.aviso, { marginTop: 12 }]}><Text style={u.avisoTexto}>Modo demonstração: a conferência automática liga junto com a IA.</Text></View>
        )}
        <Text style={u.rotulo}>Que peça é?</Text>
        <View style={u.chips}>{CATEGORIAS.map((c) => <Chip key={c} texto={c} ativo={etapa.categoria === c} onPress={() => setEtapa({ ...etapa, categoria: c })} />)}</View>
        <Text style={u.rotulo}>Cor principal</Text>
        <View style={u.chips}>{CORES.map((c) => <Chip key={c} texto={c} cor={amostraDeCor(c)} ativo={etapa.cor === c} onPress={() => setEtapa({ ...etapa, cor: c })} />)}</View>
        {erro ? <View style={u.erro}><Text style={u.erroTexto}>{erro}</Text></View> : null}
        <Botao texto="Guardar no armário" desativado={!pronta} onPress={async () => {
          if (!etapa.categoria || !etapa.cor) return;
          try {
            await p.guardar({ id: String(Date.now()), categoria: etapa.categoria, cor: etapa.cor, miniatura: etapa.miniatura, data: new Date().toISOString() });
            setEtapa({ tipo: 'lista' });
          } catch (e) {
            setErro(e instanceof Error ? e.message : 'Não foi possível guardar.');
          }
        }} />
      </View>
    );
  }

  if (etapa.tipo === 'ver') {
    const { peca } = etapa;
    return (
      <View>
        <Pressable onPress={() => setEtapa({ tipo: 'lista' })} style={u.voltar} accessibilityRole="button"><Text style={u.voltarTexto}>‹ Armário</Text></Pressable>
        <Image source={{ uri: peca.miniatura }} style={s.previa} accessibilityLabel={`${peca.categoria} ${peca.cor}`} />
        <Text style={u.h2}>{peca.categoria}</Text>
        <View style={u.chips}><Chip texto={peca.cor} cor={amostraDeCor(peca.cor)} /></View>
        {etapa.confirmar ? (
          <>
            <Text style={[u.p, { marginTop: 16 }]}>Remover esta peça do armário?</Text>
            <Botao texto="Sim, remover" perigo onPress={async () => { await p.remover(peca.id); setEtapa({ tipo: 'lista' }); }} />
            <Botao texto="Cancelar" secundario onPress={() => setEtapa({ ...etapa, confirmar: false })} />
          </>
        ) : (
          <Botao texto="Remover peça" secundario onPress={() => setEtapa({ ...etapa, confirmar: true })} />
        )}
      </View>
    );
  }

  const visiveis = filtro ? p.pecas.filter((x) => x.categoria === filtro) : p.pecas;
  return (
    <View>
      <Text style={u.h1}>Meu armário</Text>
      <Text style={u.p}>Fotografe suas peças para ter o guarda-roupa sempre à mão. Só entram roupas, calçados e acessórios: a IA confere cada foto. As fotos ficam guardadas só neste aparelho.</Text>
      <View style={u.chips}>
        <Chip texto={`tudo ${p.pecas.length}`} ativo={!filtro} onPress={() => setFiltro(null)} />
        {CATEGORIAS.map((c) => <Chip key={c} texto={`${c} ${contagem[c]}`} ativo={filtro === c} onPress={() => setFiltro(filtro === c ? null : c)} />)}
      </View>
      {erro ? <View style={u.erro}><Text style={u.erroTexto}>{erro}</Text></View> : null}
      {visiveis.length ? (
        <View style={s.grade}>
          {visiveis.map((x) => (
            <Pressable key={x.id} onPress={() => setEtapa({ tipo: 'ver', peca: x, confirmar: false })} style={s.celula} accessibilityRole="button" accessibilityLabel={`${x.categoria} ${x.cor}`}>
              <Image source={{ uri: x.miniatura }} style={s.miniatura} />
              <View style={s.etiqueta}><View style={[u.corBola, { backgroundColor: amostraDeCor(x.cor) }]} /><Text style={s.etiquetaTexto} numberOfLines={1}>{x.categoria}</Text></View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={s.vazio}><Text style={u.p}>{filtro ? `Nenhuma peça em "${filtro}" ainda.` : 'Seu armário está vazio. Comece pelas peças que você mais usa.'}</Text></View>
      )}
      <Botao texto="Fotografar peça" desativado={p.pecas.length >= LIMITE_ARMARIO} onPress={() => p.comConsentimento(() => adicionar('camera'))} />
      <Botao texto="Adicionar da galeria" secundario desativado={p.pecas.length >= LIMITE_ARMARIO} onPress={() => p.comConsentimento(() => adicionar('galeria'))} />
      <Text style={u.nota}>{p.pecas.length} de {LIMITE_ARMARIO} peças. Em breve: montar looks com o que você já tem.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  celula: { width: '31.5%' },
  miniatura: { width: '100%', aspectRatio: 3 / 4, borderRadius: 14, backgroundColor: C.painel },
  etiqueta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  etiquetaTexto: { fontSize: 12, color: C.suave, flex: 1 },
  vazio: { borderWidth: 1, borderStyle: 'dashed', borderColor: C.linha, borderRadius: 16, padding: 18, marginTop: 16 },
  conferindo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, justifyContent: 'center' },
  previa: { width: '70%', aspectRatio: 3 / 4, borderRadius: 18, alignSelf: 'center', backgroundColor: C.painel },
});
