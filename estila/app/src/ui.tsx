// Peças visuais compartilhadas: cores, tipografia, botões e chips.
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export const C = { fundo: '#ffffff', tinta: '#141414', suave: '#6b6661', painel: '#f5f3f1', linha: '#e6e1dc', coral: '#ff4f3a', cobalto: '#2643ff', verde: '#1f7a5a' };
export const SERIFA = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

export function Botao({ texto, onPress, secundario, perigo, desativado }: { texto: string; onPress: () => void; secundario?: boolean; perigo?: boolean; desativado?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!desativado }}
      style={({ pressed }) => [u.botao, secundario && u.botaoSec, perigo && { backgroundColor: '#c0392b' }, (pressed || desativado) && { opacity: desativado ? 0.4 : 0.8 }]}
    >
      <Text style={[u.botaoTexto, secundario && { color: C.tinta }]}>{texto}</Text>
    </Pressable>
  );
}

export function Chip({ texto, ativo, onPress, cor }: { texto: string; ativo?: boolean; onPress?: () => void; cor?: string }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[u.chip, ativo && u.chipAtivo]} accessibilityRole={onPress ? 'checkbox' : undefined} accessibilityState={onPress ? { checked: !!ativo } : undefined}>
      {cor && <View style={[u.corBola, { backgroundColor: cor }]} />}
      <Text style={[u.chipTexto, ativo && { color: '#fff' }]}>{texto}</Text>
    </Pressable>
  );
}

export function Foto({ uri, estilo }: { uri: string; estilo?: object }) {
  return <Image source={{ uri }} style={[u.foto, estilo]} resizeMode="cover" accessibilityLabel="Foto" />;
}

export const u = StyleSheet.create({
  h1: { fontFamily: SERIFA, fontSize: 34, lineHeight: 38, fontWeight: '700', color: C.tinta, marginBottom: 12, letterSpacing: -0.5 },
  h2: { fontFamily: SERIFA, fontSize: 26, fontWeight: '700', color: C.tinta, marginTop: 18, marginBottom: 10 },
  p: { fontSize: 16, lineHeight: 23, color: C.tinta, marginBottom: 8 },
  item: { fontSize: 15, lineHeight: 22, color: C.tinta, marginBottom: 6 },
  nota: { fontSize: 14, color: C.suave, marginTop: 12 },
  rotulo: { fontSize: 14, fontWeight: '700', color: C.tinta, marginTop: 20, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.linha, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14 },
  chipAtivo: { backgroundColor: C.tinta, borderColor: C.tinta },
  chipTexto: { fontSize: 14, color: C.tinta },
  corBola: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,.12)' },
  botao: { backgroundColor: C.coral, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
  botaoSec: { backgroundColor: C.painel },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  foto: { width: '100%', aspectRatio: 3 / 4, borderRadius: 22, backgroundColor: C.painel },
  cartao: { backgroundColor: C.painel, borderRadius: 16, padding: 14, marginBottom: 10 },
  cartaoTitulo: { fontSize: 16, fontWeight: '700', color: C.tinta, marginBottom: 4 },
  erro: { backgroundColor: '#fff1ef', borderRadius: 14, padding: 14, marginVertical: 12 },
  erroTexto: { color: '#a5281b', fontSize: 15, fontWeight: '600' },
  aviso: { backgroundColor: '#eef0ff', borderRadius: 12, padding: 12, marginBottom: 12 },
  avisoTexto: { color: C.cobalto, fontSize: 14, fontWeight: '600' },
  voltar: { paddingVertical: 8, marginBottom: 8, alignSelf: 'flex-start' },
  voltarTexto: { fontSize: 15, fontWeight: '600', color: C.cobalto },
});
