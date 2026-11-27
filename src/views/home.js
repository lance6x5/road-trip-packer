/** Home view: saved trips, new-trip form, and data management. */
import { TRIP_TEMPLATES } from '../templates.js';
import { tripProgress } from '../model.js';
import { esc } from '../util.js';

export function renderHome(trips) {
  const sorted = [...trips].sort((a, b) => b.updatedAt - a.updatedAt);
  const list = sorted.length
    ? `<ul class="trip-list">${sorted
        .map((t) => {
          const p = tripProgress(t);
          const people = t.sections.filter((s) => s.kind === 'traveler').length;
          return `<li>
            <a class="trip-card" href="#/trip/${esc(t.id)}">
              <span class="trip-card-name">${esc(t.name)}</span>
              <span class="muted">${t.days} day${t.days === 1 ? '' : 's'} · ${people} traveler${people === 1 ? '' : 's'} · ${p.done}/${p.total} packed</span>
              <progress max="100" value="${p.pct}" aria-label="${esc(t.name)} packed ${p.pct}%"></progress>
            </a>
          </li>`;
        })
        .join('')}</ul>`
    : '<p class="muted">No trips yet. Create your first packing list below.</p>';

  return `
  <h1>My trips</h1>
  ${list}

  <section class="card" aria-labelledby="new-trip-h">
    <h2 id="new-trip-h">New trip</h2>
    <form data-form="new-trip" class="stack">
      <label>Trip name
        <input name="name" required maxlength="80" placeholder="e.g. Summer at the lake" data-fk="new-name" />
      </label>
      <label>Trip length (days)
        <input name="days" type="number" min="1" max="60" value="3" inputmode="numeric" required />
      </label>
      <fieldset>
        <legend>Templates (combine as many as you like)</legend>
        <div class="chip-grid">
          ${TRIP_TEMPLATES.map(
            (t, idx) => `<label class="chip"><input type="checkbox" name="tpl" value="${t.id}" ${idx === 0 ? 'checked' : ''} /> ${esc(t.label)}</label>`
          ).join('')}
        </div>
      </fieldset>
      <button class="btn primary" type="submit">Create trip</button>
    </form>
  </section>

  <section class="card" aria-labelledby="data-h">
    <h2 id="data-h">Your data</h2>
    <p class="muted">Trips are stored only in this browser. Export a backup or move trips to another device.</p>
    <div class="btn-row">
      <button class="btn" data-action="export-all" type="button">Export all (JSON)</button>
      <label class="btn file-btn">Import JSON
        <input type="file" accept="application/json,.json" data-action="import" class="visually-hidden-file" />
      </label>
      <button class="btn danger" data-action="reset-all" type="button">Reset all data</button>
    </div>
  </section>`;
}
