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

## Step 6: Website online karein → https://i-court-forms.web.app (free)
GitHub khud deploy karta hai (`.github/workflows/deploy.yml`). Har push par website aur database rules dono update hote hain, aur `sw.js` ka `VERSION` bhi apne aap badal jata hai. Bas ek baar **deploy key** deni hai:

**A. Hosting chalu karein:** Firebase console → **Build → Hosting → Get started** → Next, Next → **Continue to console**. (Commands wale steps chhod dein.)

**B. Deploy key (service account) banayein:**
1. Kholein: `https://console.cloud.google.com/iam-admin/serviceaccounts?project=i-court-forms`
2. **+ Create service account** → naam: `github-deploy` → **Create and continue**.
3. **Role:** `Firebase Admin` chunein → **Continue → Done**.
4. List mein `github-deploy` par dabayein → **Keys** tab → **Add key → Create new key → JSON → Create**. Ek `.json` file download hogi.

**C. Key GitHub mein daalein:**
1. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.
2. Name: `FIREBASE_SERVICE_ACCOUNT`
3. Secret: downloaded `.json` file ka **poora text** paste karein (file kisi text viewer mein kholein, Select all, Copy).
4. **Add secret**. Phir phone se woh `.json` file delete kar dein.

⚠ Ye key asli chaabi hai: kisi ko na bhejein, chat mein na daalein, repo mein file ki tarah upload na karein. Sirf GitHub Secret mein.

**D. Deploy chalayein:** repo → **Actions** tab → **Deploy to Firebase** → **Run workflow**. 2–3 minute mein hara ✓ aayega, aur app `https://i-court-forms.web.app` par live hogi.

Ab repo chahein toh wapas **private** kar sakte hain. Firebase Hosting ke liye public hona zaroori nahi.

(Computer se bhi ho sakta hai: Node.js install karke `npm install -g firebase-tools`, `firebase login`, repo folder mein `firebase deploy`.)

## Step 7: Khud ko Admin banayein
1. `https://i-court-forms.web.app/admin.html` kholein → apne Google account se sign in karein.
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
1. `amount` thodi der ke liye `1` kar dein (GitHub par push hote hi deploy ho jayega).
2. Doosre Google account se app kholein → ₹1 Google Pay se bhejein → transaction ID daalein.
3. Admin page se Approve karein → app khulni chahiye.
4. Wapas `amount: 100` kar dein.

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
