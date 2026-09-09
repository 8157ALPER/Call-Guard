# Call Guardian GitHub upload package

Upload the extracted contents of this package to the root of the GitHub repository. Keep the directory structure unchanged; do not upload this ZIP as a single repository file.

The CodeMagic workflow is `codemagic.yaml` at the repository root. It uses personal-account environment variables and does not require a Team or Code Signing Identity.

Before running CodeMagic:
1. Connect this GitHub repository to your CodeMagic personal account.
2. Create `call-guardian-signing` in the app's Environment variables and add:
   - Secret `CM_KEYSTORE`: base64 contents of the Call Guardian `.jks` file.
   - Secret `CM_KEYSTORE_PASSWORD`: the keystore password.
   - Secret `CM_KEY_ALIAS`: `call_guardian`.
   - Secret `CM_KEY_PASSWORD`: the key password.
   - Regular `CM_KEYSTORE_PATH`: `$CM_BUILD_DIR/call_guardian_upload_key.jks`.
3. Keep `EXPO_PUBLIC_DOMAIN` in `call-guardian-production`.
4. Publish and verify the Call Guardian API before distributing the Android build.
5. Run the `android-release` workflow and download `app-release.aab`.

Do not add `.env` files, API keys, database URLs, keystores, service-account files, `node_modules`, `.expo`, or generated `android`/`ios` folders.
