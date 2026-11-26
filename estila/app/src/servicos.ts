// Tudo que fala com o aparelho e com o servidor: câmera, galeria, redução da foto, envio e histórico local.
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adicionarAoHistorico, lerHistorico, lerResposta, novoTamanho, type ItemHistorico, type Ocasiao } from './logica';

// Endereço do servidor. Em produção, defina EXPO_PUBLIC_API_URL (por exemplo no arquivo .env).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

const CHAVE_CONSENTIMENTO = 'estila:consentimento:v1';
const CHAVE_HISTORICO = 'estila:historico:v1';

export interface FotoPronta { uri: string; base64: string }

export async function escolherFoto(origem: 'camera' | 'galeria'): Promise<FotoPronta | null> {
  if (origem === 'camera') {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) throw new Error('Sem permissão para usar a câmera. Libere nas configurações do celular.');
  }
  const opcoes: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 1, exif: false, allowsEditing: false };
  const r = origem === 'camera' ? await ImagePicker.launchCameraAsync(opcoes) : await ImagePicker.launchImageLibraryAsync(opcoes);
  if (r.canceled || !r.assets?.length) return null;
  const a = r.assets[0];
  // Regrava a foto em JPEG menor: reduz o envio e descarta metadados (localização, modelo do aparelho).
  const ctx = ImageManipulator.manipulate(a.uri);
  const tam = novoTamanho(a.width, a.height);
  if (tam) ctx.resize(tam);
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!out.base64) throw new Error('Não foi possível preparar a foto.');
  return { uri: out.uri, base64: out.base64 };
}

export async function analisar(foto: FotoPronta, ocasiao: Ocasiao | null) {
  const controle = new AbortController();
  const tempo = setTimeout(() => controle.abort(), 70_000);
  try {
    const r = await fetch(`${API_URL}/analisar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagem: foto.base64, ocasiao }),
      signal: controle.signal,
    });
    let corpo: unknown;
    try { corpo = await r.json(); } catch { throw new Error('O servidor não respondeu direito. Tente de novo.'); }
    return lerResposta(corpo);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw new Error('Demorou demais. Verifique a internet e tente de novo.');
    if (e instanceof TypeError) throw new Error('Sem conexão com o servidor. Verifique a internet.');
    throw e;
  } finally {
    clearTimeout(tempo);
  }
}

async function ler(chave: string) {
  try { return await AsyncStorage.getItem(chave); } catch { return null; }
}

export async function temConsentimento() {
  return (await ler(CHAVE_CONSENTIMENTO)) === 'sim';
}
export async function darConsentimento() {
  await AsyncStorage.setItem(CHAVE_CONSENTIMENTO, 'sim');
}
export async function carregarHistorico() {
  return lerHistorico(await ler(CHAVE_HISTORICO));
}
export async function salvarNoHistorico(item: ItemHistorico) {
  const lista = adicionarAoHistorico(await carregarHistorico(), item);
  await AsyncStorage.setItem(CHAVE_HISTORICO, JSON.stringify(lista));
  return lista;
}
export async function apagarTudo() {
  await AsyncStorage.multiRemove([CHAVE_CONSENTIMENTO, CHAVE_HISTORICO]);
}
