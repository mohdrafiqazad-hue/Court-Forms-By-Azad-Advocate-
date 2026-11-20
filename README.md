# i Court Forms

Court ke routine forms bharne ki web app. Fields bharein, live preview dekhein, aur court ke exact printed format mein **Word** aur **PDF** export karein. Install hone ke baad bina internet bhi chalti hai.

Abhi ka form: **Form Nakal** (Form for Copies), District Courts Jalandhar. Aage aur forms judenge.

## App kaise khulti hai
1. **Google se login**
2. **₹100 membership** (1 saal): Google Pay ya kisi bhi UPI app se payment, phir 12 ankon ka UPI transaction ID daalna
3. **Admin approve karta hai** (`admin.html`), aur app apne aap khul jaati hai
4. Membership phone mein yaad rehti hai, toh app offline bhi khulti hai

Setup ke poore steps (Firebase, payment, website online karna, admin banna): **[SETUP.md](SETUP.md)**

## Phone par
- Form screen mein **Fill** aur **Preview** ke tabs, aur neeche **Word / PDF** ke button.
- **Share PDF** se PDF seedha WhatsApp par.
- Date ke saath **Today** se aaj ki tareekh.
- Bhara hua form phone mein apne aap save rehta hai. Ye data server par nahi jaata.

## Files
| File | Kaam |
|---|---|
| `index.html` | Login, payment screens, home aur form screen |
| `admin.html`, `js/admin.js` | Admin panel: payments approve/reject, members, users |
| `js/config.js` | **Aapki settings:** Firebase config, UPI ID, price |
| `js/gate.js` | Login aur membership ki jaanch |
| `js/engine.js` | Preview, PDF aur Word banane wala engine |
| `js/app.js` | Forms ki list, fields, save, export |
| `forms/nakal.js` | Form Nakal ka format, fields aur sample case |
| `css/app.css` | Design |
| `firestore.rules` | Database ki suraksha: kaun kya padh/likh sakta hai |
| `firebase.json` | Firebase Hosting aur emulator settings |
| `terms.html`, `privacy.html` | Terms aur Privacy Policy (**draft**, live se pehle poora karein) |
| `lib/` | PDF, Word, Firebase aur QR ki libraries (offline ke liye andar) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Install aur offline ke liye |
| `tests/` | Format test aur login/payment ka poora test |
| `CLAUDE.md` | Claude Code ke liye poori jaankari |

**Har update par** `sw.js` mein `VERSION` badlein (jaise `icf-v2` → `icf-v3`), warna logon ke phone mein purani app chalti rahegi.

Export ki hui file court mein dene se pehle hamesha ek baar check karein.
