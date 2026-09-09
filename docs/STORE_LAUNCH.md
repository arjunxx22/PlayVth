# Launching PlayVth on the App Store and Google Play

This is the complete, ordered checklist from the current repository to live apps in both stores. Everything that can be prepared in code is already in the repo; the steps marked **You** need your accounts, a Mac, or a decision only you can make.

**How the mobile apps work.** The iOS and Android apps are native shells (Capacitor 7) that load the hosted PlayVth web app from your production URL, with a native icon, splash screen, status bar and an offline page. This is the fastest route to both stores and is how many booking apps ship. It means the web app must be live before the mobile apps can work.

Timeline: 1 day of setup on your side, then Google review usually takes 1 to 3 days for a new developer account and Apple review 1 to 2 days. Budget 1 to 2 weeks end to end including any review round-trip.

---

## Phase 0 — What's already done in the repo

- `capacitor.config.ts` with app ID `com.playvth.app`, app name PlayVth, production URL from `PLAYVTH_APP_URL`
- `android/` and `ios/` native projects with generated icons and splash screens (`assets/` holds the sources; regenerate with `npx @capacitor/assets generate`)
- Android release signing and versioning read from environment variables (`android/app/build.gradle`)
- `.github/workflows/android-release.yml` builds a signed `.aab` and can upload it to Google Play
- `.github/workflows/ios-release.yml` archives, exports an `.ipa` and can upload it to TestFlight
- Store-required features in the app: `/privacy`, `/terms`, in-app **Delete account** (Profile page), web app manifest and icons, safe-area padding for notched phones
- Store kit in `store/`: listing copy, data-safety answers, screenshots at the required sizes, feature graphic, icons

---

## Phase 1 — Put the web app live (You, ~1 hour)

The mobile apps load this URL, so it must be public and on HTTPS.

1. Pick a host with a persistent disk (the app uses SQLite): **Railway** is the quickest and the repo has a ready `Dockerfile` + `railway.json` (see README → Deploy to Railway). Fly.io and Render also work. On Vercel you'd first need to swap SQLite for Turso or Postgres.
2. Deploy from the branch (Railway: Deploy from GitHub repo).
3. Mount a volume at `/data`; the image already sets `PLAYVTH_DB_PATH=/data/playvth.db`.
4. Set the Razorpay variables from `.env.example` and, when you have an SMS provider, `SMS_API_KEY`. Until then the OTP is the fixed demo code.
5. Point your domain (for example `app.playvth.com`) at the host and confirm `https://app.playvth.com/privacy` opens. Both stores require this URL.
6. In the Razorpay dashboard add the webhook `https://app.playvth.com/api/payments/webhook`.
7. In GitHub → Settings → Variables, set `PLAYVTH_APP_URL` to your URL. This is what the CI builds bake into the apps.

Take a note of: **production URL**, **privacy URL** (`/privacy`), **terms URL** (`/terms`), **support email**.

---

## Phase 2 — Developer accounts (You, same day; approvals take 1 to 3 days)

| Store | Where | Cost | Notes |
|---|---|---|---|
| Apple | https://developer.apple.com/programs/enroll/ | US$99 / year | Enrol as an **organisation** if you have a D-U-N-S number (recommended for a company) or as an individual. Organisation enrolment can take several days. |
| Google | https://play.google.com/console/signup | US$25 once | New personal accounts must run a closed test with 12 testers for 14 days before production access; **organisation accounts skip this**. Enrol as an organisation if you can. |

You will also need a Mac with Xcode 16+ to open the iOS project at least once (Phase 4).

---

## Phase 3 — Android: sign, build, upload

### 3.1 Create the upload keystore (You, once, keep it forever)

```bash
keytool -genkeypair -v -keystore playvth-upload.jks -alias playvth -keyalg RSA -keysize 2048 -validity 10000
```

Store `playvth-upload.jks` and both passwords in a password manager. Losing them means losing the ability to update the app.

### 3.2 Add GitHub secrets (You)

