# Call Guardian Mobile

The mobile app is an Expo/Android companion for Call Guardian. It provides senior-friendly access to the protection dashboard, trusted contacts, consent controls, call transcript analysis, and Android call-screening setup guidance.

## Privacy and call screening

- The Android call-screening service is opt-in: the user must select Call Guardian in Android Default apps / Call screening settings.
- It is registered as a platform-compatible call-screening entry point and passes calls through by default.
- This release does not automatically block or silence calls.
- It does **not** record or access ordinary cellular call audio.
- Submitted call transcripts are analyzed by the existing Call Guardian API. Never include passwords, card details, one-time passcodes, or other highly sensitive information.

## CodeMagic release build

The repository-root `codemagic.yaml` builds a signed Android App Bundle.

Before running it in CodeMagic:

1. Add your Android upload keystore in **CodeMagic → Teams → Code signing identities** with the reference name `call_guardian_keystore`.
2. Create a CodeMagic environment variable group called `call-guardian-production`.
3. In that group, add `EXPO_PUBLIC_DOMAIN` with the public domain where the Call Guardian API is deployed, without a trailing slash.
4. Run the `android-release` workflow.
5. Download `app-release.aab` from the build artifacts, then upload it to Google Play Console.

Before distributing the Android build, publish the Call Guardian API from Replit. The Replit Publish flow compares the development schema with production and applies the reviewed additions for the anonymous-device tables and device-scoped records. Do not run database schema changes from CodeMagic.

Do not commit keystores, `.env` files, API keys, Twilio credentials, database URLs, or Google Play service-account JSON files.