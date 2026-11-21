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

## Mere Case aur Meri Jaankari
- **Save:** bhara hua form naam ke saath (jaise "Rinki vs Surinder Singh · COMA/102/2022") **Mere Case** mein save hota hai. Dobara Save karne par wahi case update hota hai. Case ke naam ke saath **"Save as a new case"** dabane par naya case banta hai.
- **Mere Case:** list se case **kholein, copy karein** (wahi details, nayi tareekh) ya **hatayein**. Kisi bhi detail se khoj sakte hain. Home par aakhri case dikhte hain.
- **Meri Jaankari:** apna naam, chamber ka pata, zila wagaira ek baar save karein, phir har form mein ek tap se bhar jaata hai.
- **Pichhli entries:** har khane ke neeche pehle bhari hui cheezein (court, judge, purpose…) chhote buttons mein aati hain, tap karte hi bhar jaati hain.
- **Backup:** sab kuch sirf usi phone mein save hota hai (server par nahi). Mere Case → **Download backup** se file rakh lein, aur naye phone par **Restore backup** se wapas laayein.

## Client Book (client aur unke case)
- **Clients → + New client:** naam, pita/pati ka naam, pata, thana, tehsil, zila, phone, aur **us client ke case** (case ka type aur number, plaintiff, defendant, dava/apradh, gaon/shehar, court/judge, faisle ki tareekh).
- Certified copy (Form Nakal) bharte waqt **Clients** kholein, aur client ke case par **"Fill this case"** dabayein. Case ki saari details apne aap bhar jaati hain.
- Form mein bhara case seedha client mein save karna ho toh **"+ Save this form's case here"**. Case editor mein **"Take from this form"** bhi hai.
- **"Fill in as"** se client ki apni details (Plaintiff / Defendant / Applicant) bhi bhar sakte hain.

## Bhasha
App **English, हिंदी aur ਪੰਜਾਬੀ** mein chalti hai. Login screen par ya upar ki patti mein bhasha chunein; phone yaad rakhta hai. Form ke har khane ke neeche uska English naam bhi likha aata hai. **Court ka printed form (Word/PDF) hamesha English mein rehta hai**, isliye jaankari English mein hi bharein.

## Web app (phone mein install)
- Android / computer (Chrome, Edge): app mein **"Install the app"** card ya login screen par **Install** button dabayein, aur home screen par **i Court Forms** ka icon aa jayega.
- iPhone (Safari): neeche **Share** → **Add to Home Screen**.
- Install ke baad app apni window mein, bina browser ke, aur bina internet bhi khulti hai.
- Naya version aane par upar **"New version available · Refresh"** aata hai.

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
| `js/i18n.js` | Bhasha: English / हिंदी / ਪੰਜਾਬੀ ke saare shabd |
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