Repository → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -i playvth-upload.jks` (macOS) or `base64 -w0 playvth-upload.jks` (Linux) |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `playvth` |
| `ANDROID_KEY_PASSWORD` | key password |
| `PLAY_SERVICE_ACCOUNT_JSON` | (optional, for automatic upload) see 3.4 |

### 3.3 Build the bundle

Run the **Android release (AAB)** workflow from the Actions tab (leave the track empty the first time), or push a tag like `v1.0.0`. Download `playvth-<version>.aab` from the workflow's artifacts.

To build locally instead: install Android Studio, then

```bash
npx cap sync android
cd android && ANDROID_KEYSTORE_PATH=/path/playvth-upload.jks ANDROID_KEYSTORE_PASSWORD=… ANDROID_KEY_ALIAS=playvth ANDROID_KEY_PASSWORD=… ./gradlew bundleRelease
```

### 3.4 Play Console setup (You)

1. **Create app** → name PlayVth, App, Free, accept declarations.
2. **Set up your app** checklist (left sidebar):
   - App access: "All or some functionality is restricted" → add the reviewer login from `store/LISTING.md` (phone 9000000001, OTP 123456).
   - Ads: No ads.
   - Content rating: fill the questionnaire (answers in `store/LISTING.md`).
   - Target audience: 18+.
   - News app: No. COVID app: No. Data safety: answers in `store/LISTING.md`. Government apps: No. Financial features: select "Payments / money transfer" is **not** required since Razorpay processes payments; pick "My app doesn't provide any financial features" unless a reviewer asks otherwise.
   - Privacy policy: `https://app.playvth.com/privacy`.
3. **Main store listing**: paste short and full descriptions from `store/LISTING.md`, upload `store/graphics/play-icon-512.png`, `store/graphics/play-feature-graphic-1024x500.png`, and the phone screenshots from `store/screenshots/android-phone/`.
4. **App signing**: accept Play App Signing (default). Upload the `.aab` under **Testing → Internal testing → Create release**. Add yourself as a tester and install from the opt-in link to verify the shell loads your site.
5. (Optional automation) Play Console → Setup → API access → create a service account with "Release manager" role, download its JSON key, paste it into the `PLAY_SERVICE_ACCOUNT_JSON` secret. The workflow can then upload straight to the chosen track. Note: the very first upload of a new app must be done manually in the console.
6. **Production → Create release** → pick the bundle → review → **Start rollout**. Personal accounts must first complete the 14-day closed test with 12 testers.

---

## Phase 4 — iOS: certificates, build, upload

### 4.1 One-time setup in Xcode (You, on a Mac, ~30 min)

```bash
git clone <repo> && cd PlayVth && npm ci
npx cap sync ios
cd ios/App && pod install && open App.xcworkspace
```

In Xcode: select the **App** target → **Signing & Capabilities** → tick *Automatically manage signing* → choose your Team. Xcode registers the bundle ID `com.playvth.app` and creates a development certificate. Run once on a simulator or your iPhone to confirm the shell loads the site.

Under **General**: set Version `1.0.0`, Build `1`, and deployment target iPhone only (untick iPad) unless you want to upload iPad screenshots too.

### 4.2 App Store Connect (You)

1. https://appstoreconnect.apple.com → **My Apps → +** → New App: iOS, name PlayVth, bundle ID `com.playvth.app`, SKU `playvth-ios`.
2. **App Information**: category Sports, privacy policy URL, content rights.
3. **App Privacy**: answer per the "nutrition labels" section of `store/LISTING.md`.
4. **Pricing**: Free, all territories or India first.
5. **Version 1.0.0**: upload screenshots from `store/screenshots/ios-6.7/`, paste description, keywords, subtitle, support and marketing URLs, and the **App Review notes** with the demo login.
6. Sign-in required: yes → provide the demo phone and OTP.

### 4.3 First upload

Simplest: in Xcode, **Product → Archive → Distribute App → App Store Connect → Upload**. The build appears in App Store Connect after processing (10 to 30 min). Add it to the version and to **TestFlight**; install TestFlight on your phone and smoke-test the whole booking flow with a Razorpay test card.

