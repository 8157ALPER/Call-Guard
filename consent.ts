import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = 'call-guardian-consent-accepted';

export async function hasAcceptedConsent(): Promise<boolean> {
  return (await AsyncStorage.getItem(CONSENT_KEY)) === 'true';
}

export async function saveAcceptedConsent(): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, 'true');
}