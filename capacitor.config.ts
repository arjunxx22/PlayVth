import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The native apps are thin shells that load the hosted PlayVth web app.
 * Set PLAYVTH_APP_URL to your production HTTPS origin before running `npx cap sync`.
 * mobile/www only holds an offline fallback page.
 */
const APP_URL = process.env.PLAYVTH_APP_URL || "https://app.playvth.com";

const config: CapacitorConfig = {
  appId: "com.playvth.app",
  appName: "PlayVth",
  webDir: "mobile/www",
  server: {
    url: APP_URL,
    cleartext: false,
    // Keep navigation inside the shell for the app origin; other links open the system browser.
    allowNavigation: [new URL(APP_URL).host, "checkout.razorpay.com", "api.razorpay.com", "*.razorpay.com"],
  },
  ios: { contentInset: "automatic", scheme: "PlayVth" },
  android: { allowMixedContent: false, backgroundColor: "#0f172a" },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, launchAutoHide: true, backgroundColor: "#0f172a", showSpinner: false },
    StatusBar: { style: "DARK", backgroundColor: "#0f172a" },
  },
};

export default config;
