/* Bail Bonds — Bail Bond, Surety Bond (with the photo box and the Witness / Surety table), Affidavit of
   the surety (Jama Bandi) and the Bail Bond again: 4 Legal pages, as in the owner's Word file
   (Times New Roman, margins 1" left and 0.83" elsewhere, 1.5 line spacing, the same sizes).
   Only the particulars are filled in; each page stays on its own sheet, and a page with too much
   text gets smaller text by itself (that page only). Printed in English, Punjabi or Hindi
   (Punjabi / Hindi translated by Claude — owner to check). */
(function () {
  'use strict';
  const CF = window.CF, K = CF.formKit, { R, Para, splitLines, fitSize } = CF.flow;

  const REL = [['', 'son of'], ['daughter of', 'daughter of'], ['wife of', 'wife of']];
  const FIELDS = [
    { group: 'Court and FIR' },
    { key: 'judgeName', label: "Judge's name", type: 'text', placeholder: 'e.g. SH. A. K. SHARMA' },
    { key: 'judgeDesig', label: 'Court (designation)', type: 'pick', optionsAsIs: true, hint: 'Pick from the list, or choose Other and type it',
      options: K.opts('Select the court', ['CHIEF JUDICIAL MAGISTRATE, JALANDHAR', 'ADDITIONAL CHIEF JUDICIAL MAGISTRATE, JALANDHAR',
        'JUDICIAL MAGISTRATE FIRST CLASS, JALANDHAR', 'SESSIONS JUDGE, JALANDHAR', 'ADDITIONAL SESSIONS JUDGE, JALANDHAR']) },
    { key: 'state', label: 'Complainant', type: 'pick', optionsAsIs: true, hint: 'Pick from the list, or choose Other and type it', options: [['', 'State of Punjab']] },
    { key: 'firNo', label: 'FIR No.', type: 'text', placeholder: 'e.g. 78' },
    { key: 'firDate', label: 'FIR date', type: 'text', placeholder: 'DD.MM.YYYY' },
    { key: 'ps', label: 'Police Station', type: 'text', placeholder: 'e.g. Phillaur' },
    { key: 'psDistrict', label: 'District (of the police station)', type: 'pick', optionsAsIs: true, hint: 'Pick from the list, or choose Other and type it',
      options: K.opts('Select the district', ['District Jalandhar (Rural)', 'Commissionerate Jalandhar']) },
    { key: 'sections', label: 'Sections and Act', type: 'text', placeholder: 'e.g. Under Section 22 of NDPS Act, 1985' },

    { group: 'Accused (Bail Bond)' },
    { key: 'accName', label: "Accused's name", type: 'text' },
    { key: 'accRel', label: 'Relation', type: 'choice', options: REL },
    { key: 'accFather', label: "Father's / husband's name", type: 'text', placeholder: 'e.g. Sh. Ram Lal' },
    { key: 'accAge', label: 'Age (years)', type: 'text' },
    { key: 'accAddress', label: 'Resident of (full address)', type: 'area', rows: 2 },
    { key: 'amount', label: 'Bond amount', type: 'text', placeholder: 'e.g. Rs. 50,000/-' },
    { key: 'bondDate', label: 'Date of the bonds', type: 'text', placeholder: 'DD.MM.YYYY', today: true },

    { group: 'Surety' },
    { key: 'surName', label: "Surety's name", type: 'text' },
    { key: 'surRel', label: 'Relation', type: 'choice', options: REL },
    { key: 'surFather', label: "Father's / husband's name", type: 'text' },
    { key: 'surAge', label: 'Age (years)', type: 'text' },
    { key: 'surAddress', label: 'Resident of (full address)', type: 'area', rows: 2 },
    { key: 'surMobile', label: 'Mobile', type: 'text' },
    { key: 'surAadhaar', label: 'Aadhaar No.', type: 'text' },
    { key: 'surDob', label: 'Date of birth', type: 'text', placeholder: 'DD.MM.YYYY' },

    { group: 'Witness' },
    { key: 'witName', label: "Witness's name", type: 'text' },
    { key: 'witRel', label: 'Relation', type: 'choice', options: REL },
    { key: 'witFather', label: "Father's / husband's name", type: 'text' },
    { key: 'witAddress', label: 'Resident of (full address)', type: 'area', rows: 2 },
    { key: 'witMobile', label: 'Mobile', type: 'text' },
    { key: 'witAadhaar', label: 'Aadhaar No.', type: 'text' },
    { key: 'witDob', label: 'Date of birth', type: 'text', placeholder: 'DD.MM.YYYY' },

    { group: 'Affidavit of the surety (Jama Bandi)' },
    { key: 'jbAmount', label: 'Value of the Jama Bandi', type: 'text', placeholder: 'e.g. 2,00,000/-' },
    { key: 'jbLand', label: 'Land (and share)', type: 'text', placeholder: 'e.g. Land 3.3 Marle (Share 1/48)' },
    { key: 'jbDetails', label: 'Details of the land', type: 'area', rows: 3,
      placeholder: 'Khewat No. …, out of total Rakba …\nSituated at Village …, Tehsil …\nDistt. … (Jama Bandi for the year …)', hint: 'Each line prints as a line' },
    { key: 'verDate', label: 'Date of verification', type: 'text', placeholder: 'DD.MM.YYYY', today: true },
    { key: 'verPlace', label: 'Place of verification', type: 'text', placeholder: 'e.g. Jalandhar' },
    { key: 'copies', label: 'Bail Bond pages', type: 'choice', setting: true,
      options: [['', 'Two — first and last page, as in the file'], ['1', 'One — first page only']] },
  ].concat(K.ADVOCATE);

  const TR = K.withTR({
    hi: {
      'Bail Bonds': 'ज़मानत बांड', 'State of Punjab': 'पंजाब राज्य', 'Bail Bond, Surety Bond and Affidavit of the surety (4 pages)': 'ज़मानत बांड, ज़मानतदार बांड और ज़मानतदार का शपथ पत्र (4 पेज)',
      'Court and FIR': 'अदालत और एफ.आई.आर.', "Judge's name": 'जज का नाम', 'Court (designation)': 'अदालत (पद)',
      'Complainant': 'शिकायतकर्ता', 'FIR No.': 'एफ.आई.आर. नं.', 'FIR date': 'एफ.आई.आर. की तारीख़', 'Police Station': 'थाना',
      'District (of the police station)': 'ज़िला (थाने का)', 'Select the district': 'ज़िला चुनें', 'Sections and Act': 'धाराएँ और एक्ट',
      'Accused (Bail Bond)': 'अभियुक्त (ज़मानत बांड)', "Accused's name": 'अभियुक्त का नाम', 'Relation': 'रिश्ता',
      'son of': 'पुत्र', 'daughter of': 'पुत्री', 'wife of': 'पत्नी', "Father's / husband's name": 'पिता / पति का नाम',
      'Age (years)': 'उम्र (साल)', 'Resident of (full address)': 'निवासी (पूरा पता)', 'Bond amount': 'बांड की रकम', 'Date of the bonds': 'बांड की तारीख़',
      'Surety': 'ज़मानतदार', "Surety's name": 'ज़मानतदार का नाम', 'Aadhaar No.': 'आधार नं.', 'Date of birth': 'जन्म तिथि',
      'Witness': 'गवाह', "Witness's name": 'गवाह का नाम',
      'Affidavit of the surety (Jama Bandi)': 'ज़मानतदार का शपथ पत्र (जमाबंदी)', 'Value of the Jama Bandi': 'जमाबंदी की क़ीमत',
      'Land (and share)': 'ज़मीन (और हिस्सा)', 'Details of the land': 'ज़मीन का विवरण', 'Each line prints as a line': 'हर लाइन वैसे ही छपेगी',
      'Date of verification': 'सत्यापन की तारीख़', 'Place of verification': 'सत्यापन की जगह',
      'Bail Bond pages': 'ज़मानत बांड के पेज', 'Two — first and last page, as in the file': 'दो — पहला और आख़िरी पेज, जैसे फ़ाइल में है', 'One — first page only': 'एक — सिर्फ़ पहला पेज',
    },
    pa: {
      'Bail Bonds': 'ਜ਼ਮਾਨਤ ਬਾਂਡ', 'State of Punjab': 'ਪੰਜਾਬ ਰਾਜ', 'Bail Bond, Surety Bond and Affidavit of the surety (4 pages)': 'ਜ਼ਮਾਨਤ ਬਾਂਡ, ਜ਼ਾਮਨੀ ਬਾਂਡ ਅਤੇ ਜ਼ਾਮਨ ਦਾ ਹਲਫ਼ਨਾਮਾ (4 ਪੇਜ)',
      'Court and FIR': 'ਅਦਾਲਤ ਅਤੇ ਐਫ.ਆਈ.ਆਰ.', "Judge's name": 'ਜੱਜ ਦਾ ਨਾਮ', 'Court (designation)': 'ਅਦਾਲਤ (ਅਹੁਦਾ)',
      'Complainant': 'ਸ਼ਿਕਾਇਤਕਰਤਾ', 'FIR No.': 'ਐਫ.ਆਈ.ਆਰ. ਨੰ.', 'FIR date': 'ਐਫ.ਆਈ.ਆਰ. ਦੀ ਤਰੀਕ', 'Police Station': 'ਥਾਣਾ',
      'District (of the police station)': 'ਜ਼ਿਲ੍ਹਾ (ਥਾਣੇ ਦਾ)', 'Select the district': 'ਜ਼ਿਲ੍ਹਾ ਚੁਣੋ', 'Sections and Act': 'ਧਾਰਾਵਾਂ ਅਤੇ ਐਕਟ',
      'Accused (Bail Bond)': 'ਦੋਸ਼ੀ (ਜ਼ਮਾਨਤ ਬਾਂਡ)', "Accused's name": 'ਦੋਸ਼ੀ ਦਾ ਨਾਮ', 'Relation': 'ਰਿਸ਼ਤਾ',
      'son of': 'ਪੁੱਤਰ', 'daughter of': 'ਪੁੱਤਰੀ', 'wife of': 'ਪਤਨੀ', "Father's / husband's name": 'ਪਿਤਾ / ਪਤੀ ਦਾ ਨਾਮ',
      'Age (years)': 'ਉਮਰ (ਸਾਲ)', 'Resident of (full address)': 'ਵਾਸੀ (ਪੂਰਾ ਪਤਾ)', 'Bond amount': 'ਬਾਂਡ ਦੀ ਰਕਮ', 'Date of the bonds': 'ਬਾਂਡ ਦੀ ਤਰੀਕ',
      'Surety': 'ਜ਼ਾਮਨ', "Surety's name": 'ਜ਼ਾਮਨ ਦਾ ਨਾਮ', 'Aadhaar No.': 'ਆਧਾਰ ਨੰ.', 'Date of birth': 'ਜਨਮ ਮਿਤੀ',
      'Witness': 'ਗਵਾਹ', "Witness's name": 'ਗਵਾਹ ਦਾ ਨਾਮ',
      'Affidavit of the surety (Jama Bandi)': 'ਜ਼ਾਮਨ ਦਾ ਹਲਫ਼ਨਾਮਾ (ਜਮ੍ਹਾਂਬੰਦੀ)', 'Value of the Jama Bandi': 'ਜਮ੍ਹਾਂਬੰਦੀ ਦੀ ਕੀਮਤ',
      'Land (and share)': 'ਜ਼ਮੀਨ (ਅਤੇ ਹਿੱਸਾ)', 'Details of the land': 'ਜ਼ਮੀਨ ਦਾ ਵੇਰਵਾ', 'Each line prints as a line': 'ਹਰ ਲਾਈਨ ਉਸੇ ਤਰ੍ਹਾਂ ਛਪੇਗੀ',
      'Date of verification': 'ਤਸਦੀਕ ਦੀ ਤਰੀਕ', 'Place of verification': 'ਤਸਦੀਕ ਦੀ ਥਾਂ',
      'Bail Bond pages': 'ਜ਼ਮਾਨਤ ਬਾਂਡ ਦੇ ਪੇਜ', 'Two — first and last page, as in the file': 'ਦੋ — ਪਹਿਲਾ ਅਤੇ ਆਖ਼ਰੀ ਪੇਜ, ਜਿਵੇਂ ਫ਼ਾਈਲ ਵਿੱਚ ਹੈ', 'One — first page only': 'ਇੱਕ — ਸਿਰਫ਼ ਪਹਿਲਾ ਪੇਜ',
    },
  });

  // ------------------------------------------------------------ printed words (en = the owner's file)
  // g(m, f): the word for a man / a woman (Punjabi and Hindi verbs change with it)
  const TXT = {
    court: { en: 'IN THE COURT OF ', pa: 'ਅਦਾਲਤ ', hi: 'न्यायालय ' },
    state: { en: 'State of Punjab', pa: 'ਪੰਜਾਬ ਰਾਜ', hi: 'पंजाब राज्य' },
    versus: { en: 'Versus', pa: 'ਬਨਾਮ', hi: 'बनाम' },
    fir: { en: (n, d) => `FIR No. ${n} dated ${d},`, pa: (n, d) => `ਐਫ.ਆਈ.ਆਰ. ਨੰ. ${n} ਮਿਤੀ ${d},`, hi: (n, d) => `एफ.आई.आर. नं. ${n} दिनांक ${d},` },
    ps: { en: 'P.S. ', pa: 'ਥਾਣਾ ', hi: 'थाना ' },
    bail: { en: 'BAIL BOND', pa: 'ਜ਼ਮਾਨਤ ਬਾਂਡ', hi: 'ज़मानत बांड' },
    bnss: { en: '(Under Sections 478, 480, 483, 485, 486 of BNSS, 2023)', pa: '(ਬੀ.ਐਨ.ਐਸ.ਐਸ., 2023 ਦੀਆਂ ਧਾਰਾਵਾਂ 478, 480, 483, 485, 486 ਅਧੀਨ)', hi: '(बी.एन.एस.एस., 2023 की धाराएँ 478, 480, 483, 485, 486 के अंतर्गत)' },
    I: { en: 'I, ', pa: 'ਮੈਂ, ', hi: 'मैं, ' },
    bailBody: {
      en: () => [', having been arrested/detained by the Officer-in-Charge of the said Police Station in the above-mentioned case, and being required to give security for my appearance before this Court, do hereby bind myself to attend this Court on each and every date of hearing. In the event that this case is transferred to any other Court, I undertake to appear before that Court as well. In case of any default on my part, I shall forfeit to the Government the sum of ', ''],
      pa: g => [`, ਜਿਸ ਨੂੰ ਉਪਰੋਕਤ ਮੁਕੱਦਮੇ ਵਿੱਚ ਉਕਤ ਥਾਣੇ ਦੇ ਮੁਖੀ ਵੱਲੋਂ ਗ੍ਰਿਫ਼ਤਾਰ/ਹਿਰਾਸਤ ਵਿੱਚ ਲਿਆ ਗਿਆ ਹੈ ਅਤੇ ਜਿਸ ਤੋਂ ਇਸ ਅਦਾਲਤ ਵਿੱਚ ਹਾਜ਼ਰੀ ਲਈ ਜ਼ਮਾਨਤ ਮੰਗੀ ਗਈ ਹੈ, ਪਾਬੰਦ ${g('ਹੁੰਦਾ', 'ਹੁੰਦੀ')} ਹਾਂ ਕਿ ਹਰ ਪੇਸ਼ੀ ’ਤੇ ਇਸ ਅਦਾਲਤ ਵਿੱਚ ਹਾਜ਼ਰ ${g('ਹੋਵਾਂਗਾ', 'ਹੋਵਾਂਗੀ')}। ਜੇ ਇਹ ਮੁਕੱਦਮਾ ਕਿਸੇ ਹੋਰ ਅਦਾਲਤ ਵਿੱਚ ਬਦਲ ਜਾਂਦਾ ਹੈ ਤਾਂ ਉਸ ਅਦਾਲਤ ਵਿੱਚ ਵੀ ਹਾਜ਼ਰ ${g('ਹੋਵਾਂਗਾ', 'ਹੋਵਾਂਗੀ')}। ਮੇਰੇ ਵੱਲੋਂ ਕੋਈ ਕੁਤਾਹੀ ਹੋਣ ਦੀ ਸੂਰਤ ਵਿੱਚ ਮੈਂ ਸਰਕਾਰ ਨੂੰ ਰਕਮ `, ` ਜ਼ਬਤ ${g('ਕਰਾਵਾਂਗਾ', 'ਕਰਾਵਾਂਗੀ')}।`],
      hi: g => [`, जिसे उपरोक्त मुक़दमे में उक्त थाने के प्रभारी अधिकारी द्वारा गिरफ़्तार/हिरासत में लिया गया है और जिससे इस न्यायालय के समक्ष हाज़िरी के लिए ज़मानत माँगी गई है, एतद्द्वारा स्वयं को पाबंद ${g('करता', 'करती')} हूँ कि हर पेशी पर इस न्यायालय में हाज़िर ${g('होऊँगा', 'होऊँगी')}। यदि यह मुक़दमा किसी अन्य न्यायालय में स्थानांतरित होता है तो उस न्यायालय में भी हाज़िर ${g('होऊँगा', 'होऊँगी')}। मेरी ओर से किसी चूक की स्थिति में मैं सरकार को `, ` की राशि ज़ब्त ${g('कराऊँगा', 'कराऊँगी')}।`],
    },
    dated: { en: 'Dated: ', pa: 'ਮਿਤੀ: ', hi: 'दिनांक: ' },
    accused: { en: 'Accused', pa: 'ਦੋਸ਼ੀ', hi: 'अभियुक्त' },
    surety: { en: 'SURETY BOND', pa: 'ਜ਼ਾਮਨੀ ਬਾਂਡ', hi: 'ज़मानतदार बांड' },
    // surety text: [before the accused's name, after it up to the amount, after the amount] ; s = surety's g, a = accused's g
    suretyBody: {
      en: (s, a) => [', Surety of the above-named accused ', `, do hereby declare myself as surety for the above-named accused and bind myself to ensure ${a('his', 'her')} appearance before the Court in the above-mentioned case on every date of hearing. I further undertake that in case the said case is transferred to any other Court, the accused will appear before that Court as well. In the event of any default on the part of the accused, I hereby bind myself to forfeit to the Court the sum of `, ' Date '],
      pa: (s, a) => [', ਉਪਰੋਕਤ ਦੋਸ਼ੀ ', ` ਦਾ ਜ਼ਾਮਨ, ਆਪਣੇ ਆਪ ਨੂੰ ਉਪਰੋਕਤ ਦੋਸ਼ੀ ਦਾ ਜ਼ਾਮਨ ਘੋਸ਼ਿਤ ${s('ਕਰਦਾ', 'ਕਰਦੀ')} ਹਾਂ ਅਤੇ ਪਾਬੰਦ ${s('ਹੁੰਦਾ', 'ਹੁੰਦੀ')} ਹਾਂ ਕਿ ਦੋਸ਼ੀ ਉਪਰੋਕਤ ਮੁਕੱਦਮੇ ਵਿੱਚ ਹਰ ਪੇਸ਼ੀ ’ਤੇ ਅਦਾਲਤ ਵਿੱਚ ਹਾਜ਼ਰ ${a('ਹੋਵੇਗਾ', 'ਹੋਵੇਗੀ')}। ਜੇ ਇਹ ਮੁਕੱਦਮਾ ਕਿਸੇ ਹੋਰ ਅਦਾਲਤ ਵਿੱਚ ਬਦਲ ਜਾਂਦਾ ਹੈ ਤਾਂ ਦੋਸ਼ੀ ਉਸ ਅਦਾਲਤ ਵਿੱਚ ਵੀ ਹਾਜ਼ਰ ${a('ਹੋਵੇਗਾ', 'ਹੋਵੇਗੀ')}। ਦੋਸ਼ੀ ਵੱਲੋਂ ਕੋਈ ਕੁਤਾਹੀ ਹੋਣ ਦੀ ਸੂਰਤ ਵਿੱਚ ਮੈਂ ਅਦਾਲਤ ਨੂੰ ਰਕਮ `, ` ਜ਼ਬਤ ਕਰਾਉਣ ਦਾ ਪਾਬੰਦ ਹਾਂ। ਮਿਤੀ `],
      hi: (s, a) => [', उपरोक्त अभियुक्त ', ` का ज़मानतदार, एतद्द्वारा स्वयं को उपरोक्त अभियुक्त का ज़मानतदार घोषित ${s('करता', 'करती')} हूँ और पाबंद ${s('होता', 'होती')} हूँ कि अभियुक्त उपरोक्त मुक़दमे में हर पेशी पर न्यायालय में हाज़िर ${a('होगा', 'होगी')}। यदि यह मुक़दमा किसी अन्य न्यायालय में स्थानांतरित होता है तो अभियुक्त उस न्यायालय में भी हाज़िर ${a('होगा', 'होगी')}। अभियुक्त की ओर से किसी चूक की स्थिति में मैं न्यायालय को `, ` की राशि ज़ब्त कराने का पाबंद हूँ। दिनांक `],
    },
    witness: { en: 'Witness', pa: 'ਗਵਾਹ', hi: 'गवाह' },
    suretyH: { en: 'Surety', pa: 'ਜ਼ਾਮਨ', hi: 'ज़मानतदार' },
    name: { en: 'Name: ', pa: 'ਨਾਮ: ', hi: 'नाम: ' },
    ro: { en: 'R/o: ', pa: 'ਵਾਸੀ: ', hi: 'निवासी: ' },
    mob: { en: 'M. ', pa: 'ਮੋ. ', hi: 'मो. ' },
    aadhaar: { en: 'Aadhaar No.: ', pa: 'ਆਧਾਰ ਨੰ.: ', hi: 'आधार नं.: ' },
    dob: { en: 'DOB: ', pa: 'ਜਨਮ ਮਿਤੀ: ', hi: 'जन्म तिथि: ' },
    sign: { en: 'Signature: ', pa: 'ਦਸਤਖ਼ਤ: ', hi: 'हस्ताक्षर: ' },
    affidavit: { en: 'AFFIDAVIT', pa: 'ਹਲਫ਼ਨਾਮਾ', hi: 'शपथ पत्र' },
    affIntro: { en: () => ', do hereby solemnly affirm and declare as under:', pa: s => `, ਸੱਚੇ ਦਿਲੋਂ ਹਲਫ਼ ਉਠਾ ਕੇ ਹੇਠ ਲਿਖੇ ਅਨੁਸਾਰ ਬਿਆਨ ${s('ਕਰਦਾ', 'ਕਰਦੀ')} ਹਾਂ:`, hi: s => `, सत्यनिष्ठा से शपथ लेकर निम्नलिखित घोषणा ${s('करता', 'करती')} हूँ:` },
    a1: { en: () => ['That I, the deponent, am the Surety of the accused ', ', and have stood surety for the said accused in the aforementioned case.'],
      pa: s => [`ਇਹ ਕਿ ਮੈਂ, ਹਲਫ਼ੀਆ ਬਿਆਨ ਦੇਣ ${s('ਵਾਲਾ', 'ਵਾਲੀ')}, ਦੋਸ਼ੀ `, ' ਦਾ ਜ਼ਾਮਨ ਹਾਂ ਅਤੇ ਉਪਰੋਕਤ ਮੁਕੱਦਮੇ ਵਿੱਚ ਉਕਤ ਦੋਸ਼ੀ ਦੀ ਜ਼ਮਾਨਤ ਦਿੱਤੀ ਹੈ।'],
      hi: () => ['यह कि मैं, अभिसाक्षी, अभियुक्त ', ' का ज़मानतदार हूँ और उपरोक्त मुक़दमे में उक्त अभियुक्त की ज़मानत दी है।'] },
    a2: { en: () => ['That I, the deponent, am furnishing a ', 'Jama Bandi of Rs. ', '', ' as surety in the present case.'],
      pa: s => [`ਇਹ ਕਿ ਮੈਂ, ਹਲਫ਼ੀਆ ਬਿਆਨ ਦੇਣ ${s('ਵਾਲਾ', 'ਵਾਲੀ')}, ਇਸ ਮੁਕੱਦਮੇ ਵਿੱਚ ਜ਼ਮਾਨਤ ਵਜੋਂ `, 'ਰੁਪਏ ', ' ਦੀ ਜਮ੍ਹਾਂਬੰਦੀ', ` ਪੇਸ਼ ਕਰ ${s('ਰਿਹਾ', 'ਰਹੀ')} ਹਾਂ।`],
      hi: s => ['यह कि मैं, अभिसाक्षी, इस मुक़दमे में ज़मानत के रूप में ', 'रु. ', ' की जमाबंदी', ` प्रस्तुत कर ${s('रहा', 'रही')} हूँ।`] },
    jbHead: { en: 'Details of Jama Bandi', pa: 'ਜਮ੍ਹਾਂਬੰਦੀ ਦਾ ਵੇਰਵਾ', hi: 'जमाबंदी का विवरण' },
    total: { en: 'Total Value', pa: 'ਕੁੱਲ ਕੀਮਤ', hi: 'कुल मूल्य' },
    a3: { en: "That the said Fard Jama Bandi stands in my name, and the same is being deposited before this Hon'ble Court as surety security.",
      pa: 'ਇਹ ਕਿ ਉਕਤ ਫ਼ਰਦ ਜਮ੍ਹਾਂਬੰਦੀ ਮੇਰੇ ਨਾਮ ’ਤੇ ਹੈ ਅਤੇ ਇਹ ਮਾਣਯੋਗ ਅਦਾਲਤ ਵਿੱਚ ਜ਼ਮਾਨਤ ਵਜੋਂ ਜਮ੍ਹਾਂ ਕਰਵਾਈ ਜਾ ਰਹੀ ਹੈ।',
      hi: 'यह कि उक्त फ़र्द जमाबंदी मेरे नाम पर है और यह माननीय न्यायालय में ज़मानत के रूप में जमा कराई जा रही है।' },
    a4: { en: 'That I have not previously stood surety for any other person on the basis of the said Fard Jama Bandi in any Court of law.',
      pa: 'ਇਹ ਕਿ ਮੈਂ ਪਹਿਲਾਂ ਕਿਸੇ ਵੀ ਅਦਾਲਤ ਵਿੱਚ ਉਕਤ ਫ਼ਰਦ ਜਮ੍ਹਾਂਬੰਦੀ ਦੇ ਆਧਾਰ ’ਤੇ ਕਿਸੇ ਹੋਰ ਵਿਅਕਤੀ ਦੀ ਜ਼ਮਾਨਤ ਨਹੀਂ ਦਿੱਤੀ।',
      hi: 'यह कि मैंने पहले किसी भी न्यायालय में उक्त फ़र्द जमाबंदी के आधार पर किसी अन्य व्यक्ति की ज़मानत नहीं दी है।' },
    a5: { en: 'That the contents of this affidavit are true and correct to the best of my knowledge and belief.',
      pa: 'ਇਹ ਕਿ ਇਸ ਹਲਫ਼ਨਾਮੇ ਦੀਆਂ ਗੱਲਾਂ ਮੇਰੀ ਜਾਣਕਾਰੀ ਅਤੇ ਯਕੀਨ ਅਨੁਸਾਰ ਸੱਚ ਅਤੇ ਸਹੀ ਹਨ।',
      hi: 'यह कि इस शपथ पत्र की बातें मेरी जानकारी और विश्वास के अनुसार सत्य और सही हैं।' },
    deponent: { en: 'Deponent', pa: 'ਬਿਆਨਕਰਤਾ', hi: 'अभिसाक्षी' },
    verif: { en: 'VERIFICATION:', pa: 'ਤਸਦੀਕ:', hi: 'सत्यापन:' },
    ver: { en: p => ['Verified on this ', ` at ${p} that the contents of my above-said affidavit are true and correct to the best of my knowledge and belief, and that nothing material has been concealed therein.`],
      pa: p => ['ਤਸਦੀਕ ਕੀਤਾ ਗਿਆ ਕਿ ਅੱਜ ', ` ਨੂੰ ${p} ਵਿਖੇ ਮੇਰੇ ਉਪਰੋਕਤ ਹਲਫ਼ਨਾਮੇ ਦੀਆਂ ਗੱਲਾਂ ਮੇਰੀ ਜਾਣਕਾਰੀ ਅਤੇ ਯਕੀਨ ਅਨੁਸਾਰ ਸੱਚ ਅਤੇ ਸਹੀ ਹਨ ਅਤੇ ਇਸ ਵਿੱਚ ਕੋਈ ਜ਼ਰੂਰੀ ਗੱਲ ਛੁਪਾਈ ਨਹੀਂ ਗਈ।`],
      hi: p => ['सत्यापित किया गया कि आज ', ` को ${p} में मेरे उपरोक्त शपथ पत्र की बातें मेरी जानकारी और विश्वास के अनुसार सत्य और सही हैं और इसमें कोई महत्वपूर्ण बात छिपाई नहीं गई है।`] },
    advocate: { en: 'ADVOCATE', pa: 'ਐਡਵੋਕੇਟ', hi: 'एडवोकेट' },
    // a person: name, relation, father, age, address (accused: "…wife of Sh. …, aged about … years, resident of …";
    // surety as in the file: "… aged about … years Son of … Resident of …")
    rel: { en: { '': 'son of', 'daughter of': 'daughter of', 'wife of': 'wife of' }, pa: { '': 'ਪੁੱਤਰ', 'daughter of': 'ਪੁੱਤਰੀ', 'wife of': 'ਪਤਨੀ' }, hi: { '': 'पुत्र', 'daughter of': 'पुत्री', 'wife of': 'पत्नी' } },
    age: { en: a => `aged about ${a} years`, pa: a => `ਉਮਰ ਕਰੀਬ ${a} ਸਾਲ`, hi: a => `उम्र लगभग ${a} वर्ष` },
    res: { en: 'resident of ', pa: 'ਵਾਸੀ ', hi: 'निवासी ' },
  };
  const BLANK = '____________';
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  // ------------------------------------------------------------ the pages
  // Word: Legal, margins top / right / bottom 1200, left 1440 twips; 1.5 line spacing; Times New Roman
  function doc(d, lang = 'en', steps = [0, 0, 0, 0]) {
    const v = k => K.clean(d[k]).replace(/\s*\n\s*/g, ' ').trim();
    const b = k => v(k) || BLANK;                                     // a particular inside a sentence
    const W = k => (lang in TXT[k] ? TXT[k][lang] : TXT[k].en);
    const gOf = rel => (m, f) => (rel === 'daughter of' || rel === 'wife of' ? f : m);
    const ga = gOf(v('accRel')), gs = gOf(v('surRel'));
    const relW = k => W('rel')[v(k)] || W('rel')[''];
    const person = (p, style) => {                                    // the bold description of a person
      const name = b(p + 'Name'), father = b(p + 'Father'), age = W('age')(b(p + 'Age')), addr = b(p + 'Address');
      if (lang !== 'en') return `${name} ${relW(p + 'Rel')} ${father}, ${age}, ${W('res')}${addr}`;
      return style === 'surety' ? `${name} ${age} ${cap(relW(p + 'Rel'))} ${father} ${cap(W('res'))}${addr}`
        : `${name} ${relW(p + 'Rel')} ${father}, ${age}, ${W('res')}${addr}`;
    };
    const court = W('court') + [v('judgeName'), v('judgeDesig')].filter(Boolean).join(', ').toUpperCase();
    const accused = b('accName');

    const pageOf = (blocksFn, step) => {
      const k = [1, 0.96, 0.92, 0.88, 0.84, 0.8, 0.76, 0.72][step] || 0.7;      // a full page: a little smaller text
      const sp = [1.5, 1.5, 1.45, 1.4, 1.35, 1.3, 1.25, 1.2][step] || 1.15;     // and line spacing
      const T = (text, size, o = {}) => R(text, size * k, o);
      const ln = size => size * k * 1.15 * sp;
      const P = (runs, size, o = {}) => Para(runs, Object.assign({ line: ln(size) }, o));
      const gap = h => Para([R('', 2)], { line: h * k });
      const NB = { t: 'none', r: 'none', b: 'none', l: 'none' }, pad0 = { l: 0, r: 0, t: 0, b: 0 };
      // FIR lines on the right: one line each, as on the form (a long one gets a little smaller)
      const fitR = (text, size) => T(text, Math.max(11, fitSize(text, 222, size * k, {}, 11 * k) / k), {});
      const header = after => [
        P([T(court, 16, { b: 1 })], 16, { align: 'center' }),
        gap(44),
        { table: true, indent: 0, cols: [222, 36, 222], rows: [
          [[T(v('state') || W('state'), 14, { b: 1 })], [fitR(TXT.fir[lang in TXT.fir ? lang : 'en'](b('firNo'), b('firDate')), 14)]],
          [[T(W('versus'), 14, { b: 1 })], [fitR(W('ps') + b('ps') + ', ' + b('psDistrict'), 14)]],
          [[T(accused, 14, { b: 1 })], [fitR(v('sections') || BLANK, 14)]],
        ].map(([l, r]) => ({ h: ln(14), cells: [
          { paras: [P(l, 14, { align: 'center' })], sides: NB, pad: pad0 }, { paras: [], sides: NB, pad: pad0 },
          { paras: [P(r, 14, { align: 'right' })], sides: NB, pad: pad0 }] })) },
        gap(after),
      ];
      // the advocate (when filled), small, on the right under the signature
      const adv = () => {
        const n = v('advName'), c = v('advChamber'), m = v('advMobile');
        if (!n && !c && !m) return [];
        return [gap(12)].concat(n ? [P([T(n.toUpperCase() + ', ' + W('advocate'), 12, { b: 1 })], 12, { align: 'right' })] : [],
          c ? [P([T(c, 11, { b: 1, i: 1, u: 'single' })], 11, { align: 'right' })] : [],
          m ? [P([T('M. ' + m, 11, { b: 1, i: 1, u: 'single' })], 11, { align: 'right' })] : []);
      };
      return blocksFn({ T, P, ln, gap, header, adv, NB, pad0, k });
    };

    // Page: Bail Bond
    const bailPage = step => pageOf(({ T, P, gap, header, adv }) => {
      const [mid, end] = (TXT.bailBody[lang] || TXT.bailBody.en)(ga);
      return header(48).concat([
        P([T(W('bail'), 14, { b: 1, u: 'single' })], 14, { align: 'center' }),
        P([T(W('bnss'), 14)], 14, { align: 'center' }),
        P([T(W('I'), 14), T(person('acc'), 14, { b: 1 }), T(mid, 14), T(b('amount'), 14, { b: 1 }), T(end, 14)], 14, { align: 'both' }),
        P([T(W('dated') + b('bondDate'), 14, { b: 1 })], 14),
        gap(24.15),
        P([T(accused, 18, { b: 1 })], 18, { align: 'right' }),
        P([T(W('accused'), 18, { b: 1 })], 18, { align: 'right' }),
      ], adv());
    }, step);

    // Page: Surety Bond — the photo box on the left, the text beside it and then below it
    const suretyPage = step => pageOf(({ T, P, ln, gap, header, NB, pad0, k }) => {
      const [pre, mid, post] = (TXT.suretyBody[lang] || TXT.suretyBody.en)(gs, ga);
      const runs = [T(W('I'), 14), T(person('sur', 'surety'), 14, { b: 1 }), T(pre, 14), T(accused, 14, { b: 1 }), T(mid, 14),
        T(b('amount') + post + b('bondDate'), 14, { b: 1 })];
      const boxW = 114.6, boxH = 140.5 * k, gapW = 9, textW = 480 - boxW - gapW;
      const n = Math.max(1, Math.ceil((boxH + 2) / ln(14)));
      const [beside, below] = splitLines(runs, textW, n, { align: 'both' });
      const person2 = p => [
        [T(W(p === 'wit' ? 'witness' : 'suretyH'), 14, { b: 1, u: 'single' })],
        [T(W('name') + v(p + 'Name'), 14, { b: 1 })],
        [T(cap(relW(p + 'Rel')) + ': ' + v(p + 'Father'), 14, { b: 1 })],
        [T(W('ro') + v(p + 'Address'), 14, { b: 1 })],
        [T(W('mob') + v(p + 'Mobile'), 14, { b: 1 })],
        [T(W('aadhaar') + v(p + 'Aadhaar'), 14, { b: 1 })],
        [T(W('dob') + v(p + 'Dob'), 14, { b: 1 })],
        [T('', 14)],
        [T(W('sign') + (p === 'wit' ? '______________________' : '___________________'), 14, { b: 1 })],
      ].map(r => P(r, 14));
      return header(48).concat([
        P([T(W('surety'), 14, { b: 1, u: 'single' })], 14, { align: 'center' }),
        { table: true, indent: 0, before: 2, border: 1.5, cols: [boxW, gapW, textW], rows: [{ h: Math.max(boxH, n * ln(14)), cells: [
          { paras: [], pad: pad0, sides: { t: 'single', r: 'single', b: 'single', l: 'single' } },
          { paras: [], pad: pad0, sides: NB },
          { paras: [P(beside, 14, { align: 'both' })], pad: pad0, sides: NB },
        ] }] },
        P(below.length ? below : [T('', 14)], 14, { align: 'both' }),
        gap(24.15),
        { table: true, indent: 0, border: 0.5, cols: [240.75, 219.25], rows: [{ h: 0, cells: [
          { paras: person2('wit'), pad: { l: 5.4, r: 5.4, t: 0, b: 0 } },
          { paras: person2('sur'), pad: { l: 5.4, r: 5.4, t: 0, b: 0 } },
        ] }] },
      ]);
    }, step);

    // Page: Affidavit of the surety
    const affidavitPage = step => pageOf(({ T, P, gap, header }) => {
      const S = 13, item = (no, runs, align = 'both') => P([T(no + '.\t', S)].concat(runs), S, { align, indL: 36, hang: 18 });
      const [a1a, a1b] = (TXT.a1[lang] || TXT.a1.en)(gs);
      const [a2a, a2b, a2c, a2d] = (TXT.a2[lang] || TXT.a2.en)(gs);
      const [va, vb] = (TXT.ver[lang] || TXT.ver.en)(b('verPlace'));
      const details = K.clean(d.jbDetails).split('\n').map(s => s.trim()).filter(Boolean);
      return header(24.15).concat([
        P([T(W('affidavit'), 14, { b: 1, u: 'single' })], 14, { align: 'center' }),
        P([T(W('I'), S), T(person('sur', 'surety'), S, { b: 1 }), T((TXT.affIntro[lang] || TXT.affIntro.en)(gs), S)], S, { align: 'both' }),
        item(1, [T(a1a, S), T(accused, S, { b: 1 }), T(a1b, S)]),
        item(2, [T(a2a, S), T(a2b + b('jbAmount') + a2c, S, { b: 1 }), T(a2d, S)]),
        P([T('\t' + W('jbHead') + '\t' + W('total'), S, { b: 1 })], S, { tabs: [36, 360] }),
        P([T('•\t' + (v('jbLand') || BLANK) + '\t' + v('jbAmount'), S, { b: 1 })], S, { indL: 36, hang: 18, tabs: [324] }),
      ], (details.length ? details : ['']).map(t => P([T(t, S)], S, { indL: 36 })), [
        P([T('\t' + v('jbAmount'), S, { b: 1 })], S, { indL: 36, tabs: [363] }),
        item(3, [T(W('a3'), S)], 'left'),
        item(4, [T(W('a4'), S)]),
        item(5, [T(W('a5'), S)]),
        P([T(W('deponent'), S, { b: 1 })], S, { align: 'right' }),
        P([T(W('verif'), S, { b: 1 })], S),
        P([T(va, S), T(b('verDate'), S, { b: 1 }), T(vb, S)], S, { align: 'both' }),
        gap(22.4),
        P([T(W('deponent'), S, { b: 1 })], S, { align: 'right' }),
      ]);
    }, step);

    const pages = [bailPage(steps[0] || 0), suretyPage(steps[1] || 0), affidavitPage(steps[2] || 0)];
    if (v('copies') !== '1') pages.push(bailPage(steps[3] || 0));
    return { page: { w: 612, h: 1008 }, margin: { top: 60, left: 72, right: 60, bottom: 60 }, pages };
  }

  const first = s => K.first(s);
  CF.register({
    id: 'bail',
    name: 'Bail Bonds',
    desc: 'Bail Bond, Surety Bond and Affidavit of the surety (4 pages)',
    court: 'District Courts, Jalandhar',
    docTitle: 'Bail Bonds',
    flow: true, multiPage: true, fitSteps: 8,
    page: { w: 612, h: 1008 },
    orientations: ['portrait'], defaultOrient: 'portrait',
    defaultLang: 'en',
    fields: FIELDS,
    tr: TR,
    clientCaseMap: {},
    clientTargets: [
      { label: 'Accused (Bail Bond)', map: { accName: 'name', accFather: 'father', accAddress: 'address' } },
      { label: 'Surety', map: { surName: 'name', surFather: 'father', surAddress: 'address' } },
      { label: 'Witness', map: { witName: 'name', witFather: 'father', witAddress: 'address' } },
    ],
    doc,
    caseTitle: d => { const a = first(d.accName), f = K.clean(d.firNo).trim(); return [a && 'State vs ' + a, f && 'FIR No. ' + f].filter(Boolean).join(' · ').slice(0, 120); },
    fileBase: d => { const part = s => first(s).replace(/[^A-Za-z0-9 ]+/g, ' ').trim().replace(/ +/g, '_'); const a = part(d.accName), f = part(d.firNo);
      return ['Bail_Bonds'].concat(a ? ['State_vs_' + a] : [], f ? ['FIR_No_' + f] : []).join('_').slice(0, 120); },
  });
})();
