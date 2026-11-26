// Registra o service worker (modo offline) e mostra o botão "Instalar app" quando o navegador permitir.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

const botao = document.getElementById('instalar');
const dicaIos = document.getElementById('dica-ios');
let pedido = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  pedido = e;
  if (botao) botao.hidden = false;
});

botao?.addEventListener('click', async () => {
  if (!pedido) return;
  pedido.prompt();
  await pedido.userChoice;
  pedido = null;
  botao.hidden = true;
});

window.addEventListener('appinstalled', () => { if (botao) botao.hidden = true; });

// iPhone/iPad não têm botão de instalar: mostra a instrução manual.
const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
const instalado = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (dicaIos && ios && !instalado) dicaIos.hidden = false;
