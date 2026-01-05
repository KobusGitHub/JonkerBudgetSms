import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'JonkerBudgetSms',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SMSInboxReader: {
      android: {
        name: "ai.soliman.plugins.messagereader.MessageReaderPlugin"
      }
    }
  }
};

export default config;
