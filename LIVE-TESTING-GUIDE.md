# EduSarthi ko live karke phone me test karna — step by step

Yeh guide un logon ke liye hai jinhe code nahi aata. Har step me likha hai ki
**kahan click karna hai**, **kya copy karna hai** aur **kya Claude se karwana hai**.

> Kisi doosre Claude chat ko yeh kaam dena hai? Is file ka **sabse neeche wala
> section** ("Claude ke liye zaroori baatein") pehle padhwa dijiye.

---

## 0. Pehle ek galatfehmi door karein

Doosre chat ne kaha tha "repo me app ka code hai hi nahi" aur "yeh Android
(Kotlin) app hai". **Dono baatein galat hain.** Galti isliye hui:

| Baat | Sach |
|---|---|
| Code kahan hai? | GitHub par branch **`claude/ecstatic-mccarthy-z2n9e3`** me. `main` branch me abhi sirf `.gitignore` aur `github-ready` folder hai, isliye `main` dekhne par code nahi dikhta. |
| App kis cheez se bana hai? | Yeh ek **website** hai (Next.js). Android app sirf ek "khidki" hai (TWA) jo yahi website phone par full screen kholti hai. Alag Android code nahi hai. |
| Iska matlab? | **Pehle website internet par live honi chahiye.** Tabhi APK kuch dikha payega. Website ke bina APK khali ya error dikhayega. |

---

## 1. Poora dhancha ek nazar me

```
 Phone (APK ya browser)
        │
        ▼
 Website  ──────────────  Vercel par chalti hai (edusarthi.com)
        │
        ├── Database + recordings ──  Supabase (Mumbai)
        └── Login code ka email ────  SendGrid
```

Aapko **5 accounts** chahiye: GitHub (hai), Supabase, Vercel, SendGrid, aur
ek domain (edusarthi.com). Google Play ka account abhi testing ke liye nahi chahiye.

---

## 2. Kya kharidna hai (speed ko dhyan me rakh ke)

Aapka niyam: free tabhi lena jab speed par 0% asar ho, ya paid bahut mehenga ho.
**Keemat badalti rehti hai — sign-up se pehle site par current price zaroor dekh lein.**

| Cheez | Sujhav | Andaazan kharcha | Kyon |
|---|---|---|---|
| Domain `edusarthi.com` | Kharidein (GoDaddy, Namecheap, Hostinger — koi bhi) | ~₹800–1,500 / saal | Android app isi naam wali site kholta hai. Email bhi isi naam se jayega. |
| **Supabase** (database + recordings) | **Pro plan**, region **Mumbai (ap-south-1)** | ~$25 / mahina | Free plan me database machine chhoti hoti hai (speed kam), project kuch din khali rehne par "so jaata" hai, aur backup nahi milta. Pro me yeh teeno theek. |
| **Vercel** (website) | **Pro plan**, function region **Mumbai (bom1)** | ~$20 / mahina | Free (Hobby) plan sirf personal, non-commercial kaam ke liye allowed hai. EduSarthi business hai, isliye Pro. Speed ka sabse bada faayda region Mumbai rakhne se aata hai. |
| **SendGrid** (login ke email) | Sabse chhota paid plan | Site par dekhein | Email ki speed plan se nahi badalti. Lekin free/trial ki limit khatam hote hi students ko login code nahi jaayega. |
| Google Play Developer | **Abhi nahi** | $25 ek baar | Sirf jab Play Store par daalna ho. Testing APK se ho jaati hai. |

**Speed ki sabse zaroori baat (free hai):** Supabase aur Vercel **dono Mumbai
region** me hon. Agar ek Mumbai aur doosra America me hua, to har page par
lagbhag 0.2–0.3 second ka faltu intezaar hoga. Paisa lagane se bhi yeh theek nahi hota — sirf sahi region se hota hai.

---

## 3. Step by step

### Step 1 — Code ko `main` branch me laana (Claude karega)

Vercel `main` branch se website banata hai. Is chat me Claude ko likhiye:

> "Branch `claude/ecstatic-mccarthy-z2n9e3` ka PR `main` me bana do."

Phir GitHub par PR kholkar **Merge pull request** dabaiye. Bas.

### Step 2 — Supabase project

