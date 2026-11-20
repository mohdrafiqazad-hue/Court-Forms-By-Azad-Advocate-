# i Court Forms — Setup guide (Firebase + payment)

App ka flow: **Google se login → ₹100 UPI / Google Pay se payment → transaction ID daalna → aap Admin panel se approve karte hain → app apne aap khul jaati hai.**

Ye sab Firebase ke **free plan (Spark)** par chalta hai. Credit card ki zaroorat nahi.

---

## Step 1: Firebase project banayein
1. https://console.firebase.google.com kholein aur apne Google account se login karein.
2. **Create a project** → naam: `i Court Forms` → Google Analytics **off** → Create.

## Step 2: Web app jodein aur config copy karein
1. Project ke andar **⚙ Project settings → General** → neeche "Your apps" mein **`</>` (Web)** dabayein.
2. Nickname: `i Court Forms web` → **Register app**.
3. Jo `firebaseConfig` dikhega, usme se 4 cheezein `js/config.js` mein bharein:
   ```js
   firebase: {
     apiKey: '...',
     authDomain: '....firebaseapp.com',
     projectId: '...',
     appId: '...',
   },
   ```
   Ye values secret nahi hain. Har web app inhe browser mein bhejti hai. Suraksha `firestore.rules` se hoti hai.

## Step 3: Google login chalu karein
1. **Build → Authentication → Get started**.
2. **Sign-in method → Google → Enable** → support email chunein → **Save**.
3. **Settings → Authorized domains**: Firebase Hosting ka domain apne aap juda hota hai. Agar GitHub Pages ya apna domain use karein toh woh yahan **Add domain** karein (jaise `mohdrafiqazad-hue.github.io`).

## Step 4: Database (Firestore) banayein
1. **Build → Firestore Database → Create database**.
2. Location: **`asia-south1 (Mumbai)`**. Ye baad mein badal nahi sakti.
3. **Production mode** chunein → Create.
4. **Rules** tab kholein → wahan ka sab mita kar is repo ki `firestore.rules` file ka poora text paste karein → **Publish**.

## Step 5: Payment ki settings
`js/config.js` mein:
- `upiId`: aapka **business / merchant UPI ID**. Google Pay for Business, PhonePe Business ya BharatPe mein free banta hai. Personal UPI ID par amount pehle se bhara hua link kai baar Google Pay rok deta hai, isliye business ID behtar hai.
- `amount`: `100` (₹)
- `days`: `365` (ek payment kitne din chalegi)
- `supportWhatsApp`: aapka WhatsApp number, country code ke saath, sirf ankde (jaise `919876543210`). Ye intezaar wali screen par dikhega. Khaali chhod sakte hain.

## Step 6: Website online karein (Firebase Hosting, free)
Ye ek baar kisi computer par karna hoga (Windows / Mac):
1. https://nodejs.org se **Node.js (LTS)** install karein.
2. Command Prompt / Terminal kholein:
   ```
   npm install -g firebase-tools
   firebase login
   ```
3. Is repo ka folder download karein (GitHub → Code → Download ZIP → extract), aur us folder mein:
   ```
   firebase use --add        (apna project chunein, alias: default)
   firebase deploy
   ```
4. Link milega: `https://<project-id>.web.app`. Yahi app ka link hai.

Firebase Hosting isliye behtar hai kyunki repo private rehte hue bhi chalta hai, aur Google login usi domain par sabse bharosemand chalta hai.

**Har badlav ke baad:** `sw.js` mein `VERSION` badlein (jaise `icf-v2` → `icf-v3`), phir `firebase deploy`.

## Step 7: Khud ko Admin banayein
1. `https://<project-id>.web.app/admin.html` kholein → apne Google account se sign in karein.
2. Page kahega "This account is not an admin" aur aapka **UID** dikhayega → **Copy UID**.
3. Firebase console → **Firestore Database → Data → + Start collection**:
   - Collection ID: `admins`
   - Document ID: copy kiya hua **UID** paste karein
   - Field: `name`, type string, value: `Owner` → **Save**
4. Admin page reload karein. Ab Pending / Members / Users dikhenge.

## Roz ka kaam (payment approve karna)
1. Admin page → **Pending** tab.
2. Har entry ka **UTR (transaction ID)** aur **₹ amount** apne bank ya UPI app ki history mein milayein.
3. Mil gaya → **Approve**. User ki app turant khul jayegi.
4. Nahi mila → **Reject** aur wajah likhein. User ko wajah dikhegi aur woh dobara try kar sakta hai.
- **Users** tab → "Give access": testers, dosto ya free accounts ko bina payment ke access.
- **Members** tab → "+365 days" (badhana) ya "Revoke" (band karna).

## Test kaise karein (live karne se pehle)
1. `amount` thodi der ke liye `1` kar dein, deploy karein.
2. Doosre Google account se app kholein → ₹1 Google Pay se bhejein → transaction ID daalein.
3. Admin page se Approve karein → app khulni chahiye.
4. Wapas `amount: 100` karein, `VERSION` badlein, deploy karein.

## Free plan ki seemayein (lagbhag)
| Cheez | Free seema | Aapke liye matlab |
|---|---|---|
| Google login | ~50,000 users / mahina | Kaafi |
| Database | 50,000 reads + 20,000 writes / din | Hazaron users ke liye kaafi |
| Hosting | 10 GB storage, ~360 MB download / din | App ~1.6 MB hai, toh roz ~200 naye install. Purane users offline cache se chalate hain. |

Seema paar hone par Firebase service rok deta hai, apne aap paisa nahi kaatta (Spark plan par).

## Local testing (developers ke liye)
```
firebase emulators:start --only auth,firestore --project demo-icf
python3 -m http.server 8002
node tests/gate-e2e.js http://localhost:8002/     # login → payment → admin → unlock
node tests/smoke.js http://localhost:8002/        # form export format
```
`?emulator` aur `?nogate` sirf `localhost` par kaam karte hain, live site par nahi.
