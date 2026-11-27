/**
 * Pure data logic for trips. No DOM, no storage: easy to unit test.
 *
 * Trip shape:
 * {
 *   id, name, days, autoScale, hidePacked, templates: [templateId],
 *   sections: [{ id, kind: 'family'|'traveler', name, type?, items: [Item] }],
 *   createdAt, updatedAt
 * }
 * Item: { id, name, category, qty, scale?: [perDay, extra], checked }
 */
import { CATEGORIES, TARGET_GROUPS, TRAVELER_TYPES, TYPE_DEFAULTS, templateById } from './templates.js';

const TYPE_IDS = TRAVELER_TYPES.map((t) => t.id);

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Normalized key used to detect duplicate items within a section. */
export const itemKey = (name) => String(name).trim().toLowerCase().replace(/\s+/g, ' ');

/** Does a template target ('family', 'adult', 'all', ...) apply to a section? */
export function targetMatches(to, section) {
  if (section.kind === 'family') return to === 'family';
  if (to === section.type) return true;
  return (TARGET_GROUPS[to] || []).includes(section.type);
}

/** Turn a template item spec into a concrete checklist item. */
function toItem(spec) {
  const item = { id: uid(), name: spec.name, category: spec.category, qty: spec.qty ?? 1, checked: false };
  if (spec.scale) item.scale = [...spec.scale];
  return item;
}

/** All template-derived items for one section, before de-duplication. */
export function defaultSpecsFor(section, templateIds, includeTypeDefaults = true) {
  const specs = [];
  if (includeTypeDefaults && section.kind === 'traveler') specs.push(...(TYPE_DEFAULTS[section.type] || []));
  for (const id of templateIds) {
    const tpl = templateById(id);
    if (!tpl) continue;
    for (const spec of tpl.items) if (targetMatches(spec.to, section)) specs.push(spec);
  }
  return specs;
}

/**
 * Merge incoming items into an existing list without duplicates (by name).
 * Duplicates keep the existing item (and its checked state) but take the larger
 * quantity / scaling so merging "Beach" into a road trip never shrinks counts.
 */
export function mergeItems(existing, incoming) {
  const out = existing.map((it) => ({ ...it }));
  const index = new Map(out.map((it, idx) => [itemKey(it.name), idx]));
  for (const inc of incoming) {
    const key = itemKey(inc.name);
    if (index.has(key)) {
      const cur = out[index.get(key)];
      cur.qty = Math.max(cur.qty ?? 1, inc.qty ?? 1);
      if (inc.scale && (!cur.scale || scaledQty(inc.scale, 7) > scaledQty(cur.scale, 7))) {
        cur.scale = [...inc.scale];
      }
    } else {
      index.set(key, out.length);
      out.push({ ...inc });
    }
  }
  return out;
}

export function makeSection(kind, name, type, templateIds = []) {
  const section = { id: uid(), kind, name, items: [] };
  if (kind === 'traveler') section.type = type;
  section.items = mergeItems([], defaultSpecsFor(section, templateIds).map(toItem));
  return section;
}

export function createTrip({ name = 'My road trip', days = 3, templateIds = [], travelers = [] } = {}) {
  const now = Date.now();
  const templates = [...new Set(templateIds)].filter((id) => templateById(id));
  const trip = {
    id: uid(),
    name,
    days: clampDays(days),
    autoScale: true,
    hidePacked: false,
    templates,
    sections: [makeSection('family', 'Family / Car', null, templates)],
    createdAt: now,
    updatedAt: now
  };
  for (const t of travelers) trip.sections.push(makeSection('traveler', t.name, t.type, templates));
  return trip;
}

export const clampDays = (d) => Math.min(60, Math.max(1, Math.round(Number(d) || 1)));

/** Add templates to an existing trip, merging their items into every section. */
export function applyTemplates(trip, templateIds) {
  const added = templateIds.filter((id) => templateById(id) && !trip.templates.includes(id));
  if (!added.length) return trip;
  return touch({
    ...trip,
    templates: [...trip.templates, ...added],
    sections: trip.sections.map((s) => ({
      ...s,
      items: mergeItems(s.items, defaultSpecsFor(s, added, false).map(toItem))
    }))
  });
}

export function addTraveler(trip, name, type) {
  const clean = String(name).trim() || 'Traveler';
  const t = TYPE_IDS.includes(type) ? type : 'adult';
  return touch({ ...trip, sections: [...trip.sections, makeSection('traveler', clean, t, trip.templates)] });
}

export function removeSection(trip, sectionId) {
  return touch({ ...trip, sections: trip.sections.filter((s) => s.id !== sectionId || s.kind === 'family') });
}

/** Immutable helper: apply fn to the items of one section. */
export function updateItems(trip, sectionId, fn) {
  return touch({
    ...trip,
    sections: trip.sections.map((s) => (s.id === sectionId ? { ...s, items: fn(s.items) } : s))
  });
}

export function addItem(trip, sectionId, { name, category = 'Other', qty = 1 }) {
  const clean = String(name).trim();
  if (!clean) return trip;
  const item = { id: uid(), name: clean, category: CATEGORIES.includes(category) ? category : 'Other', qty: clampQty(qty), checked: false };
  return updateItems(trip, sectionId, (items) => mergeItems(items, [item]));
}

