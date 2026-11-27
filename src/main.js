/**
 * App entry: hash router, state, and delegated event handling.
 *
 * Routes:
 *   #/            home (trip list, new trip, data tools)
 *   #/trip/<id>   a saved trip
 *   #/s/<data>    a shared trip decoded from the URL (unsaved until the user saves it)
 */
import './styles.css';
import * as M from './model.js';
import { getAllTrips, saveTrip, deleteTrip, clearAll } from './storage.js';
import { decodeTrip, encodeTrip, shareUrl, SHARE_PREFIX, LONG_URL_WARN, VERY_LONG_URL } from './share.js';
import { renderHome } from './views/home.js';
import { renderTrip } from './views/trip.js';
import { openDialog, confirmDialog } from './dialog.js';
import { copyText, downloadJson, esc, slug, toast } from './util.js';
import { initFeedback } from './feedback.js';

const main = document.getElementById('main');

/* global __APP_VERSION__ */
const APP_VERSION = typeof __APP_VERSION__ === 'undefined' ? 'dev' : __APP_VERSION__;
const versionEl = document.getElementById('app-version');
if (versionEl) versionEl.textContent = `v${APP_VERSION}`;
initFeedback(document.getElementById('feedback'), APP_VERSION);

const state = {
  trips: [],
  current: null, // trip being viewed
  ephemeral: false, // true when viewing an unsaved shared link
  editingId: null // item id currently in edit mode
};

/* ---------------------------------------------------------------- rendering */

function render(focusKey) {
  const active = focusKey ?? document.activeElement?.dataset?.fk;
  if (state.current) {
    main.innerHTML = renderTrip(state.current, { ephemeral: state.ephemeral, editingId: state.editingId });
    document.title = `${state.current.name} · Trunkful`;
  } else {
    main.innerHTML = renderHome(state.trips);
    document.title = 'Trunkful: Road Trip Packing List';
  }
  if (active) main.querySelector(`[data-fk="${CSS.escape(active)}"]`)?.focus();
}

/* ------------------------------------------------------------------ routing */

