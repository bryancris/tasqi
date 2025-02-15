
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2ee8062ad14a4c1596ef4a060048af48',
  appName: 'tasqi',
  webDir: 'dist',
  server: {
    url: 'https://2ee8062a-d14a-4c15-96ef-4a060048af48.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  android: {
    compileSdkVersion: 33,
    targetSdkVersion: 33,
    minSdkVersion: 23
  },
  ios: {
    contentInset: 'always',
  }
};

export default config;