export const clampQty = (q) => Math.min(999, Math.max(1, Math.round(Number(q) || 1)));

export function editItem(trip, sectionId, itemId, patch) {
  return updateItems(trip, sectionId, (items) =>
    items.map((it) => {
      if (it.id !== itemId) return it;
      const next = { ...it, ...patch };
      next.name = String(next.name).trim() || it.name;
      next.qty = clampQty(next.qty);
      if (!CATEGORIES.includes(next.category)) next.category = 'Other';
      if (!next.scale) delete next.scale;
      return next;
    })
  );
}

export const toggleItem = (trip, sectionId, itemId) =>
  updateItems(trip, sectionId, (items) => items.map((it) => (it.id === itemId ? { ...it, checked: !it.checked } : it)));

export const deleteItem = (trip, sectionId, itemId) =>
  updateItems(trip, sectionId, (items) => items.filter((it) => it.id !== itemId));

/**
 * Move an item up (-1) or down (+1) among items of the same category, since
 * items are displayed grouped by category.
 */
export function moveItem(trip, sectionId, itemId, dir) {
  return updateItems(trip, sectionId, (items) => {
    const idx = items.findIndex((it) => it.id === itemId);
    if (idx < 0) return items;
    const cat = items[idx].category;
    let j = idx + dir;
    while (j >= 0 && j < items.length && items[j].category !== cat) j += dir;
    if (j < 0 || j >= items.length) return items;
    const out = [...items];
    [out[idx], out[j]] = [out[j], out[idx]];
    return out;
  });
}

export const scaledQty = (scale, days) => Math.max(1, Math.ceil(days * scale[0]) + scale[1]);

/** Quantity to display, honoring auto-scaling by trip length. */
export function effectiveQty(item, trip) {
  if (trip.autoScale && item.scale) return scaledQty(item.scale, trip.days);
  return item.qty ?? 1;
}

export function progress(items) {
  const total = items.length;
  const done = items.filter((it) => it.checked).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export const tripProgress = (trip) => progress(trip.sections.flatMap((s) => s.items));

/** Group a section's items by category in canonical category order. */
export function groupByCategory(items) {
  const groups = new Map();
  for (const it of items) {
    if (!groups.has(it.category)) groups.set(it.category, []);
    groups.get(it.category).push(it);
  }
  const order = (c) => {
    const n = CATEGORIES.indexOf(c);
    return n < 0 ? CATEGORIES.length : n;
  };
  return [...groups.entries()].sort((a, b) => order(a[0]) - order(b[0]));
}

export const touch = (trip) => ({ ...trip, updatedAt: Date.now() });

/** Human-readable scale rule, e.g. "1/day + 1". */
export function describeScale(scale) {
  if (!scale) return '';
  const [per, extra] = scale;
  const perTxt = per === 1 ? '1/day' : per === 0.5 ? '1 per 2 days' : `${per}/day`;
  return extra ? `${perTxt} + ${extra}` : perTxt;
}

/**
 * Validate and normalize an untrusted trip object (from import or share link).
 * Returns a clean trip or throws an Error with a readable message.
 */
export function normalizeTrip(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Not a trip object');
  if (!Array.isArray(raw.sections)) throw new Error('Trip is missing sections');
  const str = (v, max = 120) => String(v ?? '').slice(0, max);
  const sections = raw.sections.map((s) => {
    const kind = s.kind === 'family' ? 'family' : 'traveler';
    const sec = { id: str(s.id, 40) || uid(), kind, name: str(s.name) || (kind === 'family' ? 'Family / Car' : 'Traveler'), items: [] };
    if (kind === 'traveler') sec.type = TYPE_IDS.includes(s.type) ? s.type : 'adult';
    sec.items = (Array.isArray(s.items) ? s.items : []).map((it) => {
      const item = {
        id: str(it.id, 40) || uid(),
        name: str(it.name) || 'Item',
        category: CATEGORIES.includes(it.category) ? it.category : 'Other',
        qty: clampQty(it.qty),
        checked: Boolean(it.checked)
      };
      if (Array.isArray(it.scale) && it.scale.length === 2 && it.scale.every((n) => Number.isFinite(Number(n)))) {
        const per = Math.max(0, Math.min(20, Number(it.scale[0])));
        if (per > 0) item.scale = [per, Math.max(0, Math.min(50, Math.round(Number(it.scale[1]))))];
      }
      return item;
    });
    return sec;
  });
  if (!sections.some((s) => s.kind === 'family')) sections.unshift(makeSection('family', 'Family / Car', null));
  return {
    id: str(raw.id, 40) || uid(),
    name: str(raw.name) || 'Shared trip',
    days: clampDays(raw.days),
    autoScale: raw.autoScale !== false,
    hidePacked: Boolean(raw.hidePacked),
    templates: (Array.isArray(raw.templates) ? raw.templates : []).filter((id) => templateById(id)),
    sections,
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now()
  };
}

/** Parse an imported JSON payload: a backup bundle, an array, or a single trip. */
export function parseImport(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const list = Array.isArray(data) ? data : Array.isArray(data?.trips) ? data.trips : [data];
  return list.map(normalizeTrip);
}

export const exportBundle = (trips) => ({ app: 'road-trip-packer', version: 1, exportedAt: new Date().toISOString(), trips });
