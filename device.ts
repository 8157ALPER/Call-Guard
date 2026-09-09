import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_TOKEN_KEY = 'call-guardian-device-token';
let tokenRequest: Promise<string> | null = null;

function getApiOrigin(): string {
  const configuredDomain = process.env.EXPO_PUBLIC_DOMAIN;
  if (configuredDomain) {
    return configuredDomain.startsWith('http')
      ? configuredDomain
      : `https://${configuredDomain}`;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  throw new Error('Call Guardian needs EXPO_PUBLIC_DOMAIN to register this device.');
}

async function registerDevice(): Promise<string> {
  const response = await fetch(`${getApiOrigin()}/api/device/register`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('This device could not be registered securely.');
  const data = (await response.json()) as { token?: string };
  if (!data.token) throw new Error('The protection service returned an invalid device key.');
  await AsyncStorage.setItem(DEVICE_TOKEN_KEY, data.token);
  return data.token;
}

export async function getDeviceToken(): Promise<string> {
  const savedToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  if (savedToken) return savedToken;

  tokenRequest ??= registerDevice().finally(() => {
    tokenRequest = null;
  });
  return tokenRequest;
}