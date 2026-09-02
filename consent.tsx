import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { guardianApi } from '@/lib/api';
import { saveAcceptedConsent } from '@/lib/consent';
import { Card, PrimaryButton } from '@/components/AppUI';
import { useColors } from '@/hooks/useColors';

const items = [
  {
    key: 'terms',
    title: 'I accept the Terms of Service',
    detail: 'Fraud warnings support safer decisions, but cannot guarantee every call is detected.',
  },
  {
    key: 'privacy',
    title: 'I accept the Privacy Policy',
    detail: 'Call Guardian does not sell personal data. Information is used only to provide safety features.',
  },
  {
    key: 'data',
    title: 'I consent to call transcript analysis',
    detail: 'Only text you submit for analysis is sent securely to the protection service. The app does not record ordinary phone-call audio.',
  },
] as const;

export default function ConsentScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [accepted, setAccepted] = useState<Record<(typeof items)[number]['key'], boolean>>({
    terms: false,
    privacy: false,
    data: false,
  });
  const allAccepted = items.every((item) => accepted[item.key]);

  const consentMutation = useMutation({
    mutationFn: async () => {
      await guardianApi.saveConsent({
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        acceptedDataCollection: true,
      });
      await saveAcceptedConsent();
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      router.replace('/');
    },
    onError: () => {
      Alert.alert(
        'Consent could not be saved',
        'Please check your connection and try again. Protection remains off until consent is saved.',
      );
    },
  });

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.primary, borderRadius: colors.radius * 3 }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primaryForeground }]}>
            <Feather name="shield" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>Welcome to Call Guardian</Text>
          <Text style={[styles.heroText, { color: colors.primaryForeground }]}>
            Clear, caring protection against suspicious calls and scams.
          </Text>
        </View>

        <View style={styles.intro}>
          <Text style={[styles.introTitle, { color: colors.foreground }]}>Your consent comes first</Text>
          <Text style={[styles.introText, { color: colors.mutedForeground }]}>
            Please review these three points before activating protection.
          </Text>
        </View>

        <View style={styles.list}>
          {items.map((item) => (
            <Card key={item.key}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={item.title}
                accessibilityState={{ checked: accepted[item.key] }}
                onPress={() => setAccepted((current) => ({ ...current, [item.key]: !current[item.key] }))}
                style={styles.consentRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: accepted[item.key] ? colors.primary : colors.background,
                      borderColor: accepted[item.key] ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  {accepted[item.key] ? <Feather name="check" size={18} color={colors.primaryForeground} /> : null}
                </View>
                <View style={styles.consentCopy}>
                  <Text style={[styles.consentTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.consentDetail, { color: colors.mutedForeground }]}>{item.detail}</Text>
                </View>
              </Pressable>
            </Card>
          ))}
        </View>

        <PrimaryButton
          label={consentMutation.isPending ? 'Saving consent...' : 'Activate protection'}
          icon="shield"
          disabled={!allAccepted || consentMutation.isPending}
          onPress={() => consentMutation.mutate()}
          testID="activate-protection"
        />

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          You can review safety settings at any time.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: 18,
    marginHorizontal: 'auto',
    maxWidth: 640,
    paddingBottom: Platform.OS === 'web' ? 34 : 24,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 67 : 24,
    width: '100%',
  },
  hero: { alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 30 },
  heroIcon: { alignItems: 'center', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 27, textAlign: 'center' },
  heroText: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 23, textAlign: 'center' },
  intro: { gap: 6, marginTop: 8 },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  introText: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  list: { gap: 12 },
  consentRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 14 },
  checkbox: { alignItems: 'center', borderWidth: 2, height: 28, justifyContent: 'center', marginTop: 2, width: 28 },
  consentCopy: { flex: 1, gap: 6 },
  consentTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 22 },
  consentDetail: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  footer: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center' },
});