import React, { useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Card, EmptyState, ErrorState, IconButton, LoadingState, PrimaryButton, ScreenTitle } from '@/components/AppUI';
import { guardianApi, type Contact } from '@/lib/api';
import { useColors } from '@/hooks/useColors';

export default function ContactsScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const contactsQuery = useQuery({ queryKey: ['contacts'], queryFn: guardianApi.getContacts });
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isTrusted, setTrusted] = useState(true);
  const [isEmergency, setEmergency] = useState(false);

  const createMutation = useMutation({
    mutationFn: () => guardianApi.addContact({ name: name.trim(), phoneNumber: phoneNumber.trim(), isTrusted, isEmergency }),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setName('');
      setPhoneNumber('');
      setTrusted(true);
      setEmergency(false);
      setComposerOpen(false);
    },
    onError: () => Alert.alert('Contact could not be saved', 'Check the details and your connection, then try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => guardianApi.deleteContact(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const save = () => {
    if (!name.trim() || !phoneNumber.trim()) {
      Alert.alert('Add the details first', 'A name and phone number are required.');
      return;
    }
    createMutation.mutate();
  };

  if (contactsQuery.isLoading) return <LoadingState label="Loading trusted people..." />;
  if (contactsQuery.error) return <ErrorState message="We could not load your trusted people." onRetry={() => void contactsQuery.refetch()} />;

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <FlatList
        data={contactsQuery.data ?? []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.content}
        refreshing={contactsQuery.isRefetching}
        onRefresh={() => void contactsQuery.refetch()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ScreenTitle
              eyebrow="Trusted people"
              title="Keep help close"
              detail="Add family members or friends who should be recognized or receive safety alerts."
            />
            <PrimaryButton label="Add a trusted person" icon="user-plus" onPress={() => setComposerOpen(true)} testID="add-contact" />
            <Text style={[styles.listLabel, { color: colors.mutedForeground }]}>YOUR LIST</Text>
          </>
        }
        ListEmptyComponent={<Card><EmptyState icon="users" title="No trusted people yet" detail="Add a family member or friend for safer call decisions." /></Card>}
        renderItem={({ item }) => (
          <ContactRow
            contact={item}
            onDelete={() => Alert.alert('Remove contact?', `${item.name} will no longer be in your trusted list.`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
            ])}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Modal animationType="slide" transparent visible={isComposerOpen} onRequestClose={() => setComposerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setComposerOpen(false)}>
          <Pressable style={[styles.modal, { backgroundColor: colors.background, borderRadius: colors.radius * 2 }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add a trusted person</Text>
              <IconButton icon="x" label="Close" onPress={() => setComposerOpen(false)} />
            </View>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Name</Text>
            <TextInput accessibilityLabel="Contact name" onChangeText={setName} placeholder="Name" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.input, borderRadius: colors.radius, color: colors.foreground }]} value={name} />
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Phone number</Text>
            <TextInput accessibilityLabel="Contact phone number" keyboardType="phone-pad" onChangeText={setPhoneNumber} placeholder="+90..." placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.input, borderRadius: colors.radius, color: colors.foreground }]} value={phoneNumber} />
            <PreferenceRow label="Trusted caller" detail="Recognize this number as safe." value={isTrusted} onChange={setTrusted} />
            <PreferenceRow label="Emergency contact" detail="May receive fraud alerts." value={isEmergency} onChange={setEmergency} />
            <PrimaryButton label={createMutation.isPending ? 'Saving...' : 'Save person'} icon="check" disabled={createMutation.isPending} onPress={save} testID="save-contact" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function ContactRow({ contact, onDelete }: { contact: Contact; onDelete: () => void }) {
  const colors = useColors();
  return (
    <Card>
      <View style={styles.contactRow}>
        <View style={[styles.avatar, { backgroundColor: contact.isEmergency ? colors.destructive : colors.secondary }]}>
          <Feather name={contact.isEmergency ? 'heart' : 'user'} size={20} color={contact.isEmergency ? colors.destructiveForeground : colors.primary} />
        </View>
        <View style={styles.contactCopy}>
          <Text style={[styles.contactName, { color: colors.foreground }]}>{contact.name}</Text>
          <Text style={[styles.contactNumber, { color: colors.mutedForeground }]}>{contact.phoneNumber}</Text>
          <Text style={[styles.contactRole, { color: colors.mutedForeground }]}>
            {contact.isEmergency ? 'Emergency contact' : contact.isTrusted ? 'Trusted caller' : 'Contact'}
          </Text>
        </View>
        <IconButton icon="trash-2" label={`Remove ${contact.name}`} onPress={onDelete} color={colors.destructive} />
      </View>
    </Card>
  );
}

function PreferenceRow({ label, detail, value, onChange }: { label: string; detail: string; value: boolean; onChange: (value: boolean) => void }) {
  const colors = useColors();
  return (
    <View style={styles.preference}>
      <View style={styles.preferenceCopy}>
        <Text style={[styles.preferenceTitle, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.preferenceDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      </View>
      <Switch accessibilityLabel={label} onValueChange={onChange} thumbColor={value ? colors.primaryForeground : colors.mutedForeground} trackColor={{ false: colors.muted, true: colors.primary }} value={value} />
    </View>
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
  contactRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  avatar: { alignItems: 'center', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  contactCopy: { flex: 1, gap: 3 },
  contactName: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  contactNumber: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  contactRole: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  modalBackdrop: { backgroundColor: 'rgba(6, 19, 31, 0.58)', flex: 1, justifyContent: 'flex-end' },
  modal: { gap: 12, padding: 20 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  fieldLabel: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 2 },
  input: { borderWidth: 1, fontFamily: 'Inter_400Regular', fontSize: 16, minHeight: 50, paddingHorizontal: 14 },
  preference: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  preferenceCopy: { flex: 1, gap: 3, paddingRight: 16 },
  preferenceTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  preferenceDetail: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
});