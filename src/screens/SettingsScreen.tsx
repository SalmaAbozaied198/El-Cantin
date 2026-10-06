import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { isFirebaseConfigured } from '../config/firebase';
import { CantinSwitcherModal } from '../components/CantinSwitcherModal';

export const SettingsScreen: React.FC = () => {
  const { currentUser, users, switchUser, addUser, deleteUser, logoutUser } = useAuth();
  const { resetToDemo, clearAllMarkets, clearAllAppData, activeCantin } = useData();
  const { t, language, setLanguage, isRTL } = useLanguage();

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [showAddUser, setShowAddUser] = useState(false);
  const [cantinModalVisible, setCantinModalVisible] = useState(false);

  const firebaseStatus = isFirebaseConfigured();

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter a name and email.');
      return;
    }
    await addUser(newUserName.trim(), newUserEmail.trim(), newUserRole);
    setNewUserName('');
    setNewUserEmail('');
    setShowAddUser(false);
    Alert.alert('User Created', `User "${newUserName}" created and set as active.`);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(t('logoutConfirm')) : true;
      if (confirmed) {
        logoutUser();
      }
      return;
    }

    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await logoutUser();
          },
        },
      ]
    );
  };

  const handleDeleteUser = (u: any) => {
    if (users.length <= 1) {
      Alert.alert(t('deleteUser'), t('cannotDeleteActiveUser'));
      return;
    }

    if (Platform.OS === 'web') {
      const msg = t('deleteUserConfirm').replace('{name}', u.name);
      const confirmed = typeof window !== 'undefined' ? window.confirm(msg) : true;
      if (confirmed) {
        deleteUser(u.id);
      }
      return;
    }

    Alert.alert(
      t('deleteUser'),
      t('deleteUserConfirm').replace('{name}', u.name),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteUser(u.id);
            Alert.alert(t('appName'), t('userDeletedSuccess'));
          },
        },
      ]
    );
  };

  const handleClearMarkets = () => {
    const msg = isRTL
      ? 'هل أنت متأكد من مسح جميع المنافذ والبدء بقائمة جديدة فارغة؟'
      : 'Are you sure you want to remove all sub-markets and start with an empty list to add your own markets?';

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(msg) : true;
      if (confirmed) {
        clearAllMarkets();
      }
      return;
    }

    Alert.alert(
      t('clearAllMarkets'),
      msg,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await clearAllMarkets();
            Alert.alert(t('appName'), isRTL ? 'تم مسح المنافذ بنجاح' : 'All sub-markets cleared');
          },
        },
      ]
    );
  };

  const handleReset = () => {
    const msg = isRTL
      ? 'سيتم استعادة الأصناف النموذجية ومسح المنافذ'
      : 'This will reset inventory to default and clear markets so you can add your own.';

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(msg) : true;
      if (confirmed) {
        resetToDemo();
      }
      return;
    }

    Alert.alert(
      t('resetDefaultData'),
      msg,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await resetToDemo();
            Alert.alert(t('appName'), isRTL ? 'تمت إعادة الضبط بنجاح' : 'Data has been reset.');
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(t('clearAllDataResetConfirm')) : true;
      if (confirmed) {
        clearAllAppData().then(() => logoutUser());
      }
      return;
    }

    Alert.alert(
      t('clearAllDataReset'),
      t('clearAllDataResetConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await clearAllAppData();
            await logoutUser();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Language Switcher Card */}
      <View style={styles.card}>
        <View style={[styles.cardHeader, isRTL && styles.rowRtl]}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="translate" size={24} color={colors.primaryDark} />
          </View>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.cardTitle}>{isRTL ? 'لغة التطبيق' : 'App Language'}</Text>
            <Text style={styles.cardSub}>
              {isRTL ? 'اختر اللغة المناسبة لواجهة النظام' : 'Select language for full user interface'}
            </Text>
          </View>
        </View>

        <View style={[styles.langSwitchRow, isRTL && styles.rowRtl]}>
          <TouchableOpacity
            style={[styles.langOptionBtn, language === 'ar' && styles.langOptionBtnActive]}
            onPress={() => setLanguage('ar')}
          >
            <Text style={[styles.langOptionText, language === 'ar' && styles.langOptionTextActive]}>
              العربية (Arabic)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langOptionBtn, language === 'en' && styles.langOptionBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langOptionText, language === 'en' && styles.langOptionTextActive]}>
              English (الإنجليزية)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Current User Card */}
      <View style={styles.card}>
        <View style={[styles.cardHeader, isRTL && styles.rowRtl]}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="account-circle" size={24} color={colors.primary} />
          </View>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.cardTitle}>{t('currentLoggedInUser')}</Text>
            <Text style={styles.cardSub}>{t('stampedNotice')}</Text>
          </View>
        </View>

        <View style={[styles.activeUserBox, isRTL && styles.rowRtl]}>
          <View style={styles.avatarLarge}>
            <MaterialCommunityIcons
              name={currentUser?.role === 'admin' ? 'shield-account' : 'account'}
              size={32}
              color={currentUser?.role === 'admin' ? colors.accentDark : colors.primaryDark}
            />
          </View>
          <View style={[{ flex: 1, marginHorizontal: 12 }, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.userNameText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {currentUser?.name || 'User'}
            </Text>
            <Text style={styles.userEmailText} numberOfLines={1}>{currentUser?.email || ''}</Text>
            <View style={[styles.roleBadge, currentUser?.role === 'admin' ? styles.adminBadge : styles.staffBadge]}>
              <Text
                style={[
                  styles.roleBadgeText,
                  currentUser?.role === 'admin' ? styles.adminBadgeText : styles.staffBadgeText,
                ]}
              >
                ROLE: {currentUser?.role === 'admin' ? t('admin') : t('staff')}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={16} color={colors.danger} />
            <Text style={styles.logoutBtnText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Switch Users / Multi-User Manager */}
      <View style={styles.card}>
        <View style={[styles.cardHeaderBetween, isRTL && styles.rowRtl]}>
          <View style={[styles.cardHeaderLeft, isRTL && styles.rowRtl]}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.accentLight }]}>
              <MaterialCommunityIcons name="account-switch" size={24} color={colors.accentDark} />
            </View>
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={styles.cardTitle}>{t('multiUserSwitcher')}</Text>
              <Text style={styles.cardSub}>{t('switchPersona')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addMiniBtn}
            onPress={() => setShowAddUser(!showAddUser)}
          >
            <MaterialCommunityIcons
              name={showAddUser ? 'chevron-up' : 'plus'}
              size={18}
              color={colors.primaryDark}
            />
            <Text style={styles.addMiniBtnText}>{showAddUser ? t('cancel') : '+'}</Text>
          </TouchableOpacity>
        </View>

        {showAddUser && (
          <View style={styles.addUserForm}>
            <Text style={[styles.formTitle, isRTL && { textAlign: 'right' }]}>{t('addNewUser')}</Text>
            <TextInput
              style={[styles.input, isRTL && { textAlign: 'right' }]}
              placeholder={t('fullName')}
              placeholderTextColor={colors.textMuted}
              value={newUserName}
              onChangeText={setNewUserName}
            />
            <TextInput
              style={[styles.input, isRTL && { textAlign: 'right' }]}
              placeholder={t('emailAddress')}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={newUserEmail}
              onChangeText={setNewUserEmail}
            />

            <View style={[styles.roleSelector, isRTL && styles.rowRtl]}>
              <TouchableOpacity
                style={[styles.roleBtn, newUserRole === 'user' && styles.roleBtnActive]}
                onPress={() => setNewUserRole('user')}
              >
                <Text style={[styles.roleBtnText, newUserRole === 'user' && styles.roleBtnTextActive]}>
                  {t('staffRepRole')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleBtn, newUserRole === 'admin' && styles.roleBtnActive]}
                onPress={() => setNewUserRole('admin')}
              >
                <Text style={[styles.roleBtnText, newUserRole === 'admin' && styles.roleBtnTextActive]}>
                  {t('storeAdminRole')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.createBtn} onPress={handleCreateUser}>
              <Text style={styles.createBtnText}>{t('saveUserSwitch')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.usersList}>
          {users.map((u) => {
            const isSelected = u.id === currentUser?.id;
            return (
              <View
                key={u.id}
                style={[styles.userItem, isSelected && styles.userItemActive, isRTL && styles.rowRtl]}
              >
                <TouchableOpacity
                  style={[styles.userItemLeft, isRTL && styles.rowRtl]}
                  onPress={() => switchUser(u.id)}
                >
                  <MaterialCommunityIcons
                    name={u.role === 'admin' ? 'shield-account' : 'account'}
                    size={20}
                    color={isSelected ? colors.primaryDark : colors.textSecondary}
                  />
                  <View style={[{ flex: 1, marginHorizontal: 10 }, isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                    <Text style={[styles.itemUserName, isSelected && styles.itemUserNameActive]} numberOfLines={1}>
                      {u.name}
                    </Text>
                    <Text style={styles.itemUserRole} numberOfLines={1}>
                      {u.role === 'admin' ? t('admin') : t('staff')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={[styles.userItemActions, isRTL && styles.rowRtl]}>
                  {isSelected ? (
                    <View style={styles.activeCheck}>
                      <MaterialCommunityIcons name="check-bold" size={16} color={colors.primaryDark} />
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => switchUser(u.id)}>
                      <Text style={styles.switchText}>{t('tapToSwitch')}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.deleteUserBtn}
                    onPress={() => handleDeleteUser(u)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Cantin Workspace & Sharing Card */}
      <View style={styles.card}>
        <View style={[styles.cardHeaderBetween, isRTL && styles.rowRtl]}>
          <View style={[styles.cardHeaderLeft, isRTL && styles.rowRtl]}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="store-cog" size={24} color={colors.primaryDark} />
            </View>
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={styles.cardTitle}>{t('cantinWorkspace')}</Text>
              <Text style={styles.cardSub}>
                {activeCantin.name} • {activeCantin.code}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addMiniBtn}
            onPress={() => setCantinModalVisible(true)}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.primaryDark} />
            <Text style={styles.addMiniBtnText}>{t('switchCantin')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.activeUserBox, { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primaryBorder }, isRTL && styles.rowRtl]}>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primaryDark }}>{t('cantinCode')}</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.primaryDark, letterSpacing: 1 }}>
              {activeCantin.code}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
              {activeCantin.isShared ? t('sharedModeDesc') : t('privateModeDesc')}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.createBtn, { paddingHorizontal: 12, paddingVertical: 8 }]}
            onPress={() => setCantinModalVisible(true)}
          >
            <Text style={styles.createBtnText}>{isRTL ? 'إدارة الكانتينات' : 'Manage'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Backend / Firebase Integration Status */}
      <View style={styles.card}>
        <View style={[styles.cardHeader, isRTL && styles.rowRtl]}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: firebaseStatus ? colors.successLight : colors.infoLight },
            ]}
          >
            <MaterialCommunityIcons
              name="firebase"
              size={24}
              color={firebaseStatus ? colors.successText : colors.infoText}
            />
          </View>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.cardTitle}>{t('firebaseCloud')}</Text>
            <Text style={styles.cardSub}>
              {firebaseStatus ? t('connectedLive') : t('runningOffline')}
            </Text>
          </View>
        </View>

        <View style={styles.firebaseNotice}>
          <Text style={[styles.firebaseNoticeText, isRTL && { textAlign: 'right' }]}>
            {isRTL
              ? 'يدعم تطبيق الكانتين المزامنة السحابية الحية بين عدة هواتف عبر Firebase Firestore. لربط مشروعك أدخل المفاتيح في:'
              : 'EL cantin supports real-time multi-device sync via Firebase Firestore. To connect your live cloud database, configure your keys inside:'}
          </Text>
          <Text style={styles.codeSnippet}>src/config/firebase.ts</Text>
          <Text style={[styles.firebaseNoticeText, { marginTop: 6 }, isRTL && { textAlign: 'right' }]}>
            {isRTL
              ? 'حالياً، جميع البيانات والعمليات يتم حفظها محلياً على ذاكرة الهاتف (AsyncStorage) بحيث يعمل التطبيق فوراً بدون أي إعدادات إضافية!'
              : 'Currently, all actions and calculations are saved locally to your device storage (AsyncStorage) so the app works seamlessly right now!'}
          </Text>
        </View>
      </View>

      {/* Data Management & Resets */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { marginBottom: 12 }, isRTL && { textAlign: 'right' }]}>
          {t('dataManagement')}
        </Text>

        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', marginBottom: 10 }]}
          onPress={handleClearAllData}
        >
          <MaterialCommunityIcons name="database-remove" size={20} color={colors.danger} />
          <Text style={styles.resetBtnText}>
            {t('clearAllDataReset')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: '#FED7AA', backgroundColor: '#FFF7ED', marginBottom: 10 }]}
          onPress={handleClearMarkets}
        >
          <MaterialCommunityIcons name="store-remove" size={20} color={colors.accentDark} />
          <Text style={[styles.resetBtnText, { color: colors.accentDark }]}>
            {t('clearAllMarkets')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <MaterialCommunityIcons name="restart" size={20} color={colors.danger} />
          <Text style={styles.resetBtnText}>{t('resetDefaultData')}</Text>
        </TouchableOpacity>
      </View>

      {/* Cantin Switcher Modal */}
      <CantinSwitcherModal
        visible={cantinModalVisible}
        onClose={() => setCantinModalVisible(false)}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  langSwitchRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardHover,
    borderRadius: 12,
    padding: 4,
    marginTop: 6,
  },
  langOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  langOptionBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  langOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  langOptionTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  activeUserBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardHover,
    padding: 14,
    borderRadius: 14,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userEmailText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  adminBadge: {
    backgroundColor: colors.accentLight,
  },
  staffBadge: {
    backgroundColor: colors.primaryLight,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  adminBadgeText: {
    color: colors.accentDark,
  },
  staffBadgeText: {
    color: colors.primaryDark,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    marginHorizontal: 4,
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addMiniBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    marginLeft: 2,
  },
  addUserForm: {
    backgroundColor: colors.cardHover,
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 3,
  },
  roleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleBtnTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  createBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  usersList: {
    marginTop: 4,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.cardHover,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userItemActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  userItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemUserNameActive: {
    color: colors.primaryDark,
  },
  itemUserRole: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  userItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteUserBtn: {
    padding: 6,
    marginHorizontal: 4,
  },
  activeCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  switchText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  firebaseNotice: {
    backgroundColor: colors.cardHover,
    padding: 12,
    borderRadius: 12,
  },
  firebaseNoticeText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  codeSnippet: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dangerLight,
    backgroundColor: '#FEF2F2',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
    marginHorizontal: 8,
  },
});
