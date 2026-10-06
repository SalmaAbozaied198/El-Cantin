import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

interface CantinSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CantinSwitcherModal: React.FC<CantinSwitcherModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    activeCantin,
    allCantins,
    switchCantin,
    createCantin,
    joinCantinByCode,
    deleteCantin,
    renameCantin,
  } = useData();
  const { t, isRTL } = useLanguage();

  const [tab, setTab] = useState<'LIST' | 'JOIN' | 'CREATE'>('LIST');
  const [joinCode, setJoinCode] = useState('');
  const [newCantinName, setNewCantinName] = useState('');
  const [isSharedMode, setIsSharedMode] = useState(true);
  const [isEditingActiveName, setIsEditingActiveName] = useState(false);
  const [tempActiveName, setTempActiveName] = useState('');

  const handleStartRename = () => {
    setTempActiveName(activeCantin.name);
    setIsEditingActiveName(true);
  };

  const handleSaveRename = async () => {
    if (!tempActiveName.trim()) {
      Alert.alert('Validation Error', 'Cantin name cannot be empty');
      return;
    }
    await renameCantin(activeCantin.id, tempActiveName.trim());
    setIsEditingActiveName(false);
    Alert.alert(t('appName'), t('cantinRenamedSuccess'));
  };

  const handleDeleteCantin = (cantin: any) => {
    if (allCantins.length <= 1) {
      Alert.alert(t('deleteCantin'), t('cannotDeleteOnlyCantin'));
      return;
    }
    Alert.alert(
      t('deleteCantin'),
      t('deleteCantinConfirm').replace('{name}', cantin.name),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteCantin(cantin.id);
          },
        },
      ]
    );
  };

  const handleShareCode = async () => {
    const message = isRTL
      ? `انضم إلى متجر الكانتين الخاص بي على تطبيق "الكانتين"! كود الانضمام هو: ${activeCantin.code}`
      : `Join my store on EL cantin app! Store Code: ${activeCantin.code}`;
    try {
      await Share.share({
        message,
        title: t('activeCantin'),
      });
    } catch {
      Alert.alert(t('activeCantin'), `${t('cantinCode')}: ${activeCantin.code}`);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid code.');
      return;
    }
    const joined = await joinCantinByCode(joinCode.trim());
    if (joined) {
      Alert.alert(t('appName'), t('cantinJoinedSuccess'));
      setJoinCode('');
      setTab('LIST');
      onClose();
    } else {
      Alert.alert('Error', t('cantinNotFound'));
    }
  };

  const handleCreate = async () => {
    if (!newCantinName.trim()) {
      Alert.alert('Validation Error', 'Please enter a cantin name.');
      return;
    }
    await createCantin(newCantinName.trim(), isSharedMode);
    Alert.alert(t('appName'), t('cantinCreatedSuccess'));
    setNewCantinName('');
    setTab('LIST');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={[styles.header, isRTL && styles.rowRtl]}>
            <View style={[styles.headerLeft, isRTL && styles.rowRtl]}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="storefront-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.headerTitle}>{t('cantinWorkspace')}</Text>
                <Text style={styles.headerSubtitle}>
                  {activeCantin.name} ({activeCantin.code})
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Sub Navigation Bar inside Modal */}
          <View style={[styles.subTabs, isRTL && styles.rowRtl]}>
            <TouchableOpacity
              style={[styles.subTabItem, tab === 'LIST' && styles.subTabItemActive]}
              onPress={() => setTab('LIST')}
            >
              <Text style={[styles.subTabText, tab === 'LIST' && styles.subTabTextActive]}>
                {t('activeCantin')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTabItem, tab === 'JOIN' && styles.subTabItemActive]}
              onPress={() => setTab('JOIN')}
            >
              <Text style={[styles.subTabText, tab === 'JOIN' && styles.subTabTextActive]}>
                {t('joinWithCode')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTabItem, tab === 'CREATE' && styles.subTabItemActive]}
              onPress={() => setTab('CREATE')}
            >
              <Text style={[styles.subTabText, tab === 'CREATE' && styles.subTabTextActive]}>
                {t('createNewCantin')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. LIST / ACTIVE CANTIN TAB */}
            {tab === 'LIST' && (
              <View>
                {/* Active Cantin Hero Card */}
                <View style={styles.activeHeroCard}>
                  <View style={[styles.heroTop, isRTL && styles.rowRtl]}>
                    <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                      {isEditingActiveName ? (
                        <View style={[styles.renameInputRow, isRTL && styles.rowRtl]}>
                          <TextInput
                            style={[styles.renameInput, isRTL && { textAlign: 'right' }]}
                            value={tempActiveName}
                            onChangeText={setTempActiveName}
                            autoFocus
                          />
                          <TouchableOpacity style={styles.saveRenameBtn} onPress={handleSaveRename}>
                            <MaterialCommunityIcons name="check" size={16} color={colors.white} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.cancelRenameBtn}
                            onPress={() => setIsEditingActiveName(false)}
                          >
                            <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={[styles.heroNameRow, isRTL && styles.rowRtl]}>
                          <Text style={styles.heroName}>{activeCantin.name}</Text>
                          <TouchableOpacity style={styles.renameIconBtn} onPress={handleStartRename}>
                            <MaterialCommunityIcons name="pencil" size={15} color={colors.primaryDark} />
                          </TouchableOpacity>
                        </View>
                      )}
                      <Text style={styles.heroOwner}>
                        {isRTL ? 'المالك / المدير:' : 'Owner / Admin:'} {activeCantin.ownerName}
                      </Text>
                    </View>
                    <View style={[styles.modeTag, activeCantin.isShared ? styles.sharedTag : styles.privateTag]}>
                      <Text style={[styles.modeTagText, activeCantin.isShared ? styles.sharedTagText : styles.privateTagText]}>
                        {activeCantin.isShared ? 'SHARED' : 'PERSONAL'}
                      </Text>
                    </View>
                  </View>

                  {/* Share Code Box */}
                  <View style={styles.codeContainer}>
                    <Text style={[styles.codeNotice, isRTL && { textAlign: 'right' }]}>
                      {t('shareCodeMsg')}
                    </Text>
                    <View style={[styles.codeDisplayBox, isRTL && styles.rowRtl]}>
                      <Text style={styles.codeText}>{activeCantin.code}</Text>
                      <TouchableOpacity style={styles.shareCodeBtn} onPress={handleShareCode}>
                        <MaterialCommunityIcons name="share-variant" size={16} color={colors.white} />
                        <Text style={styles.shareCodeBtnText}>{t('copyCode')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* List of Other Saved Cantins */}
                <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
                  {t('myCantinsList')} ({allCantins.length})
                </Text>

                {allCantins.map((cantin) => {
                  const isActive = cantin.id === activeCantin.id;
                  return (
                    <View
                      key={cantin.id}
                      style={[styles.cantinItemRow, isActive && styles.cantinItemActive, isRTL && styles.rowRtl]}
                    >
                      <TouchableOpacity
                        style={[styles.cantinItemLeft, isRTL && styles.rowRtl]}
                        onPress={() => {
                          switchCantin(cantin.id);
                          onClose();
                        }}
                      >
                        <View style={[styles.cantinIconWrapper, isActive && { backgroundColor: colors.primary }]}>
                          <MaterialCommunityIcons
                            name={cantin.isShared ? 'account-group' : 'storefront'}
                            size={18}
                            color={isActive ? colors.white : colors.primaryDark}
                          />
                        </View>
                        <View style={[{ flex: 1, marginHorizontal: 10 }, isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                          <Text style={[styles.cantinItemName, isActive && { color: colors.primaryDark }]} numberOfLines={1}>
                            {cantin.name}
                          </Text>
                          <Text style={styles.cantinItemCode} numberOfLines={1}>{cantin.code} • {cantin.ownerName}</Text>
                        </View>
                      </TouchableOpacity>

                      <View style={[styles.cantinActionsRight, isRTL && styles.rowRtl]}>
                        {isActive ? (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>{isRTL ? 'الحالي' : 'ACTIVE'}</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => {
                              switchCantin(cantin.id);
                              onClose();
                            }}
                          >
                            <Text style={styles.switchLink}>{t('switchCantin')}</Text>
                          </TouchableOpacity>
                        )}

                        {allCantins.length > 1 && (
                          <TouchableOpacity
                            style={styles.deleteCantinBtn}
                            onPress={() => handleDeleteCantin(cantin)}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 2. JOIN BY CODE TAB */}
            {tab === 'JOIN' && (
              <View style={styles.formContainer}>
                <View style={[styles.infoBanner, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="qrcode-scan" size={24} color={colors.infoText} />
                  <Text style={[styles.infoBannerText, isRTL && { textAlign: 'right', marginRight: 10, marginLeft: 0 }]}>
                    {isRTL
                      ? 'أدخل كود الكانتين الذي شاركه معك المدير أو زميلك لتتصل بنفس المتجر على هاتفك فوراً.'
                      : 'Enter the Cantin Code shared by your manager to sync and access the same store on your phone.'}
                  </Text>
                </View>

                <Text style={[styles.inputLabel, isRTL && { textAlign: 'right' }]}>{t('cantinCode')}</Text>
                <TextInput
                  style={[styles.input, styles.codeInput, isRTL && { textAlign: 'right' }]}
                  placeholder={t('enterCodePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  value={joinCode}
                  onChangeText={setJoinCode}
                />

                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleJoin}>
                  <MaterialCommunityIcons name="login" size={20} color={colors.white} style={{ marginHorizontal: 6 }} />
                  <Text style={styles.primaryActionText}>{t('joinWithCode')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 3. CREATE NEW CANTIN TAB */}
            {tab === 'CREATE' && (
              <View style={styles.formContainer}>
                <Text style={[styles.inputLabel, isRTL && { textAlign: 'right' }]}>{t('cantinNameLabel')}</Text>
                <TextInput
                  style={[styles.input, isRTL && { textAlign: 'right' }]}
                  placeholder={t('cantinNamePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={newCantinName}
                  onChangeText={setNewCantinName}
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }, isRTL && { textAlign: 'right' }]}>
                  {t('cantinModeLabel')}
                </Text>

                <TouchableOpacity
                  style={[styles.modeSelectBtn, isSharedMode && styles.modeSelectActive, isRTL && styles.rowRtl]}
                  onPress={() => setIsSharedMode(true)}
                >
                  <MaterialCommunityIcons
                    name={isSharedMode ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={isSharedMode ? colors.primaryDark : colors.textMuted}
                  />
                  <View style={{ marginHorizontal: 10, alignItems: isRTL ? 'flex-end' : 'flex-start', flex: 1 }}>
                    <Text style={[styles.modeTitle, isSharedMode && { color: colors.primaryDark }]}>
                      {t('sharedModeDesc')}
                    </Text>
                    <Text style={styles.modeSub}>
                      {isRTL ? 'يتيح للآخرين الانضمام بنفس الكود ومتابعة المبيعات' : 'Generates a code so other phones can join and sync'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeSelectBtn, !isSharedMode && styles.modeSelectActive, isRTL && styles.rowRtl, { marginTop: 8 }]}
                  onPress={() => setIsSharedMode(false)}
                >
                  <MaterialCommunityIcons
                    name={!isSharedMode ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={!isSharedMode ? colors.primaryDark : colors.textMuted}
                  />
                  <View style={{ marginHorizontal: 10, alignItems: isRTL ? 'flex-end' : 'flex-start', flex: 1 }}>
                    <Text style={[styles.modeTitle, !isSharedMode && { color: colors.primaryDark }]}>
                      {t('privateModeDesc')}
                    </Text>
                    <Text style={styles.modeSub}>
                      {isRTL ? 'بيانات معزولة خاصة بهذا الهاتف فقط بدون مشاركة' : 'Runs offline on this device with full privacy'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.primaryActionBtn, { marginTop: 20 }]} onPress={handleCreate}>
                  <MaterialCommunityIcons name="plus-circle" size={20} color={colors.white} style={{ marginHorizontal: 6 }} />
                  <Text style={styles.primaryActionText}>{t('createNewCantin')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
  },
  subTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.cardHover,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subTabItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subTabTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  activeHeroCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  renameIconBtn: {
    padding: 4,
    marginHorizontal: 6,
    backgroundColor: colors.white,
    borderRadius: 6,
  },
  renameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  renameInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 140,
  },
  saveRenameBtn: {
    backgroundColor: colors.primary,
    padding: 6,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelRenameBtn: {
    padding: 6,
    marginHorizontal: 2,
  },
  cantinActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteCantinBtn: {
    padding: 6,
    marginHorizontal: 6,
  },
  heroOwner: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sharedTag: {
    backgroundColor: '#CCFBF1',
  },
  privateTag: {
    backgroundColor: '#FEF3C7',
  },
  modeTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sharedTagText: {
    color: colors.primaryDark,
  },
  privateTagText: {
    color: colors.accentDark,
  },
  codeContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
  },
  codeNotice: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  codeDisplayBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryDark,
    letterSpacing: 1,
  },
  shareCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  shareCodeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  cantinItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardHover,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cantinItemActive: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
  },
  cantinItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cantinIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantinItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cantinItemCode: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  activeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  switchLink: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  formContainer: {
    paddingVertical: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.infoText,
    marginLeft: 10,
    lineHeight: 18,
  },
  inputLabel: {
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
    marginBottom: 10,
  },
  codeInput: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  modeSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardHover,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeSelectActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modeSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
