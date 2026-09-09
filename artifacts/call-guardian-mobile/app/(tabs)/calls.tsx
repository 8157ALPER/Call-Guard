import React, { useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Card, EmptyState, ErrorState, IconButton, LoadingState, PrimaryButton, ScreenTitle } from '@/components/AppUI';
import { guardianApi, type CallRecord } from '@/lib/api';
import { useColors } from '@/hooks/useColors';

function dateLabel(value: string | null): string {
  if (!value) return 'Just now';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function CallsScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const callsQuery = useQuery({ queryKey: ['calls'], queryFn: guardianApi.getCalls });
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transcript, setTranscript] = useState('');

  const analysisMutation = useMutation({
    mutationFn: () => guardianApi.analyzeCall(phoneNumber.trim(), transcript.trim()),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      setPhoneNumber('');
      setTranscript('');
      setComposerOpen(false);
    },
    onError: () => {
      Alert.alert('Analysis could not start', 'Check your connection and try again.');
    },
  });

  const submitAnalysis = () => {
    if (!phoneNumber.trim() || !transcript.trim()) {
      Alert.alert('Add the details first', 'Enter a phone number and conversation transcript before continuing.');
      return;
    }
    analysisMutation.mutate();
  };

  if (callsQuery.isLoading) return <LoadingState label="Loading safety checks..." />;
  if (callsQuery.error) return <ErrorState message="We could not load call activity." onRetry={() => void callsQuery.refetch()} />;

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <FlatList
        data={callsQuery.data ?? []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.content}
        refreshing={callsQuery.isRefetching}
        onRefresh={() => void callsQuery.refetch()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ScreenTitle
              eyebrow="Safety checks"
              title="Review call activity"
              detail="A transcript can be checked for familiar signs of fraud or pressure."
            />
            <PrimaryButton label="Check a conversation" icon="search" onPress={() => setComposerOpen(true)} testID="check-conversation" />
            <Text style={[styles.listLabel, { color: colors.mutedForeground }]}>RECENT ACTIVITY</Text>
          </>
        }
        ListEmptyComponent={
          <Card>
            <EmptyState icon="phone-off" title="No checks yet" detail="Use “Check a conversation” to analyze a call transcript." />
          </Card>
        }
        renderItem={({ item }) => <CallRow call={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Modal animationType="slide" transparent visible={isComposerOpen} onRequestClose={() => setComposerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setComposerOpen(false)}>
          <Pressable style={[styles.modal, { backgroundColor: colors.background, borderRadius: colors.radius * 2 }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Check a conversation</Text>
                <Text style={[styles.modalDetail, { color: colors.mutedForeground }]}>Paste or type the conversation text you want checked.</Text>
              </View>
              <IconButton icon="x" label="Close" onPress={() => setComposerOpen(false)} />
            </View>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Caller’s number</Text>
            <TextInput
              accessibilityLabel="Caller phone number"
              keyboardType="phone-pad"
              onChangeText={setPhoneNumber}
              placeholder="+90..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.input, borderRadius: colors.radius, color: colors.foreground }]}
              value={phoneNumber}
            />
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Conversation transcript</Text>
            <TextInput
              accessibilityLabel="Conversation transcript"
              multiline
              onChangeText={setTranscript}
              placeholder="Example: A caller asks you to share a code, password, or bank information..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.input, borderRadius: colors.radius, color: colors.foreground }]}
              textAlignVertical="top"
              value={transcript}
            />
            <Text style={[styles.privacyHint, { color: colors.mutedForeground }]}>
              This sends the text to the protection service for analysis. Do not include passwords, card numbers, or one-time codes.
            </Text>
            <PrimaryButton
              label={analysisMutation.isPending ? 'Checking...' : 'Check for scam signs'}
              icon="shield"
              disabled={analysisMutation.isPending}
              onPress={submitAnalysis}
              testID="submit-analysis"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function CallRow({ call }: { call: CallRecord }) {
  const colors = useColors();
  const risk = call.analysis?.risk ?? 0;
  const suspicious = call.isSuspicious === true || risk >= 0.7;
  return (
    <Card>
      <View style={styles.callRow}>
        <View style={[styles.callIcon, { backgroundColor: suspicious ? colors.destructive : colors.secondary }]}>
          <Feather name={suspicious ? 'alert-triangle' : 'check'} size={20} color={suspicious ? colors.destructiveForeground : colors.primary} />
        </View>
        <View style={styles.callCopy}>
          <Text style={[styles.callNumber, { color: colors.foreground }]}>{call.phoneNumber}</Text>
          <Text style={[styles.callTime, { color: colors.mutedForeground }]}>{dateLabel(call.timestamp)}</Text>
          {call.analysis?.summary ? (
            <Text numberOfLines={2} style={[styles.callSummary, { color: colors.mutedForeground }]}>{call.analysis.summary}</Text>
          ) : null}
        </View>
        <Text style={[styles.risk, { color: suspicious ? colors.destructive : colors.primary }]}>{Math.round(risk * 100)}%</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: 12,
    marginHorizontal: 'auto',
    maxWidth: 680,
    paddingBottom: Platform.OS === 'web' ? 100 : 28,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 78 : 24,
    width: '100%',
  },
  listLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.1, marginTop: 10 },
  separator: { height: 12 },
  callRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  callIcon: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  callCopy: { flex: 1, gap: 3 },
  callNumber: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  callTime: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  callSummary: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, marginTop: 4 },
  risk: { fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 2 },
  modalBackdrop: { backgroundColor: 'rgba(6, 19, 31, 0.58)', flex: 1, justifyContent: 'flex-end' },
  modal: { gap: 12, maxHeight: '88%', padding: 20 },
  modalHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, marginBottom: 4 },
  modalDetail: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, maxWidth: 270 },
  fieldLabel: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 3 },
  input: { borderWidth: 1, fontFamily: 'Inter_400Regular', fontSize: 16, minHeight: 50, paddingHorizontal: 14 },
  textarea: { borderWidth: 1, fontFamily: 'Inter_400Regular', fontSize: 16, height: 145, padding: 14 },
  privacyHint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
});