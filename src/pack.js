/**
 * Compact (array-based) serialization of a trip for share links.
 * Pure functions with no dependencies so they are trivially testable.
 *
 * Packed shape (v1):
 * { v:1, i:id, n:name, d:days, a:autoScale(0|1), h:hidePacked(0|1), t:[templateIds],
 *   s:[[name, typeCode, [[itemName, categoryIndex, qty, perDay, extra, checked], ...]], ...] }
 * typeCode: 'f' = Family/Car section, otherwise traveler type id.
 */
import { CATEGORIES } from './templates.js';
import { normalizeTrip } from './model.js';

export function packTrip(trip) {
  return {
    v: 1,
    i: trip.id,
    n: trip.name,
    d: trip.days,
    a: trip.autoScale ? 1 : 0,
    h: trip.hidePacked ? 1 : 0,
    t: trip.templates,
    s: trip.sections.map((s) => [
      s.name,
      s.kind === 'family' ? 'f' : s.type,
      s.items.map((it) => {
        const row = [it.name, Math.max(0, CATEGORIES.indexOf(it.category)), it.qty, it.scale ? it.scale[0] : 0, it.scale ? it.scale[1] : 0, it.checked ? 1 : 0];
        // Trim trailing default zeros to keep URLs short.
        while (row.length > 3 && row[row.length - 1] === 0) row.pop();
        return row;
      })
    ])
  };
}

export function unpackTrip(p) {
  if (!p || p.v !== 1 || !Array.isArray(p.s)) throw new Error('Unsupported share link format');
  return normalizeTrip({
    id: p.i,
    name: p.n,
    days: p.d,
    autoScale: p.a !== 0,
    hidePacked: p.h === 1,
    templates: p.t,
    sections: p.s.map(([name, code, items]) => ({
      kind: code === 'f' ? 'family' : 'traveler',
      type: code === 'f' ? undefined : code,
      name,
      items: (items || []).map(([n, c = 0, q = 1, per = 0, extra = 0, chk = 0]) => ({
        name: n,
        category: CATEGORIES[c] ?? 'Other',
        qty: q,
        scale: per > 0 ? [per, extra] : undefined,
        checked: chk === 1
      }))
    }))
  });
}
