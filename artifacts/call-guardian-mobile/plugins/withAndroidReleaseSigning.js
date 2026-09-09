const { withAppBuildGradle } = require('expo/config-plugins');

const signingBlock = `
    release {
      if (System.getenv("CI") == "true") {
        storeFile file(System.getenv("CM_KEYSTORE_PATH"))
        storePassword System.getenv("CM_KEYSTORE_PASSWORD")
        keyAlias System.getenv("CM_KEY_ALIAS")
        keyPassword System.getenv("CM_KEY_PASSWORD")
      }
    }`;

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      throw new Error('Call Guardian requires the Android Groovy Gradle file for release signing.');
    }

    const contents = gradleConfig.modResults.contents;
    if (!contents.includes('CM_KEYSTORE_PATH')) {
      const signingConfigsIndex = contents.indexOf('signingConfigs {');
      if (signingConfigsIndex === -1) {
        throw new Error('Android signingConfigs block was not found during prebuild.');
      }

      const openingBraceIndex = contents.indexOf('{', signingConfigsIndex);
      gradleConfig.modResults.contents =
        contents.slice(0, openingBraceIndex + 1) +
        signingBlock +
        contents.slice(openingBraceIndex + 1);
    }

    const updatedContents = gradleConfig.modResults.contents;
    const releaseBuildType = /(buildTypes\s*\{[\s\S]*?release\s*\{)([\s\S]*?)(\n\s*\})/m.exec(
      updatedContents,
    );
    if (!releaseBuildType) {
      throw new Error('Android release build type was not found during prebuild.');
    }

    const releaseBody = releaseBuildType[2];
    if (!releaseBody.includes('signingConfigs.release')) {
      const replacement = releaseBody.replace(
        /signingConfig\s+signingConfigs\.debug/,
        'signingConfig System.getenv("CI") == "true" ? signingConfigs.release : signingConfigs.debug',
      );
      gradleConfig.modResults.contents =
        updatedContents.slice(0, releaseBuildType.index) +
        releaseBuildType[1] +
        replacement +
        releaseBuildType[3] +
        updatedContents.slice(releaseBuildType.index + releaseBuildType[0].length);
    }

    return gradleConfig;
  });
}

module.exports = withAndroidReleaseSigning;