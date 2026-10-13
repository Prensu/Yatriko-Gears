import type { ConfigContext, ExpoConfig } from "expo/config"

/**
 * Dynamic config so identifiers and the Google URL scheme can come from .env.
 * Values here are read when Expo builds the project (not at runtime).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ?? ""
  const androidPackage = process.env.EXPO_PUBLIC_ANDROID_PACKAGE || "np.com.yatrikogears.app"
  const iosBundleId = process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || "np.com.yatrikogears.app"

  const plugins: NonNullable<ExpoConfig["plugins"]> = [
    "expo-router",
    "expo-secure-store",
    "expo-image",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#193623",
        image: "./assets/splash-icon.png",
        imageWidth: 180,
      },
    ],
  ]

  // Google sign-in needs a native build (it does not work in Expo Go).
  // Only wire the iOS URL scheme when the id is provided.
  if (googleIosUrlScheme) {
    plugins.push(["@react-native-google-signin/google-signin", { iosUrlScheme: googleIosUrlScheme }])
  }

  return {
    ...config,
    name: "Yatriko Gears",
    slug: "yatriko-gears",
    scheme: "yatriko",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    backgroundColor: "#f7f5f0",
    ios: {
      supportsTablet: false,
      bundleIdentifier: iosBundleId,
    },
    android: {
      package: androidPackage,
      adaptiveIcon: {
        backgroundColor: "#193623",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: { favicon: "./assets/favicon.png" },
    plugins,
  }
}
