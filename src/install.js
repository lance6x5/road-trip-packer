/**
 * "Install app" button for this PWA.
 *
 * - Shown only when the browser says the app can be installed (beforeinstallprompt:
 *   Chrome, Edge, Samsung Internet, Android) and the app isn't already installed.
 * - On iPhone/iPad Safari, which has no install event, shows the same button with
 *   "Share > Add to Home Screen" instructions instead.
 * - Never shown when running as the installed app, and removed after installing.
 * - Other browsers (e.g. desktop Firefox) can't install PWAs, so nothing is shown.
 *
 * Call initInstallButton() as early as possible (before rendering), because the
 * browser may fire beforeinstallprompt right after load. The button is mounted into
 * the first element matching `selector` as soon as it exists.
 */
import './install.css';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
  window.navigator.standalone === true;

// iPadOS 13+ reports itself as Mac, so also check for touch support.
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function initInstallButton({ appName = document.title, selector = 'header' } = {}) {
  if (isStandalone()) return;

  let deferred = null; // the saved beforeinstallprompt event
  let button = null;
  let help = null;

  const remove = () => {
    button?.remove();
    help?.remove();
    button = help = null;
  };

  const showHelp = () => {
    if (help) { help.hidden = !help.hidden; return; }
    help = document.createElement('div');
    help.className = 'pwa-install-help';
    help.setAttribute('role', 'dialog');
    help.setAttribute('aria-label', `Install ${appName}`);
    const text = document.createElement('p');
    text.textContent = `To install ${appName}, tap the Share button, then "Add to Home Screen".`;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'pwa-install-close';
    close.textContent = 'Got it';
    close.addEventListener('click', () => { help.hidden = true; button?.focus(); });
    help.append(text, close);
    button.after(help);
    close.focus();
  };

  const mount = () => {
    if (button) return;
    const host = document.querySelector(selector);
    if (!host) return false;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'pwa-install-btn';
    button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11 3h2v9.2l3.3-3.3 1.4 1.4L12 16l-5.7-5.7 1.4-1.4L11 12.2zM5 18h14v2H5z"/></svg><span>Install app</span>';
    button.title = `Install ${appName} on this device (works offline)`;
    button.setAttribute('aria-label', `Install ${appName} app`);
    button.addEventListener('click', async () => {
      if (deferred) {
        deferred.prompt();
        const { outcome } = await deferred.userChoice;
        deferred = null; // the event can only be used once
        if (outcome === 'accepted') remove();
        else button.hidden = true; // the browser will fire a fresh event if it's still installable
      } else if (isIOS()) {
        showHelp();
      }
    });
    host.append(button);
    return true;
  };

  // Wait for the header to appear (React apps render it after this runs).
  const mountWhenReady = () => {
    if (mount() !== false) return;
    const obs = new MutationObserver(() => { if (mount() !== false) obs.disconnect(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 10000);
  };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep the browser's own mini-infobar quiet; we show our button instead
    deferred = e;
    mountWhenReady();
    if (button) button.hidden = false;
  });

  window.addEventListener('appinstalled', remove);

  // iOS Safari never fires beforeinstallprompt.
  if (isIOS()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountWhenReady, { once: true });
    else mountWhenReady();
  }
}