1. supabase.com par sign up → **New project**.
2. Name: `edusarthi`. **Region: Mumbai (South Asia)**. Database password
   banaiye aur kahin safe likh lijiye (WhatsApp/chat me mat bhejiye).
3. Plan: **Pro** (Billing me).
4. **Storage** → **New bucket**:
   - Name: `submissions` (bilkul yahi)
   - **Public: OFF**
   - File size limit: `100 MB`
   - Allowed MIME types (ek-ek karke daalein):
     `audio/webm, audio/mp4, audio/mpeg, audio/ogg, audio/wav, video/webm, video/mp4, video/quicktime, image/jpeg, image/png, image/webp`
   - `audio/mp4` chhoot gaya to **iPhone se recording upload nahi hogi**.
5. Yeh 4 cheezein copy karke ek safe note me rakhiye:

| Naam | Kahan milega |
|---|---|
| `DATABASE_URL` | Project → **Connect** → **Transaction pooler** (port **6543**). Aakhir me `?pgbouncer=true&connection_limit=1` jodna hai. |
| `DIRECT_URL` | Connect → **Session pooler** (port **5432**) |
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → **service_role** key (anon wali nahi) |

> `db.xxxx.supabase.co` wala address **mat** lijiye — woh kaam nahi karta.
> `service_role` key database ki master chaabi hai. Kisi chat, email ya screenshot me kabhi mat daalein.

### Step 3 — Database me tables aur 2,227 words daalna (Claude karega)

Yeh kaam computer par commands chalane ka hai. Aapko khud nahi karna:

1. claude.ai/code par jis environment me yeh project chalta hai, uski
   settings me **Environment variables / secrets** me `DATABASE_URL` aur
   `DIRECT_URL` daal dijiye (chat me paste nahi karna).
2. Phir Claude ko likhiye:
   > "Environment me DATABASE_URL aur DIRECT_URL set hain. Supabase database par
   > `prisma db push`, `prisma/seed.ts` aur `prisma/import-words.ts` chala do aur batao
   > kitne words import hue."
3. Jawab me **2,227 words** aane chahiye.

### Step 4 — Vercel par website

1. vercel.com → GitHub se login → **Add New → Project** → `Edu-Sarthi` repo → **Import**.
2. **Environment Variables** me yeh sab daaliye:

| Naam | Value |
|---|---|
| `DATABASE_URL` | Step 2 wala |
| `DIRECT_URL` | Step 2 wala |
| `AUTH_SECRET` | Koi bhi 40+ akshar ka random text. Claude se kahiye "ek AUTH_SECRET bana do". |
| `NEXT_PUBLIC_APP_URL` | `https://edusarthi.com` (domain judne se pehle Vercel ka diya URL) |
| `SUPABASE_URL` | Step 2 wala |
| `SUPABASE_SERVICE_ROLE_KEY` | Step 2 wala |
| `SENDGRID_API_KEY` | Step 6 me milega |
| `EMAIL_FROM` | `noreply@edusarthi.com` |
| `CRON_SECRET` | Koi bhi lamba random text (purani recordings apne aap delete karne ke liye) |
| `AUDIO_RETENTION_DAYS` | `90` |
| `ANDROID_PACKAGE_NAME` | `com.edusarthi.app` |

   `AUTH_TRUST_HOST` **mat** daaliye (woh sirf computer par testing ke liye hai).
3. **Deploy** dabaiye.
4. Project → **Settings → Functions → Function Region → Mumbai (bom1)**. Save.
5. **Zaroori:** variable badalne ke baad hamesha **Deployments → latest → Redeploy**.
   Sirf save karne se kuch nahi badalta.

### Step 5 — Domain jodna

1. Vercel project → **Settings → Domains** → `edusarthi.com` daaliye.
2. Vercel jo DNS records batata hai, woh domain wali company ki site par daaliye.
3. 10 minute se kuch ghante lag sakte hain. Phir `NEXT_PUBLIC_APP_URL` =
   `https://edusarthi.com` karke **Redeploy**.

### Step 6 — Email (login code) chalu karna

1. SendGrid account → **Settings → Sender Authentication → Authenticate your domain** → `edusarthi.com`.
2. Jo CNAME records mile, domain wali site par daaliye. DMARC record bhi.
3. **Settings → API Keys → Create** → key copy karke Vercel me `SENDGRID_API_KEY` me daaliye → **Redeploy**.

