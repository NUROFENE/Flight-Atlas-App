import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { CapacitorHttp } from '@capacitor/core';

const CALLBACK = 'flightatlas://auth/callback';
const listeners = new Set();
const errorListeners = new Set();
let lastCallback = '';
const mobileVersion = 'Android beta 0.1.0';
const dispatchCallback = url => {
  if (typeof url !== 'string' || !url.startsWith(CALLBACK)) return;
  if (url === lastCallback) return;
  lastCallback = url;
  for (const fn of [...listeners]) {
    try { fn(url); } catch (e) { console.error('Android OAuth callback:', e); }
  }
};
const notifyError = e => {
  const message = String(e?.message || e || 'Неизвестная ошибка');
  for (const fn of [...errorListeners]) fn(message);
};
App.addListener('appUrlOpen', ({ url }) => dispatchCallback(url)).catch(notifyError);
App.getLaunchUrl().then(result => {
  if (result?.url) setTimeout(() => dispatchCallback(result.url), 500);
}).catch(() => {});

const parseHttpData = response => {
  if (response.status < 200 || response.status >= 300) {
    throw new Error('HTTP ' + response.status);
  }
  if (typeof response.data === 'string') {
    try { return JSON.parse(response.data); } catch { return response.data; }
  }
  return response.data;
};

// The desktop Electron preload API is emulated only for functionality that
// makes sense on a phone. No direct SimConnect/Windows updater is exposed.
window.flightAtlasDesktop = Object.freeze({
  version: async () => mobileVersion,
  startDiscordLogin: async () => {
    const url = 'https://adtvscheowcmnogysars.supabase.co/auth/v1/authorize?provider=discord&redirect_to=' + encodeURIComponent(CALLBACK);
    await Browser.open({ url, presentationStyle: 'fullscreen' });
    return { ok: true };
  },
  onDiscordCallback: fn => { listeners.add(fn); return () => listeners.delete(fn); },
  onDiscordError: fn => { errorListeners.add(fn); return () => errorListeners.delete(fn); },
  minimizeWindow: async () => false,
  toggleMaximizeWindow: async () => false,
  closeWindow: async () => false,
  isWindowMaximized: async () => false,
  metar: async ids => {
    if (!/^[A-Z0-9]{4}(,[A-Z0-9]{4}){0,6}$/.test(String(ids))) {
      throw new Error('Недопустимые ICAO для METAR');
    }
    const r = await CapacitorHttp.get({
      url: 'https://aviationweather.gov/api/data/metar',
      params: { ids, format: 'json' },
      headers: { Accept: 'application/json' }
    });
    return parseHttpData(r);
  },
  simbrief: async id => {
    if (!/^\d{1,10}$/.test(String(id))) throw new Error('Неверный SimBrief Pilot ID');
    const r = await CapacitorHttp.get({
      url: 'https://www.simbrief.com/api/xml.fetcher.php',
      params: { userid: String(id) },
      responseType: 'text',
      headers: { Accept: 'application/xml' }
    });
    if (r.status < 200 || r.status >= 300) throw new Error('SimBrief HTTP ' + r.status);
    return typeof r.data === 'string' ? r.data : String(r.data ?? '');
  },
  simconnect: async () => ({ connected: false, position: null, reason: 'Windows only' }),
  simlinkStatus: async () => ({ connected: false, running: false, enabled: false }),
  simlinkToggle: async () => ({ ok: false, error: 'SimConnect работает только на Windows' }),
  checkUpdates: async () => ({ ok: false, error: 'Обновления Android через Google Play' }),
  installUpdate: async () => ({ ok: false, error: 'Обновления Android через Google Play' }),
  onUpdate: () => () => {}
});

// External sites are opened through the Android Custom Tabs system browser.
const openExternal = async url => {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return;
  try { await Browser.open({ url }); }
  catch { location.href = url; }
};
document.addEventListener('click', event => {
  const anchor = event.target.closest?.('a[href][target="_blank"]');
  if (anchor && /^https:\/\//i.test(anchor.href)) {
    event.preventDefault();
    void openExternal(anchor.href);
  }
}, true);

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('flight-atlas-android');
  const pages = [
    ['⌂', 'Главная', 'homeNav'],
    ['≡', 'Чарты', 'chartsNav'],
    ['◎', 'VATSIM', 'vatsimNav'],
    ['▦', 'Моды', 'newModsNav'],
    ['♛', 'Рейтинг', 'newLeadersNav'],
    ['◉', 'Профиль', 'profileNav']
  ];
  const header = document.createElement('header');
  header.className = 'fa-mobile-header';
  header.innerHTML = '<div class="fa-mobile-logo">✈</div><div><strong>FLIGHT ATLAS</strong><small>ANDROID · BETA</small></div><span class="fa-mobile-online" title="Каталог синхронизируется через интернет">●</span>';
  const nav = document.createElement('nav');
  nav.className = 'fa-mobile-tabs';
  nav.setAttribute('aria-label', 'Основные разделы Flight Atlas');
  const setCurrent = (id) => {
    nav.querySelectorAll('button').forEach(btn => {
      const active = btn.dataset.target === id;
      btn.classList.toggle('current', active);
      btn.setAttribute('aria-current', active ? 'page' : 'false');
    });
  };
  for (const [icon, label, id] of pages) {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.target = id; b.setAttribute('aria-label', label);
    const glyph = document.createElement('span'); glyph.className = 'fa-mobile-tab-icon'; glyph.textContent = icon;
    const name = document.createElement('span'); name.textContent = label;
    b.append(glyph, name);
    b.addEventListener('click', () => {
      setCurrent(id);
      if (id === 'vatsimNav') {
        void openExternal('https://vatsim-radar.com/');
        return;
      }
      const target = document.getElementById(id);
      if (target) target.click();
    });
    nav.append(b);
  }
  document.body.append(header, nav);
  setCurrent('homeNav');
  // The sidebar remains in the DOM, so all existing SPA navigation handlers work.
  App.addListener('backButton', () => {
    if (document.querySelector('.modal.open, .atlas-modal.open')) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return;
    }
    document.getElementById('homeNav')?.click();
    setCurrent('homeNav');
  }).catch(() => {});
});
