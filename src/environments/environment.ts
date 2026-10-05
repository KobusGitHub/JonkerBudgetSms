export const environment = {
  production: false,
  appName: 'Home Budget',
  version: '2.0.1',
  smsEnabled: import.meta.env.VITE_SMS_ENABLED !== 'false'
};
