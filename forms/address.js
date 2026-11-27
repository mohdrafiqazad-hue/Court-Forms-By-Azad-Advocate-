/* Address Form — District Courts Jalandhar. Copied from the owner's PDF: Times 12 pt, left margin 1.5",
   "ADDRESS FORM" in bold italics, the lines for court, parties, suit and date of hearing, the 7-column
   address table, the request to the court and the signature. Positions measured from the owner's file
   (text width 469 pt kept); printed on a Legal page. Only the particulars are filled in. */
(function () {
  'use strict';
  const CF = window.CF, K = CF.formKit, { R, Para, fitSize } = CF.flow;
  const T = 12, VAL = 10;                            // form text 12 pt; filled particulars 10 pt bold on the lines

  const FIELDS = [
    { group: 'Court and case' },
    { key: 'court', label: 'Court Name', type: 'pick', optionsAsIs: true, hint: 'Pick from the list, or choose Other and type it',
      options: K.opts('Select the court', K.COURTS.map(c => 'THE ' + c)) },
    { key: 'plaintiff', label: 'Plaintiff', type: 'text' },
    { key: 'defendant', label: 'Defendant', type: 'text' },
    { key: 'suitFor', label: 'Suit for', type: 'pick', optionsAsIs: true, hint: 'Pick from the list, or choose Other and type it',
      options: K.opts('Select the kind of suit', K.SUITS) },
    { key: 'hearing', label: 'Date of Hearing', type: 'text', placeholder: 'DD.MM.YYYY' },

    { group: 'Address (table)' },
    { key: 'adName', label: "Name with Father's Name", type: 'area', rows: 3 },
    { key: 'adCaste', label: 'Caste', type: 'text' },
    { key: 'adResident', label: 'Resident of', type: 'area', rows: 3 },
    { key: 'adPO', label: 'Post Office', type: 'text' },
    { key: 'adTehsil', label: 'Tehsil', type: 'text' },
    { key: 'adDistt', label: 'Distt.', type: 'text' },
    { key: 'adRemarks', label: 'Remarks', type: 'area', rows: 4 },

    { group: 'Signature' },
    { key: 'signName', label: 'Name under the signature', type: 'text' },
    { key: 'party', label: 'Filed for', type: 'choice', hint: 'Printed under the signature', options: K.PARTY_OPTS },
    { key: 'topHead', label: 'Heading at the top: "Important Forms / Address Form"', type: 'choice', setting: true,
      options: [['', 'Print it (as on the form)'], ['no', 'Do not print it']] },
  ].concat(K.ADVOCATE);

  const TR = K.withTR({
    hi: {
      'Address Form': 'पते का फ़ॉर्म', 'Address of the party for summons and notices': 'समन और नोटिस के लिए पक्ष का पता',
      'Suit for': 'दावा किस बारे में', 'Address (table)': 'पता (टेबल)', "Name with Father's Name": 'नाम और पिता का नाम', 'Caste': 'जाति',
      'Resident of': 'निवासी', 'Post Office': 'डाकघर', 'Tehsil': 'तहसील', 'Distt.': 'ज़िला', 'Remarks': 'टिप्पणी',
      'Name under the signature': 'हस्ताक्षर के नीचे नाम',
      'Heading at the top: "Important Forms / Address Form"': 'सबसे ऊपर की लाइन: "Important Forms / Address Form"',
      'Print it (as on the form)': 'छापें (जैसे फ़ॉर्म पर है)', 'Do not print it': 'न छापें',
    },
    pa: {
      'Address Form': 'ਪਤੇ ਦਾ ਫ਼ਾਰਮ', 'Address of the party for summons and notices': 'ਸੰਮਨ ਅਤੇ ਨੋਟਿਸ ਲਈ ਧਿਰ ਦਾ ਪਤਾ',
      'Suit for': 'ਦਾਅਵਾ ਕਿਸ ਬਾਰੇ', 'Address (table)': 'ਪਤਾ (ਟੇਬਲ)', "Name with Father's Name": 'ਨਾਮ ਅਤੇ ਪਿਤਾ ਦਾ ਨਾਮ', 'Caste': 'ਜਾਤ',
      'Resident of': 'ਵਸਨੀਕ', 'Post Office': 'ਡਾਕਘਰ', 'Tehsil': 'ਤਹਿਸੀਲ', 'Distt.': 'ਜ਼ਿਲ੍ਹਾ', 'Remarks': 'ਟਿੱਪਣੀ',
      'Name under the signature': 'ਦਸਤਖ਼ਤ ਦੇ ਹੇਠਾਂ ਨਾਮ',
      'Heading at the top: "Important Forms / Address Form"': 'ਸਭ ਤੋਂ ਉੱਪਰ ਦੀ ਲਾਈਨ: "Important Forms / Address Form"',
      'Print it (as on the form)': 'ਛਾਪੋ (ਜਿਵੇਂ ਫ਼ਾਰਮ ’ਤੇ ਹੈ)', 'Do not print it': 'ਨਾ ਛਾਪੋ',
    },
  });

  // A label and a line to write on: the filled value sits on the line in bold
  const NB = { t: 'none', l: 'none', r: 'none', b: 'none' }, LINE_ = { t: 'none', l: 'none', r: 'none', b: 'single' };
  const lab = (text, o = {}) => ({ paras: [Para([R(text, T)], Object.assign({ line: 14 }, o))], sides: NB, valign: 'bottom', pad: { l: 0, r: 0, t: 0, b: 0 } });
  const val = (text, w) => ({ paras: [Para([R(text, fitSize(text, w - 2, VAL, { b: 1 }), { b: 1 })], { align: 'center', line: 12 })], sides: LINE_, valign: 'bottom', pad: { l: 1, r: 1, t: 0, b: 0.5 } });
  const lineRow = (before, indent, cells) => ({ table: true, before, indent, border: 0.6, cols: cells.map(c => c[0]), rows: [{ h: 14, cells: cells.map(c => c[1]) }] });

  // Printed words in the three languages (the owner's form is English; Punjabi / Hindi translated — owner to check)
  const TXT = {
    imp: { en: 'Important Forms', pa: 'ਜ਼ਰੂਰੀ ਫ਼ਾਰਮ', hi: 'ज़रूरी फ़ॉर्म' },
    addr: { en: 'Address Form', pa: 'ਪਤੇ ਦਾ ਫ਼ਾਰਮ', hi: 'पते का फ़ॉर्म' },
    title: { en: 'ADDRESS FORM', pa: 'ਪਤੇ ਦਾ ਫ਼ਾਰਮ', hi: 'पते का फ़ॉर्म' },
    court: { en: 'IN THE COURT OF ', pa: 'ਅਦਾਲਤ ', hi: 'अदालत ' },
    versus: { en: 'Versus', pa: 'ਬਨਾਮ', hi: 'बनाम' },
    suit: { en: 'Suit', pa: 'ਦਾਅਵਾ', hi: 'दावा' },
    for: { en: 'for ', pa: 'ਬਾਬਤ ', hi: 'बाबत ' },
    hearing: { en: 'Date of Hearing: ', pa: 'ਤਰੀਕ ਪੇਸ਼ੀ: ', hi: 'तारीख़ पेशी: ' },
    asUnder: { en: 'The address of Plaintiff / Defendant / Applicant is as under:', pa: 'ਮੁੱਦਈ / ਮੁਦਾਲਾ / ਬਿਨੈਕਾਰ ਦਾ ਪਤਾ ਹੇਠ ਲਿਖੇ ਅਨੁਸਾਰ ਹੈ:', hi: 'वादी / प्रतिवादी / आवेदक का पता नीचे लिखे अनुसार है:' },
    c1: { en: ['Name with', 'Father’s', 'Name'], pa: ['ਨਾਮ ਤੇ', 'ਪਿਤਾ ਦਾ', 'ਨਾਮ'], hi: ['नाम व', 'पिता का', 'नाम'] },
    c2: { en: ['Caste'], pa: ['ਜਾਤ'], hi: ['जाति'] },
    c3: { en: ['Resident of'], pa: ['ਵਸਨੀਕ'], hi: ['निवासी'] },
    c4: { en: ['Post', 'Office'], pa: ['ਡਾਕਘਰ'], hi: ['डाकघर'] },
    c5: { en: ['Tehsil'], pa: ['ਤਹਿਸੀਲ'], hi: ['तहसील'] },
    c6: { en: ['Distt.'], pa: ['ਜ਼ਿਲ੍ਹਾ'], hi: ['ज़िला'] },
    c7: { en: ['Remarks'], pa: ['ਕੈਫ਼ੀਅਤ'], hi: ['कैफ़ियत'] },
    sir: { en: 'Sir,', pa: 'ਸ੍ਰੀਮਾਨ ਜੀ,', hi: 'श्रीमान जी,' },
    p1: { en: 'All the summons, notices orders etc. in connection with the above suit be sent to me at the address given above.',
      pa: 'ਉਪਰੋਕਤ ਦਾਅਵੇ ਸਬੰਧੀ ਸਾਰੇ ਸੰਮਨ, ਨੋਟਿਸ, ਹੁਕਮ ਆਦਿ ਮੈਨੂੰ ਉੱਪਰ ਦਿੱਤੇ ਪਤੇ ’ਤੇ ਭੇਜੇ ਜਾਣ।',
      hi: 'उपरोक्त दावे से संबंधित सभी समन, नोटिस, आदेश आदि मुझे ऊपर दिए गए पते पर भेजे जाएँ।' },
    p2: { en: 'In case of any change in address the same shall be communicated you with full particulars and details.',
      pa: 'ਪਤਾ ਬਦਲਣ ਦੀ ਸੂਰਤ ਵਿੱਚ ਪੂਰੇ ਵੇਰਵਿਆਂ ਸਮੇਤ ਆਪ ਜੀ ਨੂੰ ਸੂਚਿਤ ਕਰ ਦਿੱਤਾ ਜਾਵੇਗਾ।',
      hi: 'पता बदलने की सूरत में पूरे विवरण सहित आपको सूचित कर दिया जाएगा।' },
    sign: { en: '(Signature)', pa: '(ਦਸਤਖ਼ਤ)', hi: '(हस्ताक्षर)' },
  };

  function doc(d, lang = 'en') {
    const v = k => K.clean(d[k]).trim();
    const W = k => (lang in TXT[k] ? TXT[k][lang] : TXT[k].en);
    const en = lang === 'en';
    const top = v('topHead') !== 'no';
    const head = (k, before) => Para([R(top ? W(k) : '', T, { b: 1, u: 'single' })], { align: 'center', before, line: 14 });
    const cellPad = { l: 5.45, r: 3, t: 1, b: 1 }, bodyPad = { l: 2.2, r: 2, t: 10, b: 2 };
    const th = k => ({ paras: [Para([R(W(k).join('\n'), T)], { line: 14.2 })], pad: cellPad });
    const td = k => ({ paras: [Para([R(v(k), 9)], { line: 10.5 })], pad: bodyPad });
    const party = v('party') || 'Plaintiff';
    const sign = [v('signName'), v('signName') ? '(' + K.partyIn(party, lang) + ')' : ''].filter(Boolean).join(' ');
    // "Suit for ____": two words at the places of the English form; Punjabi / Hindi words take one wider space
    const suitCells = en ? [[36, lab(W('suit'))], [17, lab(W('for'))], [84, val(v('suitFor'), 84)]]
      : [[62, lab(W('suit') + ' ' + W('for'))], [75, val(v('suitFor'), 75)]];
    // The advocate (printed on the right, opposite the signature, when filled)
    const adv = v('advName'), any = adv || v('advChamber') || v('advMobile');
    const right = (text, size, o = {}) => Para([R(text, size, o)], { align: 'right', line: Math.max(14, size * 1.2) });
    const counsel = any ? [right('Counsel for the ' + party, T), right(adv ? adv.toUpperCase() + ', ADVOCATE' : '', T, { b: 1 }),
      ...(v('advChamber') ? [right(v('advChamber'), 11, { b: 1, i: 1, u: 'single' })] : []),
      ...(v('advMobile') ? [right('M. ' + v('advMobile'), 11, { b: 1, i: 1, u: 'single' })] : [])] : [];
    const NB0 = { t: 'none', l: 'none', r: 'none', b: 'none' };
    return {
      page: { w: 612, h: 1008 }, margin: { top: 30, left: 108, right: 35, bottom: 14 },
      blocks: [
        head('imp', 6.5),
        head('addr', 14.35),
        Para([R(W('title'), 22, { b: 1, i: en })], { before: en ? 26.9 : 22, line: 26 }),
        lineRow(10.55, 0, [[111, lab(W('court'))], [234, val(v('court'), 234)]]),
        lineRow(7.2, 108, [[234, val(v('plaintiff'), 234)]]),
        Para([R(W('versus'), T)], { indL: 180, before: 8.75, line: 14 }),
        lineRow(5.65, 108, [[234, val(v('defendant'), 234)]]),
        lineRow(7.2, 0, suitCells.concat([[79.1, lab('')], [83.4, lab(W('hearing'))], [60, val(v('hearing'), 60)]])),
        Para([R(W('asUnder'), T)], { before: 8.75, line: 14 }),
        {
          table: true, before: 6.8, indent: 6.65, border: 0.5, cols: [67.4, 46.3, 74.3, 60, 68.8, 50.4, 75.9],
          rows: [
            { h: 42.5, cells: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'].map(th) },
            { h: 382.1, cells: ['adName', 'adCaste', 'adResident', 'adPO', 'adTehsil', 'adDistt', 'adRemarks'].map(td) },
          ],
        },
        Para([R(W('sir'), T)], { before: 18, line: 21.2 }),
        Para([R(W('p1'), T)], { align: 'both', first: 36, line: 21.2 }),
        Para([R(W('p2'), T)], { align: 'both', first: 36, line: 21.2 }),
        // signature on the left; the advocate on the right
        { table: true, before: 24.7, indent: 0, border: 0.5, cols: [200, 269], rows: [{ h: 24, cells: [
          { sides: NB0, pad: { l: 0, r: 0, t: 0, b: 0 }, paras: [Para([R(W('sign'), T)], { line: 14 }), Para([R(sign, 9, { b: 1 })], { line: 10 })] },
          { sides: NB0, pad: { l: 0, r: 0, t: 0, b: 0 }, paras: counsel.length ? counsel : [Para([R('', T)], { line: 14 })] },
        ] }] },
      ],
    };
  }

  CF.register({
    id: 'address',
    name: 'Address Form',
    desc: 'Address of the party for summons and notices',
    court: 'District Courts, Jalandhar',
    docTitle: 'Address Form',
    flow: true,
    page: { w: 612, h: 1008 },
    orientations: ['portrait'], defaultOrient: 'portrait',
    defaultLang: 'en',                                 // the owner's form is in English; Punjabi and Hindi too
    fields: FIELDS,
    tr: TR,
    clientCaseMap: { plaintiff: 'plaintiff', defendant: 'defendant' },
    aadhaarTargets: [{ group: 'Address (table)', label: 'Address (table)', map: { adName: 'nameFather', adResident: 'addressLocal', adPO: 'po', adTehsil: 'tehsil', adDistt: 'district', signName: 'name' } }],
    clientTargets: [
      { label: 'Plaintiff', map: { plaintiff: 'name' } },
      { label: 'Defendant', map: { defendant: 'name' } },
      { label: 'Address (table)', fromForm: true, map: { adName: 'name', adResident: 'address', adPO: 'po', adTehsil: 'tehsil', adDistt: 'district', signName: 'name' } },
    ],
    doc,
    caseTitle: K.caseTitle,
    fileBase: K.fileBase('Address_Form'),
  });
})();
