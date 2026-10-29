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

### Step 3 — Database me tables, 2,227 words aur 1,430 chunks daalna (GitHub ka ek button)

Claude ke cloud computer se Supabase database tak connection nahi ban sakta,
isliye yeh kaam GitHub khud karega. Aapko sirf copy-paste aur ek button:

1. GitHub par repo kholiye → **Settings** → baayein taraf **Secrets and variables** → **Actions**.
2. **New repository secret** dabaiye:
   - Name: `DATABASE_URL` → Secret: Step 2 wala transaction pooler address (6543 wala, aakhir me `?pgbouncer=true&connection_limit=1` ke saath) → **Add secret**
   - Phir dobara **New repository secret**: Name: `DIRECT_URL` → Secret: session pooler address (5432 wala) → **Add secret**
   - Dono me `[YOUR-PASSWORD]` ki jagah apna database password likhna na bhoolein.
3. Repo me upar **Actions** tab → baayein list me **Database setup** → daayein **Run workflow** → hara **Run workflow**.
4. 3–5 minute baad run par ✅ hara tick aana chahiye. Andar "Load flashcard words" step kholenge to
   `Words imported or updated: 2227` likha dikhega, aur "Load chunk cards" me
   `Chunks imported or updated: 1430`.
5. ❌ laal cross aaye to us run ka screenshot Claude ko bhejiye (secret wahan dikhte nahi, bhejna safe hai).

> Yeh button dobara dabane se kuch kharab nahi hota — jo pehle se hai woh update hota hai, double nahi.
> **Region check:** 6543 wale address me `ap-south-1` likha ho to project Mumbai me hai. Kuch aur ho (jaise `us-east-1`) to abhi naya project Mumbai me bana lijiye — baad me badalna mushkil hai.

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

### 4b. Settings ke naye kaam (phase E–L) — branch `claude/blissful-euler-9j0h4c` merge hone ke baad

Preview deployments band hain, isliye yeh sab merge ke baad live site par hi dikhega.
1. Merge ke baad GitHub → **Actions → Database setup** ek baar chalaiye (naya `AppSetting` table; koi data nahi mitta).
2. Vercel me check kariye: **Settings → Cron Jobs** me 7 jobs dikhni chahiye (retention, reminders, aur reminders/7, /9, /13, /17, /21).

**Admin account se:**
- [ ] Admin menu me **Site settings** → "Recordings per student per day" 3 karke Save → student ke practice page par "3 recordings a day" dikhe

**Student account se:**
- [ ] Settings → Email → **Daily flashcard reminder** → sheet me on karke time chuniye (jaise 9 am) → row par "9 am" dikhe, page reload karke bhi
- [ ] Settings → Flashcards → **Read-aloud voice** → British aur Slow → kisi card ka speaker dabaiye → awaaz badli
- [ ] **Reduce motion** on → card palatte waqt ghoomta nahi
- [ ] **Hide Hindi meanings** on → support card aur Excel deck card par Hindi box chhupe; **Hide Hindi→English questions** wala alag switch on karke side 3 ka translate sawaal chhupe
- [ ] Practice page par "**2 left today**" dikhe (ya jo number admin ne rakha); utni recording bhejne ke baad "Today's recordings for audit are sent" card aaye (teacher ne jo recording wapas bheji ho, uski nayi recording phir bhi jaa sake)
- [ ] Hindi sawaal chhupane ke baad practice side par numbering 1, 2, 3, 4… bina gap ke ho
- [ ] Audit kholne par recording **Audit playback speed** wali speed se chale
- [ ] Settings → Account & security → **Change password** (purana password chahiye) → sab devices se sign out, naye password se login, aur purane email par "password changed" email
- [ ] Settings → Account & security → **Change email** → naye email par code → badalne ke baad naye email se login, purane email par suchna
- [ ] Profile → mobile number save karna aur khaali karke hatana

