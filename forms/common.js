/* Shared pieces of the court forms written like a Word page (Talbana, List of Documents, Address Form):
   lists to tap (court, kind of suit, party), the advocate's own details, app-screen translations,
   case title and file name. The printed words of each form stay in its own file. */
(function () {
  'use strict';
  const CF = window.CF;
  const clean = s => CF.util.clean(s);
  const first = s => clean(s).split('\n')[0].trim();

  // Court designations (the user picks one, or types another)
  const COURTS = ['CIVIL JUDGE (SENIOR DIVISION), JALANDHAR', 'CIVIL JUDGE (JUNIOR DIVISION), JALANDHAR',
    'ADDITIONAL CIVIL JUDGE (SENIOR DIVISION), JALANDHAR', 'DISTRICT JUDGE, JALANDHAR', 'ADDITIONAL DISTRICT JUDGE, JALANDHAR'];
  const SUITS = ['Permanent Injunction', 'Mandatory Injunction', 'Declaration', 'Recovery', 'Possession', 'Specific Performance', 'Partition'];
  const PARTIES = ['Plaintiff', 'Defendant', 'Petitioner', 'Respondent', 'Applicant'];
  const opts = (blank, list) => [['', blank]].concat(list.map(x => [x, x]));
  // '' = Plaintiff (the usual one), so an untouched form prints "Plaintiff"
  const PARTY_OPTS = [['', 'Plaintiff']].concat(PARTIES.slice(1).map(x => [x, x]));

  // The advocate's own details: saved once in "My details", filled in every form
  const ADVOCATE = [
    { key: 'advName', profile: true, label: "Advocate's name", type: 'text', placeholder: 'e.g. R. K. SHARMA', hint: 'Printed in capitals, as on the form' },
    { key: 'advChamber', profile: true, label: 'Chamber address', type: 'text', placeholder: 'e.g. Chamber No. 12, New Court, Jalandhar' },
    { key: 'advMobile', profile: true, label: 'Mobile', type: 'text', placeholder: 'e.g. 98140-00000' },
  ];

  const TR = {
    hi: {
      'District Courts, Jalandhar': 'ज़िला अदालत, जालंधर',
      'Court and case': 'अदालत और केस',
      'Signature': 'हस्ताक्षर',
      'Court Name': 'अदालत का नाम',
      'Select the court': 'अदालत चुनें',
      'Plaintiff': 'वादी (मुद्दई)',
      'Defendant': 'प्रतिवादी (मुद्दालेह)',
      'Plaintiff / Petitioner': 'वादी / याचिकाकर्ता',
      'Defendant / Respondent': 'प्रतिवादी / प्रत्यर्थी',
      'Kind of suit': 'दावे की किस्म',
      'Select the kind of suit': 'दावे की किस्म चुनें',
      'Date of Hearing': 'पेशी की तारीख़',
      'Filed for': 'किसकी तरफ़ से',
      'Printed under the signature': 'हस्ताक्षर के नीचे छपता है',
      "Advocate's name": 'वकील का नाम',
      'Printed in capitals, as on the form': 'फ़ॉर्म की तरह बड़े अक्षरों में छपता है',
      'Chamber address': 'चैंबर का पता',
      'Mobile': 'मोबाइल',
      'Pick from the list, or choose Other and type it': 'लिस्ट से चुनें, या "दूसरा" चुनकर ख़ुद लिखें',
      'Petitioner': 'याचिकाकर्ता', 'Respondent': 'प्रत्यर्थी', 'Applicant': 'आवेदक',
    },
    pa: {
      'District Courts, Jalandhar': 'ਜ਼ਿਲ੍ਹਾ ਅਦਾਲਤ, ਜਲੰਧਰ',
      'Court and case': 'ਅਦਾਲਤ ਅਤੇ ਕੇਸ',
      'Signature': 'ਦਸਤਖ਼ਤ',
      'Court Name': 'ਅਦਾਲਤ ਦਾ ਨਾਮ',
      'Select the court': 'ਅਦਾਲਤ ਚੁਣੋ',
      'Plaintiff': 'ਮੁੱਦਈ',
      'Defendant': 'ਮੁਦਾਲਾ',
      'Plaintiff / Petitioner': 'ਮੁੱਦਈ / ਪਟੀਸ਼ਨਰ',
      'Defendant / Respondent': 'ਮੁਦਾਲਾ / ਰਿਸਪਾਂਡੈਂਟ',
      'Kind of suit': 'ਦਾਅਵੇ ਦੀ ਕਿਸਮ',
      'Select the kind of suit': 'ਦਾਅਵੇ ਦੀ ਕਿਸਮ ਚੁਣੋ',
      'Date of Hearing': 'ਤਰੀਕ ਪੇਸ਼ੀ',
      'Filed for': 'ਕਿਸ ਵੱਲੋਂ',
      'Printed under the signature': 'ਦਸਤਖ਼ਤ ਦੇ ਹੇਠਾਂ ਛਪਦਾ ਹੈ',
      "Advocate's name": 'ਵਕੀਲ ਦਾ ਨਾਮ',
      'Printed in capitals, as on the form': 'ਫ਼ਾਰਮ ਵਾਂਗ ਵੱਡੇ ਅੱਖਰਾਂ ਵਿੱਚ ਛਪਦਾ ਹੈ',
      'Chamber address': 'ਚੈਂਬਰ ਦਾ ਪਤਾ',
      'Mobile': 'ਮੋਬਾਈਲ',
      'Pick from the list, or choose Other and type it': 'ਲਿਸਟ ਵਿੱਚੋਂ ਚੁਣੋ, ਜਾਂ "ਹੋਰ" ਚੁਣ ਕੇ ਆਪ ਲਿਖੋ',
      'Petitioner': 'ਪਟੀਸ਼ਨਰ', 'Respondent': 'ਰਿਸਪਾਂਡੈਂਟ', 'Applicant': 'ਬਿਨੈਕਾਰ',
    },
  };
  const withTR = own => ({ hi: Object.assign({}, TR.hi, own.hi), pa: Object.assign({}, TR.pa, own.pa) });

  // "Plaintiff vs Defendant" for My cases; file name "Talbana_Plaintiff_vs_Defendant"
  const caseTitle = d => { const p = first(d.plaintiff), q = first(d.defendant); return (p && q ? p + ' vs ' + q : (p || q)).slice(0, 120); };
  const fileBase = prefix => d => {
    const part = s => first(s).replace(/[^A-Za-z0-9 ]+/g, ' ').trim().replace(/ +/g, '_');
    const p = part(d.plaintiff), q = part(d.defendant);
    return [prefix].concat(p && q ? [p + '_vs_' + q] : (p || q) ? [p || q] : []).join('_').slice(0, 120);
  };

  CF.formKit = { COURTS, SUITS, PARTIES, PARTY_OPTS, opts, ADVOCATE, withTR, caseTitle, fileBase, clean, first };
})();
