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
import { useLanguage } from '../context/LanguageContext';
import { StoreCouponItem, SubMarket } from '../types';

// ====================================================
// 1. ADD / BUY STORE COUPONS MODAL (Asset Entry into Store)
// ====================================================
interface AddStoreCouponModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, quantity: number, unitValue: number, note?: string) => Promise<void>;
}

export const AddStoreCouponModal: React.FC<AddStoreCouponModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { t, isRTL } = useLanguage();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const numQty = parseInt(quantity, 10) || 0;
  const numVal = parseFloat(unitValue) || 0;
  const totalVal = numQty * numVal;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', isRTL ? 'يرجى إدخال اسم الكوبون' : 'Please enter coupon name.');
      return;
    }
    if (numQty <= 0) {
      Alert.alert('Validation Error', isRTL ? 'يرجى إدخال عدد الكوبونات المشتراة' : 'Please enter a valid quantity.');
      return;
    }
    if (numVal <= 0) {
      Alert.alert('Validation Error', isRTL ? 'يرجى إدخال قيمة الكوبون بالجنيه' : 'Please enter a valid coupon value.');
      return;
    }

    try {
      setSaving(true);
      await onSave(name.trim(), numQty, numVal, note.trim() || undefined);
      setName('');
      setQuantity('');
      setUnitValue('');
      setNote('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.cardModal}>
          {/* Header */}
          <View style={[styles.headerRow, isRTL && styles.rowRtl]}>
            <View style={[styles.headerLeft, isRTL && styles.rowRtl]}>
              <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="ticket-percent" size={22} color="#7C3AED" />
              </View>
              <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.modalTitle}>
                  {isRTL ? 'شراء / إدخال كوبونات للمخزن' : 'Buy / Stock Store Coupons'}
                </Text>
                <Text style={styles.modalSub}>
                  {isRTL ? 'إضافة عهدة كوبونات كأصل مالي بالمخزن' : 'Add coupon vouchers as store assets'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            {/* Coupon Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'اسم الكوبون / الفئة *' : 'Coupon Name / Title *'}
              </Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder={isRTL ? 'مثال: كوبون وجبة، فئة ٥٠ جنيه، قسيمة مشتريات' : 'e.g. Meal Voucher, 50 EGP Coupon'}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Quantity & Unit Value */}
            <View style={[styles.row, isRTL && styles.rowRtl]}>
              <View style={{ flex: 1, marginHorizontal: 3 }}>
                <Text style={[styles.inputLabel, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? 'العدد المشتري *' : 'Quantity Purchased *'}
                </Text>
                <TextInput
                  style={[styles.input, { fontWeight: '700' }, isRTL && { textAlign: 'right' }]}
                  placeholder={isRTL ? 'مثال: 100' : 'e.g. 100'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={quantity}
                  onChangeText={(v) => setQuantity(v.replace(/[^0-9]/g, ''))}
                />
              </View>

              <View style={{ flex: 1, marginHorizontal: 3 }}>
                <Text style={[styles.inputLabel, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? 'قيمة الكوبون (ج.م) *' : 'Value per Coupon (EGP) *'}
                </Text>
                <TextInput
                  style={[styles.input, { fontWeight: '700', color: '#7C3AED' }, isRTL && { textAlign: 'right' }]}
                  placeholder={isRTL ? 'مثال: 50' : 'e.g. 50'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={unitValue}
                  onChangeText={setUnitValue}
                />
              </View>
            </View>

            {/* Live Calculation Preview */}
            {numQty > 0 && numVal > 0 && (
              <View style={styles.calcPreviewBox}>
                <View style={[styles.rowBetween, isRTL && styles.rowRtl]}>
                  <Text style={styles.calcLabel}>{isRTL ? 'إجمالي قيمة الكوبونات:' : 'Total Coupon Valuation:'}</Text>
                  <Text style={styles.calcValue}>{totalVal.toLocaleString()} {t('currency')}</Text>
                </View>
                <Text style={[styles.calcSubText, isRTL && { textAlign: 'right' }]}>
                  {isRTL
                    ? `ستدخل ${numQty} كوبونات إلى المخزن بقيمة ${totalVal.toLocaleString()} ج.م قبل توزيعها`
                    : `${numQty} coupons will be stocked in the main store before distribution`}
                </Text>
              </View>
            )}

            {/* Note */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'ملاحظة (اختياري)' : 'Note (Optional)'}
              </Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder={isRTL ? 'مثال: دفعة مطعم الجامعة الأولى' : 'e.g. Batch #1 for campus'}
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={[styles.btnRow, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <MaterialCommunityIcons name="check" size={18} color={colors.white} />
              <Text style={styles.submitBtnText}>
                {isRTL ? 'حفظ في المخزن' : 'Add to Store Stock'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ====================================================
// 2. TRANSFER STORE COUPONS TO SUB-MARKET MODAL
// ====================================================
interface TransferStoreCouponModalProps {
  visible: boolean;
  coupon: StoreCouponItem | null;
  subMarkets: SubMarket[];
  onClose: () => void;
  onTransfer: (couponId: string, subMarketId: string, quantity: number, note?: string) => Promise<boolean>;
}

export const TransferStoreCouponModal: React.FC<TransferStoreCouponModalProps> = ({
  visible,
  coupon,
  subMarkets,
  onClose,
  onTransfer,
}) => {
  const { t, isRTL } = useLanguage();
  const [selectedMarketId, setSelectedMarketId] = useState<string>(subMarkets[0]?.id || '');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [transferring, setTransferring] = useState(false);

  if (!coupon) return null;

  const inStock = coupon.inStockQuantity;
  const numQty = parseInt(quantity, 10) || 0;
  const totalAmount = numQty * coupon.unitValue;

  const handleTransfer = async () => {
    if (!selectedMarketId) {
      Alert.alert('Validation Error', isRTL ? 'يرجى اختيار المنفذ المستلم' : 'Please select a sub-market.');
      return;
    }
    if (numQty <= 0 || numQty > inStock) {
      Alert.alert(
        'Validation Error',
        isRTL
          ? `يرجى إدخال عدد بين ١ و ${inStock}`
          : `Please enter a quantity between 1 and ${inStock}`
      );
      return;
    }

    try {
      setTransferring(true);
      const ok = await onTransfer(coupon.id, selectedMarketId, numQty, note.trim() || undefined);
      if (ok) {
        Alert.alert(
          isRTL ? 'تم التحويل' : 'Transferred Successfully',
          isRTL
            ? `تم تحويل ${numQty} كوبون بقيمة ${totalAmount.toLocaleString()} ج.م للمنفذ بنجاح.`
            : `Transferred ${numQty} coupons (${totalAmount.toLocaleString()} EGP) to kiosk.`
        );
        onClose();
      }
    } finally {
      setTransferring(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.cardModal}>
          {/* Header */}
          <View style={[styles.headerRow, isRTL && styles.rowRtl]}>
            <View style={[styles.headerLeft, isRTL && styles.rowRtl]}>
              <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="truck-fast" size={22} color="#7C3AED" />
              </View>
              <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.modalTitle}>
                  {isRTL ? 'صرف / تحويل كوبونات لمنفذ' : 'Transfer Coupons to Kiosk'}
                </Text>
                <Text style={styles.modalSub}>{coupon.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            {/* Stock Summary Banner */}
            <View style={styles.stockSummaryBanner}>
              <View style={[styles.rowBetween, isRTL && styles.rowRtl]}>
                <Text style={styles.stockSummaryLabel}>{isRTL ? 'المتاح بالمخزن الرئيسي:' : 'Available in Store:'}</Text>
                <Text style={styles.stockSummaryValue}>{inStock} {isRTL ? 'كوبون' : 'pcs'}</Text>
              </View>
              <View style={[styles.rowBetween, isRTL && styles.rowRtl, { marginTop: 4 }]}>
                <Text style={styles.stockSummaryLabel}>{isRTL ? 'قيمة الكوبون الواحد:' : 'Unit Value:'}</Text>
                <Text style={[styles.stockSummaryValue, { color: '#7C3AED' }]}>{coupon.unitValue.toLocaleString()} {t('currency')}</Text>
              </View>
            </View>

            {/* 1. Select Sub-Market */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'اختر المنفذ المستلم للكوبونات *' : 'Select Target Sub-Market *'}
              </Text>
              {subMarkets.length === 0 ? (
                <Text style={[styles.calcSubText, { color: colors.danger }, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? 'لا توجد منافذ مضافة حالياً. يرجى إضافة منفذ أولاً.' : 'No sub-markets found. Please create one first.'}
                </Text>
              ) : (
                <View style={styles.marketOptionsGrid}>
                  {subMarkets.map((m) => {
                    const isSelected = (selectedMarketId || subMarkets[0]?.id) === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.marketSelectOption, isSelected && styles.marketSelectOptionActive, isRTL && styles.rowRtl]}
                        onPress={() => setSelectedMarketId(m.id)}
                      >
                        <MaterialCommunityIcons
                          name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                          size={18}
                          color={isSelected ? '#7C3AED' : colors.textMuted}
                        />
                        <Text style={[styles.marketSelectText, isSelected && styles.marketSelectTextActive, { marginHorizontal: 6 }]}>
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 2. Quantity to transfer */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isRTL && { textAlign: 'right' }]}>
                {isRTL ? `عدد الكوبونات المراد تحويلها (بحد أقصى ${inStock}) *` : `Quantity to Transfer (Max ${inStock}) *`}
              </Text>
              <View style={[styles.stepperRow, isRTL && styles.rowRtl]}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQuantity(String(Math.max(1, numQty - 1)))}
                >
                  <MaterialCommunityIcons name="minus" size={20} color={colors.textPrimary} />
                </TouchableOpacity>

                <TextInput
                  style={styles.stepperInput}
                  keyboardType="number-pad"
                  value={quantity}
                  onChangeText={(v) => setQuantity(v.replace(/[^0-9]/g, ''))}
                />

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQuantity(String(Math.min(inStock, numQty + 1)))}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Quick Chips */}
              <View style={[styles.quickChipsRow, isRTL && styles.rowRtl]}>
                <TouchableOpacity style={styles.chipBtn} onPress={() => setQuantity('1')}>
                  <Text style={styles.chipBtnText}>{isRTL ? '١' : '1'}</Text>
                </TouchableOpacity>
                {inStock >= 5 && (
                  <TouchableOpacity style={styles.chipBtn} onPress={() => setQuantity('5')}>
                    <Text style={styles.chipBtnText}>{isRTL ? '٥' : '5'}</Text>
                  </TouchableOpacity>
                )}
                {inStock >= 10 && (
                  <TouchableOpacity style={styles.chipBtn} onPress={() => setQuantity('10')}>
                    <Text style={styles.chipBtnText}>{isRTL ? '١٠' : '10'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.chipBtn, { backgroundColor: '#EDE9FE', borderColor: '#DDD6FE' }]} onPress={() => setQuantity(String(inStock))}>
                  <Text style={[styles.chipBtnText, { color: '#7C3AED', fontWeight: '800' }]}>
                    {isRTL ? `تحويل الكل (${inStock})` : `All (${inStock})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Live calculation preview */}
            {numQty > 0 && (
              <View style={styles.calcPreviewBox}>
                <View style={[styles.rowBetween, isRTL && styles.rowRtl]}>
                  <Text style={styles.calcLabel}>{isRTL ? 'قيمة العهدة المحولة:' : 'Custody Value Transferred:'}</Text>
                  <Text style={[styles.calcValue, { color: '#7C3AED' }]}>{totalAmount.toLocaleString()} {t('currency')}</Text>
                </View>
                <Text style={[styles.calcSubText, isRTL && { textAlign: 'right' }]}>
                  {isRTL
                    ? `سيتم إنقاص رصيد المخزن بمقدار ${numQty} كوبون، وإضافتها إلى المنفذ ليقوم بصرفها`
                    : `Will deduct ${numQty} coupons from store and deliver them to the kiosk for redemption`}
                </Text>
              </View>
            )}

            {/* Note */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'ملاحظة (اختياري)' : 'Note (Optional)'}
              </Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder={isRTL ? 'مثال: عهدة وردية الصباح' : 'e.g. Morning shift vouchers'}
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={[styles.btnRow, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={transferring}>
              <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, transferring && { opacity: 0.6 }]}
              onPress={handleTransfer}
              disabled={transferring || subMarkets.length === 0}
            >
              <MaterialCommunityIcons name="truck-check" size={18} color={colors.white} />
              <Text style={styles.submitBtnText}>
                {isRTL ? `تأكيد التحويل (${numQty})` : `Confirm Transfer (${numQty})`}
              </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardModal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  row: {
    flexDirection: 'row',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  formGroup: {
    marginBottom: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  calcPreviewBox: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  calcLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  calcValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6D28D9',
  },
  calcSubText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  stockSummaryBanner: {
    backgroundColor: colors.cardHover,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stockSummaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  stockSummaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  marketOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  marketSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardHover,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  marketSelectOptionActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  marketSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  marketSelectTextActive: {
    color: '#6D28D9',
    fontWeight: '800',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.cardHover,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    width: 80,
    height: 44,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginHorizontal: 10,
  },
  quickChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.cardHover,
    borderRadius: 8,
    margin: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    marginLeft: 6,
  },
});
