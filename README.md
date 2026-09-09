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

1. Create or use a personal-account CodeMagic environment variable group called `call-guardian-signing`.
2. Base64-encode the keystore file, then add it to that group as the secret variable `CM_KEYSTORE`.
3. Add these signing variables to the same group as secrets: `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS`, and `CM_KEY_PASSWORD`.
4. Add `CM_KEYSTORE_PATH` as a regular variable with the value `$CM_BUILD_DIR/call_guardian_upload_key.jks`.
5. Create or use `call-guardian-production` and add `EXPO_PUBLIC_DOMAIN` with the public domain where the Call Guardian API is deployed, without a trailing slash.
6. Run the `android-release` workflow.
7. Download `app-release.aab` from the build artifacts, then upload it to Google Play Console.

On Windows PowerShell, copy the keystore as base64 to the clipboard with:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\call_guardian_upload_key.jks")) | Set-Clipboard
```

Paste the clipboard contents into the `CM_KEYSTORE` secret value. The keystore is decoded only on the temporary CodeMagic build machine. It is not uploaded to GitHub.

Before distributing the Android build, publish the Call Guardian API from Replit. The Replit Publish flow compares the development schema with production and applies the reviewed additions for the anonymous-device tables and device-scoped records. Do not run database schema changes from CodeMagic.

Do not commit keystores, `.env` files, API keys, Twilio credentials, database URLs, or Google Play service-account JSON files.