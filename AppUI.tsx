import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

type IconName = keyof typeof Feather.glyphMap;

export function ScreenTitle({
  eyebrow,
  title,
  detail,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.titleBlock}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {detail ? (
        <Text style={[styles.detail, { color: colors.mutedForeground }]}>{detail}</Text>
      ) : null}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius * 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  disabled = false,
  testID,
  tone = 'primary',
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  tone?: 'primary' | 'danger' | 'secondary';
}) {
  const colors = useColors();
  const backgroundColor =
    tone === 'danger'
      ? colors.destructive
      : tone === 'secondary'
        ? colors.secondary
        : colors.primary;
  const color =
    tone === 'secondary' ? colors.secondaryForeground : colors.primaryForeground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor,
          borderRadius: colors.radius * 1.5,
          opacity: disabled ? 0.45 : pressed ? 0.86 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
      ]}
    >
      {icon ? <Feather name={icon} size={21} color={color} /> : null}
      <Text style={[styles.primaryButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.56 : 1 }]}
    >
      <Feather name={icon} color={color ?? colors.foreground} size={23} />
    </Pressable>
  );
}

export function LoadingState({ label = 'Loading protection data...' }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const colors = useColors();
  return (
    <Card>
      <View style={styles.errorContent}>
        <Feather name="wifi-off" size={26} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>{message}</Text>
        <PrimaryButton label="Try again" icon="refresh-cw" onPress={onRetry} />
      </View>
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: IconName;
  title: string;
  detail: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.empty}>
      <Feather name={icon} size={32} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyDetail, { color: colors.mutedForeground }]}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: 7, marginBottom: 18 },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34 },
  detail: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 23 },
  card: { borderWidth: 1, padding: 18 },
  primaryButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  loading: { alignItems: 'center', flex: 1, gap: 14, justifyContent: 'center' },
  loadingText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  errorContent: { alignItems: 'center', gap: 14 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 16, lineHeight: 23, textAlign: 'center' },
  empty: { alignItems: 'center', gap: 9, paddingHorizontal: 24, paddingVertical: 34 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' },
  emptyDetail: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, textAlign: 'center' },
});