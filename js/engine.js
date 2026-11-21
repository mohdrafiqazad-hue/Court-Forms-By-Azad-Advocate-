/* i Court Forms — rendering engine.
   A form config builds ONE layout model (a list of table cells on a fixed grid).
   Three renderers read that same model, so preview, PDF and Word always match:
     svg()  — live SVG preview
     pdf()  — vector PDF (jsPDF, Times); Punjabi / Hindi pages are drawn on a canvas (the browser
              shapes Gurmukhi / Devanagari correctly) and placed in the PDF as one 300-dpi image
     docx() — editable Word file (docx.js: real table, merged cells, rotated text)
   Units: grid sizes in DXA (1/1440 inch = 1/20 pt); page and drawing in points. */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  CF.forms = CF.forms || [];
  CF.register = form => { CF.forms.push(form); };

  // ------------------------------------------------------------ text helpers
  const clean = s => String(s || '').replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  const linesOf = s => { const t = clean(s).replace(/\r/g, ''); return t.trim() === '' ? [] : t.split('\n'); };
  const P = (text, size, o = {}) => ({ text: clean(text), size, bold: !!o.bold, strike: !!o.strike });

  // Collects cells: add(col, row, colSpan, rowSpan, paragraphs, {rot, align, valign, border, gap})
  function cellList() {
    const cells = [];
    const add = (c, r, cs, rs, paras, o = {}) => cells.push({
      c, r, cs, rs, paras, rot: !!o.rot, align: o.align || 'center', valign: o.valign || 'center',
      border: o.border !== false, gap: o.gap || 0,
    });
    return { cells, add };
  }
  CF.util = { clean, linesOf, P, cellList };

  // ------------------------------------------------------------ measuring & wrapping (points)
  const pt = v => v / 20;
  const PAD_H = 3.5, PAD_V = 2, LINE = 1.15;

  // ------------------------------------------------------------ print languages & fonts
  // English prints with Times (vector PDF). Punjabi / Hindi — or any Gurmukhi / Devanagari typed in a
  // field — use the bundled Noto Serif fonts (lib/fonts, OFL) for the page, the preview and the PDF.
  const PRINT_LANGS = ['en', 'pa', 'hi'];
  const TIMES = "'Times New Roman', Times, 'Liberation Serif', serif";
  const GUR = "'Noto Serif Gurmukhi'", DEV = "'Noto Serif Devanagari'";
  const FONT_FILES = [
    ['Noto Serif Gurmukhi', 'noto-serif-gurmukhi', 'U+0951-0952,U+0964-0965,U+0A01-0A76,U+200C-200D,U+20B9,U+25CC,U+262C,U+A830-A839'],
    ['Noto Serif Devanagari', 'noto-serif-devanagari', 'U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+20F0,U+25CC,U+A830-A839,U+A8E0-A8FF'],
  ];
  const INDIC = /[\u0900-\u0A7F]/;
  let fontsP = null, fontsOk = false;
  function loadFonts() {
    if (fontsP) return fontsP;
    if (!window.FontFace || !document.fonts) { fontsOk = true; return (fontsP = Promise.resolve()); }
    const all = [];
    for (const [fam, file, range] of FONT_FILES) for (const w of ['400', '700']) {
      const f = new FontFace(fam, `url(lib/fonts/${file}-${w}.woff2) format('woff2')`, { weight: w, unicodeRange: range });
      document.fonts.add(f); all.push(f.load());
    }
    return (fontsP = Promise.all(all).then(() => { fontsOk = true; }, () => { fontsOk = true; }));
  }
  // Font family for a page: null = Times / vector PDF; otherwise the Noto fonts first (they only cover their script)
  function familyFor(lang, cells, title) {
    const indic = lang !== 'en' || INDIC.test(title) || cells.some(c => c.paras.some(p => INDIC.test(p.text)));
    if (!indic) return null;
    return (lang === 'hi' ? [DEV, GUR] : [GUR, DEV]).join(', ') + ', ' + TIMES;
  }
  const cssFont = (fam, size, bold) => `${bold ? 'bold ' : ''}${size}px ${fam}`;
  let curFam = null, ctx2d = null;

  let measurer = null;
  function measure(text, size, bold) {
    if (curFam) {
      if (!ctx2d) ctx2d = document.createElement('canvas').getContext('2d');
      ctx2d.font = cssFont(curFam, size, bold); return ctx2d.measureText(text).width;
    }
    if (!measurer) measurer = new window.jspdf.jsPDF({ unit: 'pt', format: [612, 1008] });
    measurer.setFont('times', bold ? 'bold' : 'normal');
    return measurer.getStringUnitWidth(text) * size;
  }
  function wrap(text, size, bold, maxW) {
    if (text === '') return [''];
    const words = text.split(/( +)/); const out = []; let cur = '';
    for (const w of words) {
      const trial = cur + w;
      if (cur && measure(trial.trimEnd(), size, bold) > maxW) { out.push(cur.trimEnd()); cur = w.trimStart(); }
      else cur = trial;
      while (measure(cur, size, bold) > maxW && cur.length > 1) { // break very long words
        let k = cur.length; while (k > 1 && measure(cur.slice(0, k), size, bold) > maxW) k--;
        out.push(cur.slice(0, k)); cur = cur.slice(k);
      }
    }
    out.push(cur.trimEnd()); return out;
  }

  // Grid edges and the landscape rotation constant for a form
  function geom(form) {
    if (form._geom) return form._geom;
    const g = form.grid;
    const colX = [g.left]; g.cols.forEach((w, i) => colX.push(colX[i] + w));
    const rowY = [g.top]; g.rows.forEach((h, i) => rowY.push(rowY[i] + h));
    // Landscape = portrait rotated 90° clockwise, content centred on the long side.
    const A = form.page.h / 2 + (form.title.top + pt(rowY[rowY.length - 1])) / 2;
    return (form._geom = { colX, rowY, A });
  }

  // ------------------------------------------------------------ layout → drawing ops (portrait coords)
  // ops: rect {x,y,w,h} · text {x,y,text,size,bold,angle} · line {x1,y1,x2,y2,wdt}
  const titleOf = (form, lang) => (form.title.tr && form.title.tr[lang]) || form.title.text;
  function layout(form, cells, lang = 'en') {
    const { colX, rowY } = geom(form);
    const ops = [];
    const T = form.title, title = titleOf(form, lang);
    ops.fam = curFam = familyFor(lang, cells, title); ops.lang = lang;
    const ttw = measure(title, T.size, true);
    ops.push({ t: 'text', x: form.page.w / 2 - ttw / 2, y: T.top + T.size * 0.8, text: title, size: T.size, bold: true, angle: 0 });

    for (const c of cells) {
      const x = pt(colX[c.c]), w = pt(colX[c.c + c.cs] - colX[c.c]);
      const y = pt(rowY[c.r]), h = pt(rowY[c.r + c.rs] - rowY[c.r]);
      if (c.border) ops.push({ t: 'rect', x, y, w, h });
      const along = c.rot ? h - 2 * PAD_V - 2 : w - 2 * PAD_H;
      const lines = [];
      c.paras.forEach((p, i) => wrap(p.text, p.size, p.bold, along).forEach((s, j) => lines.push({ ...p, text: s, extra: (i > 0 && j === 0) ? c.gap : 0 })));
      const across = lines.reduce((s, l) => s + l.size * LINE + l.extra, 0);
      const crossSize = c.rot ? w - 2 * PAD_H : h - 2 * PAD_V;
      let off = c.valign === 'top' ? (c.rot ? PAD_H : PAD_V) : (c.rot ? PAD_H : PAD_V) + Math.max(0, (crossSize - across) / 2);
      for (const l of lines) {
        off += l.extra;
        const lh = l.size * LINE;
        const base = off + (lh - l.size) / 2 + l.size * 0.8;
        const tw = measure(l.text, l.size, l.bold);
        if (!c.rot) {
          const tx = c.align === 'left' ? x + PAD_H : x + (w - tw) / 2;
          const ty = y + base;
          if (l.text) ops.push({ t: 'text', x: tx, y: ty, text: l.text, size: l.size, bold: l.bold, angle: 0 });
          if (l.strike && l.text) ops.push({ t: 'line', x1: tx - 1, y1: ty - l.size * 0.3, x2: tx + tw + 1, y2: ty - l.size * 0.3, wdt: 1.2 });
        } else { // vertical text, bottom-to-top
          const tx = x + base;
          const ty = c.align === 'left' ? y + h - PAD_V - 2 : y + h - (h - tw) / 2;
          if (l.text) ops.push({ t: 'text', x: tx, y: ty, text: l.text, size: l.size, bold: l.bold, angle: 90 });
          if (l.strike && l.text) ops.push({ t: 'line', x1: tx - l.size * 0.3, y1: ty + 1, x2: tx - l.size * 0.3, y2: ty - tw - 1, wdt: 1.2 });
        }
        off += lh;
      }
    }
    curFam = null;
    return ops;
  }

  // ------------------------------------------------------------ SVG preview
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function svg(form, ops, land) {
    const { A } = geom(form);
    const W = land ? form.page.h : form.page.w, H = land ? form.page.w : form.page.h;
    const g = land ? `translate(${A},0) rotate(90)` : '';
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(form.name)} preview"><rect width="${W}" height="${H}" fill="#fff"/><g transform="${g}" font-family="${esc(ops.fam || TIMES).replace(/"/g, '&quot;')}" fill="#000">`;
    for (const o of ops) {
      if (o.t === 'rect') s += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="none" stroke="#000" stroke-width="0.5"/>`;
      else if (o.t === 'line') s += `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="#000" stroke-width="${o.wdt}"/>`;
      else s += `<text x="${o.x}" y="${o.y}" font-size="${o.size}"${o.bold ? ' font-weight="bold"' : ''} xml:space="preserve"${o.angle ? ` transform="rotate(${-o.angle} ${o.x} ${o.y})"` : ''}>${esc(o.text)}</text>`;
    }
    return s + '</g></svg>';
  }

  // ------------------------------------------------------------ PDF
  // The page drawn on a canvas (same ops, same transform as the preview); scale 4 ≈ 290 dpi
  function canvasPage(form, ops, land, scale) {
    const { A } = geom(form);
    const W = land ? form.page.h : form.page.w, H = land ? form.page.w : form.page.h;
    const cv = document.createElement('canvas'); cv.width = Math.round(W * scale); cv.height = Math.round(H * scale);
    const x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
    x.scale(scale, scale); if (land) { x.translate(A, 0); x.rotate(Math.PI / 2); }
    x.fillStyle = '#000'; x.strokeStyle = '#000'; x.textBaseline = 'alphabetic';
    for (const o of ops) {
      if (o.t === 'rect') { x.lineWidth = 0.5; x.strokeRect(o.x, o.y, o.w, o.h); }
      else if (o.t === 'line') { x.lineWidth = o.wdt; x.beginPath(); x.moveTo(o.x1, o.y1); x.lineTo(o.x2, o.y2); x.stroke(); }
      else {
        x.save(); x.font = cssFont(ops.fam || TIMES, o.size, o.bold); x.translate(o.x, o.y);
        if (o.angle) x.rotate(-o.angle * Math.PI / 180);
        x.fillText(o.text, 0, 0); x.restore();
      }
    }
    return cv;
  }

  function pdf(form, ops, land) {
    const { A } = geom(form);
    const doc = new window.jspdf.jsPDF({ unit: 'pt', format: [form.page.w, form.page.h], orientation: land ? 'landscape' : 'portrait' });
    if (ops.fam) { // Punjabi / Hindi: one high-resolution image of the page
      const W = land ? form.page.h : form.page.w, H = land ? form.page.w : form.page.h;
      doc.addImage(canvasPage(form, ops, land, 4), 'PNG', 0, 0, W, H, undefined, 'FAST');
      doc.setProperties({ title: form.docTitle || form.name });
      return doc.output('blob');
    }
    doc.setLineWidth(0.5); doc.setDrawColor(0);
    const tp = (x, y) => land ? [A - y, x] : [x, y];
    for (const o of ops) {
      if (o.t === 'rect') {
        const pts = [[o.x, o.y], [o.x + o.w, o.y], [o.x + o.w, o.y + o.h], [o.x, o.y + o.h]].map(p => tp(p[0], p[1]));
        doc.setLineWidth(0.5);
        for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4]; doc.line(a[0], a[1], b[0], b[1]); }
      } else if (o.t === 'line') {
        const a = tp(o.x1, o.y1), b = tp(o.x2, o.y2); doc.setLineWidth(o.wdt); doc.line(a[0], a[1], b[0], b[1]);
      } else {
        const [x, y] = tp(o.x, o.y);
        doc.setFont('times', o.bold ? 'bold' : 'normal'); doc.setFontSize(o.size);
        const angle = o.angle - (land ? 90 : 0);
        doc.text(o.text, x, y, angle ? { angle } : undefined);
      }
    }
    doc.setProperties({ title: form.docTitle || form.name });
    return doc.output('blob');
  }

  // ------------------------------------------------------------ Word
  const DOCX_DEFAULTS = {
    titleAfter: 280,      // space between title and table (portrait)
    titleCol: 1000,       // width of the title column in landscape
    portraitMargin: { top: 2000, bottom: 1000, header: 500, footer: 500 },
    landMargin: { top: 400, bottom: 300, header: 200, footer: 200 },
  };
  function docx(form, cells, land, lang = 'en') {
    const D = window.docx;
    const cfg = Object.assign({}, DOCX_DEFAULTS, form.docx || {});
    const g = form.grid;
    const pageW = form.page.w * 20, pageH = form.page.h * 20; // portrait, DXA
    const line = { style: D.BorderStyle.SINGLE, size: 8, color: '000000' };
    const none = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const B = { top: line, bottom: line, left: line, right: line };
    const NB = { top: none, bottom: none, left: none, right: none };
    const margins = { top: 40, bottom: 40, left: 70, right: 70 };
    const FONT = 'Times New Roman';
    // Gurmukhi / Devanagari are "complex script" text in Word: Raavi / Mangal (standard Windows fonts)
    const fontOf = text => /[\u0A00-\u0A7F]/.test(text) ? { ascii: FONT, hAnsi: FONT, cs: 'Raavi' }
      : /[\u0900-\u097F]/.test(text) ? { ascii: FONT, hAnsi: FONT, cs: 'Mangal' } : FONT;
    const title = titleOf(form, lang);
    const indic = !!familyFor(lang, cells, title);
    const para = (p, o) => new D.Paragraph({
      alignment: o.align === 'left' ? D.AlignmentType.LEFT : D.AlignmentType.CENTER,
      // Punjabi / Hindi fonts have tall lines in Word: fixed line height so every row keeps its printed size
      spacing: indic ? { before: o.before || 0, after: 0, line: Math.round(p.size * 1.25 * 20), lineRule: D.LineRuleType.EXACT } : { before: o.before || 0, after: 0, line: 240 },
      children: [new D.TextRun({ text: p.text, font: fontOf(p.text), size: Math.round(p.size * 2), bold: p.bold, strike: p.strike })],
    });

    // Grid for the chosen orientation
    const pCols = g.cols.length, pRows = g.rows.length;
    let nCols, nRows, colW, rowH, place;
    if (!land) {
      nCols = pCols; nRows = pRows; colW = g.cols.slice(); rowH = g.rows.slice();
      place = c => ({ c: c.c, r: c.r, cs: c.cs, rs: c.rs, dir: c.rot ? 'btlr' : 'h' });
    } else {
      // columns: portrait rows (last..first) then a title column; rows: portrait columns
      nCols = pRows + 1; nRows = pCols; colW = g.rows.slice().reverse().concat([cfg.titleCol]); rowH = g.cols.slice();
      place = c => ({ c: pRows - 1 - (c.r + c.rs - 1), r: c.c, cs: c.rs, rs: c.cs, dir: c.rot ? 'h' : 'tbrl' });
    }
    const items = cells.map(c => ({ ...place(c), cell: c }));
    if (land) items.push({ c: pRows, r: 0, cs: 1, rs: pCols, dir: 'tbrl', cell: { paras: [P(title, form.title.size, { bold: true })], align: 'center', valign: 'center', border: false, gap: 0 } });

    const owner = [];
    for (let r = 0; r < nRows; r++) owner.push(Array(nCols).fill(null));
    for (const it of items) for (let r = it.r; r < it.r + it.rs; r++) for (let c = it.c; c < it.c + it.cs; c++) owner[r][c] = it;

    const rows = [];
    for (let r = 0; r < nRows; r++) {
      const kids = [];
      for (let c = 0; c < nCols;) {
        const it = owner[r][c];
        if (!it) throw new Error(`Grid hole at row ${r}, col ${c} — every grid square needs a cell`);
        const width = colW.slice(c, c + it.cs).reduce((a, b) => a + b, 0);
        const first = it.r === r;
        const ce = it.cell;
        const children = first
          ? (ce.paras.length ? ce.paras.map((p, i) => para(p, { align: ce.align, before: i ? ce.gap * 20 : 0 })) : [new D.Paragraph('')])
          : [new D.Paragraph('')];
        kids.push(new D.TableCell({
          children,
          columnSpan: it.cs > 1 ? it.cs : undefined,
          verticalMerge: it.rs > 1 ? (first ? D.VerticalMergeType.RESTART : D.VerticalMergeType.CONTINUE) : undefined,
          width: { size: width, type: D.WidthType.DXA },
          borders: ce.border ? B : NB, margins,
          verticalAlign: ce.valign === 'top' ? D.VerticalAlign.TOP : D.VerticalAlign.CENTER,
          textDirection: it.dir === 'btlr' ? D.TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT : it.dir === 'tbrl' ? D.TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT : undefined,
        }));
        c += it.cs;
      }
      rows.push(new D.TableRow({ height: { value: rowH[r], rule: D.HeightRule.EXACT }, cantSplit: true, children: kids }));
    }
    const total = colW.reduce((a, b) => a + b, 0);
    const table = new D.Table({ width: { size: total, type: D.WidthType.DXA }, columnWidths: colW, rows });
    const tail = new D.Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: 'exact' }, children: [new D.TextRun({ text: '', size: 2 })] });

    let page, children;
    if (!land) {
      page = { size: { width: pageW, height: pageH }, margin: { ...cfg.portraitMargin, left: g.left, right: pageW - g.left - total } };
      children = [new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { before: 0, after: cfg.titleAfter }, children: [new D.TextRun({ text: title, font: fontOf(title), size: form.title.size * 2, bold: true })] }), table, tail];
    } else {
      const side = Math.floor((pageH - total) / 2);
      page = { size: { width: pageW, height: pageH, orientation: D.PageOrientation.LANDSCAPE }, margin: { ...cfg.landMargin, left: side, right: pageH - total - side } };
      children = [table, tail];
    }
    const doc = new D.Document({
      title: form.docTitle || form.name,
      styles: { default: { document: { run: { font: FONT, size: 22 } } } },
      sections: [{ properties: { page }, children }],
    });
    return D.Packer.toBlob(doc);
  }

  CF.engine = { layout, svg, pdf, docx, loadFonts, fontsReady: () => fontsOk, PRINT_LANGS, canvasPage };
})();
