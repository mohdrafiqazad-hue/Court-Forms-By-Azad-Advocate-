/* i Court Forms — interface language: English, हिंदी, ਪੰਜਾਬੀ.
   Only the app's screens change language. The printed court form (Word / PDF) always stays in
   English, exactly like the court's format.
   Use: CF.t('key', { var: value }) in code; data-i18n / data-i18n-html / data-i18n-aria /
   data-i18n-ph attributes in HTML. Form configs translate their own labels through form.tr. */
(function () {
  'use strict';
  const CF = window.CF = window.CF || {};
  const LANGS = ['en', 'hi', 'pa'];
  const KEY = 'icf-lang';

  // key: [English, हिंदी, ਪੰਜਾਬੀ]
  const D = {
    loading: ['Loading…', 'लोड हो रहा है…', 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…'],
    tagline: ['Court forms in the exact printed format', 'कोर्ट फॉर्म, बिल्कुल छपे हुए फॉर्मेट में', 'ਕੋਰਟ ਫ਼ਾਰਮ, ਬਿਲਕੁਲ ਛਪੇ ਹੋਏ ਫ਼ਾਰਮੈਟ ਵਿੱਚ'],
    tick1: ['Fill the blanks, see a live preview', 'खाली जगह भरें, साथ-साथ प्रीव्यू देखें', 'ਖਾਲੀ ਥਾਂ ਭਰੋ, ਨਾਲ-ਨਾਲ ਪ੍ਰੀਵਿਊ ਵੇਖੋ'],
    tick2: ['Export Word & PDF, ready to print', 'Word और PDF डाउनलोड करें, प्रिंट के लिए तैयार', 'Word ਅਤੇ PDF ਡਾਊਨਲੋਡ ਕਰੋ, ਪ੍ਰਿੰਟ ਲਈ ਤਿਆਰ'],
    tick3: ['Works offline once installed', 'इंस्टॉल करने के बाद बिना इंटरनेट भी चलता है', 'ਇੰਸਟਾਲ ਕਰਨ ਤੋਂ ਬਾਅਦ ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ ਵੀ ਚੱਲਦਾ ਹੈ'],
    signinNote: ['Sign in, and the owner approves your access.', 'साइन इन करें, फिर मालिक आपको मंज़ूरी देंगे।', 'ਸਾਈਨ ਇਨ ਕਰੋ, ਫਿਰ ਮਾਲਕ ਤੁਹਾਨੂੰ ਮਨਜ਼ੂਰੀ ਦੇਣਗੇ।'],
    google: ['Continue with Google', 'Google से जारी रखें', 'Google ਨਾਲ ਜਾਰੀ ਰੱਖੋ'],
    agree: ['By continuing you agree to the <a href="terms.html">Terms</a> and <a href="privacy.html">Privacy Policy</a>.',
      'जारी रखकर आप <a href="terms.html">शर्तों</a> और <a href="privacy.html">गोपनीयता नीति</a> से सहमत होते हैं।',
      'ਜਾਰੀ ਰੱਖ ਕੇ ਤੁਸੀਂ <a href="terms.html">ਸ਼ਰਤਾਂ</a> ਅਤੇ <a href="privacy.html">ਪਰਦੇਦਾਰੀ ਨੀਤੀ</a> ਨਾਲ ਸਹਿਮਤ ਹੁੰਦੇ ਹੋ।'],
    setupTitle: ['Setup pending', 'सेटअप बाकी है', 'ਸੈੱਟਅਪ ਬਾਕੀ ਹੈ'],
    setupText: ['Firebase is not configured yet (see SETUP.md).', 'Firebase अभी सेट नहीं है (SETUP.md देखें)।', 'Firebase ਹਾਲੇ ਸੈੱਟ ਨਹੀਂ ਹੈ (SETUP.md ਵੇਖੋ)।'],
    signedInAs: ['Signed in as', 'साइन इन:', 'ਸਾਈਨ ਇਨ:'],
    signOut: ['Sign out', 'साइन आउट', 'ਸਾਈਨ ਆਊਟ'],
    hello: ['Hello, {name}!', 'नमस्ते, {name}!', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, {name}!'],
    helloNoName: ['Hello!', 'नमस्ते!', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ!'],
    waitTitle: ['Waiting for approval', 'मंज़ूरी का इंतज़ार', 'ਮਨਜ਼ੂਰੀ ਦੀ ਉਡੀਕ'],
    waitText: ['Your request has been sent to the owner. This screen opens the app by itself as soon as you are approved.',
      'आपकी रिक्वेस्ट मालिक को भेज दी गई है। मंज़ूरी मिलते ही ऐप अपने आप खुल जाएगा।',
      'ਤੁਹਾਡੀ ਬੇਨਤੀ ਮਾਲਕ ਨੂੰ ਭੇਜ ਦਿੱਤੀ ਗਈ ਹੈ। ਮਨਜ਼ੂਰੀ ਮਿਲਦੇ ਹੀ ਐਪ ਆਪਣੇ ਆਪ ਖੁੱਲ੍ਹ ਜਾਵੇਗਾ।'],
    removedTitle: ['Access removed', 'एक्सेस हटा दिया गया', 'ਪਹੁੰਚ ਹਟਾ ਦਿੱਤੀ ਗਈ'],
    removedText: ['The owner has removed your access to i Court Forms. Contact the owner if you think this is a mistake.',
      'मालिक ने i Court Forms से आपका एक्सेस हटा दिया है। अगर यह गलती है तो मालिक से संपर्क करें।',
      'ਮਾਲਕ ਨੇ i Court Forms ਤੋਂ ਤੁਹਾਡੀ ਪਹੁੰਚ ਹਟਾ ਦਿੱਤੀ ਹੈ। ਜੇ ਇਹ ਗਲਤੀ ਹੈ ਤਾਂ ਮਾਲਕ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।'],
    waBtn: ['Message the owner on WhatsApp', 'मालिक को WhatsApp करें', 'ਮਾਲਕ ਨੂੰ WhatsApp ਕਰੋ'],
    waMsg: ['Please approve my i Court Forms access: {who}', 'कृपया मेरा i Court Forms एक्सेस मंज़ूर करें: {who}', 'ਕਿਰਪਾ ਕਰਕੇ ਮੇਰੀ i Court Forms ਪਹੁੰਚ ਮਨਜ਼ੂਰ ਕਰੋ: {who}'],
    offTitle: ['No internet', 'इंटरनेट नहीं है', 'ਇੰਟਰਨੈੱਟ ਨਹੀਂ ਹੈ'],
    offText: ['Connect to the internet once to sign in. After that the app works offline.',
      'साइन इन के लिए एक बार इंटरनेट से जुड़ें। उसके बाद ऐप बिना इंटरनेट चलेगा।',
      'ਸਾਈਨ ਇਨ ਲਈ ਇੱਕ ਵਾਰ ਇੰਟਰਨੈੱਟ ਨਾਲ ਜੁੜੋ। ਉਸ ਤੋਂ ਬਾਅਦ ਐਪ ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ ਚੱਲੇਗਾ।'],
    retry: ['Try again', 'फिर से कोशिश करें', 'ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ'],
    errNet: ['No internet connection. Please try again.', 'इंटरनेट कनेक्शन नहीं है। फिर से कोशिश करें।', 'ਇੰਟਰਨੈੱਟ ਕਨੈਕਸ਼ਨ ਨਹੀਂ ਹੈ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'],
    errDomain: ['This website address is not allowed in Firebase yet (Authentication → Settings → Authorized domains).',
      'यह वेबसाइट पता अभी Firebase में मंज़ूर नहीं है (Authentication → Settings → Authorized domains)।',
      'ਇਹ ਵੈੱਬਸਾਈਟ ਪਤਾ ਹਾਲੇ Firebase ਵਿੱਚ ਮਨਜ਼ੂਰ ਨਹੀਂ ਹੈ (Authentication → Settings → Authorized domains)।'],
    errSignin: ['Sign-in failed. Please try again.', 'साइन इन नहीं हो पाया। फिर से कोशिश करें।', 'ਸਾਈਨ ਇਨ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'],
    welcome: ['Welcome', 'स्वागत है', 'ਜੀ ਆਇਆਂ ਨੂੰ'],
    greet: ['Namaste, {name}', 'नमस्ते, {name}', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, {name}'],
    owner: ['Owner', 'मालिक', 'ਮਾਲਕ'],
    approvedRole: ['Approved', 'मंज़ूर', 'ਮਨਜ਼ੂਰ'],
    team: ['Team', 'टीम', 'ਟੀਮ'],
    heroTitle: ['Court forms, ready to print', 'कोर्ट फॉर्म, प्रिंट के लिए तैयार', 'ਕੋਰਟ ਫ਼ਾਰਮ, ਪ੍ਰਿੰਟ ਲਈ ਤਿਆਰ'],
    heroText: ['Fill the blanks · live preview · Word & PDF in the exact court format',
      'खाली जगह भरें · लाइव प्रीव्यू · कोर्ट के सही फॉर्मेट में Word और PDF',
      'ਖਾਲੀ ਥਾਂ ਭਰੋ · ਲਾਈਵ ਪ੍ਰੀਵਿਊ · ਕੋਰਟ ਦੇ ਸਹੀ ਫ਼ਾਰਮੈਟ ਵਿੱਚ Word ਅਤੇ PDF'],
    teamCardSub: ['Approve who can use the app', 'तय करें कि ऐप कौन चला सकता है', 'ਤੈਅ ਕਰੋ ਕਿ ਐਪ ਕੌਣ ਚਲਾ ਸਕਦਾ ਹੈ'],
    forms: ['Forms', 'फॉर्म', 'ਫ਼ਾਰਮ'],
    soonH: ['Coming soon', 'जल्द आ रहे हैं', 'ਜਲਦੀ ਆ ਰਹੇ ਹਨ'],
    soon: ['Soon', 'जल्द', 'ਜਲਦੀ'],
    foot: ['Always check the exported form before filing. · <a href="terms.html">Terms</a> · <a href="privacy.html">Privacy</a>',
      'दाखिल करने से पहले फॉर्म हमेशा एक बार जाँच लें। · <a href="terms.html">शर्तें</a> · <a href="privacy.html">गोपनीयता</a>',
      'ਦਾਖ਼ਲ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਫ਼ਾਰਮ ਹਮੇਸ਼ਾ ਇੱਕ ਵਾਰ ਜਾਂਚ ਲਓ। · <a href="terms.html">ਸ਼ਰਤਾਂ</a> · <a href="privacy.html">ਪਰਦੇਦਾਰੀ</a>'],
    teamSub: ['Approve who can use i Court Forms', 'तय करें कि i Court Forms कौन चला सकता है', 'ਤੈਅ ਕਰੋ ਕਿ i Court Forms ਕੌਣ ਚਲਾ ਸਕਦਾ ਹੈ'],
    requests: ['Requests', 'रिक्वेस्ट', 'ਬੇਨਤੀਆਂ'],
    approvedTab: ['Approved', 'मंज़ूर', 'ਮਨਜ਼ੂਰ'],
    removedTab: ['Removed', 'हटाए गए', 'ਹਟਾਏ ਗਏ'],
    hintReq: ['People who signed in and are waiting. Approve to let them use the app.',
      'जिन्होंने साइन इन किया है और इंतज़ार कर रहे हैं। ऐप चलाने देने के लिए मंज़ूर करें।',
      'ਜਿਨ੍ਹਾਂ ਨੇ ਸਾਈਨ ਇਨ ਕੀਤਾ ਹੈ ਅਤੇ ਉਡੀਕ ਕਰ ਰਹੇ ਹਨ। ਐਪ ਚਲਾਉਣ ਦੇਣ ਲਈ ਮਨਜ਼ੂਰ ਕਰੋ।'],
    hintApp: ['People who can use the app. Remove to stop their access.', 'जो ऐप चला सकते हैं। एक्सेस बंद करने के लिए हटाएँ।', 'ਜੋ ਐਪ ਚਲਾ ਸਕਦੇ ਹਨ। ਪਹੁੰਚ ਬੰਦ ਕਰਨ ਲਈ ਹਟਾਓ।'],
    hintRem: ['People whose access you removed. Approve to give it back.', 'जिनका एक्सेस आपने हटाया। वापस देने के लिए मंज़ूर करें।', 'ਜਿਨ੍ਹਾਂ ਦੀ ਪਹੁੰਚ ਤੁਸੀਂ ਹਟਾਈ। ਵਾਪਸ ਦੇਣ ਲਈ ਮਨਜ਼ੂਰ ਕਰੋ।'],
    nobody: ['Nobody here.', 'यहाँ कोई नहीं है।', 'ਇੱਥੇ ਕੋਈ ਨਹੀਂ ਹੈ।'],
    approve: ['Approve', 'मंज़ूर करें', 'ਮਨਜ਼ੂਰ ਕਰੋ'],
    remove: ['Remove', 'हटाएँ', 'ਹਟਾਓ'],
    stWaiting: ['waiting', 'इंतज़ार', 'ਉਡੀਕ'],
    stApproved: ['approved', 'मंज़ूर', 'ਮਨਜ਼ੂਰ'],
    stRemoved: ['removed', 'हटाया', 'ਹਟਾਇਆ'],
    signedInAt: ['Signed in {t}', 'साइन इन {t}', 'ਸਾਈਨ ਇਨ {t}'],
    approvedAt: ['Approved {d}', 'मंज़ूर {d}', 'ਮਨਜ਼ੂਰ {d}'],
    removedAt: ['Removed {d}', 'हटाया {d}', 'ਹਟਾਇਆ {d}'],
    confirmRemove: ['Remove access for {name}?', '{name} का एक्सेस हटाएँ?', '{name} ਦੀ ਪਹੁੰਚ ਹਟਾਉਣੀ ਹੈ?'],
    toastApproved: ['Approved: {name}', 'मंज़ूर: {name}', 'ਮਨਜ਼ੂਰ: {name}'],
    toastRemoved: ['Removed: {name}', 'हटाया: {name}', 'ਹਟਾਇਆ: {name}'],
    failed: ['Failed: {e}', 'नहीं हुआ: {e}', 'ਨਹੀਂ ਹੋਇਆ: {e}'],
    loadErr: ['Could not load ({e}). Check the internet connection.', 'लोड नहीं हुआ ({e})। इंटरनेट कनेक्शन जाँचें।', 'ਲੋਡ ਨਹੀਂ ਹੋਇਆ ({e})। ਇੰਟਰਨੈੱਟ ਕਨੈਕਸ਼ਨ ਜਾਂਚੋ।'],
    fill: ['Fill', 'भरें', 'ਭਰੋ'],
    preview: ['Preview', 'प्रीव्यू', 'ਪ੍ਰੀਵਿਊ'],
    sample: ['Sample case', 'नमूना केस', 'ਨਮੂਨਾ ਕੇਸ'],
    newForm: ['New form', 'नया फॉर्म', 'ਨਵਾਂ ਫ਼ਾਰਮ'],
    sharePdf: ['Share PDF', 'PDF भेजें', 'PDF ਭੇਜੋ'],
    landscape: ['Landscape', 'आड़ा', 'ਲੇਟਵਾਂ'],
    portrait: ['Portrait', 'खड़ा', 'ਖੜ੍ਹਵਾਂ'],
    filled: ['{n} of {t} filled', '{t} में से {n} भरे', '{t} ਵਿੱਚੋਂ {n} ਭਰੇ'],
    today: ['Today', 'आज', 'ਅੱਜ'],
    typeEnglish: ['', 'जानकारी अंग्रेज़ी में लिखें — फॉर्म अंग्रेज़ी में छपता है।', 'ਜਾਣਕਾਰੀ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਲਿਖੋ — ਫ਼ਾਰਮ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਛਪਦਾ ਹੈ।'],
    saved: ['Saved: {f}', 'सेव हुआ: {f}', 'ਸੇਵ ਹੋਇਆ: {f}'],
    dlCancel: ['Download cancelled', 'डाउनलोड रद्द', 'ਡਾਊਨਲੋਡ ਰੱਦ'],
    dlFail: ['Could not save the file here', 'फ़ाइल यहाँ सेव नहीं हो सकी', 'ਫ਼ਾਈਲ ਇੱਥੇ ਸੇਵ ਨਹੀਂ ਹੋ ਸਕੀ'],
    wordFail: ['Word export failed', 'Word फ़ाइल नहीं बनी', 'Word ਫ਼ਾਈਲ ਨਹੀਂ ਬਣੀ'],
    pdfFail: ['PDF export failed', 'PDF फ़ाइल नहीं बनी', 'PDF ਫ਼ਾਈਲ ਨਹੀਂ ਬਣੀ'],
    shareFail: ['Could not share the PDF', 'PDF भेजी नहीं जा सकी', 'PDF ਭੇਜੀ ਨਹੀਂ ਜਾ ਸਕੀ'],
    confirmSample: ['Replace what you have typed with the sample case ({label})?', 'जो आपने लिखा है उसे नमूना केस ({label}) से बदलें?', 'ਜੋ ਤੁਸੀਂ ਲਿਖਿਆ ਹੈ ਉਸਨੂੰ ਨਮੂਨਾ ਕੇਸ ({label}) ਨਾਲ ਬਦਲਣਾ ਹੈ?'],
    confirmClear: ['Clear every field and start a new form?', 'सभी खाने खाली करके नया फॉर्म शुरू करें?', 'ਸਾਰੇ ਖਾਨੇ ਖਾਲੀ ਕਰਕੇ ਨਵਾਂ ਫ਼ਾਰਮ ਸ਼ੁਰੂ ਕਰਨਾ ਹੈ?'],
    cancel: ['Cancel', 'रद्द करें', 'ਰੱਦ ਕਰੋ'],
    yes: ['Yes', 'हाँ', 'ਹਾਂ'],
    allForms: ['All forms', 'सभी फॉर्म', 'ਸਾਰੇ ਫ਼ਾਰਮ'],
    language: ['Language', 'भाषा', 'ਭਾਸ਼ਾ'],
    // planned forms (English name is the key)
    'Vakalatnama': ['Vakalatnama', 'वकालतनामा', 'ਵਕਾਲਤਨਾਮਾ'],
    'Memo of Appearance': ['Memo of Appearance', 'हाज़िरी मेमो', 'ਹਾਜ਼ਰੀ ਮੀਮੋ'],
    'Exemption Application': ['Exemption Application', 'हाज़िरी माफ़ी की अर्ज़ी', 'ਹਾਜ਼ਰੀ ਮੁਆਫ਼ੀ ਦੀ ਅਰਜ਼ੀ'],
    'Adjournment Application': ['Adjournment Application', 'तारीख़ आगे करने की अर्ज़ी', 'ਤਾਰੀਖ਼ ਅੱਗੇ ਕਰਨ ਦੀ ਅਰਜ਼ੀ'],
    'Personal Bond': ['Personal Bond', 'निजी मुचलका', 'ਨਿੱਜੀ ਮੁਚਲਕਾ'],
    'Surety Bond': ['Surety Bond', 'ज़मानती मुचलका', 'ਜ਼ਮਾਨਤੀ ਮੁਚਲਕਾ'],
  };

  const saved = (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })();
  const guess = (navigator.language || '').toLowerCase().startsWith('pa') ? 'pa' : (navigator.language || '').toLowerCase().startsWith('hi') ? 'hi' : 'en';
  let lang = LANGS.includes(saved) ? saved : guess;
  const listeners = [];

  function t(key, vars) {
    const row = D[key];
    let s = row ? (row[LANGS.indexOf(lang)] || row[0]) : key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
  }
  // A form's own words (labels, hints, options, name…): form.tr = { hi: { English: हिंदी }, pa: { … } }
  const ft = (form, s) => (form && form.tr && form.tr[lang] && form.tr[lang][s]) || s;

  function apply(root) {
    const r = root || document;
    r.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    r.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    r.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    r.querySelectorAll('[data-i18n-ph]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.i18nPh)); });
    document.documentElement.lang = lang;
    document.querySelectorAll('.langpick [data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    document.querySelectorAll('select.langsel').forEach(s => { s.value = lang; });
  }
  function set(l) {
    if (!LANGS.includes(l) || l === lang) return;
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ }
    apply();
    listeners.forEach(fn => { try { fn(lang); } catch (e) { console.error(e); } });
  }

  document.addEventListener('click', e => { const b = e.target.closest('.langpick [data-lang]'); if (b) set(b.dataset.lang); });
  document.addEventListener('change', e => { if (e.target.matches('select.langsel')) set(e.target.value); });
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', () => apply()) : apply();

  CF.i18n = { LANGS, get lang() { return lang; }, t, ft, set, apply, onChange: fn => listeners.push(fn), dict: D };
  CF.t = t;
})();
