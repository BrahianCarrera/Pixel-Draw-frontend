/**
 * Expo Config Plugin: withAndroidDuplicateFix
 *
 * Adds Gradle resolutionStrategy to the root build.gradle to fix
 * "checkReleaseDuplicateClasses FAILED" errors.
 *
 * Root cause: react-native-android-widget and other libraries pull in
 * different versions of androidx.work and androidx.concurrent, causing
 * duplicate classes on the classpath during release builds.
 *
 * NOTE: We do NOT add a `dependencySubstitution` for
 * com.facebook.react:react-native → react-android here, because:
 * 1. The React Native Gradle Plugin already handles that automatically.
 * 2. Gradle 9+ requires a version in the `using module(...)` target,
 *    which we can't know statically.
 *
 * This plugin runs during `expo prebuild` so it persists after --clean.
 */

const { withProjectBuildGradle } = require('@expo/config-plugins');

const RESOLUTION_BLOCK = `\n  // withAndroidDuplicateFix — force consistent dependency versions
  configurations.all {
    resolutionStrategy {
      // Force consistent versions across all deps to avoid duplicate classes.
      force 'androidx.work:work-runtime:2.9.1'
      force 'androidx.work:work-runtime-ktx:2.9.1'
      force 'androidx.concurrent:concurrent-futures:1.2.0'
      force 'androidx.concurrent:concurrent-futures-ktx:1.2.0'
    }
  }`;

const withAndroidDuplicateFix = (config) => {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Idempotency guard — don't double-apply.
    if (contents.includes('withAndroidDuplicateFix')) {
      return config;
    }

    // The generated allprojects block always ends with:
    //   maven { url 'https://www.jitpack.io' }
    //   }
    // }
    // We inject our block right before the final closing `}` of allprojects.
    // Match the jitpack line and then capture everything up to the closing brace.
    const JITPACK_LINE = "maven { url 'https://www.jitpack.io' }\n  }\n}";
    const JITPACK_REPLACEMENT = `maven { url 'https://www.jitpack.io' }\n  }\n${RESOLUTION_BLOCK}\n}`;

    if (contents.includes(JITPACK_LINE)) {
      config.modResults.contents = contents.replace(JITPACK_LINE, JITPACK_REPLACEMENT);
    } else {
      // Fallback: inject before the closing brace of allprojects using a broader pattern
      config.modResults.contents = contents.replace(
        /allprojects \{([\s\S]*?)\n\}/,
        (match, inner) => `allprojects {${inner}\n${RESOLUTION_BLOCK}\n}`
      );
    }

    return config;
  });
};

module.exports = withAndroidDuplicateFix;
