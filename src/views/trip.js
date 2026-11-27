/** Trip view: per-traveler checklists with progress, editing and sharing. */
import { CATEGORIES, TRAVELER_TYPES, TRIP_TEMPLATES, typeLabel } from '../templates.js';
import { describeScale, effectiveQty, groupByCategory, progress, tripProgress } from '../model.js';
import { esc } from '../util.js';

const catOptions = (selected) =>
  CATEGORIES.map((c) => `<option value="${esc(c)}" ${c === selected ? 'selected' : ''}>${esc(c)}</option>`).join('');

function progressBar(p, label) {
  return `<div class="progress-wrap">
    <progress max="100" value="${p.pct}" aria-label="${esc(label)}"></progress>
    <span class="progress-txt">${p.done}/${p.total} · ${p.pct}%</span>
  </div>`;
}

function itemRow(trip, section, item, editing) {
  const qty = effectiveQty(item, trip);
  const sid = esc(section.id);
  const iid = esc(item.id);
  if (editing) {
    const scaled = Boolean(item.scale);
    return `<li class="item editing">
      <form data-form="edit-item" data-section="${sid}" data-item="${iid}" class="edit-form">
        <label>Name <input name="name" value="${esc(item.name)}" required maxlength="120" data-fk="edit-name" /></label>
        <div class="row">
          <label>Qty <input name="qty" type="number" min="1" max="999" value="${item.qty}" inputmode="numeric" /></label>
          <label>Category <select name="category">${catOptions(item.category)}</select></label>
        </div>
        <fieldset class="scale-fields">
          <legend>Auto-scale with trip length</legend>
          <label class="check-inline"><input type="checkbox" name="scaled" ${scaled ? 'checked' : ''} /> Scale quantity by days</label>
          <div class="row">
            <label>Per day <input name="perDay" type="number" min="0.5" max="20" step="0.5" value="${scaled ? item.scale[0] : 1}" /></label>
            <label>Plus extra <input name="extra" type="number" min="0" max="50" value="${scaled ? item.scale[1] : 0}" /></label>
          </div>
        </fieldset>
        <div class="btn-row">
          <button class="btn primary" type="submit">Save</button>
          <button class="btn" type="button" data-action="cancel-edit">Cancel</button>
        </div>
      </form>
    </li>`;
  }
  const scaleNote = trip.autoScale && item.scale ? `<span class="scale-note" title="Auto-scaled: ${esc(describeScale(item.scale))}">(${esc(describeScale(item.scale))})</span>` : '';
  return `<li class="item ${item.checked ? 'checked' : ''}">
    <label class="item-check">
      <input type="checkbox" data-action="toggle" data-section="${sid}" data-item="${iid}" data-fk="chk-${iid}" ${item.checked ? 'checked' : ''} />
      <span class="item-name">${esc(item.name)}</span>
      ${qty > 1 || item.scale ? `<span class="qty" aria-label="quantity ${qty}">×${qty}</span>` : ''}
      ${scaleNote}
    </label>
    <div class="item-actions no-print">
      <button type="button" class="icon-btn" data-action="move" data-dir="-1" data-section="${sid}" data-item="${iid}" data-fk="up-${iid}" aria-label="Move ${esc(item.name)} up">↑</button>
      <button type="button" class="icon-btn" data-action="move" data-dir="1" data-section="${sid}" data-item="${iid}" data-fk="down-${iid}" aria-label="Move ${esc(item.name)} down">↓</button>
      <button type="button" class="icon-btn" data-action="edit" data-section="${sid}" data-item="${iid}" aria-label="Edit ${esc(item.name)}">✎</button>
      <button type="button" class="icon-btn" data-action="delete-item" data-section="${sid}" data-item="${iid}" aria-label="Delete ${esc(item.name)}">✕</button>
    </div>
  </li>`;
}

