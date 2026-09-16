// Small in-process cache for hot public reads (site bootstrap, homepage, resolved pages).
// Any admin write bumps the version, so students never see stale content for long.
const MAX_ENTRIES = 1000;
const store = new Map();
let version = 0;

export const cache = {
  get(key) {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (entry.version !== version || entry.expires < Date.now()) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  },

  set(key, value, ttlMs = 60_000) {
    if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value);
    store.set(key, { value, expires: Date.now() + ttlMs, version });
  },

  async wrap(key, ttlMs, producer) {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const value = await producer();
    this.set(key, value, ttlMs);
    return value;
  },

  invalidate() {
    version += 1;
    store.clear();
  },
};
