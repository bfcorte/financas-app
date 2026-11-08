// Notificações push (Web Push). No iPhone só funciona com o app instalado na Tela de Início.
import { lerConexao } from './conexao.js';

export const ehIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const instalado = () => window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
export const suportado = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function chaveParaBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const s = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function registro() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) throw new Error('O app precisa estar publicado (service worker ausente).');
  return navigator.serviceWorker.ready;
}

export async function estadoPush() {
  if (!suportado()) return { suportado: false, permissao: 'unsupported', ativo: false };
  const permissao = Notification.permission;
  let ativo = false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    ativo = !!sub && permissao === 'granted';
  } catch (e) { /* ignora */ }
  return { suportado: true, permissao, ativo };
}

async function chamarWorker(caminho, corpo) {
  const c = lerConexao();
  if (!c || !c.push || !c.ps) throw new Error('Push não configurado: abra o link de configuração de novo.');
  const r = await fetch(c.push.replace(/\/$/, '') + caminho, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + c.ps },
    body: JSON.stringify({ deviceId: c.deviceId, ...corpo }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error('O servidor de notificações recusou (' + r.status + ').');
}

// Precisa ser chamada direto no toque do usuário (exigência do iOS).
export async function ativarPush() {
  const c = lerConexao();
  if (!c || !c.push) throw new Error('Push não configurado: abra o link de configuração de novo.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error(perm === 'denied' ? 'Notificações bloqueadas. Libere em Ajustes do iPhone > Notificações > Finanças.' : 'Permissão não concedida.');
  const reg = await registro();
  const { key } = await (await fetch(c.push.replace(/\/$/, '') + '/vapid-public-key')).json();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaBytes(key) });
  await chamarWorker('/subscribe', { subscription: sub.toJSON() });
  return true;
}

export async function desativarPush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    if (sub) await sub.unsubscribe();
  } catch (e) { /* ignora */ }
  try { await chamarWorker('/unsubscribe', {}); } catch (e) { /* ignora */ }
}
