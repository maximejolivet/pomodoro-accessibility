import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maximejolivet.pomodorotdah',
  appName: 'Pomodoro Accessibilité',
  webDir: 'www',
  plugins: {
    LocalNotifications: {
      // Sans silhouette dédiée, Android réduit l'icône de l'app à un carré blanc dans la
      // barre d'état : il ne garde que l'alpha, et l'icône est opaque de bord à bord.
      smallIcon: 'ic_notification',
      iconColor: '#8b6fd6'
    }
  }
};

export default config;
