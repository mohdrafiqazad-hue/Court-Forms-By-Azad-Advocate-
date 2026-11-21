/* Form Nakal — Form for Copies (application for certified / uncertified copies),
   District Courts Jalandhar. Layout copied from the printed court form: do not change
   boxes, sizes or headings without the owner's printed format. */
(function () {
  'use strict';
  const { linesOf, P, clean, cellList } = window.CF.util;
  const CT = window.CF.caseTypes;
  const HEAD = 10.5, DATA = 11, BIG = 15;

  const FIELDS = [
    { group: 'Top of form' },
    { key: 'copyType', label: 'Ordinary / Urgent', type: 'choice', options: [['', 'Leave both'], ['ordinary', 'Ordinary'], ['urgent', 'Urgent']], hint: 'The other one is struck out on the form' },
    { key: 'courtFee', label: 'Court Fee', type: 'text' },
    { key: 'delivery', label: 'In Person / By Registered Post', type: 'choice', options: [['', 'Leave both'], ['person', 'In Person'], ['registry', 'By Registered Post']], hint: 'The other one is struck out on the form' },
    { key: 'reqDate', label: 'Date', type: 'text', placeholder: 'DD.MM.YYYY', today: true },

    { group: 'Case particulars' },
    // optionsAsIs: the case types stay in English in every language (court list); the first option is translated
    { key: 'nature', label: 'Nature of Case: Civil, Revenue, Criminal, Misc. or Appeal', type: 'choice', optionsAsIs: true,
      options: [['', 'Select the type of case']].concat(CT.list.map(x => [x, x])), hint: 'Scroll and pick the type' },
    { key: 'caseNo', label: 'Case Number (optional)', type: 'text', placeholder: 'e.g. 102/2024',
      hint: 'Printed with the type, e.g. Case No. COMA/102/2024. Leave empty if there is none.' },
    { key: 'plaintiff', label: 'Plaintiff or Complainant', type: 'area', rows: 2 },
    { key: 'defendant', label: 'Defendant or Accused / Respondent', type: 'area', rows: 2 },
    { key: 'claim', label: 'Nature of Claim / Value of Suit or Details of Offence', type: 'area', rows: 2 },
    { key: 'village', label: 'Village / City where Property is Situated, Cause Arose or Offence was Committed', type: 'area', rows: 1 },
    { key: 'court', label: 'Name of Presiding Officer & Court: Original or Appeal', type: 'area', rows: 2 },
    { key: 'decision', label: 'Date of Decision: Original or Appeal', type: 'area', rows: 2 },
    // pick = a list to tap, plus "Other" to type it yourself; the chosen English word is printed
    { key: 'purpose', label: 'Purpose for which Copy is Required', type: 'pick', hint: 'Pick from the list, or choose Other and type it',
      options: [['', 'Select the purpose']].concat(['Record', 'Personal Record', 'Appeal', 'Revision', 'High Court', 'Bail', 'Execution', 'Evidence', 'Reference', 'Office Use'].map(x => [x, x])) },
    { key: 'copies', label: 'Details of Copies Required', type: 'area', rows: 4 },
    { key: 'seal', profile: true, label: 'Seal or Thumb Impression or Signature of Applicant', type: 'area', rows: 2 },

    { group: "Applicant's complete address" },
    { key: 'aName', profile: true, label: "Applicant's Name", type: 'area', rows: 2 },
    { key: 'aFather', profile: true, label: "Father's Name", type: 'text' },
    { key: 'aWork', profile: true, label: 'Work', type: 'text' },
    { key: 'aProfession', profile: true, label: 'Profession', type: 'area', rows: 3 },
    { key: 'aPO', profile: true, label: 'Post Office', type: 'text' },
    { key: 'aPS', profile: true, label: 'Police Station', type: 'text' },
    { key: 'aTehsil', profile: true, label: 'Tehsil', type: 'text' },
    { key: 'aDistrict', profile: true, label: 'District', type: 'text' },
    { key: 'aScribe', profile: true, label: 'Signature of Scribe', type: 'text' },
  ];




  // Field names in हिंदी / ਪੰਜਾਬੀ for the app screen only. The printed form stays in English.
  const TR = {
    hi: {
      'Form Nakal': 'फॉर्म नकल',
      'Application for certified / uncertified copies': 'प्रमाणित / अप्रमाणित नकल के लिए अर्ज़ी',
      'District Courts, Jalandhar': 'ज़िला अदालत, जालंधर',
      'Top of form': 'फॉर्म का ऊपरी हिस्सा',
      'Case particulars': 'केस का विवरण',
      "Applicant's complete address": 'आवेदक का पूरा पता',
      'Ordinary / Urgent': 'साधारण / अर्जेंट',
      'The other one is struck out on the form': 'दूसरा वाला फॉर्म पर काट दिया जाएगा',
      'Leave both': 'दोनों रहने दें',
      'Ordinary': 'साधारण (Ordinary)',
      'Urgent': 'अर्जेंट (Urgent)',
      'Court Fee': 'कोर्ट फीस',
      'In Person / By Registered Post': 'खुद / रजिस्टर्ड डाक से',
      'In Person': 'खुद (In Person)',
      'By Registered Post': 'रजिस्टर्ड डाक से (By Registered Post)',
      'Date': 'तारीख़',
      'Nature of Case: Civil, Revenue, Criminal, Misc. or Appeal': 'केस की किस्म: दीवानी, माल, फ़ौजदारी, विविध या अपील',
      'Select the type of case': 'केस की किस्म चुनें',
      'Scroll and pick the type': 'सूची में से केस की किस्म चुनें',
      'Case Number (optional)': 'केस नंबर (ज़रूरी नहीं)',
      'Printed with the type, e.g. Case No. COMA/102/2024. Leave empty if there is none.': 'किस्म के साथ छपेगा, जैसे Case No. COMA/102/2024. नंबर न हो तो खाली छोड़ दें।',
      'Select the purpose': 'मकसद चुनें', 'Pick from the list, or choose Other and type it': 'सूची में से चुनें, या “कोई और” चुनकर खुद लिखें',
      'Record': 'रिकॉर्ड', 'Personal Record': 'निजी रिकॉर्ड', 'Appeal': 'अपील', 'Revision': 'रिवीज़न (निगरानी)', 'High Court': 'हाई कोर्ट',
      'Bail': 'ज़मानत', 'Execution': 'इजराय (एग्ज़ीक्यूशन)', 'Evidence': 'सबूत (एविडेंस)', 'Reference': 'हवाला (रेफ़रेंस)', 'Office Use': 'दफ़्तरी इस्तेमाल',
      'Plaintiff or Complainant': 'वादी या शिकायतकर्ता',
      'Defendant or Accused / Respondent': 'प्रतिवादी या आरोपी / प्रत्यर्थी',
      'Nature of Claim / Value of Suit or Details of Offence': 'दावे की किस्म / दावे की कीमत या अपराध का विवरण',
      'Village / City where Property is Situated, Cause Arose or Offence was Committed': 'गाँव / शहर जहाँ जायदाद है, मामला बना या अपराध हुआ',
      'Name of Presiding Officer & Court: Original or Appeal': 'पीठासीन अधिकारी (जज) और अदालत का नाम: मूल या अपील',
      'Date of Decision: Original or Appeal': 'फ़ैसले की तारीख़: मूल या अपील',
      'Purpose for which Copy is Required': 'नकल किस काम के लिए चाहिए',
      'Details of Copies Required': 'कौन-सी नकलें चाहिए (विवरण)',
      'Seal or Thumb Impression or Signature of Applicant': 'आवेदक की मोहर, अंगूठा या हस्ताक्षर',
      "Applicant's Name": 'आवेदक का नाम',
      "Father's Name": 'पिता का नाम',
      'Work': 'काम',
      'Profession': 'पेशा',
      'Post Office': 'डाकघर',
      'Police Station': 'थाना',
      'Tehsil': 'तहसील',
      'District': 'ज़िला',
      'Signature of Scribe': 'लिखने वाले (मुंशी) के हस्ताक्षर',
    },
    pa: {
      'Form Nakal': 'ਫ਼ਾਰਮ ਨਕਲ',
      'Application for certified / uncertified copies': 'ਤਸਦੀਕਸ਼ੁਦਾ / ਗ਼ੈਰ-ਤਸਦੀਕਸ਼ੁਦਾ ਨਕਲ ਲਈ ਅਰਜ਼ੀ',
      'District Courts, Jalandhar': 'ਜ਼ਿਲ੍ਹਾ ਅਦਾਲਤ, ਜਲੰਧਰ',
      'Top of form': 'ਫ਼ਾਰਮ ਦਾ ਉੱਪਰਲਾ ਹਿੱਸਾ',
      'Case particulars': 'ਕੇਸ ਦਾ ਵੇਰਵਾ',
      "Applicant's complete address": 'ਬਿਨੈਕਾਰ ਦਾ ਪੂਰਾ ਪਤਾ',
      'Ordinary / Urgent': 'ਸਾਧਾਰਨ / ਜ਼ਰੂਰੀ',
      'The other one is struck out on the form': 'ਦੂਜਾ ਵਾਲਾ ਫ਼ਾਰਮ ਉੱਤੇ ਕੱਟ ਦਿੱਤਾ ਜਾਵੇਗਾ',
      'Leave both': 'ਦੋਵੇਂ ਰਹਿਣ ਦਿਓ',
      'Ordinary': 'ਸਾਧਾਰਨ (Ordinary)',
      'Urgent': 'ਜ਼ਰੂਰੀ (Urgent)',
      'Court Fee': 'ਕੋਰਟ ਫ਼ੀਸ',
      'In Person / By Registered Post': 'ਖ਼ੁਦ / ਰਜਿਸਟਰਡ ਡਾਕ ਰਾਹੀਂ',
      'In Person': 'ਖ਼ੁਦ (In Person)',
      'By Registered Post': 'ਰਜਿਸਟਰਡ ਡਾਕ ਰਾਹੀਂ (By Registered Post)',
      'Date': 'ਤਾਰੀਖ਼',
      'Nature of Case: Civil, Revenue, Criminal, Misc. or Appeal': 'ਕੇਸ ਦੀ ਕਿਸਮ: ਦੀਵਾਨੀ, ਮਾਲ, ਫ਼ੌਜਦਾਰੀ, ਫੁਟਕਲ ਜਾਂ ਅਪੀਲ',
      'Select the type of case': 'ਕੇਸ ਦੀ ਕਿਸਮ ਚੁਣੋ',
      'Scroll and pick the type': 'ਸੂਚੀ ਵਿੱਚੋਂ ਕੇਸ ਦੀ ਕਿਸਮ ਚੁਣੋ',
      'Case Number (optional)': 'ਕੇਸ ਨੰਬਰ (ਜ਼ਰੂਰੀ ਨਹੀਂ)',
      'Printed with the type, e.g. Case No. COMA/102/2024. Leave empty if there is none.': 'ਕਿਸਮ ਦੇ ਨਾਲ ਛਪੇਗਾ, ਜਿਵੇਂ Case No. COMA/102/2024. ਨੰਬਰ ਨਾ ਹੋਵੇ ਤਾਂ ਖਾਲੀ ਛੱਡ ਦਿਓ।',
      'Select the purpose': 'ਮਕਸਦ ਚੁਣੋ', 'Pick from the list, or choose Other and type it': 'ਸੂਚੀ ਵਿੱਚੋਂ ਚੁਣੋ, ਜਾਂ “ਹੋਰ” ਚੁਣ ਕੇ ਆਪ ਲਿਖੋ',
      'Record': 'ਰਿਕਾਰਡ', 'Personal Record': 'ਨਿੱਜੀ ਰਿਕਾਰਡ', 'Appeal': 'ਅਪੀਲ', 'Revision': 'ਰਿਵੀਜ਼ਨ (ਨਿਗਰਾਨੀ)', 'High Court': 'ਹਾਈ ਕੋਰਟ',
      'Bail': 'ਜ਼ਮਾਨਤ', 'Execution': 'ਇਜਰਾ (ਐਗਜ਼ੀਕਿਊਸ਼ਨ)', 'Evidence': 'ਸਬੂਤ (ਐਵੀਡੈਂਸ)', 'Reference': 'ਹਵਾਲਾ (ਰੈਫ਼ਰੈਂਸ)', 'Office Use': 'ਦਫ਼ਤਰੀ ਵਰਤੋਂ',
      'Plaintiff or Complainant': 'ਮੁੱਦਈ ਜਾਂ ਸ਼ਿਕਾਇਤਕਰਤਾ',
      'Defendant or Accused / Respondent': 'ਮੁੱਦਾਲਾ ਜਾਂ ਦੋਸ਼ੀ / ਜਵਾਬਦੇਹ',
      'Nature of Claim / Value of Suit or Details of Offence': 'ਦਾਅਵੇ ਦੀ ਕਿਸਮ / ਦਾਅਵੇ ਦੀ ਕੀਮਤ ਜਾਂ ਜੁਰਮ ਦਾ ਵੇਰਵਾ',
      'Village / City where Property is Situated, Cause Arose or Offence was Committed': 'ਪਿੰਡ / ਸ਼ਹਿਰ ਜਿੱਥੇ ਜਾਇਦਾਦ ਹੈ, ਮਾਮਲਾ ਬਣਿਆ ਜਾਂ ਜੁਰਮ ਹੋਇਆ',
      'Name of Presiding Officer & Court: Original or Appeal': 'ਪ੍ਰੀਜ਼ਾਈਡਿੰਗ ਅਫ਼ਸਰ (ਜੱਜ) ਅਤੇ ਅਦਾਲਤ ਦਾ ਨਾਮ: ਮੂਲ ਜਾਂ ਅਪੀਲ',
      'Date of Decision: Original or Appeal': 'ਫ਼ੈਸਲੇ ਦੀ ਤਾਰੀਖ਼: ਮੂਲ ਜਾਂ ਅਪੀਲ',
      'Purpose for which Copy is Required': 'ਨਕਲ ਕਿਸ ਕੰਮ ਲਈ ਚਾਹੀਦੀ ਹੈ',
      'Details of Copies Required': 'ਕਿਹੜੀਆਂ ਨਕਲਾਂ ਚਾਹੀਦੀਆਂ ਹਨ (ਵੇਰਵਾ)',
      'Seal or Thumb Impression or Signature of Applicant': 'ਬਿਨੈਕਾਰ ਦੀ ਮੋਹਰ, ਅੰਗੂਠਾ ਜਾਂ ਦਸਤਖ਼ਤ',
      "Applicant's Name": 'ਬਿਨੈਕਾਰ ਦਾ ਨਾਮ',
      "Father's Name": 'ਪਿਤਾ ਦਾ ਨਾਮ',
      'Work': 'ਕੰਮ',
      'Profession': 'ਪੇਸ਼ਾ',
      'Post Office': 'ਡਾਕਘਰ',
      'Police Station': 'ਥਾਣਾ',
      'Tehsil': 'ਤਹਿਸੀਲ',
      'District': 'ਜ਼ਿਲ੍ਹਾ',
      'Signature of Scribe': 'ਲਿਖਣ ਵਾਲੇ (ਮੁਨਸ਼ੀ) ਦੇ ਦਸਤਖ਼ਤ',
    },
  };

  function build(d) {
    const { cells, add } = cellList();
    const dat = k => linesOf(k === 'nature' ? natureText(d) : d[k]).map(t => P(t, DATA));

    // r0 — top boxes
    add(0, 0, 4, 1, [P('Ordinary', BIG, { bold: true, strike: d.copyType === 'urgent' }), P('Urgent', BIG, { bold: true, strike: d.copyType === 'ordinary' })]);
    add(4, 0, 3, 1, [P(d.courtFee || '', BIG, { bold: !d.courtFee }), P('Court Fee', BIG, { bold: true })]);
    add(7, 0, 3, 1, [P('In Person', BIG, { bold: true, strike: d.delivery === 'registry' }), P('By Registered Post', BIG, { bold: true, strike: d.delivery === 'person' })]);
    // r1 — request line
    const no = '......................................'; // left blank on the printed form, filled by hand
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

  // Case number: type code + number (COMA/55/2024); older free-text natures keep the number they contain
  const caseNumber = d => CT.number(d.nature, d.caseNo) || (clean(d.nature).match(/[A-Z]{2,}[\/\-][\w\/\-]+/) || [''])[0];
  // Nature of Case box: the chosen type, then "Case No. …" when a number is given
  function natureText(d) {
    const no = CT.number(d.nature, d.caseNo);
    return [clean(d.nature).trim(), no && 'Case No. ' + no].filter(Boolean).join('\n');
  }

  // Name shown in "My cases": parties and case number
  function caseTitle(d) {
    const first = s => clean(s).split('\n')[0].trim();
    const pl = first(d.plaintiff), df = first(d.defendant);
    const cn = caseNumber(d);
    let t = pl && df ? pl + ' vs ' + df : (pl || df);
    if (cn) t = t ? t + ' · ' + cn : cn;
    return t.slice(0, 120);
  }

  function fileBase(d, orient) {
    const part = s => clean(s).split('\n')[0].replace(/[^A-Za-z0-9 ]+/g, ' ').trim().replace(/ +/g, '_');
    const pl = part(d.plaintiff), df = part(d.defendant);
    const cn = caseNumber(d).replace(/[^A-Za-z0-9]+/g, '_');
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
    tr: TR,
    // Client book → a client's saved case fills these form fields (case keys: nature, plaintiff, defendant, claim, place, court, decision)
    clientCaseMap: { nature: 'nature', caseNo: 'caseNo', plaintiff: 'plaintiff', defendant: 'defendant', claim: 'claim', village: 'place', court: 'court', decision: 'decision' },
    // Client book: which form fields a saved client's own details fill (client keys: name, father, occupation, address, po, ps, tehsil, district)
    clientTargets: [
      { label: 'Plaintiff or Complainant', map: { plaintiff: 'name' } },
      { label: 'Defendant or Accused / Respondent', map: { defendant: 'name' } },
      { label: "Applicant's complete address", fromForm: true,
        map: { aName: 'name', aFather: 'father', aWork: 'occupation', aProfession: 'address', aPO: 'po', aPS: 'ps', aTehsil: 'tehsil', aDistrict: 'district' } },
    ],
    build,
    caseTitle,
    fileBase,
  });
})();
