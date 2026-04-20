import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.provisio.app',
  appName: 'Provisio',
  webDir: 'dist',
  android: {
    backgroundColor: '#0f0f14',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f0f14',
    },
  },
};

export default config;
