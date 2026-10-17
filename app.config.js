module.exports = {
  expo: {
    name: "LifeOS",
    slug: "lifeos",
    version: "1.9.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0a0a0f"
    },
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.lifeos.app"
    },
    android: {
      package: "com.mylifeos.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a0a0f"
      }
    },
    web: { favicon: "./assets/favicon.png" },
    scheme: "lifeos",
    extra: {
      eas: { projectId: "922d2216-712c-47bd-a77a-9118932806b2" }
    },
    plugins: [
      "expo-asset",
      "expo-web-browser"
    ]
  }
};