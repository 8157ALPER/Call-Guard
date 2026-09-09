import React from 'react';
import { Alert, Linking, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card, ErrorState, LoadingState, PrimaryButton, ScreenTitle } from '@/components/AppUI';
import { guardianApi } from '@/lib/api';
import { hasAcceptedConsent } from '@/lib/consent';
import { useColors } from '@/hooks/useColors';

function formatRisk(risk: number): string {
  return `${Math.round(Math.max(0, Math.min(risk, 1)) * 100)}%`;
}

export default function ProtectScreen() {
  const colors = useColors();
  const router = useRouter();
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: guardianApi.getSettings });
  const callsQuery = useQuery({ queryKey: ['calls'], queryFn: guardianApi.getCalls });
  const isLoading = settingsQuery.isLoading || callsQuery.isLoading;
  const error = settingsQuery.error || callsQuery.error;

  React.useEffect(() => {
    void hasAcceptedConsent().then((accepted) => {
      if (!accepted) router.replace('/consent');
    });
  }, [router]);

  const refresh = () => {
    void settingsQuery.refetch();
    void callsQuery.refetch();
  };

  const openEmergency = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Emergency help',
      'Call your local emergency number now if you are in immediate danger.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 112', style: 'destructive', onPress: () => void Linking.openURL('tel:112') },
      ],
    );
  };

  if (isLoading) return <LoadingState />;
  if (error) {
    return (
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        <ErrorState message="We could not reach your protection service." onRetry={refresh} />
      </View>
    );
  }

  const protectionOn = settingsQuery.data?.enableCallScreening === true;
  const latestCall = callsQuery.data?.[0];
  const risk = latestCall?.analysis?.risk ?? 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={settingsQuery.isRefetching || callsQuery.isRefetching} onRefresh={refresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle
        eyebrow="Protection center"
        title="You are not alone."
        detail="Call Guardian helps you pause, check, and get support when a call feels suspicious."
      />

      <View style={[styles.statusCard, { backgroundColor: protectionOn ? colors.secondary : colors.muted, borderColor: protectionOn ? colors.primary : colors.border, borderRadius: colors.radius * 2 }]}>
        <View style={[styles.statusIcon, { backgroundColor: protectionOn ? colors.primary : colors.mutedForeground }]}>
          <Feather name={protectionOn ? 'shield' : 'shield-off'} size={26} color={colors.primaryForeground} />
        </View>
        <View style={styles.statusCopy}>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>
            {protectionOn ? 'Protection is ready' : 'Protection needs attention'}
          </Text>
          <Text style={[styles.statusDetail, { color: colors.mutedForeground }]}>
            {protectionOn
              ? 'Your protection preferences and transcript safety checks are ready.'
              : 'Review Settings to prepare your safety tools.'}
          </Text>
        </View>
      </View>

      <PrimaryButton label="Emergency help" icon="phone-call" tone="danger" onPress={openEmergency} testID="emergency-help" />

      <Card>
        <View style={styles.sectionHeader}>
          <View style={[styles.smallIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="activity" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest safety check</Text>
        </View>
        {latestCall ? (
          <View style={styles.latestCall}>
            <View>
              <Text style={[styles.caller, { color: colors.foreground }]}>{latestCall.phoneNumber}</Text>
              <Text style={[styles.callSummary, { color: colors.mutedForeground }]} numberOfLines={2}>
                {latestCall.analysis?.summary ?? 'No AI summary is available for this activity.'}
              </Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: risk >= 0.7 ? colors.destructive : colors.secondary, borderRadius: colors.radius }]}>
              <Text style={[styles.riskValue, { color: risk >= 0.7 ? colors.destructiveForeground : colors.secondaryForeground }]}>
                {formatRisk(risk)}
              </Text>
              <Text style={[styles.riskLabel, { color: risk >= 0.7 ? colors.destructiveForeground : colors.secondaryForeground }]}>risk</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyActivity}>
            <Feather name="check-circle" size={27} color={colors.primary} />
            <Text style={[styles.emptyActivityText, { color: colors.mutedForeground }]}>
              No safety checks yet. You can test a call transcript from the Calls tab.
            </Text>
          </View>
        )}
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <View style={[styles.smallIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="info" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How protection works</Text>
        </View>
        <Text style={[styles.explainer, { color: colors.mutedForeground }]}>
          Call Guardian can register with Android’s call-screening role without recording call audio. When you submit a conversation transcript, the protection service analyzes the text for scam patterns.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20 },
  content: {
    flexGrow: 1,
    gap: 16,
    marginHorizontal: 'auto',
    maxWidth: 680,
    paddingBottom: Platform.OS === 'web' ? 100 : 32,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 78 : 24,
    width: '100%',
  },
  statusCard: { alignItems: 'center', borderWidth: 1, flexDirection: 'row', gap: 14, padding: 18 },
  statusIcon: { alignItems: 'center', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  statusCopy: { flex: 1, gap: 5 },
  statusTitle: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  statusDetail: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 15 },
  smallIcon: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  latestCall: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  caller: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 5 },
  callSummary: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, maxWidth: 210 },
  riskBadge: { alignItems: 'center', minWidth: 66, paddingHorizontal: 8, paddingVertical: 9 },
  riskValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  riskLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, textTransform: 'uppercase' },
  emptyActivity: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  emptyActivityText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  explainer: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23 },
});