**Teacher account se:**
- [ ] Settings me sirf teacher wale options (student ke flashcard/audit wale nahi); **Daily queue email** on → shaam ~7 baje queue me recordings hon to email aaye
- [ ] Settings → Email → **Each new recording** on → student recording bheje → turant email aaye

**Guest se (Continue as guest):**
- [ ] Kuch cards padhiye → Settings → **Keep your progress** → naya email → code → account full ho jaaye, cards bache rahe
- [ ] Doosra guest → apne **purane student account ka email** → code → "Add my progress" → us email se login karke cards dikhen

### 4c. Naya simple Settings page (29 Oct) — phone par check kariye

Har setting ab ek jaisi row hai: upar naam, neeche chhoti line (2 line tak). On/off wali row me switch; baaki row me `›`, jo neeche se sheet kholti hai (computer par beech me box).
- [ ] Header ka ⚙ **Settings** seedha Settings page khole (dropdown nahi) — student, teacher, admin teeno me
- [ ] Groups dikhen: Appearance, Flashcards (sirf student), Recordings, Email, Account & security, Share; guest ke liye sabse upar **Keep your progress**
- [ ] **Theme** row → sheet → Dark chuniye → peeche wala page turant dark ho; **Done** se band; row par "Dark" likha ho
- [ ] **Text size** → Larger (A+) → text bada ho; row par "A+"
- [ ] Sheet band karne ke teeno tareeke: ✕, **Done**, aur sheet ke bahar (dhundhle hisse par) tap
- [ ] Koi bhi switch on/off karke page reload → wahi bacha rahe
- [ ] Menu → **Share EduSarthi** se Settings khule to Share wali sheet apne aap khul jaaye
- [ ] **Sign out** row → sheet → Sign out → login page; guest me pehle chetavni dikhe
- [ ] **Change password** sheet seedha form khole; kuch type karke ✕ dabaiye, phir kholiye → saare fields khaali hon
- [ ] Change email / Change password sheet ke bahar tap karne se band na ho (✕ ya Cancel se ho)
- [ ] Doosre phone ya browser me login kariye → wahi theme dikhe jo account me chuna tha
- [ ] Phone par koi row ka naam kata hua (…) ya neeche wali line 2 se zyada line ki na ho
- [ ] Admin menu me **Site settings** (sab ke liye audit limit) aur ⚙ Settings (apni settings) alag-alag hon

### 4d. Naya Dashboard (phase 1, 2 aur 3, 29 Oct) — merge aur Actions → Database setup ke baad phone par check kariye

