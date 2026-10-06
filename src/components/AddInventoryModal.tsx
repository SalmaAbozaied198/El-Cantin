import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { InventoryItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AddInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (itemData: {
    name: string;
    category?: string;
    cardboardBoxes: number;
    innerBoxes: number;
    piecesPerBox: number;
    pricePerPiece: number;
  }) => void;
  editItem?: InventoryItem | null;
}

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  visible,
  onClose,
  onSave,
  editItem,
}) => {
  const { t, isRTL } = useLanguage();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [cardboardBoxes, setCardboardBoxes] = useState('');
  const [innerBoxes, setInnerBoxes] = useState('');
  const [piecesPerBox, setPiecesPerBox] = useState('');
  const [pricePerPiece, setPricePerPiece] = useState('');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setCategory(editItem.category || '');
      setCardboardBoxes(editItem.cardboardBoxes.toString());
      setInnerBoxes(editItem.innerBoxes.toString());
      setPiecesPerBox(editItem.piecesPerBox.toString());
      setPricePerPiece(editItem.pricePerPiece.toString());
    } else {
      setName('');
      setCategory('');
      setCardboardBoxes('10');
      setInnerBoxes('4');
      setPiecesPerBox('12');
      setPricePerPiece('10');
    }
  }, [editItem, visible]);

  // Live Math Calculations
  const cBoxes = parseFloat(cardboardBoxes) || 0;
  const inBoxes = parseFloat(innerBoxes) || 0;
  const pBox = parseFloat(piecesPerBox) || 0;
  const unitPrice = parseFloat(pricePerPiece) || 0;

  const piecesPerCardboard = inBoxes * pBox;
  const costPerCardboard = piecesPerCardboard * unitPrice;
  const totalPieces = cBoxes * piecesPerCardboard;
  const totalItemCost = cBoxes * costPerCardboard;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid item name.');
      return;
    }
    if (cBoxes <= 0 || inBoxes <= 0 || pBox <= 0 || unitPrice <= 0) {
      Alert.alert('Validation Error', 'Please provide positive quantities for all packaging levels and price.');
      return;
    }

    onSave({
      name: name.trim(),
      category: category.trim() || 'General',
      cardboardBoxes: cBoxes,
      innerBoxes: inBoxes,
      piecesPerBox: pBox,
      pricePerPiece: unitPrice,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          <View style={[styles.header, isRTL && styles.rowRtl]}>
            <View style={[styles.headerLeft, isRTL && styles.rowRtl]}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="package-variant-closed" size={22} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>
                {editItem ? t('editGoods') : t('addGoods')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Item Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('goodsName')} *</Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder="e.g. Molto Chocolate, Indomie, Pepsi"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('category')}</Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder="e.g. Bakery, Beverages, Snacks"
                placeholderTextColor={colors.textMuted}
                value={category}
                onChangeText={setCategory}
              />
            </View>

            <View style={styles.sectionDivider}>
              <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
                {t('packagingHierarchy')}
              </Text>
              <Text style={[styles.sectionSubtitle, isRTL && { textAlign: 'right' }]}>
                {t('packagingSubtitle')}
              </Text>
            </View>

            {/* Row 1: Cardboard Boxes & Inner Boxes */}
            <View style={[styles.row, isRTL && styles.rowRtl]}>
              <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('cardboardBoxesField')}</Text>
                <View style={[styles.inputWithIcon, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="archive" size={18} color={colors.primary} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.flexInput, isRTL && { textAlign: 'right' }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={cardboardBoxes}
                    onChangeText={setCardboardBoxes}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('innerBoxesField')}</Text>
                <View style={[styles.inputWithIcon, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="package-variant" size={18} color={colors.primary} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.flexInput, isRTL && { textAlign: 'right' }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={innerBoxes}
                    onChangeText={setInnerBoxes}
                  />
                </View>
              </View>
            </View>

            {/* Row 2: Pieces per Box & Price per Piece */}
            <View style={[styles.row, isRTL && styles.rowRtl]}>
              <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('piecesPerBoxField')}</Text>
                <View style={[styles.inputWithIcon, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="cube-outline" size={18} color={colors.primary} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.flexInput, isRTL && { textAlign: 'right' }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={piecesPerBox}
                    onChangeText={setPiecesPerBox}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('pricePerPieceField')}</Text>
                <View style={[styles.inputWithIcon, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="cash" size={18} color={colors.accentDark} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.flexInput, isRTL && { textAlign: 'right' }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={pricePerPiece}
                    onChangeText={setPricePerPiece}
                  />
                </View>
              </View>
            </View>

            {/* LIVE AUTOMATIC CALCULATION CARD */}
            <View style={styles.calcPreviewCard}>
              <View style={[styles.calcTitleRow, isRTL && styles.rowRtl]}>
                <MaterialCommunityIcons name="calculator-variant" size={20} color={colors.primaryDark} />
                <Text style={styles.calcTitle}>{t('calculationBreakdown')}</Text>
              </View>

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('piecesInOneCarton')}</Text>
                <Text style={styles.calcValueHighlight}>{piecesPerCardboard} {t('pcs')}</Text>
              </View>

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('costOfOneCarton')}</Text>
                <Text style={styles.calcValueHighlight}>
                  {costPerCardboard.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('totalPiecesInStock')}</Text>
                <Text style={styles.calcValue}>{totalPieces} {t('pcs')}</Text>
              </View>

              <View style={styles.calcDivider} />

              <View style={[styles.calcTotalRow, isRTL && styles.rowRtl]}>
                <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <Text style={styles.calcTotalLabel}>{t('totalItemValuation')}</Text>
                  <Text style={styles.calcTotalSub}>{t('addsToStore')}</Text>
                </View>
                <Text style={styles.calcTotalValue}>
                  {totalItemCost.toLocaleString()} {t('currency')}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <MaterialCommunityIcons name="check" size={20} color={colors.white} style={{ marginHorizontal: 4 }} />
              <Text style={styles.saveText}>{editItem ? t('saveChanges') : t('addToStore')}</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
  closeBtn: {
    padding: 6,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  fieldIcon: {
    marginHorizontal: 4,
  },
  flexInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionDivider: {
    marginTop: 8,
    marginBottom: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  calcPreviewCard: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  calcTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calcTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginHorizontal: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  calcValueHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  calcDivider: {
    height: 1,
    backgroundColor: colors.primaryBorder,
    marginVertical: 10,
  },
  calcTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  calcTotalSub: {
    fontSize: 11,
    color: colors.primaryDark,
  },
  calcTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
