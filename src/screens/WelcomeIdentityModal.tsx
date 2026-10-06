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
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

type ScreenMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'SELECT_CANTIN';

export const WelcomeIdentityModal: React.FC = () => {
  const {
    currentUser,
    signInWithFirebase,
    signUpWithFirebase,
    resetPassword,
  } = useAuth();
  const { allCantins, switchCantin, createCantin, joinCantinByCode } = useData();
  const { t, isRTL, language, toggleLanguage } = useLanguage();

  const [mode, setMode] = useState<ScreenMode>('LOGIN');

  // Login & Register Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');

  // Cantin Creation / Join fields for new registrations
  const [cantinTab, setCantinTab] = useState<'CREATE' | 'JOIN'>('CREATE');
  const [cantinName, setCantinName] = useState('');
  const [isSharedMode, setIsSharedMode] = useState(true);
  const [cantinCode, setCantinCode] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If user is logged in and not in middle of multi-cantin selection, hide modal
  if (currentUser && mode !== 'SELECT_CANTIN') return null;

  const handleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage(isRTL ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password.');
      return;
    }

    try {
      setSubmitting(true);
      await signInWithFirebase(email.trim(), password);

      // If user has multiple cantins available, allow choosing
      if (allCantins && allCantins.length > 1) {
        setMode('SELECT_CANTIN');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg =
        err.message?.includes('invalid-credential') ||
        err.message?.includes('wrong-password') ||
        err.message?.includes('Incorrect password')
          ? (isRTL ? 'بيانات الاعتماد غير صحيحة، يرجى التأكد من البريد وكلمة المرور' : 'Invalid email or password.')
          : (err.message || (isRTL ? 'حدث خطأ، حاول مجدداً' : 'An error occurred. Please try again.'));
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage(isRTL ? 'كلمة المرور يجب أن تكون ٦ خانات على الأقل' : 'Password must be at least 6 characters.');
      return;
    }

    if (cantinTab === 'CREATE' && !cantinName.trim()) {
      setErrorMessage(isRTL ? 'يرجى إدخال اسم الكانتين الجديد' : 'Please enter a name for your new cantin.');
      return;
    }

    if (cantinTab === 'JOIN' && !cantinCode.trim()) {
      setErrorMessage(isRTL ? 'يرجى إدخال كود الكانتين للانضمام' : 'Please enter the cantin code to join.');
      return;
    }

    try {
      setSubmitting(true);
      await signUpWithFirebase(name.trim(), email.trim(), password, role);

      // Setup Cantin
      if (cantinTab === 'CREATE') {
        await createCantin(cantinName.trim(), isSharedMode);
      } else {
        const joined = await joinCantinByCode(cantinCode.trim());
        if (!joined) {
          setErrorMessage(t('cantinNotFound'));
          setSubmitting(false);
          return;
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg =
        err.message?.includes('email-already-in-use') ||
        err.message?.includes('already registered')
          ? (isRTL ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' : 'This email is already registered. Please sign in.')
          : (err.message || (isRTL ? 'حدث خطأ، حاول مجدداً' : 'An error occurred. Please try again.'));
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage(isRTL ? 'يرجى إدخال بريدك الإلكتروني لاستلام رابط إعادة التعيين' : 'Please enter your email to receive a reset link.');
      return;
    }

    try {
      setSubmitting(true);
      await resetPassword(email.trim());
      setSuccessMessage(
        isRTL
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
          : 'A password reset link has been sent to your email.'
      );
    } catch (err: any) {
      console.error('Reset password error:', err);
      setErrorMessage(err.message || (isRTL ? 'فشل إرسال رابط إعادة التعيين' : 'Failed to send reset email.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectCantin = async (cantinId: string) => {
    await switchCantin(cantinId);
    setMode('LOGIN');
  };

  return (
    <Modal visible={!currentUser || mode === 'SELECT_CANTIN'} animationType="fade" transparent={false}>
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
            {mode === 'SELECT_CANTIN'
              ? (isRTL ? 'اختر الكانتين الذي تريد الدخول إليه' : 'Choose the cantin you want to access')
              : mode === 'FORGOT_PASSWORD'
              ? (isRTL ? 'استعادة كلمة المرور عبر البريد الإلكتروني' : 'Recover your password via email')
              : mode === 'REGISTER'
              ? (isRTL ? 'إنشاء حساب جديد وإعداد المتجر' : 'Create an account & set up your store')
              : (isRTL ? 'تسجيل الدخول إلى حسابك ومتابعة نشاطك' : 'Sign in to access your store and data')}
          </Text>

          {/* Mode Switcher Tabs for Login / Register */}
          {mode !== 'SELECT_CANTIN' && mode !== 'FORGOT_PASSWORD' && (
            <View style={[styles.tabSelectorRow, isRTL && styles.rowRtl]}>
              <TouchableOpacity
                style={[styles.tabChoiceBtn, mode === 'LOGIN' && styles.tabChoiceBtnActive]}
                onPress={() => setMode('LOGIN')}
              >
                <Text style={[styles.tabChoiceText, mode === 'LOGIN' && styles.tabChoiceTextActive]}>
                  {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabChoiceBtn, mode === 'REGISTER' && styles.tabChoiceBtnActive]}
                onPress={() => setMode('REGISTER')}
              >
                <Text style={[styles.tabChoiceText, mode === 'REGISTER' && styles.tabChoiceTextActive]}>
                  {isRTL ? 'حساب جديد' : 'Register'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* VIEW: SELECT CANTIN */}
          {mode === 'SELECT_CANTIN' && (
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionHeading, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'المتاجر والكانتينات المشتركة' : 'Available Cantins'}
              </Text>
              {allCantins.map((cantin) => (
                <TouchableOpacity
                  key={cantin.id}
                  style={styles.cantinOptionItem}
                  onPress={() => handleSelectCantin(cantin.id)}
                >
                  <MaterialCommunityIcons name="storefront" size={24} color={colors.primary} />
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={styles.cantinOptionTitle}>{cantin.name}</Text>
                    <Text style={styles.cantinOptionCode}>Code: {cantin.code}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isRTL ? 'chevron-left' : 'chevron-right'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {mode === 'FORGOT_PASSWORD' && (
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionHeading, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'استعادة كلمة المرور' : 'Password Reset'}
              </Text>
              <Text style={[styles.hintText, { marginBottom: 12 }, isRTL && { textAlign: 'right' }]}>
                {isRTL
                  ? 'أدخل بريدك الإلكتروني المسجل، وسنرسل لك رابطاً لإعادة تعيين كلمة المرور فوراً.'
                  : 'Enter your registered email address and we will send you a password reset link.'}
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? 'البريد الإلكتروني *' : 'Email Address *'}
                </Text>
                <TextInput
                  style={[styles.input, isRTL && { textAlign: 'right' }]}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {errorMessage && (
                <View style={[styles.errorBox, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.errorText, isRTL && { textAlign: 'right' }]}>{errorMessage}</Text>
                </View>
              )}

              {successMessage && (
                <View style={[styles.successBox, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                  <Text style={[styles.successText, isRTL && { textAlign: 'right' }]}>{successMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleForgotPassword}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isRTL ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 16, alignItems: 'center' }}
                onPress={() => setMode('LOGIN')}
              >
                <Text style={styles.linkText}>
                  {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* VIEW: LOGIN */}
          {mode === 'LOGIN' && (
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionHeading, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'بيانات تسجيل الدخول' : 'Sign In Credentials'}
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? 'البريد الإلكتروني *' : 'Email Address *'}
                </Text>
                <TextInput
                  style={[styles.input, isRTL && { textAlign: 'right' }]}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? 'كلمة المرور *' : 'Password *'}
                </Text>
                <TextInput
                  style={[styles.input, isRTL && { textAlign: 'right' }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity
                style={{ alignSelf: isRTL ? 'flex-start' : 'flex-end', marginBottom: 14 }}
                onPress={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('FORGOT_PASSWORD');
                }}
              >
                <Text style={styles.linkText}>
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </Text>
              </TouchableOpacity>

              {errorMessage && (
                <View style={[styles.errorBox, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.errorText, isRTL && { textAlign: 'right' }]}>{errorMessage}</Text>
                </View>
              )}

              {successMessage && (
                <View style={[styles.successBox, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                  <Text style={[styles.successText, isRTL && { textAlign: 'right' }]}>{successMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>
                      {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                    </Text>
                    <MaterialCommunityIcons
                      name={isRTL ? 'arrow-left' : 'arrow-right'}
                      size={20}
                      color={colors.white}
                      style={{ marginHorizontal: 6 }}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* VIEW: REGISTER */}
          {mode === 'REGISTER' && (
            <>
              {/* Profile details */}
              <View style={styles.sectionCard}>
                <Text style={[styles.sectionHeading, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? '١. بيانات الحساب' : '1. Profile & Credentials'}
                </Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                    {isRTL ? 'اسم المستخدم *' : 'Your Name *'}
                  </Text>
                  <TextInput
                    style={[styles.input, isRTL && { textAlign: 'right' }]}
                    placeholder={isRTL ? 'مثال: سلمى، أحمد' : 'e.g. Salma, Ahmed'}
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                    {isRTL ? 'البريد الإلكتروني *' : 'Email Address *'}
                  </Text>
                  <TextInput
                    style={[styles.input, isRTL && { textAlign: 'right' }]}
                    placeholder="name@example.com"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                    {isRTL ? 'كلمة المرور (٦ خانات على الأقل) *' : 'Password (min 6 characters) *'}
                  </Text>
                  <TextInput
                    style={[styles.input, isRTL && { textAlign: 'right' }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
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

              {/* Cantin Setup */}
              <View style={styles.sectionCard}>
                <Text style={[styles.sectionHeading, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? '٢. إعداد الكانتين' : '2. Cantin Setup'}
                </Text>

                <View style={[styles.tabSelectorRow, isRTL && styles.rowRtl]}>
                  <TouchableOpacity
                    style={[styles.tabChoiceBtn, cantinTab === 'CREATE' && styles.tabChoiceBtnActive]}
                    onPress={() => setCantinTab('CREATE')}
                  >
                    <Text style={[styles.tabChoiceText, cantinTab === 'CREATE' && styles.tabChoiceTextActive]}>
                      {isRTL ? 'إنشاء كانتين جديد' : 'Open New Cantin'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabChoiceBtn, cantinTab === 'JOIN' && styles.tabChoiceBtnActive]}
                    onPress={() => setCantinTab('JOIN')}
                  >
                    <Text style={[styles.tabChoiceText, cantinTab === 'JOIN' && styles.tabChoiceTextActive]}>
                      {isRTL ? 'انضمام برمز كود' : 'Join with Code'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {cantinTab === 'CREATE' ? (
                  <View>
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                        {isRTL ? 'اسم الكانتين الخاص بك *' : 'Your Cantin Name *'}
                      </Text>
                      <TextInput
                        style={[styles.input, isRTL && { textAlign: 'right' }]}
                        placeholder={isRTL ? 'مثال: كانتين سلمى، كانتين كلية الهندسة' : "e.g. Salma's Cantin"}
                        placeholderTextColor={colors.textMuted}
                        value={cantinName}
                        onChangeText={setCantinName}
                      />
                    </View>
                  </View>
                ) : (
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
                  </View>
                )}
              </View>

              {errorMessage && (
                <View style={[styles.errorBox, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.errorText, isRTL && { textAlign: 'right' }]}>{errorMessage}</Text>
                </View>
              )}

              {successMessage && (
                <View style={[styles.successBox, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                  <Text style={[styles.successText, isRTL && { textAlign: 'right' }]}>{successMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>
                      {isRTL ? 'إنشاء الحساب وبدء الاستخدام' : 'Complete Registration'}
                    </Text>
                    <MaterialCommunityIcons
                      name={isRTL ? 'arrow-left' : 'arrow-right'}
                      size={20}
                      color={colors.white}
                      style={{ marginHorizontal: 6 }}
                    />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
    marginHorizontal: 8,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 4,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.successText,
    marginHorizontal: 8,
    flex: 1,
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
    fontSize: 12,
    color: colors.textMuted,
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
  linkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  cantinOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cantinOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cantinOptionCode: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
