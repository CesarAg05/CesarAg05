import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CORES, ESTILOS, EVITAR, alternar, amostraDeCor, formatarNota, resumir, type ItemHistorico, type Perfil as TPerfil } from '../logica';
import { Botao, C, Chip, SERIFA, u } from '../ui';

export function Perfil(p: { perfil: TPerfil; historico: ItemHistorico[]; salvar: (p: TPerfil) => Promise<void>; apagarTudo: () => Promise<void> }) {
  const [rascunho, setRascunho] = useState(p.perfil);
  const [salvo, setSalvo] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [apagado, setApagado] = useState(false);
  const resumo = resumir(p.historico);
  const mudou = JSON.stringify(rascunho) !== JSON.stringify(p.perfil);

  const editar = (novo: TPerfil) => { setRascunho(novo); setSalvo(false); };

  return (
    <View>
      <Text style={u.h1}>Meu estilo</Text>

      {resumo ? (
        <View style={s.painel}>
          <View style={s.numeros}>
            <Numero valor={formatarNota(resumo.media)} rotulo="média" destaque />
            <Numero valor={formatarNota(resumo.melhor)} rotulo="melhor nota" />
            <Numero valor={String(resumo.total)} rotulo={resumo.total === 1 ? 'look' : 'looks'} />
          </View>
          {resumo.recentes.length > 1 && (
            <View accessibilityLabel={`Últimas notas: ${resumo.recentes.map(formatarNota).join(', ')}`}>
              <View style={s.barras}>
                {resumo.recentes.map((n, i) => (
                  <View key={i} style={s.colBarra}>
                    <View style={[s.barra, { height: `${Math.max(6, n * 10)}%`, backgroundColor: i === resumo.recentes.length - 1 ? C.coral : '#d9d3cd' }]} />
                  </View>
                ))}
              </View>
              <Text style={s.legenda}>
                Últimas notas{resumo.tendencia > 0 ? ` · subindo ${formatarNota(resumo.tendencia)}` : resumo.tendencia < 0 ? ` · caiu ${formatarNota(-resumo.tendencia)}` : ''}
              </Text>
            </View>
          )}
          {resumo.estiloFrequente && <Text style={u.item}>Estilo mais frequente: <Text style={{ fontWeight: '700' }}>{resumo.estiloFrequente}</Text></Text>}
          {resumo.cores.length > 0 && (
            <View style={[u.chips, { marginTop: 6 }]}>
              {resumo.cores.map((c) => <Chip key={c.nome} texto={`${c.nome} ×${c.vezes}`} cor={amostraDeCor(c.nome)} />)}
            </View>
          )}
        </View>
      ) : (
        <Text style={u.p}>Avalie alguns looks e aqui aparece sua evolução: média, melhor nota, estilo e cores que você mais usa.</Text>
      )}

      <Text style={u.h2}>Quiz de estilo</Text>
      <Text style={u.p}>A IA usa suas respostas para personalizar as sugestões. A nota continua avaliando só o look.</Text>

      <Text style={u.rotulo}>Estilos que você gosta (até 3)</Text>
      <View style={u.chips}>
        {ESTILOS.map((e) => <Chip key={e} texto={e} ativo={rascunho.estilos.includes(e)} onPress={() => editar({ ...rascunho, estilos: alternar(rascunho.estilos, e, 3) })} />)}
      </View>

      <Text style={u.rotulo}>Cores favoritas (até 5)</Text>
      <View style={u.chips}>
        {CORES.map((c) => <Chip key={c} texto={c} cor={amostraDeCor(c)} ativo={rascunho.cores.includes(c)} onPress={() => editar({ ...rascunho, cores: alternar(rascunho.cores, c, 5) })} />)}
      </View>

      <Text style={u.rotulo}>Prefiro evitar</Text>
      <View style={u.chips}>
        {EVITAR.map((e) => <Chip key={e} texto={e} ativo={rascunho.evitar.includes(e)} onPress={() => editar({ ...rascunho, evitar: alternar(rascunho.evitar, e, EVITAR.length) })} />)}
      </View>

      <Botao texto={salvo ? 'Perfil salvo' : 'Salvar perfil'} desativado={!mudou} onPress={async () => { await p.salvar(rascunho); setSalvo(true); }} />
      {salvo && <Text style={[u.nota, { color: C.verde }]}>Pronto. As próximas avaliações já usam seu perfil.</Text>}

      <View style={s.separador} />
      <Text style={u.h2}>Privacidade</Text>
      <Text style={u.p}>Esta é uma versão de teste. A política de privacidade completa será publicada antes da abertura ao público.</Text>
      <Text style={u.item}>• Sem cadastro: não pedimos nome, e-mail nem telefone.</Text>
      <Text style={u.item}>• A foto do look é reduzida no aparelho, enviada por conexão segura, analisada e descartada.</Text>
      <Text style={u.item}>• A IA avalia só as roupas. Não fazemos reconhecimento facial.</Text>
      <Text style={u.item}>• Perfil, histórico e armário ficam só neste aparelho. As fotos do armário nunca saem dele.</Text>
      {apagado ? (
        <Text style={[u.p, { marginTop: 16 }]}>Pronto: tudo foi apagado deste aparelho.</Text>
      ) : confirmar ? (
        <>
          <Text style={[u.p, { marginTop: 16 }]}>Apagar perfil, histórico, armário e consentimento deste aparelho? Não dá para desfazer.</Text>
          <Botao texto="Sim, apagar tudo" perigo onPress={async () => { await p.apagarTudo(); setRascunho({ estilos: [], cores: [], evitar: [] }); setApagado(true); }} />
          <Botao texto="Cancelar" secundario onPress={() => setConfirmar(false)} />
        </>
      ) : (
        <Botao texto="Apagar meus dados" secundario onPress={() => setConfirmar(true)} />
      )}
    </View>
  );
}

function Numero({ valor, rotulo, destaque }: { valor: string; rotulo: string; destaque?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[s.numero, destaque && { color: C.coral }]}>{valor}</Text>
      <Text style={s.numeroRotulo}>{rotulo}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  painel: { backgroundColor: C.painel, borderRadius: 20, padding: 16, gap: 10 },
  numeros: { flexDirection: 'row', gap: 8 },
  numero: { fontFamily: SERIFA, fontSize: 32, fontWeight: '700', color: C.tinta, lineHeight: 36 },
  numeroRotulo: { fontSize: 13, color: C.suave },
  barras: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 64, marginTop: 4 },
  colBarra: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  barra: { width: '100%', borderRadius: 4 },
  legenda: { fontSize: 13, color: C.suave, marginTop: 6 },
  separador: { height: 1, backgroundColor: C.linha, marginTop: 28 },
});
