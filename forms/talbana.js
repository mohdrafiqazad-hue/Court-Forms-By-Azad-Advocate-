/* Talbana (ਫ਼ਰਦ ਤਲਬਾਨਾ) — process fee form, District Courts Jalandhar.
   Copied from the owner's Word file: Legal page, margins, Nirmala UI headings, the 5-column table with
   1.5 pt lines, the counsel's signature on the right. Only the particulars are filled in. */
(function () {
  'use strict';
  const CF = window.CF, K = CF.formKit, { R, Para } = CF.flow;
  const S = 'sans';
  const L = CF.flow.LINE;

  const FIELDS = [
    { group: 'Court and case' },
    { key: 'court', label: 'Court Name', type: 'pick', optionsAsIs: true, hint: 'Pick from the list, or choose Other and type it',
      options: K.opts('Select the court', K.COURTS.map(c => 'IN THE COURT OF THE ' + c)) },
    { key: 'plaintiff', label: 'Plaintiff', type: 'text' },
    { key: 'defendant', label: 'Defendant', type: 'text' },
    { key: 'subject', label: 'Subject', type: 'pick', optionsAsIs: true, hint: 'Pick from the list, or choose Other and type it',
      options: K.opts('Select the subject', K.SUITS.map(s => 'Suit for ' + s)) },

    { group: 'Talbana (table)' },
    { key: 'tDate', label: 'Date of Talbana', type: 'text', placeholder: 'DD.MM.YYYY', today: true },
    { key: 'tBy', label: 'Filed by', type: 'pick', optionsAsIs: true, hint: 'Pick from the list, or choose Other and type it',
      options: K.opts('Select who files it', ["Plaintiff's", "Defendant's", "Petitioner's", "Respondent's", "Applicant's"]) },
    { key: 'tPurpose', label: 'Purpose', type: 'pick', optionsAsIs: true, hint: 'Pick from the list, or choose Other and type it',
      options: K.opts('Select the purpose', ['FOR THE SERVICE OF SUMMONS UPON DEFENDANT', 'FOR THE SERVICE OF NOTICE UPON RESPONDENT', 'FOR THE SERVICE OF NOTICE UPON DEFENDANT']) },
    { key: 'tCount', label: 'Number of Talbana', type: 'text' },
    { key: 'tFee', label: 'Court Fee', type: 'text', placeholder: 'e.g. RS. 25/-' },

    { group: 'Signature' },
    { key: 'party', label: 'Filed for', type: 'choice', hint: 'Printed under the signature', options: K.PARTY_OPTS },
  ].concat(K.ADVOCATE);

  const TR = K.withTR({
    hi: {
      'Talbana': 'तलबाना', 'Process fee form (Fard Talbana)': 'तलबाना फ़ॉर्म (फ़र्द तलबाना)',
      'Subject': 'विषय', 'Select the subject': 'विषय चुनें', 'Talbana (table)': 'तलबाना (टेबल)',
      'Date of Talbana': 'तलबाने की तारीख़', 'Filed by': 'किसने दाख़िल किया', 'Select who files it': 'चुनें किसने दाख़िल किया',
      'Purpose': 'किस मतलब के लिए', 'Select the purpose': 'मतलब चुनें', 'Number of Talbana': 'तलबाने की गिनती', 'Court Fee': 'कोर्ट फ़ीस',
    },
    pa: {
      'Talbana': 'ਤਲਬਾਨਾ', 'Process fee form (Fard Talbana)': 'ਤਲਬਾਨਾ ਫ਼ਾਰਮ (ਫ਼ਰਦ ਤਲਬਾਨਾ)',
      'Subject': 'ਵਿਸ਼ਾ', 'Select the subject': 'ਵਿਸ਼ਾ ਚੁਣੋ', 'Talbana (table)': 'ਤਲਬਾਨਾ (ਟੇਬਲ)',
      'Date of Talbana': 'ਮਿਤੀ ਤਲਬਾਨਾ', 'Filed by': 'ਕਿਸ ਨੇ ਦਾਖਲ ਕੀਤਾ', 'Select who files it': 'ਚੁਣੋ ਕਿਸ ਨੇ ਦਾਖਲ ਕੀਤਾ',
      'Purpose': 'ਕਿਸ ਮਤਲਬ ਲਈ ਦਾਖਲ ਕੀਤਾ', 'Select the purpose': 'ਮਤਲਬ ਚੁਣੋ', 'Number of Talbana': 'ਤਲਬਾਨੇ ਦੀ ਗਿਣਤੀ', 'Court Fee': 'ਕੋਰਟ ਫੀਸ',
    },
  });

  // Printed words in the three languages (the owner's form is Punjabi; English / Hindi translated — owner to check)
  const TXT = {
    title: { pa: 'ਫ਼ਰਦ ਤਲਬਾਨਾ', en: 'FARD TALBANA', hi: 'फ़र्द तलबाना' },
    h1: { pa: 'ਮਿਤੀ ਤਲਬਾਨਾ', en: 'Date of Talbana', hi: 'तलबाने की तारीख़' },
    h2: { pa: 'ਕਿਸ ਨੇ ਦਾਖਲ\nਕੀਤਾ', en: 'Filed by', hi: 'किसने दाख़िल\nकिया' },
    h3: { pa: 'ਕਿਸ ਮਤਲਬ\nਲਈ ਦਾਖਲ\nਕੀਤਾ', en: 'Purpose of\nfiling', hi: 'किस मतलब\nके लिए\nदाख़िल किया' },
    h4: { pa: 'ਤਲਬਾਨੇ ਦੀ\nਗਿਣਤੀ', en: 'Number of\nTalbana', hi: 'तलबाने की\nगिनती' },
    h5: { pa: 'ਕੋਰਟ ਫੀਸ', en: 'Court Fee', hi: 'कोर्ट फ़ीस' },
  };

  // Word: Legal page, margins top 800 / left 1100 / right 1620 twips; table 1768·2160·1751·1890·1890 twips
  function doc(d, lang, step) {
    const v = k => K.clean(d[k]).trim();
    const W = k => (lang in TXT[k] ? TXT[k][lang] : TXT[k].pa);
    const hs = lang === 'en' ? 12.5 : 13.5;            // table headings
    const party = v('party') || 'Plaintiff';
    const adv = v('advName').toUpperCase();
    const dbl = size => size * L.sans * 2;                    // the heading lines are double spaced
    const head = (label, value, size) => Para([R(label + '\t', 14, { font: S, b: 1 }), R(value, size, { font: S, b: 1, u: value ? 'single' : null })],
      { indL: 108, hang: 108, line: dbl(Math.max(14, value ? size : 14)) });
    const th = (text, o = {}) => Para([R(text, hs, { font: S })], Object.assign({ align: 'center', before: 3.65, line: 16.5 }, o));
    const td = (text, o = {}) => Para([R(text, 11, { font: S })], Object.assign({ align: 'center', before: 4.25, line: 11 * L.sans }, o));
    const foot = (text, size, o = {}) => Para([R(text, size, Object.assign({ font: 'serif' }, o))], { align: 'right', line: size * L.serif * 1.5 });
    const parties = [v('plaintiff'), v('defendant')];
    return {
      page: { w: 612, h: 1008 }, margin: { top: 40, left: 55, right: 81, bottom: 14 },
      blocks: [
        Para([R(W('title'), 24, { font: S, b: 1 })], { align: 'center', before: 3.65, line: 24 * L.sans * 1.5 }),
        head('COURT NAME:', v('court'), 16),
        head('CASE TITLE', parties[0] || parties[1] ? parties[0] + '       VS\t\t' + parties[1] : '', 14),
        head('SUBJECT: - ', v('subject'), 14),
        Para([R('', 11, { font: S })], { before: 7.25 }),
        {
          table: true, indent: 6.85, border: 1.5, cols: [88.4, 108, 87.55, 94.5, 94.5],
          rows: [
            { h: 47.7, cells: [
              { paras: [th(W('h1'), { align: 'left', indL: 3.25 })], pad: { l: 0, r: 0 } },
              { paras: [th(W('h2'), { before: 5.1, line: 14.5 })], pad: { l: 0, r: 0 } },
              { paras: [th(W('h3'), { align: 'left', indL: 5.4, before: 2, line: 14.5 })], pad: { l: 0, r: 0 } },
              { paras: [th(W('h4'))], pad: { l: 0, r: 0 } },
              { paras: [th(W('h5'))], pad: { l: 0, r: 0 } },
            ] },
            { h: 457 - step * 20, cells: [
              { paras: [td(v('tDate'))] },
              { paras: [td(v('tBy'), { align: 'left', indL: 10.7 })] },
              { paras: [td(v('tPurpose'), { before: 5.2 })], pad: { l: 4.6, r: 3 } },
              { paras: [td(v('tCount'))] },
              { paras: [td(v('tFee'))] },
            ] },
          ],
        },
        foot('', 14),
        foot(party, 14, { b: 1 }),
        foot('Counsel for the ' + party, 14),
        foot(adv ? adv + ', ADVOCATE' : '', 16, { b: 1 }),
        foot(v('advChamber'), 13.5, { b: 1, i: 1, u: 'single' }),
        foot(v('advMobile') ? 'M. ' + v('advMobile') : '', 13.5, { b: 1, i: 1, u: 'single' }),
      ],
    };
  }

  CF.register({
    id: 'talbana',
    name: 'Talbana',
    desc: 'Process fee form (Fard Talbana)',
    court: 'District Courts, Jalandhar',
    docTitle: 'Fard Talbana',
    flow: true, fitSteps: 6,
    page: { w: 612, h: 1008 },
    orientations: ['portrait'], defaultOrient: 'portrait',
    defaultLang: 'pa',                                 // the owner's form is in Punjabi; English and Hindi too
    fields: FIELDS,
    tr: TR,
    clientCaseMap: { plaintiff: 'plaintiff', defendant: 'defendant' },
    clientTargets: [{ label: 'Plaintiff', map: { plaintiff: 'name' } }, { label: 'Defendant', map: { defendant: 'name' } }],
    doc,
    caseTitle: K.caseTitle,
    fileBase: K.fileBase('Talbana'),
  });
})();
