/* i Court Forms — photos from the camera or the gallery, read ON THE PHONE (nothing is sent anywhere):
   1. "Fill from ID card" (Aadhaar, Voter ID, PAN, Driving Licence, Passport or another ID): the card's QR code (lib/qr: jsQR + pako; the phone's own BarcodeDetector when it has one)
      and its printed text (lib/ocr: Tesseract, English, loaded the first time it is used, then offline) give
      name, S/O · D/O · W/O, date of birth, age, address, post office, tehsil, district, Aadhaar number.
      The user checks the values and fills them into the form (form.aadhaarTargets: [{ group, label, map: { formKey: value } }]).
      The card photo is not kept.
   2. Photo fields (type 'photo', e.g. the surety's photo box): the picture is cut to the box and kept, small (JPEG),
      with the form on this phone only. */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  const t = (k, v) => CF.i18n.t(k, v);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const BASE = new URL('.', location.href).href;
  const p2 = x => String(x).padStart(2, '0');

  const loaded = {};
  const loadScript = src => loaded[src] || (loaded[src] = new Promise((ok, no) => {
    const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => { delete loaded[src]; no(new Error('load ' + src)); }; document.head.appendChild(s);
  }));

  // ------------------------------------------------------------ picking pictures
  function pick(camera, multiple) {
    return new Promise(resolve => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      if (camera) inp.setAttribute('capture', 'environment');
      inp.multiple = !!multiple && !camera;
      inp.style.display = 'none';
      inp.onchange = () => { resolve([...inp.files]); inp.remove(); };
      document.body.appendChild(inp); inp.click();
    });
  }
  function loadImage(file) {
    return new Promise((ok, no) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { ok(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
      img.onerror = () => { URL.revokeObjectURL(url); no(new Error('image')); };
      img.src = url;
    });
  }
  function canvasOf(img, max) {
    const k = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const c = document.createElement('canvas');
    c.width = Math.round((img.naturalWidth || img.width) * k); c.height = Math.round((img.naturalHeight || img.height) * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  // ------------------------------------------------------------ QR code
  async function readQR(img) {
    if ('BarcodeDetector' in window) {
      try {
        const fm = await window.BarcodeDetector.getSupportedFormats();
        if (fm.includes('qr_code')) { const r = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(canvasOf(img, 2400)); if (r.length) return r[0].rawValue; }
      } catch (e) { /* fall back to jsQR */ }
    }
    await loadScript('lib/qr/jsQR.js');
    for (const max of [1600, 1100, 2200, 800]) {
      const c = canvasOf(img, max), d = c.getContext('2d').getImageData(0, 0, c.width, c.height);
      const q = window.jsQR(d.data, c.width, c.height, { inversionAttempts: 'attemptBoth' });
      if (q && q.data) return q.data;
    }
    return null;
  }
  // Secure QR (a long number: compressed fields separated by byte 255) or the old XML QR
  async function parseQR(text) {
    text = String(text || '').trim();
    if (/PrintLetterBarcodeData/.test(text)) {
      const el = new DOMParser().parseFromString(text.replace(/^[^<]*/, ''), 'text/xml').querySelector('PrintLetterBarcodeData');
      if (!el) return null;
      const a = k => (el.getAttribute(k) || '').trim();
      return { name: a('name'), dob: a('dob') || a('yob'), gender: a('gender'), careof: a('co'), house: a('house'), street: a('street'), landmark: a('lm'),
        location: a('loc'), vtc: a('vtc'), po: a('po'), tehsil: a('subdist'), district: a('dist'), state: a('state'), pin: a('pc'), aadhaar: a('uid'), via: 'qr' };
    }
    if (!/^\d{100,}$/.test(text)) return null;
    let n = BigInt(text); const bytes = [];
    while (n > 0n) { bytes.push(Number(n & 255n)); n >>= 8n; }
    bytes.reverse();
    await loadScript('lib/qr/pako_inflate.min.js');
    let raw;
    try { raw = window.pako.ungzip(new Uint8Array(bytes)); } catch (e) { try { raw = window.pako.inflate(new Uint8Array(bytes)); } catch (e2) { return null; } }
    const fields = []; let start = 0;
    for (let i = 0; i < raw.length && fields.length < 20; i++) if (raw[i] === 255) { fields.push(new TextDecoder('iso-8859-1').decode(raw.slice(start, i))); start = i + 1; }
    const o = /^V\d$/.test(fields[0]) ? 1 : 0;   // version 2 starts with "V2"
    const f = i => (fields[o + i] || '').trim();
    return { name: f(2), dob: f(3), gender: f(4), careof: f(5), district: f(6), landmark: f(7), house: f(8), location: f(9), pin: f(10), po: f(11),
      state: f(12), street: f(13), tehsil: f(14), vtc: f(15), last4: f(1).slice(0, 4), via: 'qr' };
  }

  // ------------------------------------------------------------ printed text (OCR)
  let worker = null, idle = 0;
  // A photo made easier to read: grey, stretched contrast, enlarged small pictures, turned by `turn` × 90°
  function prep(img, turn) {
    const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height;
    const k = Math.min(2400 / Math.max(w0, h0), Math.max(1, 1800 / Math.max(w0, h0)));
    const w = Math.round(w0 * k), h = Math.round(h0 * k), side = turn % 2;
    const c = document.createElement('canvas'); c.width = side ? h : w; c.height = side ? w : h;
    const g = c.getContext('2d');
    g.translate(c.width / 2, c.height / 2); g.rotate(turn * Math.PI / 2); g.drawImage(img, -w / 2, -h / 2, w, h);
    const d = g.getImageData(0, 0, c.width, c.height), px = d.data, hist = new Uint32Array(256);
    for (let i = 0; i < px.length; i += 4) { const y = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000 | 0; px[i] = y; hist[y]++; }
    const n = px.length / 4; let lo = 0, hi = 255, acc = 0;
    while (lo < 255 && (acc += hist[lo]) < n * 0.02) lo++;
    acc = 0; while (hi > 0 && (acc += hist[hi]) < n * 0.02) hi--;
    const span = Math.max(1, hi - lo);
    for (let i = 0; i < px.length; i += 4) { const y = Math.max(0, Math.min(255, (px[i] - lo) * 255 / span)); px[i] = px[i + 1] = px[i + 2] = y; }
    g.setTransform(1, 0, 0, 1, 0, 0); g.putImageData(d, 0, 0);
    return c;
  }
  // how much real text a reading has (to pick the right way up)
  const score = txt => (txt.match(/\b[A-Za-z]{3,}\b/g) || []).length + 2 * (txt.match(/\d{4}/g) || []).length;
  async function ocr(img, onp) {
    await loadScript('lib/ocr/tesseract.min.js');
    if (!worker) {
      onp(t('ocrGet'));
      worker = await window.Tesseract.createWorker('eng', 1, {
        workerPath: BASE + 'lib/ocr/worker.min.js', corePath: BASE + 'lib/ocr/', langPath: BASE + 'lib/ocr', workerBlobURL: false,
        logger: m => { if (m.status === 'recognizing text') onp(t('ocrRead', { p: Math.round(m.progress * 100) })); },
      });
    }
    clearTimeout(idle);
    let best = '', bestScore = -1;
    for (const turn of [0, 1, 3, 2]) {                  // upright first; a photo taken sideways or upside down is turned
      const { data } = await worker.recognize(prep(img, turn));
      const sc = score(data.text || '');
      if (sc > bestScore) { best = data.text || ''; bestScore = sc; }
      if (sc >= 14) break;                              // clearly readable: no need to turn
    }
    idle = setTimeout(() => { if (worker) { worker.terminate(); worker = null; } }, 90000);
    return best;
  }
  // Verhoeff check digit of an Aadhaar number
  const VD = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]];
  const VP = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]];
  const verhoeff = s => { let c = 0; s.split('').reverse().forEach((d, i) => { c = VD[c][VP[i % 8][+d]]; }); return c === 0; };
  // ------------------------------------------------------------ any ID card: Aadhaar, Voter ID (EPIC), PAN, Driving Licence, Passport, others
  const titleCase = n => (/[a-z]/.test(n) ? n : n.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase())).replace(/\s+/g, ' ').trim();
  const nameOnly = s => titleCase(String(s || '').replace(/[^A-Za-z .']/g, ' ').replace(/\s+/g, ' ').replace(/^[ .']+|[ .']+$/g, ''));
  const okName = s => /^[A-Za-z.']+( [A-Za-z.']+){0,5}$/.test(s) && s.replace(/[^A-Za-z]/g, '').length >= 3
    && !/government|india|aadhaar|authority|income|department|election|commission|licence|license|republic|passport|card|signature|address|male|female|birth/i.test(s);
  const DATE = /(\d{1,2})\s?[\/\-.]\s?(\d{1,2})\s?[\/\-.]\s?((?:19|20)\d{2})/;
  function parseText(text) {
    const r = { via: 'text' };
    const raw = String(text || '');
    const lines = raw.split('\n').map(l => l.replace(/[|_~«»“”"]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const all = lines.join('\n');
    // the value after a label on the same line, or on the next line
    const after = (re, okFn = x => /[A-Za-z]/.test(x)) => {
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(re); if (!m) continue;
        const rest = lines[i].slice(m.index + m[0].length).replace(/^[\s:.;,\-–/]+/, '').trim();
        if (okFn(rest)) return rest;
        if (lines[i + 1] && okFn(lines[i + 1])) return lines[i + 1];
      }
      return '';
    };
    const nm = re => { const v = nameOnly(after(re, x => okName(nameOnly(x)))); return okName(v) ? v : ''; };

    // which card
    const pan = all.match(/\b([A-Z]{5})\s?([0-9OIlSB]{4})\s?([A-Z])\b/);
    const epic = all.match(/\b([A-Z]{3})\s?([0-9OIl]{7})\b/);
    const dl = all.match(/\b([A-Z]{2})[- ]?(\d{2})[- ]?((?:19|20)\d{2})[- ]?(\d{7})\b/) || all.match(/\b([A-Z]{2}\d{2}\s?\d{11})\b/);
    const mrz = lines.map(l => l.replace(/\s/g, '').replace(/[«(]/g, '<')).filter(l => (l.match(/</g) || []).length >= 4);
    const fixDigits = x => x.replace(/[OQ]/g, '0').replace(/[Il]/g, '1').replace(/S/g, '5').replace(/B/g, '8');
    if (/income\s*tax|permanent\s*account/i.test(all) || (pan && !/aadhaar|election|licen/i.test(all))) {
      r.idType = 'PAN'; if (pan) r.idNo = pan[1] + fixDigits(pan[2]) + pan[3];
    } else if (/election\s*commission|elector|epic/i.test(all)) {
      r.idType = 'Voter ID'; if (epic) r.idNo = epic[1] + fixDigits(epic[2]);
    } else if (/driving\s*licen[cs]e|\bD\.?L\.?\s*No/i.test(all)) {
      r.idType = 'Driving Licence'; if (dl) r.idNo = dl[0].replace(/\s/g, '');
    } else if (mrz.length >= 2 || /passport/i.test(all)) {
      r.idType = 'Passport';
    } else if (/aadhaar|unique\s*identification|government\s*of\s*india|\d{4}\s\d{4}\s\d{4}/i.test(all)) {
      r.idType = 'Aadhaar';
    } else r.idType = 'ID card';

    // Aadhaar number: 12 digits in groups of 4 (not the 16-digit VID), with a valid check digit
    const nums = [...raw.matchAll(/(?<![\d])(\d{4})[ ]?(\d{4})[ ]?(\d{4})(?![ ]?\d)/g)].map(m => m[1] + m[2] + m[3]).filter(n => !/^[01]/.test(n));
    r.aadhaarAll = nums.filter(verhoeff);

    // Passport: the two machine-readable lines at the bottom are the surest
    const l1 = mrz.find(l => /^P[<A-Z]/.test(l)), l2 = mrz.find(l => /^[A-Z0-9<]{9}\d[A-Z<]{3}\d{6}\d[MF<]/.test(l));
    if (l1) {
      const [sur, given] = l1.slice(5).split('<<');
      const full = [given, sur].filter(Boolean).map(x => x.replace(/</g, ' ').trim()).join(' ');
      if (full) r.name = titleCase(full);
    }
    if (l2) {
      r.idNo = l2.slice(0, 9).replace(/</g, '');
      const yy = +l2.slice(13, 15), cy = new Date().getFullYear() % 100;
      r.dob = l2.slice(17, 19) + '/' + l2.slice(15, 17) + '/' + (yy > cy ? 1900 + yy : 2000 + yy);
      r.gender = l2[20] === 'F' ? 'F' : l2[20] === 'M' ? 'M' : '';
    }

    // date of birth, gender, age
    if (!r.dob) {
      const lab = all.match(new RegExp('(?:DOB|D0B|DO8|Date\\s*of\\s*Birth|Birth|जन्म)[^\\d]{0,25}' + DATE.source, 'i'));
      const any = lab || all.match(DATE);
      if (any) r.dob = p2(any[1]) + '/' + p2(any[2]) + '/' + any[3];
      else { const y = all.match(/Year\s*of\s*Birth[^\d]{0,10}((?:19|20)\d{2})/i); if (y) r.dob = y[1]; }
    }
    if (!r.gender) { const g = all.match(/\b(FEMALE|MALE)\b/i) || all.match(/\bSex\s*[:/]?\s*([MF])\b/i); if (g) r.gender = g[1].toUpperCase()[0]; }
    if (!r.dob) { const a = all.match(/Age(?:\s*as\s*on[^:]*)?\s*[:\-]?\s*(\d{2})\b/i); if (a) r.ageText = a[1]; }

    // name
    if (!r.name) r.name = nm(/(?<!(?:father|husband|mother|guardian)'?s?\s{0,3})(?:\b|(?<=Elector'?s))Name\b(?!\s*of\s*(?:father|husband|mother))/i);
    if (!r.name && r.idType === 'PAN') {                 // old PAN: name and father's name are the first two lines after the heading
      const hi = lines.findIndex(l => /income\s*tax|govt/i.test(l));
      const names = lines.slice(hi + 1).map(nameOnly).filter(okName);
      if (names[0]) r.name = names[0]; if (names[1]) r.father = names[1];
    }
    if (!r.name) {                                       // Aadhaar: the English line just above the date of birth
      const di = lines.findIndex(l => /DOB|D0B|Birth|\d{2}\/\d{2}\/\d{4}/i.test(l));
      for (let i = di - 1; i >= 0 && i >= di - 3; i--) { const l = nameOnly(lines[i]); if (okName(l) && l.length >= 5) { r.name = l; break; } }
    }

    // father / husband: S/O · D/O · W/O, or a labelled line
    const co = all.match(/\b([SDWC])\s?[\/.]?\s?O\b\s*[:.,-]?\s*([A-Za-z][A-Za-z .]{2,40}?)\s*(?:,|\n|$)/)
      || all.match(/\b(Son|Daughter|Wife|Care)\s*of\s*[:.,-]?\s*([A-Za-z][A-Za-z .]{2,40}?)\s*(?:,|\n|$)/i);
    if (co && !/^S\s*\/\s*D\s*\/\s*W/i.test(co[0])) { r.careof = co[1][0].toUpperCase() + '/O: ' + nameOnly(co[2]); }
    if (!r.careof) {
      const hus = nm(/Husband'?s?\s*Name/i), fat = nm(/Father'?s?\s*Name|Name\s*of\s*Father|Father\s*\/\s*Legal\s*Guardian|S\s*\/\s*D\s*\/\s*W\s*of|Son\s*\/\s*Daughter\s*\/\s*Wife\s*of/i);
      if (hus) r.careof = 'W/O: ' + hus;
      else if (fat) r.careof = (r.gender === 'F' ? 'D' : r.gender === 'M' ? 'S' : 'C') + '/O: ' + fat;
      else if (r.father) r.careof = 'C/O: ' + r.father;
    }

    // address: after "Address", up to the PIN code
    const ai = all.search(/Address\s*[:\-]?/i);
    if (ai >= 0) {
      let a = all.slice(ai).replace(/^Address\s*[:\-]?\s*/i, '');
      const pin = a.match(/\b(\d{6})\b/);
      if (pin) { r.pin = pin[1]; a = a.slice(0, pin.index); }
      a = a.replace(/\n/g, ', ').replace(/[^A-Za-z0-9 ,.\/\-#()]/g, ' ').replace(/\s+/g, ' ').replace(/(\s*,\s*)+/g, ', ').replace(/^[,\s]+|[,\s-]+$/g, '');
      a = a.replace(/^(?:[SDWC]\s?[\/.]?\s?O|Son of|Daughter of|Wife of)\s*[:.,-]?\s*[^,]+,\s*/i, '');
      if (a.length > 5) r.addressText = a;
    }
    return r;
  }

  // ------------------------------------------------------------ the values for the form
  const fmtDob = s => { const m = String(s || '').match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/); return m ? p2(m[1]) + '.' + p2(m[2]) + '.' + m[3] : String(s || ''); };
  const ageOf = s => {
    const m = String(s || '').match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/), y = m ? +m[3] : (/^\d{4}$/.test(s) ? +s : 0);
    if (!y) return '';
    const now = new Date(); let a = now.getFullYear() - y;
    if (m && (now.getMonth() + 1 < +m[2] || (now.getMonth() + 1 === +m[2] && now.getDate() < +m[1]))) a--;
    return a > 0 && a < 120 ? String(a) : '';
  };
  function values(r) {
    const co = String(r.careof || '').match(/^\s*([SDWC])\s*\/\s*O\s*[:.]?\s*(.*)$/i);
    const rel = co ? { S: 'son of', D: 'daughter of', W: 'wife of' }[co[1].toUpperCase()] || '' : '';
    const father = co ? co[2].replace(/[,;]+$/, '').trim() : '';
    const uniq = a => a.filter((x, i) => x && a.findIndex(y => y && y.toLowerCase() === x.toLowerCase()) === i);
    const local = uniq([r.house, r.street, r.landmark, r.location, r.vtc]);
    const full = uniq(local.concat([r.po && r.po !== r.vtc ? 'P.O. ' + r.po : '', r.tehsil ? 'Tehsil ' + r.tehsil : '', r.district ? 'District ' + r.district : '', r.state]));
    let address = full.join(', '), addressLocal = local.join(', ');
    if (!address && r.addressText) address = addressLocal = r.addressText;
    if (r.pin) { address += (address ? ' – ' : '') + r.pin; }
    const relShort = { 'son of': 'S/o', 'daughter of': 'D/o', 'wife of': 'W/o' }[rel];
    const nice = n => String(n || '').replace(/\s+/g, ' ').trim();
    const v = {
      name: nice(r.name), father: nice(father), rel, relChoice: rel === 'son of' ? '' : rel, dob: fmtDob(r.dob), age: ageOf(r.dob) || nice(r.ageText),
      address, addressLocal, po: nice(r.po), tehsil: nice(r.tehsil), district: nice(r.district),
      aadhaar: r.aadhaar ? r.aadhaar.replace(/(\d{4})(?=\d)/g, '$1 ') : '',
    };
    v.nameFather = v.name + (v.father ? ' ' + (relShort || 'C/o') + ' ' + v.father : '');
    return v;
  }
  // QR first (UIDAI's own data), then what the printed text adds; the number must match the QR's last 4 digits
  function merge(list) {
    const qr = list.find(r => r.via === 'qr') || {}, txt = list.filter(r => r.via === 'text');
    // every photo adds what it has (an empty value never wipes one found on the other side); the QR wins
    const filled = o => Object.fromEntries(Object.entries(o).filter(([k, x]) => x && k !== 'aadhaarAll'));
    const r = Object.assign({}, ...txt.map(filled), filled(qr));
    const typed = txt.find(x => x.idType && x.idType !== 'ID card'); if (typed) { r.idType = typed.idType; r.idNo = typed.idNo || r.idNo; }
    if (!qr.aadhaar) {
      const all = txt.flatMap(x => x.aadhaarAll || []);
      r.aadhaar = (qr.last4 ? all.find(n => n.endsWith(qr.last4)) : all[0]) || '';
    }
    r.fromQR = !!qr.via;
    if (qr.via) r.idType = 'Aadhaar';
    return r;
  }

  // ------------------------------------------------------------ the "Fill from Aadhaar" sheet
  let job = null;
  async function openAadhaar(i) {
    const F = CF.formApi, form = F.form(); if (!form) return;
    const target = form.aadhaarTargets[i];
    job = { target, results: [], images: 0 };
    F.openSheet(t('aadhaarTitle', { who: CF.i18n.ft(form, target.label) }), `<div class="aad">
      <p class="small muted">${esc(t('aadhaarHelp'))}</p>
      <div class="sheet-row"><button type="button" class="btn primary" data-aad-pick="cam">📷 ${esc(t('photoCam'))}</button>
      <button type="button" class="btn" data-aad-pick="gal">🖼 ${esc(t('photoGal'))}</button></div>
      <p class="aad-status small" role="status"></p><div class="aad-out"></div></div>`);
  }
  async function addPhotos(camera) {
    const files = await pick(camera, true);
    if (!files.length || !job) return;
    const box = document.querySelector('#sheetBody .aad'); if (!box) return;
    const status = box.querySelector('.aad-status'); const say = s => { status.textContent = s; };
    box.querySelectorAll('[data-aad-pick]').forEach(b => { b.disabled = true; });
    try {
      for (const file of files) {
        job.images++;
        const img = await loadImage(file);
        say(t('qrRead'));
        const q = await readQR(img).then(parseQR).catch(() => null);
        if (q) job.results.push(q);
        if (!(q && q.aadhaar)) {                       // the number (and a card without QR) from the printed text
          try { job.results.push(parseText(await ocr(img, say))); }
          catch (e) { console.warn('ocr', e); if (!q) say(t(navigator.onLine === false ? 'ocrOffline' : 'aadhaarNone')); }
        }
      }
    } catch (e) { console.warn('aadhaar', e); }
    box.querySelectorAll('[data-aad-pick]').forEach(b => { b.disabled = false; });
    showFound(box, say);
  }
  function showFound(box, say) {
    const F = CF.formApi, form = F.form(); const r = merge(job.results), v = values(r);
    const rows = Object.entries(job.target.map).map(([key, src]) => ({ key, src, val: v[src] || '', field: form.fields.find(f => f.key === key) })).filter(x => x.field && x.val !== '' || (x.field && x.src === 'relChoice' && v.rel));
    if (!rows.length) { say(t('aadhaarNone')); return; }
    say((r.idType ? t('idRead', { id: r.idType + (r.idNo ? ' ' + r.idNo : '') }) + ' ' : '') + t(r.fromQR ? 'aadhaarFoundQR' : 'aadhaarFound'));
    const shown = x => x.field.type === 'choice' ? CF.i18n.ft(form, (x.field.options.find(o => o[0] === x.val) || ['', x.val])[1]) : x.val;
    box.querySelector('.aad-out').innerHTML = `<div class="aad-rows">${rows.map((x, i) => `<label class="aad-row"><input type="checkbox" checked data-aad-use="${i}">
        <span><b>${esc(CF.i18n.ft(form, x.field.label))}</b>${x.field.type === 'choice' ? `<em>${esc(shown(x))}</em>` : `<input type="text" data-aad-val="${i}" value="${esc(x.val)}">`}</span></label>`).join('')}</div>
      <p class="small muted">${esc(t('aadhaarCheck'))}</p>
      <div class="sheet-row"><button type="button" class="btn primary" data-aad-fill>${esc(t('aadhaarFill'))}</button>
      <button type="button" class="btn" data-aad-pick="gal">${esc(t('addBack'))}</button></div>`;
    job.rows = rows;
  }
  function fill() {
    const box = document.querySelector('#sheetBody .aad'); if (!box || !job || !job.rows) return;
    const vals = {};
    job.rows.forEach((x, i) => {
      if (!box.querySelector(`[data-aad-use="${i}"]`).checked) return;
      const inp = box.querySelector(`[data-aad-val="${i}"]`);
      vals[x.key] = inp ? inp.value.trim() : x.val;
    });
    CF.formApi.set(vals);
    CF.formApi.closeSheet();
    if (CF.toast) CF.toast(t('aadhaarFilled'));
    if (CF.act) CF.act.log('aadhaar', CF.formApi.form().id + ' · ' + Object.keys(vals).length);
    job = null;
  }

  // ------------------------------------------------------------ photo fields (the surety's photo box)
  async function takePhoto(key, camera) {
    const F = CF.formApi, form = F.form(); if (!form) return;
    const f = form.fields.find(x => x.key === key); if (!f) return;
    const [file] = await pick(camera, false); if (!file) return;
    const img = await loadImage(file);
    const [bw, bh] = f.box || [3, 4];                               // keep the box's shape (width : height)
    const W = 330, H = Math.round(W * bh / bw);
    const iw = img.naturalWidth, ih = img.naturalHeight, k = Math.max(W / iw, H / ih);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.drawImage(img, (W - iw * k) / 2, (H - ih * k) / 2, iw * k, ih * k);
    F.set({ [key]: c.toDataURL('image/jpeg', 0.82) });
    if (CF.act) CF.act.log('photo', form.id);
  }
  function paintPhoto(el, src) {
    const img = el.querySelector('img'), del = el.querySelector('[data-photo-del]');
    img.hidden = !src; if (src) img.src = src; else img.removeAttribute('src');
    del.hidden = !src;
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('[data-aadhaar]'); if (a) { e.preventDefault(); openAadhaar(+a.dataset.aadhaar); return; }
    const p = e.target.closest('[data-aad-pick]'); if (p) { e.preventDefault(); addPhotos(p.dataset.aadPick === 'cam'); return; }
    if (e.target.closest('[data-aad-fill]')) { e.preventDefault(); fill(); return; }
    const ph = e.target.closest('[data-photo-cam],[data-photo-gal]');
    if (ph) { e.preventDefault(); takePhoto(ph.closest('[data-photo]').dataset.photo, ph.hasAttribute('data-photo-cam')); return; }
    const pd = e.target.closest('[data-photo-del]');
    if (pd) { e.preventDefault(); CF.formApi.set({ [pd.closest('[data-photo]').dataset.photo]: '' }); }
  });

  CF.capture = { paintPhoto, parseQR, parseText, values, merge, verhoeff };
})();
