/* i Court Forms — settings the owner fills in. See SETUP.md.
   These values are not secret: every web app ships its Firebase config to the browser.
   Security comes from firestore.rules, not from hiding these. */
window.ICF_CONFIG = {
  // Firebase console → Project settings → General → Your apps → Web app → "SDK setup and configuration" → Config
  firebase: {
    apiKey: 'AIzaSyDK9UNrw7x-l8WKRRCgs9LCnQX1RXo4DTg',
    authDomain: 'i-court-forms.firebaseapp.com',
    projectId: 'i-court-forms',
    appId: '1:131820138603:web:e4b0d904a4b42861acc12e',
  },

  // Membership payment by UPI (Google Pay or any UPI app)
  payment: {
    upiId: '',              // your business / merchant UPI ID, e.g. icourtforms@okaxis
    payeeName: 'i Court Forms',
    amount: 100,            // rupees
    days: 365,              // how long one payment unlocks the app
    planLabel: '1 year',
  },

  // Optional: WhatsApp number (with country code, digits only, e.g. 919876543210) shown to users waiting for approval
  supportWhatsApp: '',
};
