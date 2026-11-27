/**
 * Minimal accessible modal built on the native <dialog> element.
 * openDialog resolves with the `value` of the clicked action, or 'cancel'
 * when dismissed with Escape.
 */
import { esc } from './util.js';

export function openDialog({ title, bodyHtml = '', actions = [{ label: 'OK', value: 'ok', cls: 'primary' }] }) {
  const dlg = document.getElementById('dialog');
  const returnFocus = document.activeElement;
  dlg.innerHTML = `<form method="dialog" class="dialog-inner">
      <h2 id="dialog-title">${esc(title)}</h2>
      <div class="dialog-body">${bodyHtml}</div>
      <div class="btn-row">${actions
        .map((a) => `<button class="btn ${a.cls || ''}" value="${esc(a.value)}">${esc(a.label)}</button>`)
        .join('')}</div>
    </form>`;
  return new Promise((resolve) => {
    const onClose = () => {
      dlg.removeEventListener('close', onClose);
      resolve(dlg.returnValue || 'cancel');
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
    };
    dlg.returnValue = '';
    dlg.addEventListener('close', onClose);
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    // Focus the first action that isn't destructive.
    const first = dlg.querySelector('.dialog-body input, .btn:not(.danger)');
    first?.focus();
  });
}

/** Convenience confirm: resolves true if the user picked the confirm action. */
export async function confirmDialog(title, message, confirmLabel = 'Confirm', danger = true) {
  const res = await openDialog({
    title,
    bodyHtml: `<p>${esc(message)}</p>`,
    actions: [
      { label: 'Cancel', value: 'cancel' },
      { label: confirmLabel, value: 'confirm', cls: danger ? 'danger' : 'primary' }
    ]
  });
  return res === 'confirm';
}
