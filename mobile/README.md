# Flight Atlas · Android beta

This is a **separate Android application** powered by Capacitor 8 and the existing Flight Atlas UI and data from \`../app\`. Desktop Electron/SimConnect and Windows release configuration remain unchanged.

## What is implemented

- Android-only graphite UI (#181819), touch bottom navigation and responsive route catalog.
- Existing route records and public Supabase content are bundled/synced with the same Supabase project.
- Native Android requests for METAR and SimBrief XML; external links open via Android Custom Tabs.
- Supabase Discord OAuth initiated in Custom Tabs; Android callback \`flightatlas://auth/callback\` handled by Capacitor App plugin.
- Original desktop update overlays and Windows SimConnect are deliberately excluded from the mobile UI.
- VATSIM Radar opens the official website; it is *not* reproduced or repackaged.

## Build on GitHub (no local Android Studio required)

Go to **Actions → Android beta → Run workflow** or push code under \`mobile/**\`.
The completed run stores \`Flight-Atlas-Android-debug-APK\` (install on Android) and \`Flight-Atlas-Android-unsigned-AAB\` (unsigned test output; NOT yet uploadable to Google Play).

## Build locally

Install Node 22+, Java 21, Android SDK 36 and Android Studio.

\`\`\`bash
cd mobile
npm install
npm run build:web
npx cap add android
npm run android:patch
npx cap sync android
cd android
./gradlew assembleDebug bundleRelease
\`\`\`

Debug APK: \`mobile/android/app/build/outputs/apk/debug/app-debug.apk\`.
Unsigned release app bundle: \`mobile/android/app/build/outputs/bundle/release/app-release.aab\` (sign before publishing; do **not** upload developer keystores to GitHub).

## Not yet production ready

- This is a **beta**. Charts depend on Electron custom protocol proxy and may not work on Android until replaced with an authorized HTTPS API; desktop-only simulator integration cannot run on a phone.
- Check OAuth redirect in Supabase allow list and Discord app setup, then test sign-in, session refresh and app resume on a physical Android device.
- Audit external mod download links and charts for intellectual property / content rights before Google Play.
- Add a functional account-deletion request flow **inside and outside** the app and publish privacy policy / data-safety disclosures.
- Add an original app icon, screenshots, store listing, age-rating questionnaire, real-device tests, error monitoring, and signing setup.
- Google Play requires a **signed release AAB** (NOT the debug APK/unsigned AAB) targeting API 36+ since August 31, 2026.
- For a new personal developer account created after Nov 13, 2023, complete 12 opted-in closed testers for 14 continuous days before requesting production access. Owner must be an adult.

Build output is intended for smoke testing, not yet a claim of Play Store approval.