> Jab tak yeh step poora nahi hota, live site par login email nahi jaayega aur
> app saaf error dikhayega. Yeh jaan-boojh kar hai, taaki chupchaap fail na ho.

### Step 7 — Apna teacher/admin account

1. Live site par apne email se register/login kariye.
2. Supabase → **Table Editor → User** → apni row → `role` ko `ADMIN` (ya `TEACHER`) kariye.
3. Site se sign out karke dobara sign in kariye.

### Step 8 — Phone ke browser me test (APK se pehle)

Phone me Chrome kholiye → `https://edusarthi.com`. Neeche wali list check kariye.
Yahan sab chal gaya to APK me bhi chalega.

### Step 9 — APK phone me

1. GitHub → repo → **Actions** → **Android app** → **Run workflow** (branch `main`) → 5–10 minute ruk kar run kholiye.
2. Neeche **Artifacts** me `edusarthi-debug-apk` download kariye (zip hai, andar `.apk` hai).
3. Phone par file bhejiye (Drive/WhatsApp) → tap → "Install unknown apps" allow → **Install**.
4. Test APK me upar ek chhoti URL bar dikhegi. Yeh normal hai. Play Store wale version me nahi dikhegi (`android/README.md`).

> APK `edusarthi.com` kholta hai. Agar domain abhi nahi juda, Claude se kahiye:
> "APK ko Vercel wale URL par point kar do" (`android/gradle.properties` me `twaHost`).

---

## 4. Test checklist (phone par)

- [ ] Email code se login, aur email link se login
- [ ] Dashboard khulta hai, neeche 5 tab dikhte hain
- [ ] **Flashcard:** tap se card palatta hai, left/right swipe se agla/pichhla card aata hai, do ungli se zoom hota hai
- [ ] Known / Unknown dabane par agla card aata hai
- [ ] Remark ▾ → ⭐ lagta hai, note save hota hai
- [ ] Side 3 → **Record yourself for audit** → recording bhejna
- [ ] iPhone ho to wahan bhi recording upload
- [ ] Teacher account se queue me recording dikhti hai, audit bhejna
- [ ] Student ko audit dikhta hai, note par tap karne se recording wahan se chalti hai
- [ ] Settings → Theme aur Flashcard colour badalna
- [ ] Internet band karke app kholna → "offline" page aata hai
- [ ] Slow net (2G/3G) par page kitna der me khulta hai — note kariye

**Kuch galat mile to** Claude ko yeh teen cheezein bhejiye: (1) screenshot, (2) kya dabaya tha, (3) phone ka naam. Password ya key kabhi nahi.

---

## 5. Kya **mat** kariye

- Keys, passwords, database URL kisi chat me paste mat kariye. Sirf Vercel aur Claude environment settings me daaliye. Galti se paste ho jaaye to Supabase me key **rotate** (nayi) kar lijiye.
- `main` ke alawa kisi branch se Vercel deploy mat kariye.
- Supabase bucket ko Public mat kariye.

---

## Claude ke liye zaroori baatein (doosre chat ko yeh padhwaiye)

- **Code branch `claude/ecstatic-mccarthy-z2n9e3` par hai**, `main` par nahi (jab tak Step 1 ka PR merge na ho). Pehle `git fetch origin` aur `git checkout claude/ecstatic-mccarthy-z2n9e3` kariye. `main` dekh kar "code nahi hai" mat kahiye.
- Stack: Next.js 16 (App Router), TypeScript, Tailwind v4, Prisma 6, Auth.js v5 (JWT), Supabase Postgres + Storage, Vercel. Android = TWA wrapper in `android/` (koi Kotlin app code nahi), APK GitHub Actions `.github/workflows/android.yml` se.
- Kaam shuru karne se pehle **`CLAUDE.md`** padhiye — coding rules wahi hain. Deploy details: `DEPLOY.md`, `README.md`, `android/README.md`. Saare env variables: `.env.example`.
- Existing Supabase database me purane themes (Rose/Ocean) hon to `db push` se **pehle** `prisma/migrate-themes.sql` chalaiye (README me likha hai). Naye database me zaroorat nahi.
- Owner coder nahi hai: har step click-by-click, Hinglish me, ek baar me ek step. Keys chat me mat maangiye; environment secrets use karwaiye.
