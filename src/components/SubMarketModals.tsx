import React, { useState, useEffect } from 'react';
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
import { SubMarket, MarketCoupon, StoreCouponItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// ----------------------------------------------------
// 1. ADD SUB-MARKET MODAL
// ----------------------------------------------------
interface AddSubMarketModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, location?: string, phone?: string, hasCoupons?: boolean) => void;
}

export const AddSubMarketModal: React.FC<AddSubMarketModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { t, isRTL } = useLanguage();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [hasCoupons, setHasCoupons] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a name for the sub-market.');
      return;
    }
    onSave(name.trim(), location.trim(), phone.trim(), hasCoupons);
    setName('');
    setLocation('');
    setPhone('');
    setHasCoupons(false);
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
              <View style={[styles.iconContainer, { backgroundColor: colors.accentLight }]}>
                <MaterialCommunityIcons name="storefront-plus" size={22} color={colors.accentDark} />
              </View>
              <Text style={styles.headerTitle}>{t('addSubMarketTitle')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('marketName')}</Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder="e.g. Science Faculty Canteen, Kiosk #4"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('locationBuilding')}</Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder="e.g. Building B, 2nd Floor"
                placeholderTextColor={colors.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('contactPhone')}</Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder="+20 1xx xxx xxxx"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <TouchableOpacity
              style={[styles.couponToggleRow, isRTL && styles.rowRtl]}
              onPress={() => setHasCoupons(!hasCoupons)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={hasCoupons ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={hasCoupons ? '#7C3AED' : colors.textMuted}
              />
              <Text style={[styles.couponToggleText, hasCoupons && { color: '#7C3AED', fontWeight: '700' }, isRTL && { marginRight: 8, marginLeft: 0 }]}>
                {t('enableCouponsForMarket')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.footer, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accentDark }]} onPress={handleSave}>
              <MaterialCommunityIcons name="check" size={20} color={colors.white} style={{ marginHorizontal: 4 }} />
              <Text style={styles.saveText}>{t('createMarket')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ----------------------------------------------------
// 2. TRANSFER GOODS VALUE MODAL
// ----------------------------------------------------
interface TransferGoodsModalProps {
  visible: boolean;
  onClose: () => void;
  market: SubMarket | null;
  availableStoreValue: number;
  onTransfer: (subMarketId: string, amount: number, note?: string) => Promise<boolean>;
}

export const TransferGoodsModal: React.FC<TransferGoodsModalProps> = ({
  visible,
  onClose,
  market,
  availableStoreValue,
  onTransfer,
}) => {
  const { t, isRTL } = useLanguage();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const numAmount = parseFloat(amount) || 0;
  const newDebt = (market?.currentDebt || 0) + numAmount;
  const newStoreBalance = Math.max(0, availableStoreValue - numAmount);

  const handleConfirm = async () => {
    if (!market) return;
    if (numAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid transfer amount.');
      return;
    }
    setLoading(true);
    const success = await onTransfer(market.id, numAmount, note.trim());
    setLoading(false);
    if (success) {
      setAmount('');
      setNote('');
      onClose();
    }
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
              <View style={[styles.iconContainer, { backgroundColor: colors.infoLight }]}>
                <MaterialCommunityIcons name="truck-delivery" size={22} color={colors.infoText} />
              </View>
              <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.headerTitle}>{t('transferGoodsTitle')}</Text>
                <Text style={styles.headerSubtitle}>{market?.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={[styles.infoBanner, isRTL && styles.rowRtl]}>
              <MaterialCommunityIcons name="information-outline" size={20} color={colors.infoText} />
              <Text style={[styles.infoBannerText, isRTL && { textAlign: 'right', marginRight: 8, marginLeft: 0 }]}>
                {t('transferBanner')}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('transferAmount')}</Text>
              <TextInput
                style={[styles.input, styles.largeInput, isRTL && { textAlign: 'right' }]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('noteDescription')}</Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder="e.g. Morning delivery snacks & soda"
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Calculations impact */}
            <View style={styles.calcPreviewBox}>
              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('currentDebtOnMarket')}</Text>
                <Text style={styles.calcValue}>
                  {(market?.currentDebt || 0).toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('marketBalanceAfter')}</Text>
                <Text style={[styles.calcValue, { color: colors.dangerText, fontWeight: '800' }]}>
                  {newDebt.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('remainingStoreValue')}</Text>
                <Text style={[styles.calcValue, { color: colors.primaryDark }]}>
                  {newStoreBalance.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.stampNotice, isRTL && styles.rowRtl]}>
                <MaterialCommunityIcons name="account-clock" size={16} color={colors.textMuted} />
                <Text style={styles.stampNoticeText}>
                  {t('loggedBy')} {currentUser?.name} ({currentUser?.role})
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.footer, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.infoText }]}
              onPress={handleConfirm}
              disabled={loading}
            >
              <MaterialCommunityIcons name="arrow-right-bold" size={20} color={colors.white} style={{ marginHorizontal: 4 }} />
              <Text style={styles.saveText}>{loading ? t('transferring') : t('confirmTransfer')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ----------------------------------------------------
// 3. RECORD GAIN / REPAYMENT MODAL
// ----------------------------------------------------
interface RecordGainModalProps {
  visible: boolean;
  onClose: () => void;
  market: SubMarket | null;
  onRecordGain: (subMarketId: string, amount: number, note?: string) => Promise<boolean>;
}

export const RecordGainModal: React.FC<RecordGainModalProps> = ({
  visible,
  onClose,
  market,
  onRecordGain,
}) => {
  const { t, isRTL } = useLanguage();
  const [gainAmount, setGainAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const numAmount = parseFloat(gainAmount) || 0;
  const currentDebt = market?.currentDebt || 0;
  const newDebt = Math.max(0, currentDebt - numAmount);

  const handleConfirm = async () => {
    if (!market) return;
    if (numAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }
    setLoading(true);
    const success = await onRecordGain(market.id, numAmount, note.trim());
    setLoading(false);
    if (success) {
      setGainAmount('');
      setNote('');
      onClose();
    }
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
              <View style={[styles.iconContainer, { backgroundColor: colors.successLight }]}>
                <MaterialCommunityIcons name="cash-check" size={22} color={colors.successText} />
              </View>
              <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.headerTitle}>{t('recordGainTitle')}</Text>
                <Text style={styles.headerSubtitle}>{market?.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={[styles.infoBanner, { backgroundColor: colors.successLight }, isRTL && styles.rowRtl]}>
              <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.successText} />
              <Text style={[styles.infoBannerText, { color: colors.successText }, isRTL && { textAlign: 'right', marginRight: 8, marginLeft: 0 }]}>
                {t('gainBanner')}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('gainAmount')}</Text>
              <TextInput
                style={[styles.input, styles.largeInput, { color: colors.successText }, isRTL && { textAlign: 'right' }]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={gainAmount}
                onChangeText={setGainAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('paymentNote')}</Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder="e.g. Daily cash collection, receipt #104"
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Calculations preview */}
            <View style={[styles.calcPreviewBox, { borderColor: colors.successLight }]}>
              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('currentMoneyOnHim')}</Text>
                <Text style={[styles.calcValue, { color: colors.dangerText }]}>
                  {currentDebt.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('gainSubtracted')}</Text>
                <Text style={[styles.calcValue, { color: colors.successText, fontWeight: '700' }]}>
                  - {numAmount.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={styles.calcDivider} />

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('remainingBalanceOnHim')}</Text>
                <Text style={[styles.calcValue, { fontSize: 16, fontWeight: '900', color: colors.textPrimary }]}>
                  {newDebt.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.stampNotice, isRTL && styles.rowRtl]}>
                <MaterialCommunityIcons name="shield-check" size={16} color={colors.primaryDark} />
                <Text style={[styles.stampNoticeText, { color: colors.primaryDark }]}>
                  {t('loggedBy')} {currentUser?.name}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.footer, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.success }]}
              onPress={handleConfirm}
              disabled={loading}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.white} style={{ marginHorizontal: 4 }} />
              <Text style={styles.saveText}>{loading ? t('recording') : t('recordPayment')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ----------------------------------------------------
// 4. TRANSFER STORE COUPONS TO SUB-MARKET MODAL
// ----------------------------------------------------
export interface TransferCouponsModalProps {
  visible: boolean;
  market: SubMarket | null;
  storeCoupons: StoreCouponItem[];
  onClose: () => void;
  onTransfer: (
    storeCouponId: string,
    subMarketId: string,
    quantity: number,
    note?: string
  ) => Promise<boolean>;
}

export const TransferCouponsModal: React.FC<TransferCouponsModalProps> = ({
  visible,
  market,
  storeCoupons,
  onClose,
  onTransfer,
}) => {
  const { t, isRTL } = useLanguage();
  const availableCoupons = (storeCoupons || []).filter((c) => c.inStockQuantity > 0);
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (visible) {
      if (availableCoupons.length > 0 && (!selectedCouponId || !availableCoupons.some((c) => c.id === selectedCouponId))) {
        setSelectedCouponId(availableCoupons[0].id);
      }
      setQuantity('1');
      setNote('');
    }
  }, [visible, storeCoupons]);

  if (!market) return null;

  const selectedCoupon = availableCoupons.find((c) => c.id === selectedCouponId) || availableCoupons[0];
  const maxStock = selectedCoupon ? selectedCoupon.inStockQuantity : 0;
  const numQty = Math.max(1, Math.min(maxStock || 1, parseInt(quantity, 10) || 1));
  const unitVal = selectedCoupon ? selectedCoupon.unitValue : 0;
  const totalValue = numQty * unitVal;
  const currentCouponsBal = market.currentCouponsBalance ?? Math.max(
    0,
    (market.totalCouponsTaken || 0) - (market.totalCouponsGained || market.totalCouponsRedeemed || 0)
  );
  const newCouponsBal = currentCouponsBal + totalValue;

  const handleConfirm = async () => {
    if (!selectedCoupon) {
      Alert.alert('Error', isRTL ? 'لا توجد كوبونات متاحة بالمخزن' : 'No coupons available in store stock.');
      return;
    }
    if (numQty <= 0 || numQty > maxStock) {
      Alert.alert(
        'Validation Error',
        isRTL
          ? `يرجى إدخال عدد صالح بين ١ و ${maxStock}`
          : `Please enter a valid quantity between 1 and ${maxStock}`
      );
      return;
    }

    setTransferring(true);
    try {
      const ok = await onTransfer(selectedCoupon.id, market.id, numQty, note.trim());
      if (ok) {
        onClose();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
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
              <View style={[styles.iconContainer, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="ticket-confirmation" size={22} color="#7C3AED" />
              </View>
              <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.headerTitle}>{t('transferCouponsTitle')}</Text>
                <Text style={styles.headerSubtitle}>{market.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {availableCoupons.length === 0 ? (
              <View style={[styles.emptyContainer, { paddingVertical: 24 }]}>
                <MaterialCommunityIcons name="ticket-outline" size={42} color={colors.textMuted} />
                <Text style={[styles.emptyText, { marginTop: 10 }]}>
                  {t('noStoreCouponsAvailable')}
                </Text>
                <Text style={[styles.dialogSub, { marginTop: 4, textAlign: 'center' }]}>
                  {isRTL
                    ? 'يرجى إضافة وشراء كوبونات في المخزن الرئيسي أولاً لتتمكن من صرفها للمنافذ'
                    : 'Please stock coupons in the Main Store first to transfer them to sub-markets'}
                </Text>
              </View>
            ) : (
              <>
                {/* 1. Select Store Coupon */}
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                  {t('selectStoreCoupon')} *
                </Text>
                <View style={{ marginBottom: 12 }}>
                  {availableCoupons.map((c) => {
                    const isSelected = selectedCoupon?.id === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setSelectedCouponId(c.id)}
                        style={[
                          styles.couponSelectionCard,
                          isSelected && styles.couponSelectionCardActive,
                          isRTL && styles.rowRtl,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                          size={20}
                          color={isSelected ? '#7C3AED' : colors.textMuted}
                        />
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text style={[styles.couponSelectionTitle, isSelected && { color: '#6D28D9', fontWeight: '800' }, isRTL && { textAlign: 'right' }]}>
                            {c.name}
                          </Text>
                          <Text style={[styles.couponSelectionMeta, isRTL && { textAlign: 'right' }]}>
                            {isRTL ? 'قيمة الكوبون:' : 'Unit Value:'} {c.unitValue.toLocaleString()} {t('currency')}
                          </Text>
                        </View>
                        <View style={[styles.stockPill, { backgroundColor: isSelected ? '#EDE9FE' : colors.cardHover }]}>
                          <Text style={[styles.stockPillText, isSelected && { color: '#6D28D9', fontWeight: '800' }]}>
                            {isRTL ? `المتاح: ${c.inStockQuantity}` : `In Stock: ${c.inStockQuantity}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Number of coupons input with stepper */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                    {t('numberOfCoupons')} * ({isRTL ? `الأقصى بالمخزن: ${maxStock}` : `Max: ${maxStock}`})
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
                      onChangeText={(val) => {
                        const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
                        setQuantity(String(Math.min(maxStock, parsed)));
                      }}
                    />

                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setQuantity(String(Math.min(maxStock, numQty + 1)))}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Quick Chips for Quantity */}
                  <View style={[styles.quickChipsRow, isRTL && styles.rowRtl]}>
                    <TouchableOpacity style={styles.chipBtn} onPress={() => setQuantity('1')}>
                      <Text style={styles.chipBtnText}>{isRTL ? '١ كوبون' : '1'}</Text>
                    </TouchableOpacity>
                    {maxStock >= 5 && (
                      <TouchableOpacity style={styles.chipBtn} onPress={() => setQuantity('5')}>
                        <Text style={styles.chipBtnText}>{isRTL ? '٥ كوبونات' : '5'}</Text>
                      </TouchableOpacity>
                    )}
                    {maxStock >= 10 && (
                      <TouchableOpacity style={styles.chipBtn} onPress={() => setQuantity('10')}>
                        <Text style={styles.chipBtnText}>{isRTL ? '١٠ كوبونات' : '10'}</Text>
                      </TouchableOpacity>
                    )}
                    {maxStock >= 20 && (
                      <TouchableOpacity style={styles.chipBtn} onPress={() => setQuantity('20')}>
                        <Text style={styles.chipBtnText}>{isRTL ? '٢٠ كوبون' : '20'}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.chipBtn, styles.chipBtnAll]} onPress={() => setQuantity(String(maxStock))}>
                      <Text style={[styles.chipBtnText, { color: '#7C3AED', fontWeight: '800' }]}>
                        {isRTL ? `الكل (${maxStock})` : `All (${maxStock})`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3. Note input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('couponNote')}</Text>
                  <TextInput
                    style={[styles.input, isRTL && { textAlign: 'right' }]}
                    placeholder={isRTL ? 'ملاحظات اختيارية عن الصرف' : 'Optional notes'}
                    placeholderTextColor={colors.textMuted}
                    value={note}
                    onChangeText={setNote}
                  />
                </View>

                {/* 4. Live Preview Box */}
                <View style={[styles.calcPreviewBox, { borderColor: '#DDD6FE', backgroundColor: '#FAF5FF' }]}>
                  <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                    <Text style={styles.calcLabel}>{isRTL ? 'الكوبون المحدد:' : 'Selected Coupon:'}</Text>
                    <Text style={[styles.calcValue, { color: '#6D28D9', fontWeight: '800' }]}>
                      {selectedCoupon?.name}
                    </Text>
                  </View>

                  <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                    <Text style={styles.calcLabel}>{isRTL ? 'الحسبة:' : 'Calculation:'}</Text>
                    <Text style={[styles.calcValue, { color: '#7C3AED' }]}>
                      {numQty} × {unitVal.toLocaleString()} = {totalValue.toLocaleString()} {t('currency')}
                    </Text>
                  </View>

                  <View style={styles.calcDivider} />

                  <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                    <Text style={styles.calcLabel}>{isRTL ? 'المتبقي بالمخزن بعد الصرف:' : 'Store Stock Remaining:'}</Text>
                    <Text style={[styles.calcValue, { fontWeight: '700' }]}>
                      {maxStock - numQty} {isRTL ? 'كوبون' : 'coupons'}
                    </Text>
                  </View>

                  <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                    <Text style={styles.calcLabel}>{isRTL ? 'رصيد كوبونات المنفذ بعد التحويل:' : 'Market Coupon Balance After:'}</Text>
                    <Text style={[styles.calcValue, { fontWeight: '900', color: '#6D28D9', fontSize: 16 }]}>
                      {newCouponsBal.toLocaleString()} {t('currency')}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={transferring}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            {availableCoupons.length > 0 && (
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#7C3AED' }, transferring && { opacity: 0.6 }]}
                onPress={handleConfirm}
                disabled={transferring}
              >
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.white} style={{ marginHorizontal: 4 }} />
                <Text style={styles.saveText}>
                  {transferring ? (isRTL ? 'جاري الصرف...' : 'Transferring...') : t('transferCouponsBtn')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ----------------------------------------------------
// 5. RECORD COUPON GAIN MODAL (Sub-Market returning coupon value)
// ----------------------------------------------------
export interface RecordCouponGainModalProps {
  visible: boolean;
  market: SubMarket | null;
  onClose: () => void;
  onRecordCouponGain: (
    subMarketId: string,
    amount: number,
    couponId?: string,
    quantity?: number,
    note?: string
  ) => Promise<boolean>;
}

export const RecordCouponGainModal: React.FC<RecordCouponGainModalProps> = ({
  visible,
  market,
  onClose,
  onRecordCouponGain,
}) => {
  const { t, isRTL } = useLanguage();
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [returnQty, setReturnQty] = useState('1');
  const [manualAmount, setManualAmount] = useState('');
  const [useManualAmount, setUseManualAmount] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!market) return null;

  const couponsWithMarket = (market.coupons || []).filter((c) => {
    const total = c.totalQuantity || 1;
    const redeemed = c.redeemedQuantity || (c.isRedeemed ? total : 0);
    return total - redeemed > 0;
  });

  const selectedCoupon = couponsWithMarket.find((c) => c.id === selectedCouponId) || couponsWithMarket[0];
  const maxCouponQty = selectedCoupon
    ? Math.max(0, (selectedCoupon.totalQuantity || 1) - (selectedCoupon.redeemedQuantity || 0))
    : 0;

  const numReturnQty = Math.max(1, Math.min(maxCouponQty || 9999, parseInt(returnQty, 10) || 1));
  const couponUnitVal = selectedCoupon ? (selectedCoupon.unitValue || selectedCoupon.value) : 0;
  const computedAmount = selectedCoupon && !useManualAmount ? numReturnQty * couponUnitVal : parseFloat(manualAmount) || 0;

  const currentCouponsBal = market.currentCouponsBalance ?? Math.max(
    0,
    (market.totalCouponsTaken || 0) - (market.totalCouponsGained || market.totalCouponsRedeemed || 0)
  );
  const newCouponsBal = Math.max(0, currentCouponsBal - computedAmount);
  const prevCouponsGained = market.totalCouponsGained || market.totalCouponsRedeemed || 0;
  const newCouponsGained = prevCouponsGained + computedAmount;

  const handleConfirm = async () => {
    if (computedAmount <= 0) {
      Alert.alert('Validation Error', isRTL ? 'يرجى إدخال قيمة عائد صحيحة' : 'Please enter a valid coupon return amount.');
      return;
    }

    setLoading(true);
    try {
      const ok = await onRecordCouponGain(
        market.id,
        computedAmount,
        useManualAmount ? undefined : selectedCoupon?.id,
        useManualAmount ? undefined : numReturnQty,
        note.trim()
      );
      if (ok) {
        setReturnQty('1');
        setManualAmount('');
        setNote('');
        onClose();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record coupon gain.');
    } finally {
      setLoading(false);
    }
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
              <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                <MaterialCommunityIcons name="ticket-percent" size={22} color="#4F46E5" />
              </View>
              <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.headerTitle}>{t('recordCouponGainTitle')}</Text>
                <Text style={styles.headerSubtitle}>{market.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Status Hero Card */}
            <View style={[styles.couponHeroCard, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1 }]}>
              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.couponHeroLabel}>{t('currentCouponsBalance')}</Text>
                <Text style={[styles.couponHeroDebt, { color: '#4F46E5' }]}>
                  {currentCouponsBal.toLocaleString()} {t('currency')}
                </Text>
              </View>
              <View style={[styles.couponHeroStatsRow, isRTL && styles.rowRtl, { marginTop: 6 }]}>
                <View style={[styles.couponStatPill, { backgroundColor: '#EDE9FE', flex: 1 }]}>
                  <Text style={[styles.couponStatPillText, { color: '#6D28D9' }]} numberOfLines={1}>
                    {t('totalCouponsTaken')} {(market.totalCouponsTaken || 0).toLocaleString()} {t('currency')}
                  </Text>
                </View>
                <View style={[styles.couponStatPill, { backgroundColor: colors.successLight, flex: 1 }]}>
                  <Text style={[styles.couponStatPillText, { color: colors.successText }]} numberOfLines={1}>
                    {t('totalCouponsGained')} {prevCouponsGained.toLocaleString()} {t('currency')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Selection mode toggle: By Coupon vs Manual Amount */}
            {couponsWithMarket.length > 0 && (
              <View style={[styles.toggleModeRow, isRTL && styles.rowRtl]}>
                <TouchableOpacity
                  style={[styles.modeTabBtn, !useManualAmount && styles.modeTabBtnActive]}
                  onPress={() => setUseManualAmount(false)}
                >
                  <MaterialCommunityIcons name="ticket-outline" size={16} color={!useManualAmount ? '#4F46E5' : colors.textMuted} />
                  <Text style={[styles.modeTabText, !useManualAmount && styles.modeTabTextActive]}>
                    {isRTL ? 'تحديد بعدد الكوبونات' : 'By Coupon Count'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeTabBtn, useManualAmount && styles.modeTabBtnActive]}
                  onPress={() => setUseManualAmount(true)}
                >
                  <MaterialCommunityIcons name="cash" size={16} color={useManualAmount ? '#4F46E5' : colors.textMuted} />
                  <Text style={[styles.modeTabText, useManualAmount && styles.modeTabTextActive]}>
                    {isRTL ? 'إدخال مبلغ مالي مباشر' : 'Direct Money Value'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!useManualAmount && couponsWithMarket.length > 0 ? (
              <>
                {/* Pick which coupon is being returned */}
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? 'اختر الكوبون المورد من المنفذ:' : 'Select Returning Coupon:'}
                </Text>
                <View style={{ marginBottom: 10 }}>
                  {couponsWithMarket.map((c) => {
                    const isSelected = selectedCoupon?.id === c.id;
                    const total = c.totalQuantity || 1;
                    const redeemed = c.redeemedQuantity || (c.isRedeemed ? total : 0);
                    const rem = Math.max(0, total - redeemed);
                    const uVal = c.unitValue || c.value;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => {
                          setSelectedCouponId(c.id);
                          setReturnQty('1');
                        }}
                        style={[
                          styles.couponSelectionCard,
                          isSelected && styles.couponSelectionCardActive,
                          isRTL && styles.rowRtl,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                          size={20}
                          color={isSelected ? '#4F46E5' : colors.textMuted}
                        />
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text style={[styles.couponSelectionTitle, isSelected && { color: '#4338CA', fontWeight: '800' }, isRTL && { textAlign: 'right' }]}>
                            {c.name || c.code}
                          </Text>
                          <Text style={[styles.couponSelectionMeta, isRTL && { textAlign: 'right' }]}>
                            {isRTL ? 'قيمة الكوبون:' : 'Unit Value:'} {uVal.toLocaleString()} {t('currency')}
                          </Text>
                        </View>
                        <View style={[styles.stockPill, { backgroundColor: isSelected ? '#EEF2FF' : colors.cardHover }]}>
                          <Text style={[styles.stockPillText, isSelected && { color: '#4338CA', fontWeight: '800' }]}>
                            {isRTL ? `المتبقي معه: ${rem}` : `With Market: ${rem}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Return count stepper */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                    {isRTL ? `عدد الكوبونات الموردة (الأقصى: ${maxCouponQty}):` : `Returned Coupon Count (Max: ${maxCouponQty}):`}
                  </Text>
                  <View style={[styles.stepperRow, isRTL && styles.rowRtl]}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setReturnQty(String(Math.max(1, numReturnQty - 1)))}
                    >
                      <MaterialCommunityIcons name="minus" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <TextInput
                      style={styles.stepperInput}
                      keyboardType="number-pad"
                      value={returnQty}
                      onChangeText={(val) => {
                        const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
                        setReturnQty(String(Math.min(maxCouponQty, parsed)));
                      }}
                    />

                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setReturnQty(String(Math.min(maxCouponQty, numReturnQty + 1)))}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Quick Chips */}
                  <View style={[styles.quickChipsRow, isRTL && styles.rowRtl]}>
                    <TouchableOpacity style={styles.chipBtn} onPress={() => setReturnQty('1')}>
                      <Text style={styles.chipBtnText}>{isRTL ? '١ كوبون' : '1'}</Text>
                    </TouchableOpacity>
                    {maxCouponQty >= 5 && (
                      <TouchableOpacity style={styles.chipBtn} onPress={() => setReturnQty('5')}>
                        <Text style={styles.chipBtnText}>{isRTL ? '٥ كوبونات' : '5'}</Text>
                      </TouchableOpacity>
                    )}
                    {maxCouponQty >= 10 && (
                      <TouchableOpacity style={styles.chipBtn} onPress={() => setReturnQty('10')}>
                        <Text style={styles.chipBtnText}>{isRTL ? '١٠ كوبونات' : '10'}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.chipBtn, styles.chipBtnAll]} onPress={() => setReturnQty(String(maxCouponQty))}>
                      <Text style={[styles.chipBtnText, { color: '#4F46E5', fontWeight: '800' }]}>
                        {isRTL ? `توريد الكل (${maxCouponQty})` : `All (${maxCouponQty})`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              /* Direct Amount Input */
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? 'قيمة الكوبونات الموردة (ج.م) *' : 'Returned Coupon Value (EGP) *'}
                </Text>
                <TextInput
                  style={[styles.input, styles.largeInput, { color: '#4F46E5' }, isRTL && { textAlign: 'right' }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={manualAmount}
                  onChangeText={setManualAmount}
                />
              </View>
            )}

            {/* Note input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('couponNote')}</Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder={isRTL ? 'ملاحظات اختيارية عن التوريد' : 'Optional notes'}
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Calculations preview: Subtracted from coupons & Total Coupons Gained */}
            <View style={[styles.calcPreviewBox, { borderColor: '#C7D2FE', backgroundColor: '#EEF2FF' }]}>
              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{isRTL ? 'قيمة التوريد المستلمة:' : 'Returned Coupon Value:'}</Text>
                <Text style={[styles.calcValue, { color: '#4338CA', fontWeight: '800', fontSize: 16 }]}>
                  {computedAmount.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={styles.calcDivider} />

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{isRTL ? 'متبقي الكوبونات مع المنفذ (يتم خصمها):' : 'Remaining Coupons (Subtracted):'}</Text>
                <Text style={[styles.calcValue, { fontWeight: '900', color: newCouponsBal > 0 ? colors.textPrimary : colors.successText }]}>
                  {newCouponsBal.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{isRTL ? 'إجمالي الكوبونات الموردة الجديد:' : 'New Total Coupons Gained:'}</Text>
                <Text style={[styles.calcValue, { fontWeight: '900', color: colors.successText }]}>
                  {newCouponsGained.toLocaleString()} {t('currency')}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: '#4F46E5' }, loading && { opacity: 0.6 }]}
              onPress={handleConfirm}
              disabled={loading}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.white} style={{ marginHorizontal: 4 }} />
              <Text style={styles.saveText}>
                {loading ? (isRTL ? 'جاري التسجيل...' : 'Saving...') : t('recordCouponGainBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ----------------------------------------------------
// 6. REDEEM COUPON MODAL (Backward Compatibility)
// ----------------------------------------------------
interface RedeemCouponModalProps {
  visible: boolean;
  market: SubMarket | null;
  onClose: () => void;
  onRedeem: (marketId: string, couponCode: string, unitValue: number, quantity: number, note?: string) => Promise<boolean>;
}

export const RedeemCouponModal: React.FC<RedeemCouponModalProps> = ({
  visible,
  market,
  onClose,
  onRedeem,
}) => {
  const { currentUser } = useAuth();
  const { t, isRTL } = useLanguage();
  const [couponValue, setCouponValue] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [couponCode, setCouponCode] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const numValue = parseFloat(couponValue) || 0;
  const numQty = Math.max(1, parseInt(quantity, 10) || 1);
  const totalDeduction = numValue * numQty;
  const currentCouponsBal = market?.currentCouponsBalance ?? Math.max(0, (market?.totalCouponsTaken || 0) - (market?.totalCouponsGained || 0));
  const newCouponsBal = Math.max(0, currentCouponsBal - totalDeduction);

  const handleConfirm = async () => {
    if (!market) return;
    if (isNaN(numValue) || numValue <= 0) {
      Alert.alert('Validation Error', isRTL ? 'يرجى إدخال قيمة صحيحة للكوبون' : 'Please enter a valid coupon value.');
      return;
    }
    if (isNaN(numQty) || numQty <= 0) {
      Alert.alert('Validation Error', isRTL ? 'يرجى إدخال عدد صحيح للكوبونات' : 'Please enter a valid quantity of coupons.');
      return;
    }

    setLoading(true);
    const success = await onRedeem(market.id, couponCode.trim(), numValue, numQty, note.trim());
    setLoading(false);
    if (success) {
      setCouponValue('');
      setQuantity('1');
      setCouponCode('');
      setNote('');
      onClose();
      Alert.alert(t('appName'), t('couponRedeemedSuccess'));
    }
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
              <View style={[styles.iconContainer, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="ticket-percent" size={22} color="#7C3AED" />
              </View>
              <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.headerTitle}>{t('redeemCouponTitle')}</Text>
                <Text style={styles.headerSubtitle}>{market?.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={[styles.infoBanner, { backgroundColor: '#F5F3FF' }, isRTL && styles.rowRtl]}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={20} color="#7C3AED" />
              <Text style={[styles.infoBannerText, { color: '#6D28D9' }, isRTL && { textAlign: 'right', marginRight: 8, marginLeft: 0 }]}>
                {t('couponBanner')}
              </Text>
            </View>

            <View style={[styles.calcRow, { marginBottom: 10 }, isRTL && styles.rowRtl]}>
              <View style={{ flex: 1.2, marginHorizontal: 3 }}>
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('couponValue')}</Text>
                <TextInput
                  style={[styles.input, styles.largeInput, { color: '#7C3AED' }, isRTL && { textAlign: 'right' }]}
                  placeholder={t('couponValuePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={couponValue}
                  onChangeText={setCouponValue}
                />
              </View>

              <View style={{ flex: 1, marginHorizontal: 3 }}>
                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('couponQuantity')}</Text>
                <View style={[styles.qtyRow, isRTL && styles.rowRtl]}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity(String(Math.max(1, numQty - 1)))}
                  >
                    <MaterialCommunityIcons name="minus" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, styles.qtyInput]}
                    keyboardType="number-pad"
                    value={quantity}
                    onChangeText={(val) => setQuantity(val.replace(/[^0-9]/g, ''))}
                  />
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity(String(numQty + 1))}
                  >
                    <MaterialCommunityIcons name="plus" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('couponCode')}</Text>
              <TextInput
                style={[styles.input, { letterSpacing: 1, fontWeight: '700' }, isRTL && { textAlign: 'right' }]}
                placeholder={t('couponCodePlaceholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={couponCode}
                onChangeText={setCouponCode}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('couponNote')}</Text>
              <TextInput
                style={[styles.input, isRTL && { textAlign: 'right' }]}
                placeholder={t('couponNotePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>

            <View style={[styles.calcPreviewBox, { borderColor: '#DDD6FE' }]}>
              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('currentCouponsBalance')}</Text>
                <Text style={[styles.calcValue, { color: colors.dangerText }]}>
                  {currentCouponsBal.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('totalCouponDeduction')}</Text>
                <Text style={[styles.calcValue, { color: '#7C3AED', fontWeight: '800' }]}>
                  - {totalDeduction.toLocaleString()} {t('currency')}
                  {numQty > 1 ? ` (${numQty} × ${numValue.toLocaleString()})` : ''}
                </Text>
              </View>

              <View style={styles.calcDivider} />

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{isRTL ? 'متبقي الكوبونات بعد الصرف:' : 'Coupons Balance After:'}</Text>
                <Text style={[styles.calcValue, { fontSize: 16, fontWeight: '900', color: colors.textPrimary }]}>
                  {newCouponsBal.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.stampNotice, isRTL && styles.rowRtl]}>
                <MaterialCommunityIcons name="shield-check" size={16} color={colors.primaryDark} />
                <Text style={[styles.stampNoticeText, { color: colors.primaryDark }]}>
                  {t('loggedBy')} {currentUser?.name}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.footer, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: '#7C3AED' }]}
              onPress={handleConfirm}
              disabled={loading}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.white} style={{ marginHorizontal: 4 }} />
              <Text style={styles.saveText}>{loading ? t('redeemingCoupon') : t('confirmRedeemCoupon')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ----------------------------------------------------
// 7. SUB-MARKET COUPONS DETAIL MODAL (Transferred Store Coupons Breakdown)
// ----------------------------------------------------
interface MarketCouponsModalProps {
  visible: boolean;
  market: SubMarket | null;
  onClose: () => void;
  onRecordCouponGain?: (marketId: string, amount: number, couponId?: string, quantity?: number, note?: string) => Promise<boolean>;
  onOpenTransferCoupons?: () => void;
  onAddCoupon?: any;
  onRedeemCoupons?: any;
  onUndoRedeemCoupons?: any;
  onToggleRedemption?: any;
  onDeleteCoupon?: any;
}

export const MarketCouponsModal: React.FC<MarketCouponsModalProps> = ({
  visible,
  market,
  onClose,
  onRecordCouponGain,
  onOpenTransferCoupons,
  onRedeemCoupons,
  onUndoRedeemCoupons,
  onDeleteCoupon,
}) => {
  const { t, isRTL } = useLanguage();
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'REDEEMED'>('ALL');

  // State for return quantity dialog
  const [returningItem, setReturningItem] = useState<MarketCoupon | null>(null);
  const [returnQtyInput, setReturnQtyInput] = useState('1');
  const [returningAction, setReturningAction] = useState(false);

  // State for undo dialog
  const [undoingItem, setUndoingItem] = useState<MarketCoupon | null>(null);
  const [undoQtyInput, setUndoQtyInput] = useState('1');
  const [undoingAction, setUndoingAction] = useState(false);

  if (!market) return null;

  const coupons = market.coupons || [];

  const activeCoupons = coupons.filter((c) => {
    const totalQty = c.totalQuantity || 1;
    const redeemedQty = c.redeemedQuantity || (c.isRedeemed ? totalQty : 0);
    return totalQty - redeemedQty > 0;
  });

  const redeemedCoupons = coupons.filter((c) => {
    const totalQty = c.totalQuantity || 1;
    const redeemedQty = c.redeemedQuantity || (c.isRedeemed ? totalQty : 0);
    return redeemedQty >= totalQty;
  });

  const totalActiveValue = market.currentCouponsBalance ?? coupons.reduce((sum, c) => {
    const totalQty = c.totalQuantity || 1;
    const redeemedQty = c.redeemedQuantity || (c.isRedeemed ? totalQty : 0);
    const rem = Math.max(0, totalQty - redeemedQty);
    return sum + rem * (c.unitValue || c.value);
  }, 0);

  const totalRedeemedValue = (market.totalCouponsGained || market.totalCouponsRedeemed) ?? coupons.reduce((sum, c) => {
    const totalQty = c.totalQuantity || 1;
    const redeemedQty = c.redeemedQuantity || (c.isRedeemed ? totalQty : 0);
    return sum + redeemedQty * (c.unitValue || c.value);
  }, 0);

  const displayedCoupons = coupons.filter((c) => {
    const totalQty = c.totalQuantity || 1;
    const redeemedQty = c.redeemedQuantity || (c.isRedeemed ? totalQty : 0);
    const isFullyRedeemed = redeemedQty >= totalQty;
    if (filterTab === 'ACTIVE') return !isFullyRedeemed;
    if (filterTab === 'REDEEMED') return isFullyRedeemed;
    return true;
  });

  const handleQuickReturnOne = async (c: MarketCoupon) => {
    const unitVal = c.unitValue || c.value;
    const msg = isRTL
      ? `هل تريد تسجيل توريد كوبون واحد من "${c.name || c.code}" بقيمة ${unitVal.toLocaleString()} ج.م؟`
      : `Record return of 1 coupon of "${c.name || c.code}" (${unitVal.toLocaleString()} EGP)?`;

    const proceed = async () => {
      if (onRecordCouponGain) {
        await onRecordCouponGain(market.id, unitVal, c.id, 1, `Return 1x "${c.name || c.code}"`);
      } else if (onRedeemCoupons) {
        await onRedeemCoupons(market.id, c.id, 1);
      }
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(msg) : true;
      if (ok) await proceed();
      return;
    }

    Alert.alert(
      isRTL ? 'توريد كوبون' : 'Return Coupon',
      msg,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: isRTL ? 'توريد (١)' : 'Return (1)',
          style: 'default',
          onPress: proceed,
        },
      ]
    );
  };

  const handleConfirmCustomReturn = async () => {
    if (!returningItem) return;
    const qty = parseInt(returnQtyInput, 10) || 0;
    const totalQty = returningItem.totalQuantity || 1;
    const redeemedQty = returningItem.redeemedQuantity || (returningItem.isRedeemed ? totalQty : 0);
    const available = Math.max(0, totalQty - redeemedQty);

    if (qty <= 0 || qty > available) {
      Alert.alert(
        'Validation Error',
        isRTL
          ? `يرجى إدخال عدد بين ١ و ${available}`
          : `Please enter a quantity between 1 and ${available}`
      );
      return;
    }

    setReturningAction(true);
    const uVal = returningItem.unitValue || returningItem.value;
    const amount = qty * uVal;
    if (onRecordCouponGain) {
      await onRecordCouponGain(market.id, amount, returningItem.id, qty, `Return ${qty}x "${returningItem.name || returningItem.code}"`);
    } else if (onRedeemCoupons) {
      await onRedeemCoupons(market.id, returningItem.id, qty);
    }
    setReturningAction(false);
    setReturningItem(null);
  };

  const handleConfirmCustomUndo = async () => {
    if (!undoingItem) return;
    const qty = parseInt(undoQtyInput, 10) || 0;
    const totalQty = undoingItem.totalQuantity || 1;
    const redeemedQty = undoingItem.redeemedQuantity || (undoingItem.isRedeemed ? totalQty : 0);

    if (qty <= 0 || qty > redeemedQty) {
      Alert.alert(
        'Validation Error',
        isRTL
          ? `يرجى إدخال عدد بين ١ و ${redeemedQty}`
          : `Please enter a quantity between 1 and ${redeemedQty}`
      );
      return;
    }

    setUndoingAction(true);
    if (onUndoRedeemCoupons) {
      await onUndoRedeemCoupons(market.id, undoingItem.id, qty);
    }
    setUndoingAction(false);
    setUndoingItem(null);
  };

  const handleDelete = (coupon: MarketCoupon) => {
    if (!onDeleteCoupon) return;
    const msg = isRTL
      ? `هل أنت متأكد من حذف كوبون "${coupon.name || coupon.code}"؟`
      : `Are you sure you want to delete "${coupon.name || coupon.code}"?`;

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(msg) : true;
      if (confirmed) {
        onDeleteCoupon(market.id, coupon.id);
      }
      return;
    }

    Alert.alert(
      t('delete'),
      msg,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await onDeleteCoupon(market.id, coupon.id);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.modalContent, { maxHeight: '92%' }]}>
          {/* Header */}
          <View style={[styles.header, isRTL && styles.rowRtl]}>
            <View style={[styles.headerLeft, isRTL && styles.rowRtl]}>
              <View style={[styles.iconContainer, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="ticket-percent" size={22} color="#7C3AED" />
              </View>
              <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.headerTitle}>{t('marketCouponsTitle')}</Text>
                <Text style={styles.headerSubtitle}>{market.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Market Coupons Stats Card */}
            <View style={styles.couponHeroCard}>
              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.couponHeroLabel}>{t('currentCouponsBalance')}</Text>
                <Text style={[styles.couponHeroDebt, { color: '#7C3AED' }]}>
                  {totalActiveValue.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.couponHeroStatsRow, isRTL && styles.rowRtl]}>
                <View style={[styles.couponStatPill, { backgroundColor: '#EDE9FE', flex: 1 }]}>
                  <Text style={styles.couponStatPillText} numberOfLines={1}>
                    {t('totalCouponsTaken')} {(market.totalCouponsTaken || (totalActiveValue + totalRedeemedValue)).toLocaleString()} {t('currency')}
                  </Text>
                </View>
                <View style={[styles.couponStatPill, { backgroundColor: colors.successLight, flex: 1 }]}>
                  <Text style={[styles.couponStatPillText, { color: colors.successText }]} numberOfLines={1}>
                    {t('totalCouponsGained')} {totalRedeemedValue.toLocaleString()} {t('currency')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick action: Transfer more coupons from store stock */}
            {onOpenTransferCoupons && (
              <TouchableOpacity
                style={[styles.transferCouponsQuickBanner, isRTL && styles.rowRtl]}
                onPress={() => {
                  onClose();
                  onOpenTransferCoupons();
                }}
              >
                <MaterialCommunityIcons name="plus-circle" size={18} color="#7C3AED" />
                <Text style={[styles.transferCouponsQuickText, isRTL && { marginRight: 8, marginLeft: 0 }]}>
                  {t('transferCouponsBtn')} {isRTL ? 'من المخزن الرئيسي' : 'from Store Stock'}
                </Text>
                <MaterialCommunityIcons name={isRTL ? "chevron-left" : "chevron-right"} size={16} color="#7C3AED" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}

            {/* Filter Tabs */}
            <View style={[styles.couponFilterRow, isRTL && styles.rowRtl]}>
              <TouchableOpacity
                style={[styles.couponFilterBtn, filterTab === 'ALL' && styles.couponFilterBtnActive]}
                onPress={() => setFilterTab('ALL')}
              >
                <Text style={[styles.couponFilterText, filterTab === 'ALL' && styles.couponFilterTextActive]}>
                  {t('allFilter')} ({coupons.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.couponFilterBtn, filterTab === 'ACTIVE' && styles.couponFilterBtnActive]}
                onPress={() => setFilterTab('ACTIVE')}
              >
                <Text style={[styles.couponFilterText, filterTab === 'ACTIVE' && styles.couponFilterTextActive]}>
                  {isRTL ? 'متبقي مع المنفذ' : 'With Market'} ({activeCoupons.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.couponFilterBtn, filterTab === 'REDEEMED' && styles.couponFilterBtnActive]}
                onPress={() => setFilterTab('REDEEMED')}
              >
                <Text style={[styles.couponFilterText, filterTab === 'REDEEMED' && styles.couponFilterTextActive]}>
                  {isRTL ? 'تم توريده' : 'Returned'} ({redeemedCoupons.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* List of Coupons Transferred to this Market */}
            {displayedCoupons.length === 0 ? (
              <View style={styles.emptyCouponsBox}>
                <MaterialCommunityIcons name="ticket-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyCouponsText}>{t('noCouponsInMarket')}</Text>
              </View>
            ) : (
              displayedCoupons.map((c) => {
                const totalQty = c.totalQuantity || 1;
                const redeemedQty = c.redeemedQuantity || (c.isRedeemed ? totalQty : 0);
                const remainingQty = Math.max(0, totalQty - redeemedQty);
                const unitVal = c.unitValue || c.value;
                const totalVal = c.value || (unitVal * totalQty);
                const remainingValue = remainingQty * unitVal;
                const isFullyRedeemed = remainingQty === 0;

                return (
                  <View
                    key={c.id}
                    style={[
                      styles.couponItemCard,
                      isFullyRedeemed && styles.couponItemCardRedeemed,
                    ]}
                  >
                    <View style={[styles.couponCardHeader, isRTL && styles.rowRtl]}>
                      <View style={[styles.couponHeaderLeft, isRTL && styles.rowRtl]}>
                        <View style={[styles.couponMiniBadge, isFullyRedeemed ? styles.couponBadgeFinished : styles.couponBadgeAvailable]}>
                          <MaterialCommunityIcons
                            name={isFullyRedeemed ? "check-circle" : "ticket-percent"}
                            size={18}
                            color={isFullyRedeemed ? colors.successText : '#7C3AED'}
                          />
                        </View>
                        <View style={[{ flex: 1, marginHorizontal: 8 }, isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                          <Text style={[styles.couponItemCode, isFullyRedeemed && styles.couponCodeRedeemed]}>
                            {c.name || c.code}
                          </Text>
                          <Text style={styles.couponSubDetail}>
                            {isRTL
                              ? `قيمة الكوبون: ${unitVal.toLocaleString()} ج.م  •  الإجمالي: ${totalVal.toLocaleString()} ج.م (${totalQty} كوبون)`
                              : `${unitVal.toLocaleString()} EGP each  •  Total: ${totalVal.toLocaleString()} EGP (${totalQty} pcs)`}
                          </Text>
                        </View>
                      </View>

                      {onDeleteCoupon && (
                        <TouchableOpacity
                          style={styles.deleteCouponBtn}
                          onPress={() => handleDelete(c)}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Progress counts row */}
                    <View style={[styles.couponCounterRow, isRTL && styles.rowRtl]}>
                      <View style={[styles.counterTag, isFullyRedeemed ? styles.counterTagFinished : styles.counterTagActive]}>
                        <Text style={[styles.counterTagText, isFullyRedeemed ? styles.counterTagFinishedText : styles.counterTagActiveText]}>
                          {isRTL
                            ? `متبقي معه: ${remainingQty} من ${totalQty} (${remainingValue.toLocaleString()} ج.م)`
                            : `With Market: ${remainingQty} of ${totalQty} (${remainingValue.toLocaleString()} EGP)`}
                        </Text>
                      </View>

                      {redeemedQty > 0 && (
                        <View style={[styles.counterTag, styles.counterTagRedeemed]}>
                          <Text style={[styles.counterTagText, styles.counterTagRedeemedText]}>
                            {isRTL
                              ? `تم توريد: ${redeemedQty} كوبون (-${(redeemedQty * unitVal).toLocaleString()} ج.م)`
                              : `Returned: ${redeemedQty} (-${(redeemedQty * unitVal).toLocaleString()} EGP)`}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Return Action buttons */}
                    <View style={[styles.couponActionsRow, isRTL && styles.rowRtl]}>
                      {remainingQty > 0 && (
                        <>
                          <TouchableOpacity
                            style={[styles.quickRedeemBtn, isRTL && styles.rowRtl]}
                            onPress={() => handleQuickReturnOne(c)}
                          >
                            <MaterialCommunityIcons name="cash-refund" size={15} color={colors.white} />
                            <Text style={styles.quickRedeemBtnText}>
                              {isRTL ? `توريد ١ (-${unitVal.toLocaleString()} ج.م)` : `Return 1 (-${unitVal.toLocaleString()} EGP)`}
                            </Text>
                          </TouchableOpacity>

                          {remainingQty > 1 && (
                            <TouchableOpacity
                              style={[styles.customRedeemBtn, isRTL && styles.rowRtl]}
                              onPress={() => {
                                setReturningItem(c);
                                setReturnQtyInput(String(Math.min(2, remainingQty)));
                              }}
                            >
                              <MaterialCommunityIcons name="layers-outline" size={15} color="#7C3AED" />
                              <Text style={styles.customRedeemBtnText}>
                                {isRTL ? 'توريد عدد...' : 'Custom Return...'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}

                      {redeemedQty > 0 && onUndoRedeemCoupons && (
                        <TouchableOpacity
                          style={[styles.undoBtn, isRTL && styles.rowRtl]}
                          onPress={() => {
                            setUndoingItem(c);
                            setUndoQtyInput('1');
                          }}
                        >
                          <MaterialCommunityIcons name="undo" size={14} color={colors.danger} />
                          <Text style={styles.undoBtnText}>
                            {isRTL ? 'تراجع' : 'Undo'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#7C3AED', justifyContent: 'center' }]} onPress={onClose}>
              <Text style={styles.saveText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SUB-MODAL: CUSTOM RETURN QUANTITY */}
        {returningItem && (
          <Modal visible={!!returningItem} animationType="fade" transparent>
            <View style={styles.dialogOverlay}>
              <View style={styles.dialogCard}>
                <View style={[styles.dialogHeader, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="cash-refund" size={22} color="#7C3AED" />
                  <Text style={styles.dialogTitle}>
                    {isRTL ? 'توريد كوبونات' : 'Return Coupons'}
                  </Text>
                </View>

                <Text style={[styles.dialogSub, isRTL && { textAlign: 'right' }]}>
                  {returningItem.name || returningItem.code}
                </Text>

                {(() => {
                  const total = returningItem.totalQuantity || 1;
                  const done = returningItem.redeemedQuantity || (returningItem.isRedeemed ? total : 0);
                  const available = Math.max(0, total - done);
                  const uVal = returningItem.unitValue || returningItem.value;
                  const currentInputQty = Math.max(1, Math.min(available, parseInt(returnQtyInput, 10) || 1));
                  const totalDeduction = currentInputQty * uVal;

                  return (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[styles.subLabel, isRTL && { textAlign: 'right' }]}>
                        {isRTL ? `المتبقي مع المنفذ: ${available} كوبون` : `With market: ${available} coupons`}
                      </Text>

                      {/* Stepper for Quantity */}
                      <View style={[styles.stepperRow, isRTL && styles.rowRtl]}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setReturnQtyInput(String(Math.max(1, currentInputQty - 1)))}
                        >
                          <MaterialCommunityIcons name="minus" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>

                        <TextInput
                          style={styles.stepperInput}
                          keyboardType="number-pad"
                          value={returnQtyInput}
                          onChangeText={(val) => setReturnQtyInput(val.replace(/[^0-9]/g, ''))}
                        />

                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setReturnQtyInput(String(Math.min(available, currentInputQty + 1)))}
                        >
                          <MaterialCommunityIcons name="plus" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>

                      {/* Quick Chips */}
                      <View style={[styles.quickChipsRow, isRTL && styles.rowRtl]}>
                        <TouchableOpacity style={styles.chipBtn} onPress={() => setReturnQtyInput('1')}>
                          <Text style={styles.chipBtnText}>{isRTL ? '١ كوبون' : '1'}</Text>
                        </TouchableOpacity>
                        {available >= 2 && (
                          <TouchableOpacity style={styles.chipBtn} onPress={() => setReturnQtyInput('2')}>
                            <Text style={styles.chipBtnText}>{isRTL ? '٢ كوبون' : '2'}</Text>
                          </TouchableOpacity>
                        )}
                        {available >= 5 && (
                          <TouchableOpacity style={styles.chipBtn} onPress={() => setReturnQtyInput('5')}>
                            <Text style={styles.chipBtnText}>{isRTL ? '٥ كوبونات' : '5'}</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.chipBtn, styles.chipBtnAll]} onPress={() => setReturnQtyInput(String(available))}>
                          <Text style={[styles.chipBtnText, { color: '#7C3AED', fontWeight: '800' }]}>
                            {isRTL ? `توريد الكل (${available})` : `All (${available})`}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Deduction preview */}
                      <View style={styles.deductionBox}>
                        <Text style={[styles.deductionBoxText, isRTL && { textAlign: 'right' }]}>
                          {isRTL
                            ? `سيتم خصم: ${totalDeduction.toLocaleString()} ج.م من كوبونات المنفذ وإضافتها لإجمالي الكوبونات الموردة`
                            : `Will deduct ${totalDeduction.toLocaleString()} EGP from market coupons & add to total gained`}
                        </Text>
                      </View>

                      {/* Buttons */}
                      <View style={[styles.dialogBtnRow, isRTL && styles.rowRtl]}>
                        <TouchableOpacity
                          style={styles.dialogCancelBtn}
                          onPress={() => setReturningItem(null)}
                          disabled={returningAction}
                        >
                          <Text style={styles.dialogCancelText}>{t('cancel')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.dialogConfirmBtn, returningAction && { opacity: 0.6 }]}
                          onPress={handleConfirmCustomReturn}
                          disabled={returningAction}
                        >
                          <Text style={styles.dialogConfirmText}>
                            {isRTL ? `تأكيد توريد ${currentInputQty} كوبون` : `Confirm Return (${currentInputQty})`}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Modal>
        )}

        {/* SUB-MODAL: UNDO RETURN QUANTITY */}
        {undoingItem && (
          <Modal visible={!!undoingItem} animationType="fade" transparent>
            <View style={styles.dialogOverlay}>
              <View style={styles.dialogCard}>
                <View style={[styles.dialogHeader, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="undo" size={22} color={colors.danger} />
                  <Text style={styles.dialogTitle}>
                    {isRTL ? 'تراجع عن توريد كوبونات' : 'Undo Coupon Return'}
                  </Text>
                </View>

                <Text style={[styles.dialogSub, isRTL && { textAlign: 'right' }]}>
                  {undoingItem.name || undoingItem.code}
                </Text>

                {(() => {
                  const total = undoingItem.totalQuantity || 1;
                  const done = undoingItem.redeemedQuantity || (undoingItem.isRedeemed ? total : 0);
                  const uVal = undoingItem.unitValue || undoingItem.value;
                  const currentInputQty = Math.max(1, Math.min(done, parseInt(undoQtyInput, 10) || 1));
                  const totalRestore = currentInputQty * uVal;

                  return (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[styles.subLabel, isRTL && { textAlign: 'right' }]}>
                        {isRTL ? `الكوبونات الموردة حالياً: ${done} كوبون` : `Returned coupons: ${done}`}
                      </Text>

                      {/* Stepper for Quantity */}
                      <View style={[styles.stepperRow, isRTL && styles.rowRtl]}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setUndoQtyInput(String(Math.max(1, currentInputQty - 1)))}
                        >
                          <MaterialCommunityIcons name="minus" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>

                        <TextInput
                          style={styles.stepperInput}
                          keyboardType="number-pad"
                          value={undoQtyInput}
                          onChangeText={(val) => setUndoQtyInput(val.replace(/[^0-9]/g, ''))}
                        />

                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setUndoQtyInput(String(Math.min(done, currentInputQty + 1)))}
                        >
                          <MaterialCommunityIcons name="plus" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>

                      {/* Quick Chips */}
                      <View style={[styles.quickChipsRow, isRTL && styles.rowRtl]}>
                        <TouchableOpacity style={styles.chipBtn} onPress={() => setUndoQtyInput('1')}>
                          <Text style={styles.chipBtnText}>{isRTL ? '١ كوبون' : '1'}</Text>
                        </TouchableOpacity>
                        {done >= 2 && (
                          <TouchableOpacity style={styles.chipBtn} onPress={() => setUndoQtyInput('2')}>
                            <Text style={styles.chipBtnText}>{isRTL ? '٢ كوبون' : '2'}</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.chipBtn, styles.chipBtnAll]} onPress={() => setUndoQtyInput(String(done))}>
                          <Text style={[styles.chipBtnText, { color: colors.danger, fontWeight: '800' }]}>
                            {isRTL ? `استرجاع الكل (${done})` : `All (${done})`}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Restore preview */}
                      <View style={[styles.deductionBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                        <Text style={[styles.deductionBoxText, { color: colors.dangerText }, isRTL && { textAlign: 'right' }]}>
                          {isRTL
                            ? `سيتم إعادة: ${totalRestore.toLocaleString()} ج.م إلى رصيد كوبونات المنفذ`
                            : `Will restore: ${totalRestore.toLocaleString()} EGP to market coupons`}
                        </Text>
                      </View>

                      {/* Buttons */}
                      <View style={[styles.dialogBtnRow, isRTL && styles.rowRtl]}>
                        <TouchableOpacity
                          style={styles.dialogCancelBtn}
                          onPress={() => setUndoingItem(null)}
                          disabled={undoingAction}
                        >
                          <Text style={styles.dialogCancelText}>{t('cancel')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.dialogConfirmBtn, { backgroundColor: colors.danger }, undoingAction && { opacity: 0.6 }]}
                          onPress={handleConfirmCustomUndo}
                          disabled={undoingAction}
                        >
                          <Text style={styles.dialogConfirmText}>
                            {isRTL ? `تأكيد استرجاع ${currentInputQty} كوبون` : `Confirm Undo (${currentInputQty})`}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Modal>
        )}
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
    width: 38,
    height: 38,
    borderRadius: 12,
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
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.infoLight,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 12,
    color: colors.infoText,
    marginLeft: 8,
    flex: 1,
    lineHeight: 17,
  },
  inputGroup: {
    marginBottom: 14,
  },
  couponToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 6,
  },
  couponToggleText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    fontWeight: '600',
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
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textPrimary,
  },
  largeInput: {
    fontSize: 18,
    fontWeight: '700',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 36,
    height: 42,
    backgroundColor: colors.cardHover,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 4,
    height: 42,
    paddingVertical: 6,
  },
  calcPreviewBox: {
    backgroundColor: colors.cardHover,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  calcDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  stampNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stampNoticeText: {
    fontSize: 11,
    color: colors.textMuted,
    marginHorizontal: 6,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  couponHeroCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 12,
  },
  couponHeroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  couponHeroDebt: {
    fontSize: 18,
    fontWeight: '900',
  },
  couponHeroStatsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  couponStatPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  couponStatPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  addCouponCard: {
    backgroundColor: colors.cardHover,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  addCouponInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCouponSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 4,
  },
  addCouponSubmitText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  couponFilterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  couponFilterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.cardHover,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  couponFilterBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#6D28D9',
  },
  couponFilterText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  couponFilterTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  emptyCouponsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyCouponsText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  couponItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  couponItemCardRedeemed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponItemCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  couponHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  couponCodeRedeemed: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  couponStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  couponStatusTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  tagActive: {
    backgroundColor: '#EDE9FE',
  },
  tagActiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED',
  },
  tagRedeemed: {
    backgroundColor: colors.successLight,
  },
  tagRedeemedText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.successText,
  },
  couponItemValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7C3AED',
    marginTop: 2,
  },
  couponValueRedeemed: {
    color: colors.textMuted,
  },
  redeemedByNotice: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  deleteCouponBtn: {
    padding: 8,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  couponSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  couponSummaryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
    marginHorizontal: 6,
    flex: 1,
  },
  couponCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  couponHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponMiniBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponBadgeAvailable: {
    backgroundColor: '#EDE9FE',
  },
  couponBadgeFinished: {
    backgroundColor: colors.successLight,
  },
  couponSubDetail: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  couponCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
  },
  counterTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  counterTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  counterTagActive: {
    backgroundColor: '#EDE9FE',
  },
  counterTagActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  counterTagFinished: {
    backgroundColor: colors.successLight,
  },
  counterTagFinishedText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.successText,
  },
  counterTagRedeemed: {
    backgroundColor: '#F3F4F6',
  },
  counterTagRedeemedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  couponActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  quickRedeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 6,
  },
  quickRedeemBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
    marginLeft: 4,
  },
  customRedeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 6,
  },
  customRedeemBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
    marginLeft: 4,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  undoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    marginLeft: 4,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  dialogSub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
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
    fontSize: 22,
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
  chipBtnAll: {
    backgroundColor: '#EDE9FE',
    borderColor: '#DDD6FE',
  },
  chipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  deductionBox: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  deductionBoxText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
    textAlign: 'center',
  },
  dialogBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  dialogCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 8,
  },
  dialogCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dialogConfirmBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  dialogConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  couponSelectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  couponSelectionCardActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
  },
  couponSelectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  couponSelectionMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stockPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stockPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  toggleModeRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardHover,
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabBtnActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  modeTabTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  transferCouponsQuickBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  transferCouponsQuickText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
    marginLeft: 8,
  },
});
