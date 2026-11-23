/* List of Documents (ਫਿਹਿਰਸਤ ਦਸਤਾਵੇਜ, Order 7 Rule 14 & Order 13 Rule 1 CPC), District Courts Jalandhar.
   Copied from the owner's Word file: Legal page, margins, the Punjabi headings, dotted lines under the
   parties, the 7-column table with 1.5 pt lines, "Sr.# · Description of Documents", one row per document
   (at least 12 rows, as on the form) and the counsel's box at the bottom. Only the particulars are filled in.
   Many documents: the rows and text get smaller step by step so the list stays on one page. */
(function () {
  'use strict';
  const CF = window.CF, K = CF.formKit, { R, Para } = CF.flow;
  const S = 'sans', L = CF.flow.LINE;
  const MAX_DOCS = 30;

  const FIELDS = [
    { group: 'Court and case' },
    { key: 'court', label: 'Court Name', type: 'pick', optionsAsIs: true, hint: 'Pick from the list, or choose Other and type it',
      options: K.opts('Select the court', K.COURTS.map(c => 'IN THE COURT OF ' + c)) },
    { key: 'plaintiff', label: 'Plaintiff', type: 'text' },
    { key: 'defendant', label: 'Defendant', type: 'text' },
    { key: 'subject', label: 'Case (ਮੁਕਦੱਮਾ)', type: 'pick', optionsAsIs: true, hint: 'Pick from the list, or choose Other and type it',
      options: K.opts('Select the kind of suit', K.SUITS.map(s => 'Suit for ' + s)) },
    { key: 'hearing', label: 'Date of Hearing', type: 'text', placeholder: 'DD.MM.YYYY' },

    { group: 'Documents' },
    { key: 'docs', label: 'Description of Documents', type: 'area', rows: 10,
      hint: 'One document on each line — numbers 1, 2, 3… are added by themselves (up to 30)' },

    { group: 'Signature' },
    { key: 'party', label: 'Filed for', type: 'choice', hint: 'Printed under the signature', options: K.PARTY_OPTS },
    K.ADVOCATE[0],
  ];

  const TR = K.withTR({
    hi: {
      'List of Documents': 'दस्तावेज़ों की सूची', 'Fehrist Dastavez (Order 7 Rule 14 & Order 13 Rule 1 CPC)': 'फ़ेहरिस्त दस्तावेज़ (ऑर्डर 7 रूल 14 व ऑर्डर 13 रूल 1 CPC)',
      'Case (ਮੁਕਦੱਮਾ)': 'मुक़दमा', 'Documents': 'दस्तावेज़', 'Description of Documents': 'दस्तावेज़ों का विवरण',
      'One document on each line — numbers 1, 2, 3… are added by themselves (up to 30)': 'हर लाइन में एक दस्तावेज़ लिखें — नंबर 1, 2, 3… अपने आप लगेंगे (30 तक)',
    },
    pa: {
      'List of Documents': 'ਫਿਹਿਰਸਤ ਦਸਤਾਵੇਜ', 'Fehrist Dastavez (Order 7 Rule 14 & Order 13 Rule 1 CPC)': 'ਫਿਹਿਰਸਤ ਦਸਤਾਵੇਜ (ਆਰਡਰ 7 ਰੂਲ 14 ਤੇ ਆਰਡਰ 13 ਰੂਲ 1)',
      'Case (ਮੁਕਦੱਮਾ)': 'ਮੁਕਦੱਮਾ', 'Documents': 'ਦਸਤਾਵੇਜ਼', 'Description of Documents': 'ਦਸਤਾਵੇਜ਼ਾਂ ਦਾ ਵੇਰਵਾ',
      'One document on each line — numbers 1, 2, 3… are added by themselves (up to 30)': 'ਹਰ ਲਾਈਨ ਵਿੱਚ ਇੱਕ ਦਸਤਾਵੇਜ਼ ਲਿਖੋ — ਨੰਬਰ 1, 2, 3… ਆਪਣੇ ਆਪ ਲੱਗਣਗੇ (30 ਤੱਕ)',
    },
  });

  const docsOf = d => K.clean(d.docs).split('\n').map(s => s.replace(/^\s*\d+\s*[.)]\s*/, '').trim()).filter(Boolean).slice(0, MAX_DOCS);

  // Word: Legal page, margins top 1080 / left 980 / right 540 twips; table 537·449·1973·1772·1704·2277·1528 twips
  function doc(d, lang, step) {
    const v = k => K.clean(d[k]).trim();
    const party = (v('party') || 'Plaintiff').toUpperCase();
    const docs = docsOf(d);
    const size = [14, 13, 12, 11, 10.5, 10, 9.5][step] || 9;   // document text: 14 pt as on the form, smaller only when needed
    const rowH = [16.5, 16, 15, 14, 13, 12.5, 12][step] || 12;
    const lineH = size * L.serif * ([1.15, 1.1, 1.05, 1, 1, 1, 1][step] || 1);   // 1.15 line spacing as on the form
    const hd = (lines, o = {}) => lines.map((t, i) => Para([R(t, 13.5, { font: S, b: 1 })], Object.assign({ align: 'center', line: 13.5 * 1.25 }, i ? {} : o)));
    const dot = { t: 'none', l: 'none', r: 'none', b: 'dotted' }, none = { t: 'none', l: 'none', r: 'none', b: 'none' };
    const rows = [];
    const docRow = (i, t) => ({ h: rowH, cells: [
      { paras: [Para([R(t ? (i + 1) + '.' : '', size, { b: 1 })], { align: 'center', line: lineH })], pad: { l: 0, r: 0, t: 1.5, b: 1.5 } },
      { span: 6, paras: [Para([R(t, size, { b: 1 })], { indL: 12.1, line: lineH })], pad: { l: 0, r: 3, t: 1.5, b: 1.5 } },
    ] });
    docs.forEach((t, i) => rows.push(docRow(i, t)));
    // at least 3 blank rows as on the form; more blank rows fill the page down to the counsel's box
    for (let i = 0; i < (step ? 1 : 3); i++) rows.push(docRow(0, ''));
    return {
      page: { w: 612, h: 1008 }, margin: { top: 40, left: 49, right: 27, bottom: 14 },
      blocks: [
        Para([R('ਫਿਹਿਰਸਤ  ਦਸਤਾਵੇਜ', 24, { font: S, b: 1 })], { align: 'center', line: 30 }),
        Para([R('ਮੁਜਬ ਆਰਡਰ 7 ਰੂਲ 14 ਤੇ ਆਰਡਰ 13 ਰੂਲ ਜਾਬਤਾ ਦੀਵਾਨੀ', 16, { font: S, b: 1 })], { align: 'center', before: 8, line: 16 * L.sans * 1.6 }),
        Para([R('ਅਦਾਲਤ ', 16, { font: S }), R(v('court'), 16, { b: 1, u: v('court') ? 'single' : null })], { align: 'center', line: 16 * L.serif * 2 }),
        // parties over two dotted lines, "ਬਨਾਮ" between them
        { table: true, indent: 30, cols: [206.7, 46, 202], border: 0.5, rows: [{ h: 24, cells: [
          { paras: [Para([R(v('plaintiff'), 14, { font: S, b: 1 })], { align: 'center', line: 14 * L.sans })], sides: dot, valign: 'bottom', pad: { l: 0, r: 0, t: 0, b: 1 } },
          { paras: [Para([R('ਬਨਾਮ', 13, { font: S, b: 1 })], { align: 'center', line: 13 * L.sans })], sides: none, valign: 'bottom', pad: { l: 0, r: 0, t: 0, b: 1 } },
          { paras: [Para([R(v('defendant'), 14, { font: S, b: 1 })], { align: 'center', line: 14 * L.sans })], sides: dot, valign: 'bottom', pad: { l: 0, r: 0, t: 0, b: 1 } },
        ] }] },
        Para([R('ਮੁਕਦੱਮਾ ', 14, { font: S, b: 1 }), R(v('subject') ? v('subject') + '  ' : '\t\t', 14, { font: S, b: 1, u: v('subject') ? 'single' : null }),
          R(' ਤਰੀਕ ਪੇਸ਼ੀ: ', 14, { font: S, b: 1 }), R(v('hearing'), 14, { font: S, b: 1 })], { before: 4, line: 14 * L.sans * 1.15 }),
        Para([R('ਫਿਹਿਰਸਤ ਮੁਦਲਖਾ', 10.5, { font: S, b: 1 })], { align: 'center', before: 6, line: 10.5 * L.sans * 1.15, after: 3 }),
        {
          table: true, indent: 2.85, border: 1.5, cols: [26.85, 22.45, 98.65, 88.6, 85.2, 113.85, 76.4],
          fillTo: 905, fillRow: docRow(0, ''),
          rows: [
            { h: 78.35, cells: [
              { span: 2, paras: hd(['ਨੰਬਰ']), valign: 'center', pad: { l: 0, r: 0 } },
              { paras: hd(['ਦਸਤਾਵੇਜ਼ਾ ਦਾ', 'ਵੇਰਵਾ ਤੇ ਲਿਖਣ', 'ਦੀ ਤਰੀਕ']), valign: 'center', pad: { l: 0, r: 0 } },
              { paras: hd(['ਦਸਤਾਵੇਜ਼ ਕੀ', 'ਸਿੱਧ ਕਰਦੀਆਂ', 'ਹਨ']), valign: 'center', pad: { l: 0, r: 0 } },
              { paras: hd(['ਜੇ ਦਸਤਾਵੇਜ਼', 'ਮਿਸਲ ਤੇ ਰੱਖੀ', 'ਤਾਂ ਉਸ ਉੱਤੇ', 'ਕੀ ਨੰਬਰ', 'ਪਾਇਆ ਗਿਆ']), valign: 'center', pad: { l: 0, r: 0 } },
              { paras: hd(['ਜੇ ਦਸਤਾਵੇਜ਼', 'ਵਾਪਿਸ ਕੀਤੀ', 'ਗਈ ਤਾਂ ਦੂਜੀ', 'ਪਾਰਟੀ ਵਕੀਲ ਨੂੰ', 'ਵਾਪਿਸ ਹੋਇਆ']), valign: 'center', pad: { l: 0, r: 0 } },
              { paras: hd(['ਵੇਰਵਾ']), valign: 'center', pad: { l: 0, r: 0 } },
            ] },
            { h: 5.25, cells: [{ span: 7, paras: [], pad: { l: 0, r: 0, t: 0, b: 0 } }] },
            { h: 31.35, cells: [
              { paras: [Para([R('Sr.', 12, { font: S, b: 1 }), R('\n#', 12, { font: S, b: 1 })], { align: 'center', line: 12.65 })], valign: 'center', pad: { l: 0, r: 0, t: 0, b: 0 } },
              { span: 6, paras: [Para([R('   Description of Documents', 18, { font: S, b: 1 })], { indL: 2.2, line: 18 * L.sans })], valign: 'center', pad: { l: 0, r: 0, t: 0, b: 0 } },
            ] },
          ].concat(rows, [
            { h: 141.15 - step * 12, cells: [{ span: 7, pad: { l: 0, r: 14, t: 0, b: 0 }, paras: [
              Para([R(party, 10.5, { font: S, b: 1 }), R('\nTHROUGH COUNSEL', 10.5, { font: S, b: 1 })], { align: 'right', before: 13.45, line: 10.5 * 1.25 }),
              Para([R('', 6)], { line: 10 }),
              Para([R(v('advName').toUpperCase(), 18, { b: 1 })], { align: 'right', line: 18 * L.serif * 1.5 }),
              Para([R(v('advName') ? 'ADVOCATE' : '', 18, { b: 1 })], { align: 'right', line: 18 * L.serif * 1.5 }),
            ] }] },
          ]),
        },
      ],
    };
  }

  CF.register({
    id: 'listdocs',
    name: 'List of Documents',
    desc: 'Fehrist Dastavez (Order 7 Rule 14 & Order 13 Rule 1 CPC)',
    court: 'District Courts, Jalandhar',
    docTitle: 'List of Documents',
    flow: true, fitSteps: 7,
    page: { w: 612, h: 1008 },
    orientations: ['portrait'], defaultOrient: 'portrait',
    printLangs: ['pa'],
    fields: FIELDS,
    tr: TR,
    clientCaseMap: { plaintiff: 'plaintiff', defendant: 'defendant' },
    clientTargets: [{ label: 'Plaintiff', map: { plaintiff: 'name' } }, { label: 'Defendant', map: { defendant: 'name' } }],
    doc,
    caseTitle: K.caseTitle,
    fileBase: K.fileBase('List_of_Documents'),
  });
})();
