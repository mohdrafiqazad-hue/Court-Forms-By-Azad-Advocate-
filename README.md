# i Court Forms

Court ke routine forms bharne ki web app. Fields bharein, live preview dekhein, aur court ke exact printed format mein **Word** aur **PDF** export karein. Install hone ke baad bina internet bhi chalti hai.

Abhi ka form: **Form Nakal** (Form for Copies), District Courts Jalandhar. Aage aur forms judenge.

## App kaise khulti hai
1. **Google se login**
2. User ko **"Waiting for approval"** dikhta hai, aur woh aapki app mein **Team → Requests** mein aa jata hai
3. Aap **Approve** karte hain, aur uski app apne aap khul jaati hai. **Remove** karne par band ho jaati hai.
4. Malik (`mohdrafiqazad@gmail.com`) ke liye app hamesha khuli hai. Home par **"Owner · Team"** dabakar approve/remove karte hain (Madhur Ganga jaisa, app ke andar hi).
5. Approval phone mein yaad rehti hai, toh app offline bhi khulti hai (har 30 din mein ek baar online check)

Live: **https://mohdrafiqazad-hue.github.io/Court-Forms-By-Azad-Advocate-/** (GitHub Pages; Firebase par bhi: i-court-forms.web.app) · Setup ki poori jaankari: **[SETUP.md](SETUP.md)**

## Phone par
- Form screen mein **Fill** aur **Preview** ke tabs, aur neeche **Word / PDF** ke button.
- **Share PDF** se PDF seedha WhatsApp par.
- Date ke saath **Today** se aaj ki tareekh.
- Bhara hua form phone mein apne aap save rehta hai. Ye data server par nahi jaata.

## Files
| File | Kaam |
|---|---|
| `index.html` | Login, approval ka intezaar, home aur form screen |
| `js/team.js` | Team screen (sirf malik): Requests / Approved / Removed |
| `js/config.js` | **Aapki settings:** Firebase config, WhatsApp number |
| `js/gate.js` | Login aur approval ki jaanch |
| `js/engine.js` | Preview, PDF aur Word banane wala engine |
| `js/app.js` | Forms ki list, fields, save, export |
| `forms/nakal.js` | Form Nakal ka format, fields aur sample case |
| `css/app.css` | Design |
| `firestore.rules` | Database ki suraksha: kaun kya padh/likh sakta hai |
| `firebase.json` | Firebase Hosting aur emulator settings |
| `.github/workflows/pages.yml` | Har update par app GitHub Pages (github.io) par live karta hai |
| `.github/workflows/deploy.yml` | Har update par Firebase (database rules + web.app) update karta hai |
| `terms.html`, `privacy.html` | Terms aur Privacy Policy (**draft**, live se pehle poora karein) |
| `lib/` | PDF, Word aur Firebase ki libraries (offline ke liye andar) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Install aur offline ke liye |
| `tests/` | Format test aur login/approval ka poora test |
| `CLAUDE.md` | Claude Code ke liye poori jaankari |

Export ki hui file court mein dene se pehle hamesha ek baar check karein.
