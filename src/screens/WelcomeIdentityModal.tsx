import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

export const WelcomeIdentityModal: React.FC = () => {
  const { currentUser, loginUser } = useAuth();
  const { createCantin, joinCantinByCode } = useData();
  const { t, isRTL, language, toggleLanguage } = useLanguage();

  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [cantinTab, setCantinTab] = useState<'CREATE' | 'JOIN'>('CREATE');
  const [cantinName, setCantinName] = useState('');
  const [isSharedMode, setIsSharedMode] = useState(true);
  const [cantinCode, setCantinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If user is already logged in, do not show the modal
  if (currentUser) return null;

  const handleComplete = async () => {
    if (!name.trim()) {
      Alert.alert(
        t('appName'),
        isRTL ? 'يرجى إدخال اسمك للاستمرار' : 'Please enter your name to proceed.'
      );
      return;
    }

    if (cantinTab === 'CREATE' && !cantinName.trim()) {
      Alert.alert(
        t('appName'),
        isRTL
          ? 'يرجى إدخال اسم الكانتين الجديد الخاص بك'
          : 'Please enter a name for your new cantin.'
      );
      return;
    }

    if (cantinTab === 'JOIN' && !cantinCode.trim()) {
      Alert.alert(
        t('appName'),
        isRTL
          ? 'يرجى إدخال كود الكانتين للانضمام'
          : 'Please enter the cantin code to join.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const newUser = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        email: `${name.trim().toLowerCase().replace(/\s+/g, '')}@cantin.local`,
        role,
      };

      // 1. Log in the user
      await loginUser(newUser);

      // 2. Setup Cantin
      if (cantinTab === 'CREATE') {
        await createCantin(cantinName.trim(), isSharedMode);
      } else {
        const joined = await joinCantinByCode(cantinCode.trim());
        if (!joined) {
          Alert.alert(t('appName'), t('cantinNotFound'));
          setSubmitting(false);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to setup profile and cantin:', err);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={!currentUser} animationType="fade" transparent={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
            <MaterialCommunityIcons name="translate" size={16} color={colors.primaryDark} />
            <Text style={styles.langBtnText}>{language === 'ar' ? 'English' : 'عربي'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="store-cog" size={38} color={colors.white} />
          </View>

          <Text style={styles.welcomeTitle}>{t('appName')}</Text>
          <Text style={styles.welcomeSubtitle}>
            {isRTL
              ? 'مرحباً بك! سجل اسمك وحدد كانتين للبدء'
              : 'Welcome! Register your profile & set up your store'}
          </Text>

          {/* Section 1: User Profile */}
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionHeading, isRTL && { textAlign: 'right' }]}>
              {isRTL ? '١. بيانات المستخدم' : '1. Your Profile'}
            </Text>

            {/* Name Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'اسمك (الذي سيظهر في العمليات والتقارير) *' : 'Your Name (Appears on receipts & logs) *'}
              </Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder={isRTL ? 'مثال: سلمى، أحمد، عمر' : 'e.g. Salma, Ahmed, Omar'}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Role Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'صلاحيتك / دورك:' : 'Your Role:'}
              </Text>
              <View style={[styles.roleRow, isRTL && styles.rowRtl]}>
                <TouchableOpacity
                  style={[styles.roleOption, role === 'admin' && styles.roleOptionActive]}
                  onPress={() => setRole('admin')}
                >
                  <MaterialCommunityIcons
                    name="shield-account"
                    size={20}
                    color={role === 'admin' ? colors.accentDark : colors.textSecondary}
                  />
                  <Text style={[styles.roleText, role === 'admin' && styles.roleTextActive]}>
                    {t('storeAdminRole')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleOption, role === 'user' && styles.roleOptionActive]}
                  onPress={() => setRole('user')}
                >
                  <MaterialCommunityIcons
                    name="account-tie"
                    size={20}
                    color={role === 'user' ? colors.primaryDark : colors.textSecondary}
                  />
                  <Text style={[styles.roleText, role === 'user' && styles.roleTextActive]}>
                    {t('staffRepRole')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Section 2: Cantin Workspace Choice */}
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionHeading, isRTL && { textAlign: 'right' }]}>
              {isRTL ? '٢. إعداد الكانتين' : '2. Cantin Setup'}
            </Text>

            {/* Choice Tabs */}
            <View style={[styles.tabSelectorRow, isRTL && styles.rowRtl]}>
              <TouchableOpacity
                style={[styles.tabChoiceBtn, cantinTab === 'CREATE' && styles.tabChoiceBtnActive]}
                onPress={() => setCantinTab('CREATE')}
              >
                <MaterialCommunityIcons
                  name="store-plus"
                  size={18}
                  color={cantinTab === 'CREATE' ? colors.primaryDark : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabChoiceText,
                    cantinTab === 'CREATE' && styles.tabChoiceTextActive,
                  ]}
                >
                  {isRTL ? 'إنشاء كانتين جديد' : 'Open New Cantin'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabChoiceBtn, cantinTab === 'JOIN' && styles.tabChoiceBtnActive]}
                onPress={() => setCantinTab('JOIN')}
              >
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={18}
                  color={cantinTab === 'JOIN' ? colors.primaryDark : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabChoiceText,
                    cantinTab === 'JOIN' && styles.tabChoiceTextActive,
                  ]}
                >
                  {isRTL ? 'انضمام برمز كود' : 'Join with Code'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Body: Create New Cantin */}
            {cantinTab === 'CREATE' ? (
              <View>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                    {isRTL ? 'اسم الكانتين الخاص بك *' : 'Your Cantin Name *'}
                  </Text>
                  <TextInput
                    style={[styles.input, isRTL && { textAlign: 'right' }]}
                    placeholder={
                      isRTL
                        ? 'مثال: كانتين سلمى، كانتين كلية الهندسة'
                        : "e.g. Salma's Cantin, Branch #1"
                    }
                    placeholderTextColor={colors.textMuted}
                    value={cantinName}
                    onChangeText={setCantinName}
                  />
                  <Text style={[styles.hintText, isRTL && { textAlign: 'right' }]}>
                    {isRTL
                      ? 'سيتم فتح كانتين جديد وفارغ باسمك لإضافة البضائع والمنافذ الخاصة بك.'
                      : 'A fresh new store will be created for you with your own custom inventory.'}
                  </Text>
                </View>

                {/* Mode toggle */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                    {t('cantinModeLabel')}
                  </Text>
                  <View style={[styles.roleRow, isRTL && styles.rowRtl]}>
                    <TouchableOpacity
                      style={[styles.roleOption, isSharedMode && styles.roleOptionActive]}
                      onPress={() => setIsSharedMode(true)}
                    >
                      <MaterialCommunityIcons
                        name="account-group"
                        size={18}
                        color={isSharedMode ? colors.primaryDark : colors.textSecondary}
                      />
                      <Text style={[styles.roleText, isSharedMode && styles.roleTextActive]}>
                        {isRTL ? 'مشترك (برمز كود)' : 'Shared (with Code)'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.roleOption, !isSharedMode && styles.roleOptionActive]}
                      onPress={() => setIsSharedMode(false)}
                    >
                      <MaterialCommunityIcons
                        name="lock"
                        size={18}
                        color={!isSharedMode ? colors.primaryDark : colors.textSecondary}
                      />
                      <Text style={[styles.roleText, !isSharedMode && styles.roleTextActive]}>
                        {isRTL ? 'خاص بالهاتف' : 'Private'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              /* Tab Body: Join with Code */
              <View>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                    {isRTL ? 'كود الكانتين *' : 'Cantin Code *'}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { letterSpacing: 2, fontWeight: '800', textTransform: 'uppercase' },
                      isRTL && { textAlign: 'right' },
                    ]}
                    placeholder="e.g. ELC-101"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    value={cantinCode}
                    onChangeText={setCantinCode}
                  />
                  <Text style={[styles.hintText, isRTL && { textAlign: 'right' }]}>
                    {isRTL
                      ? 'أدخل كود الكانتين الذي شاركه معك المدير للاتصال بنفس المتجر'
                      : 'Enter the code provided by the store manager to connect directly.'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleComplete}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {submitting
                ? isRTL
                  ? 'جاري التحميل...'
                  : 'Setting up...'
                : isRTL
                ? 'دخول وبدء الاستخدام'
                : 'Start Using App'}
            </Text>
            <MaterialCommunityIcons
              name={isRTL ? 'arrow-left' : 'arrow-right'}
              size={20}
              color={colors.white}
              style={{ marginHorizontal: 6 }}
            />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    marginLeft: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textPrimary,
  },
  roleRow: {
    flexDirection: 'row',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  roleOptionActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 6,
  },
  roleTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  tabSelectorRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  tabChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabChoiceBtnActive: {
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 6,
  },
  tabChoiceTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  hintText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
});
