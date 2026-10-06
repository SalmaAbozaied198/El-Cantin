import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { CantinSwitcherModal } from './CantinSwitcherModal';

interface HeaderProps {
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfile }) => {
  const { currentUser } = useAuth();
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const { activeCantin, isAdmin } = useData();

  const [switcherVisible, setSwitcherVisible] = useState(false);

  return (
    <View style={[styles.container, isRTL && styles.containerRtl]}>
      {/* Brand & Active Cantin Switcher */}
      <TouchableOpacity
        style={[styles.brandRow, isRTL && styles.brandRowRtl]}
        activeOpacity={0.7}
        onPress={() => setSwitcherVisible(true)}
      >
        <View style={styles.logoBadge}>
          <MaterialCommunityIcons name="store-cog" size={22} color={colors.white} />
        </View>
        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
          <View style={[styles.titleWithChevron, isRTL && styles.rowRtl]}>
            <Text style={styles.appName} numberOfLines={1}>
              {activeCantin?.name || t('appName')}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
          </View>
          <View style={[styles.codeBadgeRow, isRTL && styles.rowRtl]}>
            <Text style={styles.appSubtitle}>{activeCantin?.code || 'ELC-101'}</Text>
            <View style={styles.dot} />
            <Text style={styles.shareCodeActionText}>{isRTL ? 'تبديل الكانتين' : 'Switch'}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Controls */}
      <View style={[styles.rightActions, isRTL && styles.rightActionsRtl]}>
        {/* Language Switch Button */}
        <TouchableOpacity
          style={styles.langBtn}
          onPress={toggleLanguage}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="translate" size={15} color={colors.primaryDark} />
          <Text style={styles.langBtnText}>
            {language === 'ar' ? 'EN' : 'عربي'}
          </Text>
        </TouchableOpacity>

        {/* User Profile Badge */}
        <TouchableOpacity
          style={[styles.userBadge, isRTL && styles.userBadgeRtl]}
          activeOpacity={0.7}
          onPress={onOpenProfile}
        >
          <View style={[styles.userTextContainer, isRTL && { alignItems: 'flex-start', marginRight: 0, marginLeft: 6 }]}>
            <Text style={styles.userName} numberOfLines={1}>
              {currentUser?.name || 'User'}
            </Text>
            <View style={[styles.roleTag, isAdmin ? styles.adminTag : styles.userTag]}>
              <Text style={[styles.roleText, isAdmin ? styles.adminRoleText : styles.userRoleText]}>
                {isAdmin ? t('admin') : t('staff')}
              </Text>
            </View>
          </View>
          <View style={styles.avatar}>
            <MaterialCommunityIcons
              name={isAdmin ? 'shield-account' : 'account'}
              size={18}
              color={isAdmin ? colors.accentDark : colors.primaryDark}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Cantin Switcher Modal */}
      <CantinSwitcherModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'ios' ? 12 : 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  containerRtl: {
    flexDirection: 'row-reverse',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  brandRowRtl: {
    flexDirection: 'row-reverse',
    marginRight: 0,
    marginLeft: 6,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  titleWithChevron: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    maxWidth: 130,
  },
  codeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  appSubtitle: {
    fontSize: 10,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: 4,
  },
  shareCodeActionText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActionsRtl: {
    flexDirection: 'row-reverse',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    marginLeft: 3,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardHover,
    paddingVertical: 3,
    paddingLeft: 8,
    paddingRight: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userBadgeRtl: {
    flexDirection: 'row-reverse',
    paddingLeft: 4,
    paddingRight: 8,
  },
  userTextContainer: {
    marginRight: 5,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    maxWidth: 65,
  },
  roleTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 1,
  },
  adminTag: {
    backgroundColor: colors.accentLight,
  },
  userTag: {
    backgroundColor: colors.primaryLight,
  },
  roleText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  adminRoleText: {
    color: colors.accentDark,
  },
  userRoleText: {
    color: colors.primaryDark,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
