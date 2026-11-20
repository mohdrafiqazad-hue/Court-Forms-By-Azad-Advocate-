# Court Forms

Court ke routine forms bharne ki offline web app. Fields bharein, live preview dekhein, aur court ke exact printed format mein **Word** aur **PDF** export karein.

Abhi ka form: **Form Nakal** (Form for Copies), District Courts Jalandhar. Aage aur forms judenge.

## Kaise chalayein
- **Local server se:** repo folder mein `python3 -m http.server 8000` chalayein, phir browser mein `http://localhost:8000` kholein.
- **Seedha:** `index.html` par double-click karke Chrome ya Edge mein kholein. Is tareeke mein offline (install) wala hissa nahi chalta.

## Phone par
- Phone par form screen mein **Fill** aur **Preview** ke do tabs hain, aur neeche **Word / PDF** ke button.
- Jin phones mein share ka option hai, wahan **Share PDF** button bhi dikhega, jisse PDF seedha WhatsApp par bhej sakte hain.
- Date ke saath **Today** dabane par aaj ki tareekh bhar jati hai.
- Jo bharte hain woh phone mein apne aap save rehta hai.

## Online daalna (GitHub Pages)
1. Repo mein **Settings → Pages** kholein.
2. **Source: Deploy from a branch** chunein, phir woh branch jisme ye files hain, aur folder **`/ (root)`**. **Save** dabayein.
3. 1–2 minute baad link milega. Use phone mein Chrome mein kholein, phir **⋮ → Add to Home screen / Install app**.
4. Ek baar khulne ke baad app bina internet ke bhi chalegi.

**Har update par** `sw.js` mein `VERSION` badlein (jaise `court-forms-v1` → `court-forms-v2`), warna logon ke phone mein purani app chalti rahegi.

## Files
| File | Kaam |
|---|---|
| `index.html` | Page ka dhaancha: home screen aur form screen |
| `css/app.css` | Design (phone aur computer dono ke liye) |
| `js/engine.js` | Preview, PDF aur Word banane wala common engine |
| `js/app.js` | App ka chalna: forms ki list, fields, save, export |
| `forms/nakal.js` | Form Nakal ka format, fields aur sample case |
| `lib/` | PDF aur Word banane wali libraries (offline ke liye andar rakhi hain) |
| `manifest.webmanifest`, `sw.js`, `icons/` | App install aur offline chalne ke liye |
| `tests/smoke.js` | Har form ko export karke check karne wala test |
| `CLAUDE.md` | Claude Code ke liye poori jaankari |

## Naya form jodna
Har naya form `forms/` folder mein ek file hoga. Format hamesha asli printed form se liya jayega. Tarika `CLAUDE.md` mein likha hai.

Export ki hui file court mein dene se pehle hamesha ek baar check karein.