### 4.4 CI uploads afterwards (optional)

To let the `iOS release (TestFlight)` workflow archive and upload:

| Secret | How to get it |
|---|---|
| `APPLE_TEAM_ID` | developer.apple.com → Membership |
| `IOS_DIST_CERT_P12_BASE64` | Xcode → Settings → Accounts → Manage Certificates → create *Apple Distribution*; export from Keychain Access as `.p12`; `base64 -i dist.p12` |
| `IOS_DIST_CERT_PASSWORD` | the `.p12` password |
| `IOS_PROVISIONING_PROFILE_BASE64` | developer.apple.com → Profiles → + → App Store → bundle `com.playvth.app` → download; `base64 -i playvth.mobileprovision` |
| `IOS_PROVISIONING_PROFILE_NAME` | the profile's name as typed on the portal |
| `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_BASE64` | App Store Connect → Users and Access → Integrations → App Store Connect API → generate key with *App Manager* role; download the `.p8` once; `base64 -i AuthKey_XXXX.p8` |

Then run the workflow or push a `v*` tag.

### 4.5 Submit for review

App Store Connect → version 1.0.0 → select the build → **Add for Review → Submit**.

---

## Phase 5 — Review risks and how they are handled

| Risk | Where it bites | Handling |
|---|---|---|
| Apple 4.2 "Minimum functionality" for web-wrapper apps | iOS review | The app has real booking, payments, community and Karma features and native splash/status-bar integration. In review notes, describe the app as a sports booking marketplace and give the demo login. If rejected, the standard fix is to add one or two native capabilities: push notifications for booking reminders and device location for "near me". Both are Capacitor plugins and can be added in a day. |
| Apple 5.1.1(v) account deletion | iOS review | Implemented: Profile → Delete account. Mention it in review notes. |
| Apple 3.1.1 In-App Purchase | iOS review | Not applicable: bookings are physical-world services (Apple explicitly allows external payment for real-world goods and services), so Razorpay is fine. Say so in the notes if asked. |
| Play "Login credentials for review" | Play pre-launch | App access section filled with the demo login. |
| Play Data safety mismatch | Play review | Answers in `store/LISTING.md` match what the app collects. |
| Play "account deletion" policy (web + in-app) | Play review | In-app deletion plus the privacy page describes the email route. Add the privacy URL as the "delete account URL" in Data safety. |
| Mixed content / HTTP | Both | `capacitor.config.ts` disallows cleartext; production must be HTTPS. |
| New Google personal account 14-day closed test | Play production | Use an organisation account, or plan the 14 days. |

---

## Phase 6 — Ship an update

1. Bump nothing in code; versions come from the git tag.
2. `git tag v1.0.1 && git push --tags` → both workflows build; Android uploads to the internal track automatically if the service-account secret is set; iOS uploads to TestFlight if the Apple secrets are set.
3. Promote in Play Console (internal → production) and in App Store Connect (pick the new build, submit).

Because the apps load the hosted site, **most product changes need no store release at all**: deploy the web app and every user has it immediately. Store releases are only needed for native changes (icon, splash, plugins, Capacitor upgrades).

---

## Quick checklist

- [ ] Web app live on HTTPS with `PLAYVTH_APP_URL` set in GitHub variables
- [ ] Razorpay live keys and webhook configured
- [ ] SMS OTP provider connected (or reviewer note explaining the fixed demo OTP for test numbers)
- [ ] Apple Developer Program enrolled; Google Play Console enrolled (organisation)
- [ ] Android upload keystore created and secrets added
- [ ] First `.aab` uploaded to Internal testing and installed on a device
- [ ] Play listing, data safety, content rating, app access, privacy URL completed
- [ ] Xcode signing set up; first archive uploaded; TestFlight smoke test done
- [ ] App Store listing, privacy labels, screenshots, review notes completed
- [ ] Submit both; monitor review emails; reply within 24 h to any question
