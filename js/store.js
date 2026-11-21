/* i Court Forms — data kept on this device (never sent to a server):
     cases    saved forms ("My cases"): { id, formId, title, data, orient, createdAt, updatedAt }
     profile  "My details": values of fields marked profile: true (name, chamber address…), shared by all forms
     history  recent values per form field, offered as one-tap suggestions
   plus a backup file (download / restore) so nothing is lost when changing phones. */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  const K = { cases: 'icf-cases-v1', profile: 'icf-profile-v1', hist: 'icf-history-v1' };
  const HIST_MAX = 6;

  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  // keep only plain string values (data coming from a backup file is untrusted)
  const strings = o => {
    const out = {};
    if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (typeof v === 'string' && /^[\w-]{1,40}$/.test(k)) out[k] = v.slice(0, 5000);
    return out;
  };

  const cases = {
    all() { return read(K.cases, []).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); },
    forForm(formId) { return this.all().filter(c => c.formId === formId); },
    get(id) { return read(K.cases, []).find(c => c.id === id) || null; },
    put(c) {
      const list = read(K.cases, []);
      const now = Date.now();
      const rec = { ...c, data: strings(c.data), updatedAt: now };
      if (!rec.id) { rec.id = newId(); rec.createdAt = now; }
      const i = list.findIndex(x => x.id === rec.id);
      if (i >= 0) { rec.createdAt = list[i].createdAt || now; list[i] = rec; } else list.push(rec);
      return write(K.cases, list) ? rec : null;
    },
    remove(id) { write(K.cases, read(K.cases, []).filter(c => c.id !== id)); },
  };

  const profile = {
    get() { return read(K.profile, {}); },
    set(p) { return write(K.profile, strings(p)); },
  };

  const history = {
    get(formId, key) { const h = read(K.hist, {}); return (h[formId] && h[formId][key]) || []; },
    add(formId, data, keys) {
      const h = read(K.hist, {});
      const f = h[formId] = h[formId] || {};
      for (const k of keys) {
        const v = String(data[k] || '').trim();
        if (!v) continue;
        f[k] = [v, ...(f[k] || []).filter(x => x !== v)].slice(0, HIST_MAX);
      }
      write(K.hist, h);
    },
  };

  const backup = {
    make() {
      return { app: 'i Court Forms', kind: 'backup', version: 1, exportedAt: new Date().toISOString(),
        cases: read(K.cases, []), profile: read(K.profile, {}), history: read(K.hist, {}) };
    },
    // Merges a backup into this device; newer copy of a case wins. Returns how many cases were added or updated.
    restore(obj) {
      if (!obj || obj.app !== 'i Court Forms' || obj.kind !== 'backup' || !Array.isArray(obj.cases)) throw new Error('not a backup');
      const byId = new Map(read(K.cases, []).map(c => [c.id, c]));
      let n = 0;
      for (const c of obj.cases) {
        if (!c || typeof c.id !== 'string' || typeof c.formId !== 'string' || !c.data || typeof c.data !== 'object') continue;
        const cur = byId.get(c.id);
        if (cur && (cur.updatedAt || 0) >= (c.updatedAt || 0)) continue;
        byId.set(c.id, {
          id: c.id.slice(0, 40), formId: c.formId.slice(0, 40), title: String(c.title || '').slice(0, 200),
          data: strings(c.data), orient: c.orient === 'portrait' || c.orient === 'landscape' ? c.orient : undefined,
          createdAt: Number(c.createdAt) || Date.now(), updatedAt: Number(c.updatedAt) || Date.now(),
        });
        n++;
      }
      write(K.cases, [...byId.values()]);
      if (obj.profile) write(K.profile, { ...strings(obj.profile), ...strings(read(K.profile, {})) });
      if (obj.history && typeof obj.history === 'object') {
        const h = read(K.hist, {});
        for (const [fid, keys] of Object.entries(obj.history)) {
          if (!keys || typeof keys !== 'object') continue;
          const f = h[fid] = h[fid] || {};
          for (const [k, vals] of Object.entries(keys)) {
            if (!Array.isArray(vals)) continue;
            f[k] = [...new Set([...(f[k] || []), ...vals.filter(v => typeof v === 'string')])].slice(0, HIST_MAX);
          }
        }
        write(K.hist, h);
      }
      return n;
    },
  };

  CF.store = { cases, profile, history, backup };
})();