async function route() {
  const hash = window.location.hash || '#/';
  if (!hash.startsWith('#/')) return; // e.g. in-page anchors; not a route
  state.editingId = null;

  if (hash.startsWith(SHARE_PREFIX)) {
    try {
      state.current = decodeTrip(hash.slice(SHARE_PREFIX.length));
      state.ephemeral = true;
    } catch (err) {
      state.current = null;
      state.ephemeral = false;
      toast(err.message || 'Could not open that share link.');
      history.replaceState(null, '', '#/');
    }
  } else if (hash.startsWith('#/trip/')) {
    const id = decodeURIComponent(hash.slice('#/trip/'.length));
    const trip = state.trips.find((t) => t.id === id);
    state.current = trip || null;
    state.ephemeral = false;
    if (!trip) {
      toast('Trip not found.');
      history.replaceState(null, '', '#/');
    }
  } else {
    state.current = null;
    state.ephemeral = false;
  }
  render();
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

/* ---------------------------------------------------------------- mutations */

/** Replace the current trip and persist it (or update the URL for shared views). */
async function commit(trip, focusKey, { rerender = true } = {}) {
  state.current = trip;
  if (state.ephemeral) {
    history.replaceState(null, '', SHARE_PREFIX + encodeTrip(trip));
  } else {
    state.trips = [...state.trips.filter((t) => t.id !== trip.id), trip];
    await saveTrip(trip);
  }
  if (rerender) render(focusKey);
}

async function createFromForm(form) {
  const fd = new FormData(form);
  const trip = M.createTrip({
    name: String(fd.get('name')).trim() || 'My road trip',
    days: fd.get('days'),
    templateIds: fd.getAll('tpl')
  });
  state.trips.push(trip);
  await saveTrip(trip);
  window.location.hash = `#/trip/${trip.id}`;
  toast('Trip created. Add your travelers next.');
}

async function saveShared() {
  const trip = state.current;
  const existing = state.trips.find((t) => t.id === trip.id);
  let toSave = { ...trip, updatedAt: Date.now() };
  if (existing) {
    const choice = await openDialog({
      title: 'You already have this trip',
      bodyHtml: `<p>A trip named <strong>${esc(existing.name)}</strong> from this link is already saved.</p>`,
      actions: [
        { label: 'Cancel', value: 'cancel' },
        { label: 'Save as copy', value: 'copy' },
        { label: 'Replace mine', value: 'replace', cls: 'danger' }
      ]
    });
    if (choice === 'cancel') return;
    if (choice === 'copy') toSave = { ...toSave, id: M.uid(), name: `${trip.name} (copy)` };
  }
  state.trips = [...state.trips.filter((t) => t.id !== toSave.id), toSave];
  await saveTrip(toSave);
  window.location.hash = `#/trip/${toSave.id}`;
  toast('Saved to your trips.');
}

async function share() {
  const url = shareUrl(state.current);
  const copied = await copyText(url);
  const len = url.length;
  let warning = '';
  if (len > VERY_LONG_URL) {
    warning = `<p class="warn"><strong>This link is very long (${len.toLocaleString()} characters).</strong> Many apps will cut it off. Exporting the trip as a JSON file is more reliable.</p>`;
  } else if (len > LONG_URL_WARN) {
    warning = `<p class="warn">This link is fairly long (${len.toLocaleString()} characters). Some messaging apps may truncate it; if it doesn't open, use JSON export instead.</p>`;
  }
  const choice = await openDialog({
    title: copied ? 'Share link copied' : 'Share link',
    bodyHtml: `${copied ? '<p>The link is on your clipboard. Anyone who opens it sees this list, including what is packed.</p>' : '<p>Copy this link to share the list:</p>'}
      <label>Share link <input class="share-url" readonly value="${esc(url)}" /></label>
      ${warning}`,
    actions: [
      { label: 'Export JSON instead', value: 'export' },
      { label: 'Done', value: 'done', cls: 'primary' }
    ]
  });
  if (choice === 'export') exportTrip();
}

function exportTrip() {
  downloadJson(`${slug(state.current.name)}.json`, M.exportBundle([state.current]));
}

async function importFile(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const trips = M.parseImport(await file.text());
    let replaced = 0;
    for (const t of trips) {
      if (state.trips.some((x) => x.id === t.id)) replaced++;
      state.trips = [...state.trips.filter((x) => x.id !== t.id), t];
      await saveTrip(t);
    }
    render();
    toast(`Imported ${trips.length} trip${trips.length === 1 ? '' : 's'}${replaced ? ` (${replaced} replaced)` : ''}.`);
  } catch (err) {
    console.error(err);
    toast(`Import failed: ${err.message}`);
  }
}

/* ------------------------------------------------------------------- events */

main.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'INPUT') return; // inputs handled on change
  const { action, section, item } = el.dataset;
  const t = state.current;

  switch (action) {
    case 'move':
      return commit(M.moveItem(t, section, item, Number(el.dataset.dir)), el.dataset.fk);
    case 'edit':
      state.editingId = item;
      return render('edit-name');
    case 'cancel-edit': {
      const id = state.editingId;
      state.editingId = null;
      return render(`chk-${id}`);
    }
    case 'delete-item': {
      const name = t.sections.find((s) => s.id === section)?.items.find((i) => i.id === item)?.name;
      return commit(M.deleteItem(t, section, item), `add-${section}`).then(() => toast(`Deleted “${name}”.`));
    }
    case 'remove-section': {
      const sec = t.sections.find((s) => s.id === section);
      if (await confirmDialog('Remove traveler?', `Remove ${sec.name} and their ${sec.items.length} items from this trip?`, 'Remove')) {
        return commit(M.removeSection(t, section), 'trav-name');
      }
      return;
    }
    case 'share':
      return share();
    case 'print':
      return window.print();
    case 'export-trip':
      return exportTrip();
    case 'uncheck-all':
      if (await confirmDialog('Uncheck everything?', 'Mark every item in this trip as not packed?', 'Uncheck all', false)) {
        return commit({ ...t, sections: t.sections.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, checked: false })) })) });
      }
      return;
    case 'delete-trip':
      if (await confirmDialog('Delete trip?', `Delete “${t.name}” permanently from this browser?`, 'Delete trip')) {
        await deleteTrip(t.id);
        state.trips = state.trips.filter((x) => x.id !== t.id);
        window.location.hash = '#/';
        toast('Trip deleted.');
      }
      return;
    case 'save-shared':
      return saveShared();
    case 'export-all':
      return downloadJson(`road-trip-packer-backup-${new Date().toISOString().slice(0, 10)}.json`, M.exportBundle(state.trips));
    case 'reset-all':
      if (await confirmDialog('Reset all data?', `This permanently deletes all ${state.trips.length} saved trips from this browser. Consider exporting a backup first.`, 'Delete everything')) {
        await clearAll();
        state.trips = [];
        state.current = null;
        render();
        toast('All data deleted.');
      }
      return;
    default:
  }
});

