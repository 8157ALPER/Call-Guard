import { Platform } from 'react-native';
import { getDeviceToken } from '@/lib/device';

export type Contact = {
  id: number;
  name: string;
  phoneNumber: string;
  isEmergency: boolean | null;
  isTrusted: boolean | null;
};

export type CallAnalysis = {
  risk: number;
  summary: string;
  keywords: string[];
  mood: {
    emoji: string;
    stressLevel: number;
    description: string;
  };
};

export type CallRecord = {
  id: number;
  phoneNumber: string;
  timestamp: string | null;
  duration: string | null;
  isSuspicious: boolean | null;
  analysis: CallAnalysis | null;
};

export type Settings = {
  enableCallScreening: boolean | null;
  enableSmsAlerts: boolean | null;
  alertPhoneNumber: string | null;
  aiSensitivity: string | null;
  disableInDisaster: boolean | null;
  enableEmergencyAlerts: boolean | null;
  highContrastMode: boolean | null;
  largeTextMode: boolean | null;
};

export type Consent = {
  acceptedTerms: boolean | null;
  acceptedPrivacyPolicy: boolean | null;
  acceptedDataCollection: boolean | null;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

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

  throw new Error(
    'Call Guardian needs EXPO_PUBLIC_DOMAIN to connect to its protection service.',
  );
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${getApiOrigin()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'X-Call-Guardian-Device-Token': await getDeviceToken(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Request failed with status ${response.status}.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const guardianApi = {
  getContacts: () => apiRequest<Contact[]>('/api/contacts'),
  addContact: (contact: Omit<Contact, 'id'>) =>
    apiRequest<Contact>('/api/contacts', { method: 'POST', body: contact }),
  updateContact: (id: number, contact: Partial<Omit<Contact, 'id'>>) =>
    apiRequest<Contact>(`/api/contacts/${id}`, {
      method: 'PATCH',
      body: contact,
    }),
  deleteContact: (id: number) =>
    apiRequest<void>(`/api/contacts/${id}`, { method: 'DELETE' }),
  getCalls: () => apiRequest<CallRecord[]>('/api/calls'),
  analyzeCall: (phoneNumber: string, transcript: string) =>
    apiRequest<CallRecord>('/api/calls/analyze', {
      method: 'POST',
      body: { phoneNumber, transcript },
    }),
  getSettings: () => apiRequest<Settings>('/api/settings'),
  updateSettings: (settings: Partial<Settings>) =>
    apiRequest<Settings>('/api/settings', { method: 'PATCH', body: settings }),
  getConsent: () => apiRequest<Consent>('/api/consent'),
  saveConsent: (consent: Consent) =>
    apiRequest<Consent>('/api/consent', { method: 'PATCH', body: consent }),
};