Student account se login kariye (jisme kuch cards aur recordings hon), phir ek bilkul naya account aur ek guest bhi try kariye.
- [ ] Dashboard khulte hi upar: naam, ek line ("N things left today · X XP to your goal"), aur 🔥 streak aur ⭐ XP · Stage wale do pill
- [ ] Pehli screen par hi **Today card** (ring, streak, hafte ke 7 gol) aur **Do this next** dikhen; bina scroll kiye
- [ ] 10 cards review kariye, Dashboard par wapas aaiye → ring aage badhe, "Safe for today ✓" dikhe, aaj ka gola bhar jaaye
- [ ] **Today's tasks** me jo kaam ho gaya uspar ✓ aur line cut; har row tap karne par sahi page khule
- [ ] 🔥 pill tap → sheet me is mahine ka calendar, longest streak, aur rule; **Done**, ✕ aur bahar tap — teeno se band ho
- [ ] ⭐ pill tap → XP sheet me aaj / is hafte / best day, XP ke rules, aur "Daily goal" row → Settings ki Daily goal sheet seedha khule
- [ ] Settings → Flashcards → **Daily goal** → 20 XP chuniye → Dashboard ka ring "of 20 XP" dikhaye; **Weekly goal** → 3 days → "Week goal: … of 3 days"
- [ ] Daily goal pura hone par ring hara ho aur tick ek baar "pop" ho; reload karne par dobara pop na ho (Settings → Reduce motion on ho to bilkul animation na ho)
- [ ] Naya account: "Welcome", aur **Getting started** list (level aur goal, pehle 10 cards, pehli recording, pehla audit)
- [ ] Guest: recording ki jagah **Keep your progress** row; streak aur XP dikhen
- [ ] Teacher ne recording wapas bheji ho to sabse upar laal **Re-record** row aur "Action needed"
- [ ] Computer par do column: baayen kaam, daayen Today card, Stage aur Notices
- [ ] Profile → Badges me 14 badges; streak wale "Learn N days in a row" kehte hon
- [ ] Today card par "❄ 1 freeze" dikhe (naya account 1 freeze se shuru hota hai); streak sheet me "1 of 2 streak freezes ready"
- [ ] Streak chalte hue ek din kuch na padhiye; agle din Dashboard par "A freeze saved your streak yesterday.", us din ke gole par ❄, aur streak wahi rahe
- [ ] Computer par kisi bhi student page (jaise Today's review) ke header me 🔥 streak aur XP dikhen; ek card karke doosre page par jaaiye → XP badh jaaye; Dashboard par header me ye na dikhen (wahan upar pills hain)
- [ ] Admin → Content → kisi module me "Skill focus: Fluency" chuniye → jis student ki fluency sabse kam hai uske Dashboard par "Practise fluency" button → sirf wahi modules + "Show all modules"
- [ ] Daily reminder email (cards due ho, streak ho, aaj 10 XP se kam) me "Your N-day streak needs 10 XP today" line
- [ ] Ek hafta weekly goal pura kariye; agle Monday freeze ek badhe (2 se zyada nahi) aur Profile me "Weekly goal met" badge mile

---

### 4e. Naya Profile page (29 Oct) — branch `claude/busy-johnson-epz1lg` merge hone ke baad

Pehle yeh do kaam, isi order me:
1. Merge ke turant baad GitHub → **Actions → Database setup** chalaiye (naya column `User.avatarKey`; koi data nahi mitta). Iske bina live par Profile page khulega hi nahi. Agar Dashboard (4d) ke baad Database setup abhi tak nahi chala, to yahi ek run dono ke tables bana dega.
2. Admin → **Announcements** se privacy badlaav ka email bhejiye. Privacy page par photo wali nayi line hai, aur page ka vaada hai ki badlaav se pehle email jaayega.

**Student account se (phone par):**
- [ ] Profile khule: upar naam, STU ID, **Edit profile** aur **Share progress**; neeche streak tiles, My goal, Speaking scores, Practice calendar, Badges (17), My content, Shortcuts, Account and privacy
- [ ] Edit profile → **Add a photo** → gallery se photo → ungli se khiskaiye, zoom → **Use photo** → photo dikhe; page reload karke bhi
- [ ] Photo dobara badaliye → nayi dikhe; **Remove photo** → initials wapas
- [ ] **Share progress** → Photo switch on → preview me photo aaye (yeh live storage ka asli test hai) → **Share** se WhatsApp par bhejiye; **Download** se PNG save ho
- [ ] My goal → Edit → Target date chuniye → card par "N days left"
- [ ] Practice calendar → **View as list** → aaj ka din sabse upar
- [ ] Dashboard ka streak, header ka streak (computer par) aur Profile ka "Day streak" ek hi number ho (din tab ginta hai jab 10 XP ho: recording 10, naya card 2, review 1)
- [ ] Practice calendar ke neeche "N learning days" ho, aur Badges me "N of 17" Dashboard ke badges se mile
- [ ] Account and privacy → **Who sees what** → padh ke dekhiye sab sahi lage

**Teacher account se:**
- [ ] Profile par audits written, this month, students helped, turnaround; Queue row par "N waiting" = Queue page ka number
- [ ] Kisi audit par admin QA flag lagaye to teacher ke Profile → **Quality checks** me note aur exercise ka naam dikhe

**Admin account se:**
- [ ] Profile par apne actions (7 din), recent actions shabdon me
- [ ] Dispatch → done → **Flag for QA** → reason ke neeche likha ho "The teacher who wrote this audit sees this note on their Profile."

Agar photo upload ya share me photo na aaye: Claude ko batayein, `docs/PROFILE-AUDIT.md` me F4 yahi hai.

---

### 4f. Library ab Class ki jagah bar me (29 Oct) — branch `claude/bold-hopper-hxfrpd`

Database setup ki zarurat nahi. **Library ko bina login ke kholne wala hissa (Step 1b) tab tak merge mat kariye jab tak Privacy/Terms ka text badal na jaaye aur creators ko email na chala jaaye** — dekhiye `docs/PUBLIC-LIBRARY-PLAN.md`, Step 4.

**Student account se (phone par):**
- [ ] Neeche ki bar: Dashboard, Flashcard, Audited, **Library**, Profile. "Class" nahi hai
- [ ] Library par tap → Library ka page khule aur uska icon neela (lit) ho; kisi deck me jaane par bhi neela rahe
- [ ] ☰ menu: pehla group "Main pages" me bhi Library dikhe (Class nahi); baaki saare groups waise hi, "Shared and library decks" me Library ka apna row bhi
- [ ] Neeche page ke footer me pehla link **Library**
- [ ] Computer par header ki row me Library (Class ki jagah)
- [ ] Profile → Get started → "Send your first recording" abhi bhi Class page kholta hai (page hataya nahi gaya)

**Bina login ke (private window me, sirf Step 1b merge hone ke baad):**
- [ ] `/library` khule; header me Library aur Sign in; neeche student wali bar nahi
- [ ] Deck khule, saare cards padh sakein; "Sign in to study or copy this deck", ♡ aur "Sign in to report this deck" sab `/login` par le jaayein
- [ ] `/library/<deck>/study` seedha `/login` par jaaye
- [ ] Koi deck Admin → Decks se reject/take down karke dekhiye: ab wo list me nahi aata aur uska page "not found" dikhata hai

## 5. Kya **mat** kariye

- Keys, passwords, database URL kisi chat me paste mat kariye. Sirf Vercel aur Claude environment settings me daaliye. Galti se paste ho jaaye to Supabase me key **rotate** (nayi) kar lijiye.
- `main` ke alawa kisi branch se Vercel deploy mat kariye.
- Supabase bucket ko Public mat kariye.

---

## Claude ke liye zaroori baatein (doosre chat ko yeh padhwaiye)

- **Kaun sa kaam kis branch par hai, yeh `docs/PROJECT-MEMORY.md` batata hai** — pehle wahi padhiye. Jo merge ho chuka hai woh `main` par hai; nayi chats `claude/<naam>` branches par kaam karti hain, aur unka kaam merge hone tak `main` par nahi dikhta.
- Claude ka cloud environment Supabase tak nahi pahunch sakta (network policy, aur Postgres port proxy se nahi jaata). Database setup `.github/workflows/database.yml` ("Database setup", manual run) se hota hai, jo GitHub repository secrets `DATABASE_URL`/`DIRECT_URL` padhta hai.
- Stack: Next.js 16 (App Router), TypeScript, Tailwind v4, Prisma 6, Auth.js v5 (JWT), Supabase Postgres + Storage, Vercel. Android = TWA wrapper in `android/` (koi Kotlin app code nahi), APK GitHub Actions `.github/workflows/android.yml` se.
- Kaam shuru karne se pehle **`CLAUDE.md`** padhiye — coding rules wahi hain. Deploy details: `DEPLOY.md`, `README.md`, `android/README.md`. Saare env variables: `.env.example`.
- Existing Supabase database me purane themes (Rose/Ocean) hon to `db push` se **pehle** `prisma/migrate-themes.sql` chalaiye (README me likha hai). Naye database me zaroorat nahi.
- Owner coder nahi hai: har step click-by-click, Hinglish me, ek baar me ek step. Keys chat me mat maangiye; environment secrets use karwaiye.
