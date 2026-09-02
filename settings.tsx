import React from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Card, ErrorState, LoadingState, ScreenTitle } from '@/components/AppUI';
import { guardianApi, type Settings } from '@/lib/api';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: guardianApi.getSettings });
  const updateMutation = useMutation({
    mutationFn: (update: Partial<Settings>) => guardianApi.updateSettings(update),
    onSuccess: () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => Alert.alert('Settings could not be saved', 'Please check your connection and try again.'),
  });

  if (settingsQuery.isLoading) return <LoadingState label="Loading your safety settings..." />;
  if (settingsQuery.error || !settingsQuery.data) return <ErrorState message="We could not load your safety settings." onRetry={() => void settingsQuery.refetch()} />;
  const settings = settingsQuery.data;

  const openSystemSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.openSettings();
      } else {
        Alert.alert('Android setting', 'Install Call Guardian on an Android phone, then use the device’s Default apps settings to choose it as your call-screening app.');
      }
    } catch {
      Alert.alert('Could not open settings', 'Open your Android Settings app, then look for Default apps or Call screening.');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <ScreenTitle
        eyebrow="Your choices"
        title="Safety settings"
        detail="Choose how Call Guardian supports you. Changes are saved to your protection service."
      />

      <Card>
        <SettingHeader icon="shield" title="Call screening" />
        <SettingRow label="Enable call-screening access" detail="Keep your Android call-screening preference ready for compatible device features." value={settings.enableCallScreening === true} onChange={(value) => updateMutation.mutate({ enableCallScreening: value })} />
        <View style={[styles.callScreenNotice, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="smartphone" size={19} color={colors.primary} />
          <View style={styles.noticeCopy}>
            <Text style={[styles.noticeTitle, { color: colors.foreground }]}>Android call-screening role</Text>
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>After installing the release app, select Call Guardian in Android’s call-screening/default apps settings. This release does not automatically block or silence calls, and it does not record phone-call audio.</Text>
            <Text accessibilityRole="button" onPress={openSystemSettings} style={[styles.systemLink, { color: colors.primary }]}>Open Android settings</Text>
          </View>
        </View>
      </Card>

      <Card>
        <SettingHeader icon="bell" title="Family alerts" />
        <SettingRow label="Send SMS safety alerts" detail="Allow the protection service to notify your emergency contact about high-risk activity." value={settings.enableSmsAlerts === true} onChange={(value) => updateMutation.mutate({ enableSmsAlerts: value })} />
        <SettingRow label="Enable emergency alerts" detail="Keep emergency notification tools available if you report a suspected scam." value={settings.enableEmergencyAlerts === true} onChange={(value) => updateMutation.mutate({ enableEmergencyAlerts: value })} />
      </Card>

      <Card>
        <SettingHeader icon="sliders" title="Accessibility" />
        <SettingRow label="High contrast" detail="Use stronger contrast for easier reading." value={settings.highContrastMode === true} onChange={(value) => updateMutation.mutate({ highContrastMode: value })} />
        <SettingRow label="Larger text" detail="Use larger type throughout the web dashboard." value={settings.largeTextMode === true} onChange={(value) => updateMutation.mutate({ largeTextMode: value })} />
      </Card>

      {updateMutation.isPending ? <Text style={[styles.saving, { color: colors.mutedForeground }]}>Saving your choice...</Text> : null}
    </ScrollView>
  );
}

function SettingHeader({ icon, title }: { icon: keyof typeof Feather.glyphMap; title: string }) {
  const colors = useColors();
  return (
    <View style={styles.settingHeader}>
      <View style={[styles.headerIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

function SettingRow({ label, detail, value, onChange }: { label: string; detail: string; value: boolean; onChange: (value: boolean) => void }) {
  const colors = useColors();
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.settingDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      </View>
      <Switch accessibilityLabel={label} onValueChange={onChange} thumbColor={value ? colors.primaryForeground : colors.mutedForeground} trackColor={{ false: colors.muted, true: colors.primary }} value={value} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 16,
    marginHorizontal: 'auto',
    maxWidth: 680,
    paddingBottom: Platform.OS === 'web' ? 100 : 28,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 78 : 24,
    width: '100%',
  },
  settingHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 14 },
  headerIcon: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  settingRow: { alignItems: 'center', flexDirection: 'row', gap: 14, paddingVertical: 11 },
  settingCopy: { flex: 1, gap: 4 },
  settingTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  settingDetail: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  callScreenNotice: { borderWidth: 1, flexDirection: 'row', gap: 11, marginTop: 12, padding: 13 },
  noticeCopy: { flex: 1, gap: 4 },
  noticeTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  noticeText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  systemLink: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 5 },
  saving: { fontFamily: 'Inter_500Medium', fontSize: 14, textAlign: 'center' },
});