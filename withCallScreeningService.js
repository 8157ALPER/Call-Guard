const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const serviceName = '.CallGuardianCallScreeningService';

function withCallScreeningService(config) {
  config = withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error('Android application entry was not found while configuring call screening.');
    }

    application.service = application.service ?? [];
    const alreadyConfigured = application.service.some(
      (service) => service.$?.['android:name'] === serviceName,
    );

    if (!alreadyConfigured) {
      application.service.push({
        $: {
          'android:name': serviceName,
          'android:exported': 'true',
          'android:permission': 'android.permission.BIND_SCREENING_SERVICE',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.telecom.CallScreeningService' } }],
          },
        ],
      });
    }

    return manifestConfig;
  });

  return withDangerousMod(config, [
    'android',
    async (androidConfig) => {
      const source = path.join(
        androidConfig.modRequest.projectRoot,
        'native',
        'CallGuardianCallScreeningService.kt',
      );
      const destination = path.join(
        androidConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'seniorshield',
        'callguardian',
        'CallGuardianCallScreeningService.kt',
      );

      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
      return androidConfig;
    },
  ]);
}

module.exports = withCallScreeningService;