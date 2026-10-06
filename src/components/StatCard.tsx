import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  variant?: 'primary' | 'accent' | 'success' | 'info' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'primary',
}) => {
  const { isRTL } = useLanguage();

  const getColors = () => {
    switch (variant) {
      case 'accent':
        return { bg: colors.accentLight, iconColor: colors.accentDark };
      case 'success':
        return { bg: colors.successLight, iconColor: colors.successText };
      case 'info':
        return { bg: colors.infoLight, iconColor: colors.infoText };
      case 'danger':
        return { bg: colors.dangerLight, iconColor: colors.dangerText };
      case 'primary':
      default:
        return { bg: colors.primaryLight, iconColor: colors.primaryDark };
    }
  };

  const currentColors = getColors();

  return (
    <View style={styles.card}>
      <View style={[styles.topRow, isRTL && styles.rowRtl]}>
        <Text style={[styles.title, isRTL && { textAlign: 'right', marginRight: 0, marginLeft: 6 }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={[styles.iconWrapper, { backgroundColor: currentColors.bg }]}>
          <MaterialCommunityIcons name={icon} size={20} color={currentColors.iconColor} />
        </View>
      </View>
      <Text
        style={[styles.value, isRTL && { textAlign: 'right' }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
    minWidth: 140,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  title: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginRight: 6,
    lineHeight: 16,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
});
