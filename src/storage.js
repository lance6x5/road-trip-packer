/**
 * Persistence: trips in IndexedDB, with a localStorage fallback when IndexedDB
 * is unavailable (private mode, old browsers). Every call is wrapped in
 * try/catch so storage failures never crash the UI.
 */
const DB_NAME = 'road-trip-packer';
const STORE = 'trips';
const LS_KEY = 'rtp-trips';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      if (!('indexedDB' in window)) return reject(new Error('No IndexedDB'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  }).catch((err) => {
    console.warn('IndexedDB unavailable, using localStorage', err);
    return null;
  });
  return dbPromise;
}

/** Run a request against the object store and resolve with its result. */
async function withStore(mode, fn) {
  const db = await openDb();
  if (!db) return undefined;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

function lsRead() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}
function lsWrite(trips) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(trips));
  } catch (err) {
    console.error('localStorage write failed', err);
  }
}

export async function getAllTrips() {
  try {
    const db = await openDb();
    if (!db) return lsRead();
    const trips = await withStore('readonly', (s) => s.getAll());
    return trips || [];
  } catch (err) {
    console.error('Failed to load trips', err);
    return lsRead();
  }
}

export async function saveTrip(trip) {
  try {
    const db = await openDb();
    if (!db) {
      const trips = lsRead().filter((t) => t.id !== trip.id);
      lsWrite([...trips, trip]);
      return;
    }
    await withStore('readwrite', (s) => s.put(trip));
  } catch (err) {
    console.error('Failed to save trip', err);
  }
}

export async function deleteTrip(id) {
  try {
    const db = await openDb();
    if (!db) return lsWrite(lsRead().filter((t) => t.id !== id));
    await withStore('readwrite', (s) => s.delete(id));
  } catch (err) {
    console.error('Failed to delete trip', err);
  }
}

export async function clearAll() {
  try {
    const db = await openDb();
    if (db) await withStore('readwrite', (s) => s.clear());
  } catch (err) {
    console.error('Failed to clear IndexedDB', err);
  }
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}
