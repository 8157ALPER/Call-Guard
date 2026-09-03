# Call Guardian GitHub upload package

Upload the contents of this package to the root of the GitHub repository. Keep the directory structure unchanged.

The CodeMagic workflow is `codemagic.yaml` at the repository root. It builds the Expo project in `artifacts/call-guardian-mobile` and generates the Android project during the build.

Before running CodeMagic:
1. Connect this GitHub repository to CodeMagic.
2. Configure the `call_guardian_keystore` Android signing credential.
3. Configure the `call-guardian-production` environment group without committing secrets.
4. Publish the API from Replit first so the production database schema is current.

Do not add `.env` files, API keys, database URLs, keystores, service-account files, `node_modules`, `.expo`, or generated `android`/`ios` folders.
