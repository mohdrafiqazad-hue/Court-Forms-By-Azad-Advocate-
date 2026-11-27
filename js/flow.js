/* i Court Forms — flow layout for forms written like a Word page: heading lines, a table, the signature.
   Used by Talbana, List of Documents and Address Form (form.flow = true).
   A form gives doc(data, lang, step) = { page, margin, blocks } (points):
     paragraph { p: true, align: left|center|right|both, indL, indR, hang, before, after, line, tabs: [pt], runs: [run] }
       run { text (\t = tab, \n = new line), font: serif|sans, size, b, i, u: single|dotted }
     table     { table: true, indent, cols: [pt], border (pt), rows: [{ h, cells: [{ span, paras, valign, pad, sides }] }] }
       sides = { t, r, b, l }: 'single' | 'dotted' | 'none' (default single)
   layout() measures and wraps it (the same way for every output), lays it on ONE Legal page and returns the
   drawing ops of engine.js (preview / PDF); every line and row height it finds goes into Word as an exact
   height, so Word, PDF and preview match and the page never runs onto a second sheet.
   step: when the page is too full the form is asked again with step 1, 2, … to make its text smaller. */
(function () {
  'use strict';
  const CF = window.CF, E = CF.engine;
  const FAM = {
    serif: "'Times New Roman', Times, 'Liberation Serif', 'Noto Serif Gurmukhi', 'Noto Serif Devanagari', serif",
    sans: "'Noto Sans', 'Noto Sans Gurmukhi', 'Noto Sans Devanagari', sans-serif",
  };
  const WORD = { serif: 'Times New Roman', sans: 'Nirmala UI' };
  const LINE = { serif: 1.15, sans: 1.33 };   // single line height ÷ font size (Times New Roman, Nirmala UI)

  // ------------------------------------------------------------ measuring
  let vector = true, ctx = null, jsp = null;
  function measure(text, r) {
    if (vector) {
      if (!jsp) jsp = new window.jspdf.jsPDF({ unit: 'pt', format: [612, 1008] });
      jsp.setFont('times', r.b && r.i ? 'bolditalic' : r.b ? 'bold' : r.i ? 'italic' : 'normal');
      return jsp.getStringUnitWidth(text) * r.size;
    }
    if (!ctx) ctx = document.createElement('canvas').getContext('2d');
    ctx.font = E.cssFont(FAM[r.font || 'serif'], r.size, r.b, r.i);
    return ctx.measureText(text).width;
  }
  // Punjabi / Hindi letters are taller: never less than this line height, so Word does not cut them off
  const INDIC_MIN = { serif: 1.4, sans: 1.22 };
  const lineOf = p => Math.max(p.line || Math.max(...p.runs.map(r => r.size * LINE[r.font || 'serif']), 8) * (p.mult || 1),
    ...p.runs.filter(r => E.INDIC.test(r.text || '')).map(r => r.size * INDIC_MIN[r.font || 'serif']));

  // ------------------------------------------------------------ paragraph → lines
  function tokens(runs) {
    const out = [];
    runs.forEach(r => String(r.text == null ? '' : r.text).replace(/\r/g, '').split(/(\t|\n| +)/).forEach(s => {
      if (s === '') return;
      out.push({ s, r, k: s === '\t' ? 'tab' : s === '\n' ? 'nl' : s[0] === ' ' ? 'sp' : 'w' });
    }));
    return out;
  }
  function wrapPara(p, width) {
    const indL = p.indL || 0, indR = p.indR || 0, hang = p.hang || 0;
    const right = width - indR;
    const stops = (p.tabs || []).slice();
    if (hang) stops.push(indL);
    stops.sort((a, b) => a - b);
    const lines = []; let cur = null;
    const start = first => { const x = first ? indL - hang + (p.first || 0) : indL; cur = { items: [], left: x, x, end: 'wrap' }; lines.push(cur); };
    start(true);
    for (const tk of tokens(p.runs)) {
      if (tk.k === 'nl') { cur.end = 'nl'; start(false); continue; }
      if (tk.k === 'tab') {
        let stop = stops.find(v => v > cur.x + 0.5);
        if (stop == null) stop = (Math.floor(cur.x / 36) + 1) * 36;
        if (stop > right) { start(false); stop = cur.x; }
        cur.items.push({ ...tk, x: cur.x, w: stop - cur.x }); cur.x = stop; continue;
      }
      let w = measure(tk.s, tk.r);
      if (tk.k === 'sp') { if (cur.items.length) { cur.items.push({ ...tk, x: cur.x, w }); cur.x += w; } continue; }
      if (cur.x + w > right + 0.01 && cur.items.some(i => i.k === 'w')) { trim(cur); start(false); }
      let s = tk.s;
      while (cur.x + w > right + 0.01 && s.length > 1) { // a word longer than the line: break it
        let k = s.length; while (k > 1 && cur.x + measure(s.slice(0, k), tk.r) > right) k--;
        cur.items.push({ ...tk, s: s.slice(0, k), x: cur.x, w: measure(s.slice(0, k), tk.r) });
        s = s.slice(k); start(false); w = measure(s, tk.r);
      }
      cur.items.push({ ...tk, s, x: cur.x, w }); cur.x += w;
    }
    cur.end = 'last'; trim(cur);
    lines.forEach(l => { // alignment
      const used = l.items.length ? l.items[l.items.length - 1].x + l.items[l.items.length - 1].w - l.left : 0;
      const free = right - l.left - used;
      let shift = p.align === 'center' ? free / 2 : p.align === 'right' ? free : 0;
      if (p.align === 'both' && l.end === 'wrap') {
        const gaps = l.items.filter((it, i) => it.k === 'sp' && i > 0);
        if (gaps.length) { const add = free / gaps.length; let acc = 0; l.items.forEach(it => { it.x += acc; if (it.k === 'sp') { it.w += add; acc += add; } }); }
      }
      if (shift > 0) l.items.forEach(it => { it.x += shift; });
    });
    return lines;
  }
  function trim(l) { while (l.items.length && l.items[l.items.length - 1].k === 'sp') l.items.pop(); }

  // Draw a laid-out paragraph at (x0, y) → height used
  function drawPara(ops, p, x0, y, width) {
    const lines = wrapPara(p, width), lh = lineOf(p);
    p._line = lh;
    let top = y + (p.before || 0);
    for (const l of lines) {
      const size = Math.max(...l.items.map(i => i.r.size), ...p.runs.map(r => r.size), 1);
      const base = top + lh / 2 + size * 0.33;
      // text: words of one style that follow each other are drawn as one piece (justified lines word by word)
      let run = null;
      const flush = () => { if (run && run.text.trim()) ops.push(run); run = null; };
      for (const it of l.items) {
        if (it.k === 'tab') { flush(); continue; }
        const r = it.r;
        if (run && run.r === r && p.align !== 'both') { run.text += it.s; continue; }
        flush();
        run = { t: 'text', x: x0 + it.x, y: base, text: it.s, size: r.size, bold: !!r.b, italic: !!r.i, fam: vector ? null : FAM[r.font || 'serif'], angle: 0, r };
      }
      flush();
      // underline (Word underlines the spaces and tabs inside an underlined run too)
      let u = null;
      const uflush = () => { if (u) ops.push({ t: 'line', x1: u.x1, y1: u.y, x2: u.x2, y2: u.y, wdt: u.w, dash: u.dash }); u = null; };
      for (const it of l.items) {
        const r = it.r;
        if (!r.u || (it.k !== 'w' && !(u && u.r === r))) { uflush(); continue; }
        const y2 = base + r.size * 0.14;
        if (u && u.r === r) u.x2 = x0 + it.x + it.w; else { uflush(); u = { r, x1: x0 + it.x, x2: x0 + it.x + it.w, y: y2, w: Math.max(0.6, r.size * 0.055), dash: r.u === 'dotted' ? [1, 1.6] : null }; }
      }
      uflush();
      top += lh;
    }
    p._h = (p.before || 0) + lines.length * lh + (p.after || 0);
    return p._h;
  }

  // ------------------------------------------------------------ whole page
  const SIDES = ['t', 'r', 'b', 'l'];
  function place(doc) {
    const ops = []; const m = doc.margin;
    const width = doc.page.w - m.left - m.right;
    let y = m.top;
    for (const b of doc.blocks) {
      if (b.p) { y += drawPara(ops, b, m.left, y, width); continue; }
      // table
      y += b.before || 0;
      const x0 = m.left + (b.indent || 0);
      const colX = [x0]; b.cols.forEach((w, i) => colX.push(colX[i] + w));
      const sizeRow = row => {
        let c = 0;
        row.cells.forEach(cell => { cell._c = c; c += cell.span || 1; });
        // height: the row's own, or more if the text needs it
        const need = row.cells.map(cell => {
          const pad = Object.assign({ l: 3, r: 3, t: 1, b: 1 }, cell.pad || {});
          const w = colX[cell._c + (cell.span || 1)] - colX[cell._c] - pad.l - pad.r;
          const tmp = []; let h = 0; (cell.paras || []).forEach(p => { h += drawPara(tmp, p, 0, 0, w); });
          return h + pad.t + pad.b;
        });
        row._h = Math.max(row.h || 0, ...need);
        return row._h;
      };
      let total = b.rows.reduce((sum, row) => sum + sizeRow(row), 0);
      // fillTo: blank rows (fillRow) before the last row until the table reaches that height on the page
      if (b.fillTo && b.fillRow) {
        const fh = sizeRow(JSON.parse(JSON.stringify(b.fillRow)));
        while (y + total + fh <= b.fillTo) { const r = JSON.parse(JSON.stringify(b.fillRow)); sizeRow(r); b.rows.splice(b.rows.length - 1, 0, r); total += fh; }
      }
      for (const row of b.rows) {
        row.cells.forEach(cell => {
          const pad = Object.assign({ l: 3, r: 3, t: 1, b: 1 }, cell.pad || {});
          const x = colX[cell._c], w = colX[cell._c + (cell.span || 1)] - x;
          if (cell.image) ops.push({ t: 'image', x: x + 1, y: y + 1, w: w - 2, h: row._h - 2, src: cell.image });   // a photo filling the box (under its border)
          const sides = cell.sides || {};
          const bw = b.border || 0.5;
          const edge = { t: [x, y, x + w, y], r: [x + w, y, x + w, y + row._h], b: [x, y + row._h, x + w, y + row._h], l: [x, y, x, y + row._h] };
          SIDES.forEach(s => { const k = sides[s] || 'single'; if (k !== 'none') ops.push({ t: 'line', x1: edge[s][0], y1: edge[s][1], x2: edge[s][2], y2: edge[s][3], wdt: k === 'dotted' ? 1.1 : bw, dash: k === 'dotted' ? [1, 1.8] : null }); });
          const ch = (cell.paras || []).reduce((s, p) => s + (p._h || 0), 0);
          let cy = y + pad.t;
          if (cell.valign === 'center') cy = y + Math.max(pad.t, (row._h - ch) / 2);
          if (cell.valign === 'bottom') cy = y + row._h - pad.b - ch;
          (cell.paras || []).forEach(p => { cy += drawPara(ops, p, x + pad.l, cy, w - pad.l - pad.r); });
        });
        y += row._h;
      }
    }
    ops.bottom = y;
    return ops;
  }

  const INDIC = E.INDIC;
  const blocksOf = doc => doc.pages ? doc.pages.flat() : doc.blocks;
  const textsOf = doc => blocksOf(doc).flatMap(b => b.p ? b.runs : b.rows.flatMap(r => r.cells.flatMap(c => (c.paras || []).flatMap(p => p.runs))));
  // Lay the form out on one page: ask the form for smaller text (step 1, 2, …) while it does not fit
  // Several pages (doc.pages = [blocks, blocks, …], form.multiPage): each page is fitted by itself —
  // only a page that is too full gets smaller text (doc(data, lang, steps) with steps[i] for page i).
  function fit(form, data, lang) {
    const max = form.fitSteps || 0;
    let steps = [0], doc, list;
    for (let guard = 0; guard < 80; guard++) {
      vector = lang === 'en';                     // measuring while the form is built (e.g. text beside a box)
      doc = form.doc(data, lang, form.multiPage ? steps.slice() : steps[0]);
      const pages = doc.pages || [doc.blocks];
      steps = pages.map((_, i) => steps[i] || 0);
      vector = textsOf(doc).every(r => (r.font || 'serif') === 'serif' && !INDIC.test(r.text || ''));
      list = pages.map(blocks => place({ page: doc.page, margin: doc.margin, blocks }));
      let again = false;
      list.forEach((o, i) => { if (o.bottom > doc.page.h - doc.margin.bottom && steps[i] < max) { steps[i]++; again = true; } });
      if (!again) break;
    }
    list.forEach(o => { o.fam = vector ? null : FAM.sans; o.lang = lang; o.overflow = o.bottom > doc.page.h - doc.margin.bottom + 0.5; });
    const ops = list[0];
    if (list.length > 1) ops.pages = list;
    ops.overflow = list.some(o => o.overflow);
    vector = true;
    return { doc, ops };
  }
  const layout = (form, data, lang) => fit(form, data, lang).ops;

  // ------------------------------------------------------------ Word
  const tw = v => Math.round(v * 20);
  function docx(form, data, lang) {
    const { doc } = fit(form, data, lang);
    const D = window.docx;
    const AL = { left: D.AlignmentType.LEFT, center: D.AlignmentType.CENTER, right: D.AlignmentType.RIGHT, both: D.AlignmentType.JUSTIFIED };
    const run = r => {
      const t = r.text || '';
      // Punjabi / Hindi in a serif text: Raavi / Mangal (Windows); sans: Nirmala UI has both
      const font = (r.font || 'serif') === 'serif' && /[\u0A00-\u0A7F]/.test(t) ? 'Raavi' : (r.font || 'serif') === 'serif' && /[\u0900-\u097F]/.test(t) ? 'Mangal' : WORD[r.font || 'serif'];
      const parts = String(r.text == null ? '' : r.text).split(/(\t|\n)/).filter(s => s !== '');
      const kids = []; parts.forEach(s => { if (s === '\t') kids.push(new D.Tab()); else if (s === '\n') kids.push(new D.CarriageReturn()); else kids.push(s); });
      return new D.TextRun({
        children: kids.length ? kids : [''], font: { ascii: font, hAnsi: font, cs: font, eastAsia: font }, size: Math.round(r.size * 2), sizeComplexScript: Math.round(r.size * 2),
        bold: !!r.b, boldComplexScript: !!r.b, italics: !!r.i, italicsComplexScript: !!r.i,
        underline: r.u ? { type: r.u === 'dotted' ? D.UnderlineType.DOTTED : D.UnderlineType.SINGLE, color: '000000' } : undefined,
      });
    };
    const para = p => new D.Paragraph({
      alignment: AL[p.align || 'left'],
      indent: { left: tw(p.indL || 0), right: tw(p.indR || 0), hanging: p.hang ? tw(p.hang) : undefined, firstLine: p.first ? tw(p.first) : undefined },
      spacing: { before: tw(p.before || 0), after: tw(p.after || 0), line: tw(p._line || lineOf(p)), lineRule: D.LineRuleType.EXACT },
      tabStops: (p.tabs || []).map(v => ({ type: D.TabStopType.LEFT, position: tw(v) })),
      children: p.runs.length ? p.runs.map(run) : [new D.TextRun('')],
    });
    // a photo in a box: a JPEG picture of the box's size (1 pt = 96/72 px in Word)
    const photoPara = (src, w, h) => {
      const bin = atob(String(src).split(',')[1] || ''), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { before: 0, after: 0, line: tw(h), lineRule: D.LineRuleType.EXACT },
        children: [new D.ImageRun({ type: 'jpg', data: bytes, transformation: { width: Math.round(w * 96 / 72), height: Math.round(h * 96 / 72) } })] });
    };
    const border = (k, wdt) => k === 'none' ? { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' }
      : { style: k === 'dotted' ? D.BorderStyle.DOTTED : D.BorderStyle.SINGLE, size: k === 'dotted' ? 12 : Math.max(2, Math.round(wdt * 8)), color: '000000' };
    const children = [];
    (doc.pages || [doc.blocks]).forEach((blocks, pi) => {
    // a new sheet for every page after the first (a 1-point paragraph that starts on a new page)
    if (pi) children.push(new D.Paragraph({ pageBreakBefore: true, spacing: { before: 0, after: 0, line: 20, lineRule: D.LineRuleType.EXACT }, children: [new D.TextRun({ text: '', size: 2 })] }));
    for (const b of blocks) {
      if (b.p) { children.push(para(b)); continue; }
      if (b.before >= 1) children.push(new D.Paragraph({ spacing: { before: 0, after: 0, line: tw(b.before), lineRule: D.LineRuleType.EXACT }, children: [new D.TextRun({ text: '', size: 2 })] }));
      const rows = b.rows.map(row => new D.TableRow({
        height: { value: tw(row._h), rule: D.HeightRule.EXACT }, cantSplit: true,
        children: row.cells.map(cell => {
          const pad = Object.assign({ l: 3, r: 3, t: 1, b: 1 }, cell.pad || {}); const sd = cell.sides || {};
          const w = b.cols.slice(cell._c, cell._c + (cell.span || 1)).reduce((a, c) => a + c, 0);
          return new D.TableCell({
            width: { size: tw(w), type: D.WidthType.DXA }, columnSpan: (cell.span || 1) > 1 ? cell.span : undefined,
            margins: { left: tw(pad.l), right: tw(pad.r), top: tw(pad.t), bottom: tw(pad.b) },
            verticalAlign: cell.valign === 'center' ? D.VerticalAlign.CENTER : cell.valign === 'bottom' ? D.VerticalAlign.BOTTOM : D.VerticalAlign.TOP,
            borders: { top: border(sd.t || 'single', b.border || 0.5), right: border(sd.r || 'single', b.border || 0.5), bottom: border(sd.b || 'single', b.border || 0.5), left: border(sd.l || 'single', b.border || 0.5) },
            children: cell.image ? [photoPara(cell.image, w - 2, row._h - 2)] : (cell.paras && cell.paras.length) ? cell.paras.map(para) : [new D.Paragraph('')],
          });
        }),
      }));
      children.push(new D.Table({
        rows, width: { size: tw(b.cols.reduce((a, c) => a + c, 0)), type: D.WidthType.DXA }, columnWidths: b.cols.map(tw),
        indent: { size: tw(b.indent || 0), type: D.WidthType.DXA }, layout: D.TableLayoutType.FIXED,
      }));
    }
    // Word needs a paragraph after a table: a 1-point one, so it never makes a second page
    });
    children.push(new D.Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: D.LineRuleType.EXACT }, children: [new D.TextRun({ text: '', size: 2 })] }));
    const m = doc.margin;
    const file = new D.Document({
      title: form.docTitle || form.name,
      styles: { default: { document: { run: { font: WORD.serif, size: 24 } } } },
      sections: [{ properties: { page: { size: { width: tw(doc.page.w), height: tw(doc.page.h) }, margin: { top: tw(m.top), right: tw(m.right), bottom: tw(Math.max(m.bottom, 0)), left: tw(m.left), header: 0, footer: 0 } } }, children }],
    });
    return D.Packer.toBlob(file);
  }

  // Helpers for form files
  const R = (text, size, o = {}) => ({ text: CF.util.clean(text), size, font: o.font || 'serif', b: !!o.b, i: !!o.i, u: o.u || null });
  const Para = (runs, o = {}) => Object.assign({ p: true, runs: [].concat(runs) }, o);

  // Largest size (down to min) at which a serif text fits a width — for short lines on the form (e.g. "Suit for ____")
  function fitSize(text, maxW, size, o = {}, min = 7) {
    const r = { size, b: !!o.b, i: !!o.i, font: 'serif' };
    while (r.size > min && measure(CF.util.clean(text), r) > maxW) r.size = Math.round((r.size - 0.5) * 2) / 2;
    return r.size;
  }

  // Split a paragraph after its first n lines at a width (text beside a box, then the full width below it)
  function splitLines(runs, width, n, o = {}) {
    const lines = wrapPara(Object.assign({ p: true, runs }, o), width);
    let words = lines.slice(0, n).reduce((a, l) => a + l.items.filter(i => i.k === 'w').length, 0);
    const first = [], rest = [];
    let into = first;
    for (const tk of tokens(runs)) {
      if (into === first && tk.k === 'w') { if (words <= 0) into = rest; else words--; }
      if (into === rest && !rest.length && tk.k === 'sp') continue;
      const last = into[into.length - 1];
      if (last && last.src === tk.r) last.text += tk.s; else into.push(Object.assign({}, tk.r, { text: tk.s, src: tk.r }));
    }
    const strip = a => a.map(r => { const c = Object.assign({}, r); delete c.src; return c; });
    return [strip(first), strip(rest), lines.length];
  }

  CF.flow = { layout, fit, docx, R, Para, LINE, fitSize, splitLines };
})();
