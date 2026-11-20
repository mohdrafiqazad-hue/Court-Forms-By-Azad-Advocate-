/* Form Nakal — Form for Copies (application for certified / uncertified copies),
   District Courts Jalandhar. Layout copied from the printed court form: do not change
   boxes, sizes or headings without the owner's printed format. */
(function () {
  'use strict';
  const { linesOf, P, clean, cellList } = window.CF.util;
  const HEAD = 10.5, DATA = 11, BIG = 15;

  const FIELDS = [
    { group: 'Top of form' },
    { key: 'copyType', label: 'Ordinary / Urgent', type: 'choice', options: [['', 'Leave both'], ['ordinary', 'Ordinary'], ['urgent', 'Urgent']], hint: 'The other one is struck out on the form' },
    { key: 'courtFee', label: 'Court Fee', type: 'text' },
    { key: 'delivery', label: 'In Person / By Registered Post', type: 'choice', options: [['', 'Leave both'], ['person', 'In Person'], ['registry', 'By Registered Post']], hint: 'The other one is struck out on the form' },
    { key: 'reqNo', label: 'No. (after “No.: 9”)', type: 'text' },
    { key: 'reqDate', label: 'Date', type: 'text', placeholder: 'DD.MM.YYYY', today: true },

    { group: 'Case particulars' },
    { key: 'nature', label: 'Nature of Case: Civil, Revenue, Criminal, Misc. or Appeal', type: 'area', rows: 3 },
    { key: 'plaintiff', label: 'Plaintiff or Complainant', type: 'area', rows: 2 },
    { key: 'defendant', label: 'Defendant or Accused / Respondent', type: 'area', rows: 2 },
    { key: 'claim', label: 'Nature of Claim / Value of Suit or Details of Offence', type: 'area', rows: 2 },
    { key: 'village', label: 'Village / City where Property is Situated, Cause Arose or Offence was Committed', type: 'area', rows: 1 },
    { key: 'court', label: 'Name of Presiding Officer & Court: Original or Appeal', type: 'area', rows: 2 },
    { key: 'decision', label: 'Date of Decision: Original or Appeal', type: 'area', rows: 2 },
    { key: 'purpose', label: 'Purpose for which Copy is Required', type: 'area', rows: 1 },
    { key: 'copies', label: 'Details of Copies Required', type: 'area', rows: 4 },
    { key: 'seal', label: 'Seal or Thumb Impression or Signature of Applicant', type: 'area', rows: 2 },

    { group: "Applicant's complete address" },
    { key: 'aName', label: "Applicant's Name", type: 'area', rows: 2 },
    { key: 'aFather', label: "Father's Name", type: 'text' },
    { key: 'aWork', label: 'Work', type: 'text' },
    { key: 'aProfession', label: 'Profession', type: 'area', rows: 3 },
    { key: 'aPO', label: 'Post Office', type: 'text' },
    { key: 'aPS', label: 'Police Station', type: 'text' },
    { key: 'aTehsil', label: 'Tehsil', type: 'text' },
    { key: 'aDistrict', label: 'District', type: 'text' },
    { key: 'aScribe', label: 'Signature of Scribe', type: 'text' },
  ];

  const SAMPLE = {
    copyType: '', courtFee: '', delivery: '', reqNo: '', reqDate: '12.11.2026',
    nature: 'Criminal (Misc.) - Domestic Violence Complaint\nCase No. COMA/102/2022',
    plaintiff: 'Rinki', defendant: 'Surinder Singh',
    claim: 'Complaint under the Protection of Women\nfrom Domestic Violence Act, 2005', village: '',
    court: 'Sh. Parteek Gupta, JMIC, Jalandhar\n(Original)',
    decision: 'Pending\nNext Date: 11.12.2026', purpose: 'For Record',
    copies: 'Uncertified copy of the complete court file, i.e. Petition, Affidavit, all Documents, all Orders of the Court and all Statements',
    seal: 'Through Counsel\nMohammad Rafiq Azad, Advocate',
    aName: 'Mohammad Rafiq Azad,\nAdvocate (Counsel)', aFather: '', aWork: 'Counsel',
    aProfession: 'Advocate,\nChamber No. 786 & 92,\nNew Court Complex,\nDistrict & Sessions Court,\nJalandhar',
    aPO: 'Jalandhar', aPS: '', aTehsil: 'Jalandhar', aDistrict: 'Jalandhar', aScribe: '',
  };

  function build(d) {
    const { cells, add } = cellList();
    const dat = k => linesOf(d[k]).map(t => P(t, DATA));

    // r0 — top boxes
    add(0, 0, 4, 1, [P('Ordinary', BIG, { bold: true, strike: d.copyType === 'urgent' }), P('Urgent', BIG, { bold: true, strike: d.copyType === 'ordinary' })]);
    add(4, 0, 3, 1, [P(d.courtFee || '', BIG, { bold: !d.courtFee }), P('Court Fee', BIG, { bold: true })]);
    add(7, 0, 3, 1, [P('In Person', BIG, { bold: true, strike: d.delivery === 'registry' }), P('By Registered Post', BIG, { bold: true, strike: d.delivery === 'person' })]);
    // r1 — request line
    const no = (d.reqNo || '').trim() ? clean(d.reqNo).trim() : '......................................';
    const dt = (d.reqDate || '').trim() ? clean(d.reqDate).trim() : '....................';
    add(0, 1, 10, 1, [
      P('Sir, the applicant requests that copy be supplied as per the particulars given in the table below, in accordance with the Rules.', DATA),
      P('No.: 9  ' + no + '  be supplied.                    Date: ' + dt, DATA),
    ], { gap: 2 });
    // r2-r3 — headings
    add(0, 2, 1, 2, [P('Nature of Case: Civil, Revenue, Criminal, Miscellaneous or Appeal', HEAD)], { rot: true });
    add(1, 2, 2, 1, [P('Parties', DATA)], { align: 'left', valign: 'top' });
    add(1, 3, 1, 1, [P('Plaintiff or Complainant', HEAD)], { rot: true, align: 'left', valign: 'top' });
    add(2, 3, 1, 1, [P('Defendant or Accused / Respondent', HEAD)], { rot: true, align: 'left', valign: 'top' });
    ['Nature of Claim / Value of Suit or Details of Offence',
      'Name of Village / City where Property is Situated or Cause Arose or Offence was Committed',
      'Name of Presiding Officer & Court: Original or Appeal', 'Date of Decision: Original or Appeal',
      'Purpose for which Copy is Required', 'Details of Copies Required', 'Seal or Thumb Impression or Signature of Applicant',
    ].forEach((h, i) => add(3 + i, 2, 1, 2, [P(h, HEAD)], { rot: true }));
    // r4 — particulars (rotated, like the headings)
    ['nature', 'plaintiff', 'defendant', 'claim', 'village', 'court', 'decision', 'purpose', 'copies', 'seal']
      .forEach((k, i) => add(i, 4, 1, 1, dat(k), { rot: true }));
    // r5 — address title
    add(0, 5, 10, 1, [P("Applicant's Complete Address", BIG, { bold: true })]);
    // r6 — address headings; r7 — address particulars (rotated)
    const ah = [["Applicant's", 'Name'], ["Father's", 'Name'], ['Work'], ['Profession'], ['Post', 'Office'], ['Police', 'Station'], ['Tehsil'], ['District'], ['Signature of', 'Scribe']];
    const acol = [0, 1, 2, 3, 5, 6, 7, 8, 9];
    ah.forEach((t, i) => add(acol[i], 6, acol[i] === 3 ? 2 : 1, 1, t.map(x => P(x, HEAD)), { valign: 'top' }));
    ['aName', 'aFather', 'aWork', 'aProfession', 'aPO', 'aPS', 'aTehsil', 'aDistrict', 'aScribe']
      .forEach((k, i) => add(acol[i], 7, acol[i] === 3 ? 2 : 1, 1, dat(k), { rot: true }));
    return cells;
  }

  function fileBase(d, orient) {
    const part = s => clean(s).split('\n')[0].replace(/[^A-Za-z0-9 ]+/g, ' ').trim().replace(/ +/g, '_');
    const pl = part(d.plaintiff), df = part(d.defendant);
    const cn = (clean(d.nature).match(/[A-Z]{2,}[\/\-][\w\/\-]+/) || [''])[0].replace(/[\/\-]/g, '_');
    const bits = ['Nakal_Form'];
    if (pl && df) bits.push(pl + '_vs_' + df); else if (pl || df) bits.push(pl || df);
    if (cn) bits.push(cn);
    if (orient === 'landscape') bits.push('Landscape');
    return bits.join('_').slice(0, 120);
  }

  window.CF.register({
    id: 'nakal',
    name: 'Form Nakal',
    desc: 'Application for certified / uncertified copies',
    court: 'District Courts, Jalandhar',
    docTitle: 'Form for Copies',
    page: { w: 612, h: 1008 },                       // Legal, 8.5" × 14" (points)
    title: { text: 'FORM FOR COPIES', size: 22, top: 100 },
    grid: { left: 420, top: 2820, cols: Array(10).fill(1140), rows: [886, 763, 634, 3700, 5587, 482, 814, 2563] },
    orientations: ['landscape', 'portrait'],
    defaultOrient: 'landscape',
    fields: FIELDS,
    sample: SAMPLE,
    sampleLabel: 'Rinki vs Surinder Singh',
    build,
    fileBase,
  });
})();
