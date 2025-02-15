
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.tasqi',
  appName: 'tasqi',
  webDir: 'dist',
  server: {
    url: 'https://2ee8062a-d14a-4c15-96ef-4a060048af48.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;
