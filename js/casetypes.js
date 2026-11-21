/* Case types of the District Courts (list given by the owner, as on the court records).
   Shared by all forms: CF.caseTypes.list (option texts), .code(type), .number(type, no).
   The texts stay in English in every interface language, like on the printed form. */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  const list = [
    '446 CRPC - PROCEEDINGS UNDER SECTION 446 CRPC',
    'APP - APPLICATION',
    'ARB - ARBITRATION CASE',
    'BA - BAIL APPLICATION',
    'CA - CIVIL APPEAL',
    'CHA - CHALLAN ACT',
    'CHI - CHALLAN IPC',
    'CM - CIVIL MISC APPLICATION',
    'CMA - CIVIL MISCELLANEOUS APPEAL',
    'COMA - COMPLAINT ACT',
    'COMI - COMPLAINT IPC',
    'COMMERCIAL APPEAL',
    'COMMERCIAL SUIT',
    'COUNTER CLAIM-CROSS OBJ - COUNTER CLAIM OR OBJECTION',
    'CR - CIVIL REVISION',
    'CRA - CRIMINAL APPEAL',
    'CRM - CRIMINAL MISC APPLICATION',
    'CRMP - CRIMINAL MISC PROCEEDINGS',
    'CRR - CRIMINAL REVISION',
    'CS - CIVIL SUIT',
    'CS37 - SUIT U O XXXVII OF CPC',
    'DMC - DIVORCE AND MATRIMONIAL CASES',
    'ELC - PREVENTION OF ELC ACT U/S 1545',
    'EP - ELECTION PETITION',
    'EXE - EXECUTION',
    'FD - FINAL DECREE',
    'GW - GUARDIANS AND WARDS CASE',
    'HDR Act',
    'HMA - HINDU MARRIAGE ACT',
    'HRY MC ACT - HARYANA MUNICIPAL CORPN ACT',
    'INDIG - PAUPER APPLICATION',
    'INDIGA - PAUPER APPEAL',
    'INSO - INSOLVENCY',
    'IT ACT',
    'JJB - JUVENILE',
    'LAC - CASE U LAND ACQU ACT 1894',
    'MACM - MOTOR ACCIDENT CLAIM MISC PET',
    'MACP - MOTOR ACCIDENT CLAIM PETITION',
    'MHA - MENTAL HEALTH ACT',
    'MNT125 - MAINTENANCE U/S 125 CrPC',
    'MPL - DECL U MUSLIM PRSNL LAW 1937',
    'MPLA - APL U MUSLIM PERSONAL LAW 1937',
    'NACT - 138 NIA ACT',
    'NDPS - NDPS ACT',
    'OBJ - OBJECTION',
    'PC - PREVENTION OF CORRUPTION ACT',
    'PFA - PREVENTION OF FOOD AND ALTER',
    'PFC - PUNJAB FINANCIAL CORP',
    'PRI - APLCT U O 31 OF PUN RLF INDEBT',
    'PROB - PROBATE CASE',
    'RA - RENT APPEAL',
    'REMP - REMAND PAPER',
    'RENT - RENT APPLICATION',
    'REW - REVIEW APPLICATION',
    'SC - SESSIONS CASE',
    'SUCC - SUCCESSION CASE',
    'SUMM - SUMMARY CASES',
    'TA CIVIL - TRANSFER APPLICATION CIVIL',
    'TA CRM - TRANSFER APPLICATION CRIMINAL',
    'TELA - TELE PHONE ACT',
    'TELE ACT - TELEPHONE ACT',
    'TRAFFIC',
    'TRUA - 7 TRUST ACT',
    'UCR - UNTRACED CANCELLATION REPORT',
    'WKF - WAKF ACT',
  ];
  const s = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  // Short code of a listed type ("COMA - COMPLAINT ACT" → "COMA"); '' for types without one
  const code = type => { const t = s(type); if (!list.includes(t)) return ''; const i = t.indexOf(' - '); return i > 0 ? t.slice(0, i) : ''; };
  // Full case number: type code + number ("COMA", "55/2024" → "COMA/55/2024"); the number alone if it already has the code
  const number = (type, no) => {
    const n = s(no).replace(/^case\s*no\.?\s*:?\s*/i, '');
    if (!n) return '';
    const c = code(type);
    return c && !n.toUpperCase().startsWith(c.toUpperCase()) ? c + '/' + n : n;
  };
  CF.caseTypes = { list, code, number };
})();