function sectionBlock(trip, section, editingId) {
  const p = progress(section.items);
  const visible = trip.hidePacked ? section.items.filter((it) => !it.checked || it.id === editingId) : section.items;
  const groups = groupByCategory(visible);
  const title = section.kind === 'family' ? esc(section.name) : `${esc(section.name)} <span class="badge">${esc(typeLabel(section.type))}</span>`;
  const sid = esc(section.id);
  const body = groups.length
    ? groups
        .map(
          ([cat, items]) => `<h3 class="cat">${esc(cat)}</h3>
          <ul class="items">${items.map((it) => itemRow(trip, section, it, it.id === editingId)).join('')}</ul>`
        )
        .join('')
    : `<p class="muted">${section.items.length ? 'Everything here is packed! 🎉' : 'No items yet.'}</p>`;

  return `<section class="card person" aria-labelledby="h-${sid}">
    <div class="section-head">
      <h2 id="h-${sid}">${title}</h2>
      ${section.kind === 'traveler' ? `<button type="button" class="btn small danger no-print" data-action="remove-section" data-section="${sid}" aria-label="Remove traveler ${esc(section.name)}">Remove</button>` : ''}
    </div>
    ${progressBar(p, `${section.name} packed ${p.pct}%`)}
    ${body}
    <form data-form="add-item" data-section="${sid}" class="add-item no-print">
      <label class="grow">Add item <input name="name" required maxlength="120" placeholder="Item name" data-fk="add-${sid}" /></label>
      <label>Category <select name="category">${catOptions('Other')}</select></label>
      <label class="qty-in">Qty <input name="qty" type="number" min="1" max="999" value="1" inputmode="numeric" /></label>
      <button class="btn primary" type="submit">Add</button>
    </form>
  </section>`;
}

export function renderTrip(trip, { ephemeral = false, editingId = null } = {}) {
  const overall = tripProgress(trip);
  const unused = TRIP_TEMPLATES.filter((t) => !trip.templates.includes(t.id));
  const applied = trip.templates.map((id) => TRIP_TEMPLATES.find((t) => t.id === id)?.label).filter(Boolean);

  return `
  ${ephemeral ? `<div class="banner no-print" role="region" aria-label="Shared list">
      <p><strong>You opened a shared list.</strong> Changes stay in this tab until you save it.</p>
      <button class="btn primary" type="button" data-action="save-shared">Save to my trips</button>
    </div>` : '<p class="no-print"><a href="#/">← All trips</a></p>'}

  <div class="trip-head">
    <label class="title-label no-print">Trip name
      <input class="title-input" name="trip-name" value="${esc(trip.name)}" maxlength="80" data-action="rename" data-fk="trip-name" />
    </label>
    <h1 class="print-only">${esc(trip.name)}</h1>
    <p class="muted">${trip.days} day${trip.days === 1 ? '' : 's'}${applied.length ? ` · ${esc(applied.join(' + '))}` : ''}</p>
    <h2 class="visually-hidden">Overall progress</h2>
    ${progressBar(overall, `Overall packed ${overall.pct}%`)}
  </div>

  <section class="card settings no-print" aria-label="Trip settings">
    <div class="row wrap">
      <label class="days-in">Days <input type="number" min="1" max="60" value="${trip.days}" data-action="days" inputmode="numeric" data-fk="days" /></label>
      <label class="toggle"><input type="checkbox" data-action="auto-scale" data-fk="auto" ${trip.autoScale ? 'checked' : ''} /> Auto-scale quantities by days</label>
      <label class="toggle"><input type="checkbox" data-action="hide-packed" data-fk="hide" ${trip.hidePacked ? 'checked' : ''} /> Hide packed items</label>
    </div>
    <div class="btn-row">
      <button class="btn primary" type="button" data-action="share">Copy share link</button>
      <button class="btn" type="button" data-action="print">Print</button>
      <button class="btn" type="button" data-action="export-trip">Export trip (JSON)</button>
      <button class="btn" type="button" data-action="uncheck-all">Uncheck all</button>
      ${ephemeral ? '' : '<button class="btn danger" type="button" data-action="delete-trip">Delete trip</button>'}
    </div>
  </section>

  <section class="card no-print" aria-labelledby="people-h">
    <h2 id="people-h">Travelers & templates</h2>
    <form data-form="add-traveler" class="row wrap">
      <label class="grow">Name <input name="name" required maxlength="40" placeholder="e.g. Maya" data-fk="trav-name" /></label>
      <label>Type <select name="type">${TRAVELER_TYPES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('')}</select></label>
      <button class="btn primary" type="submit">Add traveler</button>
    </form>
    ${unused.length ? `<form data-form="add-template" class="row wrap">
      <label class="grow">Add a template <select name="tpl">${unused.map((t) => `<option value="${t.id}">${esc(t.label)}</option>`).join('')}</select></label>
      <button class="btn" type="submit">Merge items</button>
    </form>` : '<p class="muted">All templates applied.</p>'}
  </section>

  ${trip.sections.map((s) => sectionBlock(trip, s, editingId)).join('')}`;
}