main.addEventListener('change', (e) => {
  const el = e.target;
  const action = el.dataset?.action;
  const t = state.current;
  switch (action) {
    case 'toggle':
      return commit(M.toggleItem(t, el.dataset.section, el.dataset.item), el.dataset.fk);
    case 'rename':
      // No re-render: avoids swallowing a click that caused this blur.
      document.title = `${el.value.trim() || t.name} · Trunkful`;
      return commit({ ...t, name: el.value.trim() || t.name, updatedAt: Date.now() }, null, { rerender: false });
    case 'days':
      return commit({ ...t, days: M.clampDays(el.value), updatedAt: Date.now() }, 'days');
    case 'auto-scale':
      return commit({ ...t, autoScale: el.checked, updatedAt: Date.now() }, 'auto');
    case 'hide-packed':
      return commit({ ...t, hidePacked: el.checked, updatedAt: Date.now() }, 'hide');
    case 'import':
      return importFile(el);
    default:
  }
});

main.addEventListener('submit', (e) => {
  const form = e.target;
  const kind = form.dataset.form;
  if (!kind) return;
  e.preventDefault();
  const fd = new FormData(form);
  const t = state.current;

  switch (kind) {
    case 'new-trip':
      return createFromForm(form);
    case 'add-traveler':
      return commit(M.addTraveler(t, fd.get('name'), fd.get('type')), 'trav-name').then(() => toast(`Added ${String(fd.get('name')).trim()}.`));
    case 'add-template': {
      const label = form.querySelector('select').selectedOptions[0]?.textContent;
      return commit(M.applyTemplates(t, [fd.get('tpl')])).then(() => toast(`Merged “${label}” items.`));
    }
    case 'add-item':
      return commit(M.addItem(t, form.dataset.section, { name: fd.get('name'), category: fd.get('category'), qty: fd.get('qty') }), `add-${form.dataset.section}`);
    case 'edit-item': {
      const scaled = fd.get('scaled') === 'on';
      const per = Number(fd.get('perDay'));
      const patch = {
        name: fd.get('name'),
        qty: fd.get('qty'),
        category: fd.get('category'),
        scale: scaled && per > 0 ? [Math.min(20, per), Math.max(0, Math.round(Number(fd.get('extra')) || 0))] : undefined
      };
      const id = state.editingId;
      state.editingId = null;
      return commit(M.editItem(t, form.dataset.section, form.dataset.item, patch), `chk-${id}`);
    }
    default:
  }
});

// Escape cancels inline item editing.
main.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.editingId && e.target.closest('.edit-form')) {
    const id = state.editingId;
    state.editingId = null;
    render(`chk-${id}`);
  }
});

// The skip link targets #main, which would otherwise be read as a route.
document.querySelector('.skip-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  main.focus();
});

window.addEventListener('hashchange', route);

/* --------------------------------------------------------------------- boot */
(async function init() {
  state.trips = (await getAllTrips()).map((t) => {
    try {
      return M.normalizeTrip(t);
    } catch {
      return null;
    }
  }).filter(Boolean);
  route();
})();
