import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatarNota, type ItemHistorico } from '../logica';
import { C, SERIFA, u } from '../ui';
import { DetalheAnalise } from './Avaliar';

export function Historico({ itens }: { itens: ItemHistorico[] }) {
  const [aberto, setAberto] = useState<ItemHistorico | null>(null);

  if (aberto) {
    return (
      <View>
        <Pressable onPress={() => setAberto(null)} style={u.voltar} accessibilityRole="button"><Text style={u.voltarTexto}>‹ Histórico</Text></Pressable>
        <Text style={u.nota}>{dataLonga(aberto.data)}{aberto.ocasiao ? ` · ${aberto.ocasiao}` : ''}{aberto.demo ? ' · exemplo' : ''}</Text>
        <View style={{ height: 12 }} />
        <DetalheAnalise analise={aberto.analise} />
        <Text style={u.nota}>A foto não é guardada, só a avaliação.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={u.h1}>Histórico</Text>
      {!itens.length && <Text style={u.p}>Seus looks avaliados aparecem aqui. As fotos não são guardadas, só as notas e sugestões.</Text>}
      {itens.map((i) => (
        <Pressable key={i.id} onPress={() => setAberto(i)} style={s.linha} accessibilityRole="button" accessibilityLabel={`Ver avaliação de ${i.analise.estilo || 'look'}, nota ${formatarNota(i.analise.nota)}`}>
          <Text style={s.nota}>{formatarNota(i.analise.nota)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={u.cartaoTitulo}>{i.analise.estilo || 'Look'}</Text>
            <Text style={s.meta}>{new Date(i.data).toLocaleDateString('pt-BR')}{i.ocasiao ? ` · ${i.ocasiao}` : ''}{i.demo ? ' · exemplo' : ''}</Text>
          </View>
          <Text style={s.seta}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

function dataLonga(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const s = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.linha },
  nota: { fontFamily: SERIFA, fontSize: 26, fontWeight: '700', color: C.coral, width: 56 },
  meta: { fontSize: 14, color: C.suave },
  seta: { fontSize: 24, color: C.suave },
});
