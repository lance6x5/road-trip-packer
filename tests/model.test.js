import { describe, it, expect } from 'vitest';
import * as M from '../src/model.js';
import { packTrip, unpackTrip } from '../src/pack.js';
import { encodeTrip, decodeTrip } from '../src/share.js';

const names = (section) => section.items.map((i) => M.itemKey(i.name));

describe('templates', () => {
  it('merges combined templates without duplicate items', () => {
    const trip = M.createTrip({ templateIds: ['week', 'beach', 'themepark'] });
    const fam = trip.sections[0];
    const keys = names(fam);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('sunscreen'); // in both beach and theme park
    expect(keys.filter((k) => k === 'cooler')).toHaveLength(1); // in week and beach
  });

  it('keeps the larger quantity when merging duplicates', () => {
    const trip = M.createTrip({ templateIds: ['themepark', 'beach'] });
    expect(trip.sections[0].items.find((i) => i.name === 'Sunscreen').qty).toBe(2);
  });

  it('applyTemplates merges into existing sections and keeps checked state', () => {
    let trip = M.createTrip({ templateIds: ['weekend'] });
    trip = M.addTraveler(trip, 'Ana', 'adult');
    const ana = trip.sections[1];
    const socks = ana.items.find((i) => i.name === 'Socks');
    trip = M.toggleItem(trip, ana.id, socks.id);
    trip = M.applyTemplates(trip, ['winter']);
    const ana2 = trip.sections[1];
    expect(ana2.items.find((i) => i.name === 'Socks').checked).toBe(true);
    expect(names(ana2)).toContain('ski / snow jacket');
    expect(trip.templates).toEqual(['weekend', 'winter']);
  });
});

describe('travelers', () => {
  it('gives type-appropriate defaults', () => {
    let trip = M.createTrip({ templateIds: ['weekend'] });
    trip = M.addTraveler(trip, 'Baby Lu', 'baby');
    trip = M.addTraveler(trip, 'Max', 'kid');
    const [, baby, kid] = trip.sections;
    expect(names(baby)).toContain('diapers');
    expect(names(baby)).not.toContain('toothbrush');
    expect(names(kid)).toContain('car games');
    expect(names(kid)).not.toContain('diapers');
  });

  it('cannot remove the family section', () => {
    const trip = M.createTrip();
    expect(M.removeSection(trip, trip.sections[0].id).sections).toHaveLength(1);
  });
});

describe('quantities', () => {
  it('auto-scales socks to days + 1', () => {
    let trip = M.createTrip({ days: 5, templateIds: ['weekend'] });
    trip = M.addTraveler(trip, 'A', 'adult');
    const socks = trip.sections[1].items.find((i) => i.name === 'Socks');
    expect(M.effectiveQty(socks, trip)).toBe(6);
    expect(M.effectiveQty(socks, { ...trip, autoScale: false })).toBe(socks.qty);
  });
});

describe('checklist editing', () => {
  it('adds, edits, reorders within a category and deletes', () => {
    let trip = M.createTrip();
    const sid = trip.sections[0].id;
    trip = M.addItem(trip, sid, { name: 'Kayak', category: 'Other' });
    trip = M.addItem(trip, sid, { name: 'Paddle', category: 'Other' });
    trip = M.addItem(trip, sid, { name: 'kayak', category: 'Other' }); // duplicate ignored
    let others = trip.sections[0].items.filter((i) => i.category === 'Other');
    expect(others.map((i) => i.name)).toEqual(['Kayak', 'Paddle']);

    trip = M.moveItem(trip, sid, others[1].id, -1);
    others = trip.sections[0].items.filter((i) => i.category === 'Other');
    expect(others.map((i) => i.name)).toEqual(['Paddle', 'Kayak']);

    trip = M.editItem(trip, sid, others[1].id, { name: 'Inflatable kayak', qty: 2 });
    expect(trip.sections[0].items.find((i) => i.id === others[1].id)).toMatchObject({ name: 'Inflatable kayak', qty: 2 });

    trip = M.deleteItem(trip, sid, others[0].id);
    expect(trip.sections[0].items.some((i) => i.name === 'Paddle')).toBe(false);
  });

  it('computes progress', () => {
    expect(M.progress([{ checked: true }, { checked: false }])).toEqual({ done: 1, total: 2, pct: 50 });
    expect(M.progress([])).toEqual({ done: 0, total: 0, pct: 0 });
  });
});

describe('import / share', () => {
  const sample = () => {
    let trip = M.createTrip({ name: 'Lake <trip>', days: 4, templateIds: ['weekend', 'camping'] });
    trip = M.addTraveler(trip, 'Kim', 'adult');
    trip = M.addTraveler(trip, 'Bo', 'toddler');
    const s = trip.sections[2];
    return M.toggleItem(trip, s.id, s.items[0].id);
  };

  it('pack/unpack round-trips the list state', () => {
    const trip = sample();
    const back = unpackTrip(JSON.parse(JSON.stringify(packTrip(trip))));
    expect(back.name).toBe(trip.name);
    expect(back.days).toBe(4);
    expect(back.sections.map((s) => [s.kind, s.type, s.name, s.items.length])).toEqual(
      trip.sections.map((s) => [s.kind, s.type, s.name, s.items.length])
    );
    expect(back.sections[2].items[0].checked).toBe(true);
    const strip = (it) => ({ name: it.name, category: it.category, qty: it.qty, scale: it.scale, checked: it.checked });
    expect(back.sections.flatMap((s) => s.items.map(strip))).toEqual(trip.sections.flatMap((s) => s.items.map(strip)));
  });

  it('lz-string share encoding round-trips', () => {
    const trip = sample();
    const data = encodeTrip(trip);
    expect(data).toMatch(/^[A-Za-z0-9+\-$]+$/);
    expect(decodeTrip(data).sections[1].name).toBe('Kim');
  });

  it('rejects damaged share data', () => {
    expect(() => decodeTrip('not-really-data')).toThrow();
  });

  it('parses an export bundle and sanitizes bad values', () => {
    const bundle = M.exportBundle([sample()]);
    bundle.trips[0].sections[1].items[0].category = 'Bogus';
    bundle.trips[0].days = 999;
    const [t] = M.parseImport(JSON.stringify(bundle));
    expect(t.days).toBe(60);
    expect(t.sections[1].items[0].category).toBe('Other');
    expect(() => M.parseImport('{"foo":1}')).toThrow();
  });
});
