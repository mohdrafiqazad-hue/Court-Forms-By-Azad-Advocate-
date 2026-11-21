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
    confirmClear: ['Clear every field and start a new form?', 'सभी खाने खाली करके नया फॉर्म शुरू करें?', 'ਸਾਰੇ ਖਾਨੇ ਖਾਲੀ ਕਰਕੇ ਨਵਾਂ ਫ਼ਾਰਮ ਸ਼ੁਰੂ ਕਰਨਾ ਹੈ?'],
    cancel: ['Cancel', 'रद्द करें', 'ਰੱਦ ਕਰੋ'],
    yes: ['Yes', 'हाँ', 'ਹਾਂ'],
    allForms: ['All forms', 'सभी फॉर्म', 'ਸਾਰੇ ਫ਼ਾਰਮ'],
    language: ['Language', 'भाषा', 'ਭਾਸ਼ਾ'],
    installTitle: ['Install the app', 'ऐप इंस्टॉल करें', 'ਐਪ ਇੰਸਟਾਲ ਕਰੋ'],
    installSub: ['Add i Court Forms to your home screen. Opens like an app and works offline.',
      'i Court Forms को होम स्क्रीन पर जोड़ें। ऐप की तरह खुलेगा और बिना इंटरनेट भी चलेगा।',
      'i Court Forms ਨੂੰ ਹੋਮ ਸਕ੍ਰੀਨ ’ਤੇ ਜੋੜੋ। ਐਪ ਵਾਂਗ ਖੁੱਲ੍ਹੇਗਾ ਅਤੇ ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ ਵੀ ਚੱਲੇਗਾ।'],
    installBtn: ['Install', 'इंस्टॉल', 'ਇੰਸਟਾਲ'],
    iosSteps: ['On iPhone: tap Share at the bottom, then “Add to Home Screen”.',
      'iPhone पर: नीचे Share दबाएँ, फिर “Add to Home Screen” चुनें।',
      'iPhone ’ਤੇ: ਹੇਠਾਂ Share ਦਬਾਓ, ਫਿਰ “Add to Home Screen” ਚੁਣੋ।'],
    installed: ['Installed — open i Court Forms from your home screen', 'इंस्टॉल हो गया — होम स्क्रीन से i Court Forms खोलें', 'ਇੰਸਟਾਲ ਹੋ ਗਿਆ — ਹੋਮ ਸਕ੍ਰੀਨ ਤੋਂ i Court Forms ਖੋਲ੍ਹੋ'],
    updateReady: ['New version available', 'नया वर्ज़न आ गया है', 'ਨਵਾਂ ਵਰਜ਼ਨ ਆ ਗਿਆ ਹੈ'],
    reload: ['Refresh', 'रिफ्रेश करें', 'ਰਿਫ੍ਰੈਸ਼ ਕਰੋ'],
    zoomIn: ['Zoom in', 'बड़ा करें', 'ਵੱਡਾ ਕਰੋ'],
    zoomFit: ['Fit to screen', 'स्क्रीन में फिट', 'ਸਕ੍ਰੀਨ ’ਚ ਫਿੱਟ'],
    saveCase: ['Save', 'सेव करें', 'ਸੇਵ ਕਰੋ'],
    myCases: ['My cases', 'मेरे केस', 'ਮੇਰੇ ਕੇਸ'],
    myDetails: ['My details', 'मेरी जानकारी', 'ਮੇਰੀ ਜਾਣਕਾਰੀ'],
    caseSaved: ['Saved in My cases', '“मेरे केस” में सेव हो गया', '“ਮੇਰੇ ਕੇਸ” ਵਿੱਚ ਸੇਵ ਹੋ ਗਿਆ'],
    caseUpdated: ['Case updated', 'केस अपडेट हो गया', 'ਕੇਸ ਅੱਪਡੇਟ ਹੋ ਗਿਆ'],
    saveFail: ['Could not save — the phone storage may be full', 'सेव नहीं हुआ — फ़ोन की मेमोरी भरी हो सकती है', 'ਸੇਵ ਨਹੀਂ ਹੋਇਆ — ਫ਼ੋਨ ਦੀ ਮੈਮਰੀ ਭਰੀ ਹੋ ਸਕਦੀ ਹੈ'],
    noCases: ['No saved cases yet. Fill a form and tap Save.', 'अभी कोई केस सेव नहीं है। फॉर्म भरकर “सेव करें” दबाएँ।', 'ਹਾਲੇ ਕੋਈ ਕੇਸ ਸੇਵ ਨਹੀਂ ਹੈ। ਫ਼ਾਰਮ ਭਰ ਕੇ “ਸੇਵ ਕਰੋ” ਦਬਾਓ।'],
    noMatch: ['No case matches your search.', 'खोज से कोई केस नहीं मिला।', 'ਖੋਜ ਨਾਲ ਕੋਈ ਕੇਸ ਨਹੀਂ ਮਿਲਿਆ।'],
    open: ['Open', 'खोलें', 'ਖੋਲ੍ਹੋ'],
    copyCase: ['Copy', 'कॉपी', 'ਕਾਪੀ'],
    del: ['Delete', 'हटाएँ', 'ਮਿਟਾਓ'],
    confirmDel: ['Delete “{name}”?', '“{name}” हटाएँ?', '“{name}” ਮਿਟਾਉਣਾ ਹੈ?'],
    deleted: ['Deleted', 'हटा दिया', 'ਮਿਟਾ ਦਿੱਤਾ'],
    search: ['Search cases', 'केस खोजें', 'ਕੇਸ ਲੱਭੋ'],
    untitled: ['Case of {d}', '{d} का केस', '{d} ਦਾ ਕੇਸ'],
    editingCase: ['Case: {name}', 'केस: {name}', 'ਕੇਸ: {name}'],
    copied: ['Copied — this is a new case now. Change what you need and Save.', 'कॉपी हो गया — अब यह नया केस है। जो बदलना है बदलें और सेव करें।', 'ਕਾਪੀ ਹੋ ਗਿਆ — ਹੁਣ ਇਹ ਨਵਾਂ ਕੇਸ ਹੈ। ਜੋ ਬਦਲਣਾ ਹੈ ਬਦਲੋ ਅਤੇ ਸੇਵ ਕਰੋ।'],
    confirmReplace: ['Replace what is in the form now?', 'फॉर्म में अभी जो लिखा है उसे बदलें?', 'ਫ਼ਾਰਮ ਵਿੱਚ ਹੁਣ ਜੋ ਲਿਖਿਆ ਹੈ ਉਸਨੂੰ ਬਦਲਣਾ ਹੈ?'],
    fillMine: ['Fill my details', 'मेरी जानकारी भरें', 'ਮੇਰੀ ਜਾਣਕਾਰੀ ਭਰੋ'],
    saveMine: ['Save these as my details', 'इन्हें मेरी जानकारी के रूप में सेव करें', 'ਇਹਨਾਂ ਨੂੰ ਮੇਰੀ ਜਾਣਕਾਰੀ ਵਜੋਂ ਸੇਵ ਕਰੋ'],
    mineHelp: ['Your own details (name, chamber address, district…) fill in with one tap in every form.', 'आपकी अपनी जानकारी (नाम, चैंबर का पता, ज़िला…) हर फॉर्म में एक टैप में भर जाती है।', 'ਤੁਹਾਡੀ ਆਪਣੀ ਜਾਣਕਾਰੀ (ਨਾਮ, ਚੈਂਬਰ ਦਾ ਪਤਾ, ਜ਼ਿਲ੍ਹਾ…) ਹਰ ਫ਼ਾਰਮ ਵਿੱਚ ਇੱਕ ਟੈਪ ਨਾਲ ਭਰ ਜਾਂਦੀ ਹੈ।'],
    mineSaved: ['My details saved', 'मेरी जानकारी सेव हो गई', 'ਮੇਰੀ ਜਾਣਕਾਰੀ ਸੇਵ ਹੋ ਗਈ'],
    mineFilled: ['My details filled in', 'मेरी जानकारी भर दी गई', 'ਮੇਰੀ ਜਾਣਕਾਰੀ ਭਰ ਦਿੱਤੀ ਗਈ'],
    mineEmpty: ['Nothing saved yet. Fill your name and address in the form, then tap “Save these as my details”.', 'अभी कुछ सेव नहीं है। फॉर्म में अपना नाम और पता भरें, फिर “इन्हें मेरी जानकारी के रूप में सेव करें” दबाएँ।', 'ਹਾਲੇ ਕੁਝ ਸੇਵ ਨਹੀਂ ਹੈ। ਫ਼ਾਰਮ ਵਿੱਚ ਆਪਣਾ ਨਾਮ ਅਤੇ ਪਤਾ ਭਰੋ, ਫਿਰ “ਇਹਨਾਂ ਨੂੰ ਮੇਰੀ ਜਾਣਕਾਰੀ ਵਜੋਂ ਸੇਵ ਕਰੋ” ਦਬਾਓ।'],
    mineNone: ['Fill at least one of these fields first: {fields}', 'पहले इनमें से कम से कम एक खाना भरें: {fields}', 'ਪਹਿਲਾਂ ਇਹਨਾਂ ਵਿੱਚੋਂ ਘੱਟੋ-ਘੱਟ ਇੱਕ ਖਾਨਾ ਭਰੋ: {fields}'],
    recent: ['Recent:', 'पिछली:', 'ਪਿਛਲੀ:'],
    close: ['Close', 'बंद करें', 'ਬੰਦ ਕਰੋ'],
    backup: ['Download backup', 'बैकअप डाउनलोड करें', 'ਬੈਕਅੱਪ ਡਾਊਨਲੋਡ ਕਰੋ'],
    restore: ['Restore backup', 'बैकअप वापस लाएँ', 'ਬੈਕਅੱਪ ਵਾਪਸ ਲਿਆਓ'],
    restored: ['Restored {n} cases', '{n} केस वापस आ गए', '{n} ਕੇਸ ਵਾਪਸ ਆ ਗਏ'],
    badBackup: ['This is not an i Court Forms backup file', 'यह i Court Forms की बैकअप फ़ाइल नहीं है', 'ਇਹ i Court Forms ਦੀ ਬੈਕਅੱਪ ਫ਼ਾਈਲ ਨਹੀਂ ਹੈ'],
    deviceNote: ['Saved on this phone only, never on a server. Download a backup now and then.', 'सिर्फ़ इसी फ़ोन में सेव है, किसी सर्वर पर नहीं। बीच-बीच में बैकअप डाउनलोड कर लें।', 'ਸਿਰਫ਼ ਇਸੇ ਫ਼ੋਨ ਵਿੱਚ ਸੇਵ ਹੈ, ਕਿਸੇ ਸਰਵਰ ’ਤੇ ਨਹੀਂ। ਕਦੇ-ਕਦੇ ਬੈਕਅੱਪ ਡਾਊਨਲੋਡ ਕਰ ਲਓ।'],
    seeAll: ['See all', 'सभी देखें', 'ਸਾਰੇ ਵੇਖੋ'],
    savedOn: ['Saved {d}', 'सेव {d}', 'ਸੇਵ {d}'],
    saveAsNew: ['Save as a new case', 'नए केस के रूप में सेव करें', 'ਨਵੇਂ ਕੇਸ ਵਜੋਂ ਸੇਵ ਕਰੋ'],
    clients: ['Clients', 'क्लाइंट', 'ਕਲਾਇੰਟ'],
    clientBook: ['Client book', 'क्लाइंट बुक', 'ਕਲਾਇੰਟ ਬੁੱਕ'],
    newClient: ['New client', 'नया क्लाइंट', 'ਨਵਾਂ ਕਲਾਇੰਟ'],
    cName: ['Name', 'नाम', 'ਨਾਮ'],
    cFather: ['Father’s / husband’s name', 'पिता / पति का नाम', 'ਪਿਤਾ / ਪਤੀ ਦਾ ਨਾਮ'],
    cOccupation: ['Occupation', 'काम-धंधा', 'ਕੰਮ-ਧੰਦਾ'],
    cAddress: ['Address', 'पता', 'ਪਤਾ'],
    cPo: ['Post office', 'डाकघर', 'ਡਾਕਘਰ'],
    cPs: ['Police station', 'थाना', 'ਥਾਣਾ'],
    cTehsil: ['Tehsil', 'तहसील', 'ਤਹਿਸੀਲ'],
    cDistrict: ['District', 'ज़िला', 'ਜ਼ਿਲ੍ਹਾ'],
    cPhone: ['Phone', 'फ़ोन', 'ਫ਼ੋਨ'],
    cNotes: ['Notes', 'नोट', 'ਨੋਟ'],
    saveClient: ['Save client', 'क्लाइंट सेव करें', 'ਕਲਾਇੰਟ ਸੇਵ ਕਰੋ'],
    clientSaved: ['Client saved', 'क्लाइंट सेव हो गया', 'ਕਲਾਇੰਟ ਸੇਵ ਹੋ ਗਿਆ'],
    needName: ['Write the client’s name', 'क्लाइंट का नाम लिखें', 'ਕਲਾਇੰਟ ਦਾ ਨਾਮ ਲਿਖੋ'],
    noClients: ['No clients yet. Tap “New client”.', 'अभी कोई क्लाइंट नहीं। “नया क्लाइंट” दबाएँ।', 'ਹਾਲੇ ਕੋਈ ਕਲਾਇੰਟ ਨਹੀਂ। “ਨਵਾਂ ਕਲਾਇੰਟ” ਦਬਾਓ।'],
    searchClients: ['Search clients', 'क्लाइंट खोजें', 'ਕਲਾਇੰਟ ਲੱਭੋ'],
    useAs: ['Fill in as:', 'इसमें भरें:', 'ਇਸ ਵਿੱਚ ਭਰੋ:'],
    edit: ['Edit', 'बदलें', 'ਬਦਲੋ'],
    clientFilled: ['{name} filled in', '{name} भर दिया', '{name} ਭਰ ਦਿੱਤਾ'],
    fromForm: ['Take from this form', 'इस फॉर्म से लें', 'ਇਸ ਫ਼ਾਰਮ ਤੋਂ ਲਓ'],
    back: ['Back', 'वापस', 'ਵਾਪਸ'],
    clientCases: ['Cases', 'केस', 'ਕੇਸ'],
    addCase: ['Add case', 'केस जोड़ें', 'ਕੇਸ ਜੋੜੋ'],
    fillCase: ['Fill this case', 'इस केस से भरें', 'ਇਸ ਕੇਸ ਨਾਲ ਭਰੋ'],
    caseFilled: ['{name} — details filled in', '{name} — जानकारी भर दी गई', '{name} — ਜਾਣਕਾਰੀ ਭਰ ਦਿੱਤੀ ਗਈ'],
    saveFormCase: ['Save this form’s case here', 'इस फॉर्म का केस यहाँ सेव करें', 'ਇਸ ਫ਼ਾਰਮ ਦਾ ਕੇਸ ਇੱਥੇ ਸੇਵ ਕਰੋ'],
    caseAdded: ['Case saved for {name}', '{name} के लिए केस सेव हो गया', '{name} ਲਈ ਕੇਸ ਸੇਵ ਹੋ ਗਿਆ'],
    noFormCase: ['Fill the case particulars in the form first', 'पहले फॉर्म में केस का विवरण भरें', 'ਪਹਿਲਾਂ ਫ਼ਾਰਮ ਵਿੱਚ ਕੇਸ ਦਾ ਵੇਰਵਾ ਭਰੋ'],
    noClientCases: ['No cases yet. Tap “Add case”.', 'अभी कोई केस नहीं। “केस जोड़ें” दबाएँ।', 'ਹਾਲੇ ਕੋਈ ਕੇਸ ਨਹੀਂ। “ਕੇਸ ਜੋੜੋ” ਦਬਾਓ।'],
    needCase: ['Fill at least one detail of the case', 'केस की कम से कम एक जानकारी भरें', 'ਕੇਸ ਦੀ ਘੱਟੋ-ਘੱਟ ਇੱਕ ਜਾਣਕਾਰੀ ਭਰੋ'],
    done: ['Done', 'ठीक है', 'ਠੀਕ ਹੈ'],
    kNature: ['Case type & number', 'केस की किस्म और नंबर', 'ਕੇਸ ਦੀ ਕਿਸਮ ਅਤੇ ਨੰਬਰ'],
    kPlaintiff: ['Plaintiff / Complainant', 'वादी / शिकायतकर्ता', 'ਮੁੱਦਈ / ਸ਼ਿਕਾਇਤਕਰਤਾ'],
    kDefendant: ['Defendant / Accused / Respondent', 'प्रतिवादी / आरोपी / प्रत्यर्थी', 'ਮੁੱਦਾਲਾ / ਦੋਸ਼ੀ / ਜਵਾਬਦੇਹ'],
    kClaim: ['Claim / value of suit / offence', 'दावा / दावे की कीमत / अपराध', 'ਦਾਅਵਾ / ਦਾਅਵੇ ਦੀ ਕੀਮਤ / ਜੁਰਮ'],
    kPlace: ['Village / city', 'गाँव / शहर', 'ਪਿੰਡ / ਸ਼ਹਿਰ'],
    kCourt: ['Court & presiding officer', 'अदालत और पीठासीन अधिकारी (जज)', 'ਅਦਾਲਤ ਅਤੇ ਪ੍ਰੀਜ਼ਾਈਡਿੰਗ ਅਫ਼ਸਰ (ਜੱਜ)'],
    kDecision: ['Date of decision / status', 'फ़ैसले की तारीख़ / स्थिति', 'ਫ਼ੈਸਲੇ ਦੀ ਤਾਰੀਖ਼ / ਸਥਿਤੀ'],
    about: ['About', 'परिचय', 'ਜਾਣ-ਪਛਾਣ'],
    aboutSub: ['The app and its founder', 'ऐप और इसके संस्थापक', 'ਐਪ ਅਤੇ ਇਸਦੇ ਸੰਸਥਾਪਕ'],
    aboutApp: ['About the app', 'ऐप के बारे में', 'ਐਪ ਬਾਰੇ'],
    ab1: ['Court forms in the exact printed format of the District Courts, Jalandhar', 'ज़िला अदालत, जालंधर के बिल्कुल छपे हुए फॉर्मेट में कोर्ट फॉर्म', 'ਜ਼ਿਲ੍ਹਾ ਅਦਾਲਤ, ਜਲੰਧਰ ਦੇ ਬਿਲਕੁਲ ਛਪੇ ਹੋਏ ਫ਼ਾਰਮੈਟ ਵਿੱਚ ਕੋਰਟ ਫ਼ਾਰਮ'],
    ab2: ['Fill the blanks, see a live preview, download Word & PDF', 'खाली जगह भरें, लाइव प्रीव्यू देखें, Word और PDF डाउनलोड करें', 'ਖਾਲੀ ਥਾਂ ਭਰੋ, ਲਾਈਵ ਪ੍ਰੀਵਿਊ ਵੇਖੋ, Word ਅਤੇ PDF ਡਾਊਨਲੋਡ ਕਰੋ'],
    ab3: ['Saved cases, client book and your details stay on your own phone', 'सेव किए केस, क्लाइंट बुक और आपकी जानकारी आपके अपने फ़ोन में ही रहती है', 'ਸੇਵ ਕੀਤੇ ਕੇਸ, ਕਲਾਇੰਟ ਬੁੱਕ ਅਤੇ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਤੁਹਾਡੇ ਆਪਣੇ ਫ਼ੋਨ ਵਿੱਚ ਹੀ ਰਹਿੰਦੀ ਹੈ'],
    ab4: ['Works offline · English, हिंदी, ਪੰਜਾਬੀ', 'बिना इंटरनेट भी चलता है · English, हिंदी, ਪੰਜਾਬੀ', 'ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ ਵੀ ਚੱਲਦਾ ਹੈ · English, हिंदी, ਪੰਜਾਬੀ'],
    founder: ['Founder', 'संस्थापक', 'ਸੰਸਥਾਪਕ'],
    mobile: ['Mobile', 'मोबाइल', 'ਮੋਬਾਈਲ'],
    call: ['Call', 'कॉल करें', 'ਕਾਲ ਕਰੋ'],
    whatsapp: ['WhatsApp', 'WhatsApp', 'WhatsApp'],
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
