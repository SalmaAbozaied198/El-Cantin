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
import { SubMarket, MarketCoupon } from '../types';
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
// 4. REDEEM COUPON MODAL
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
  const currentDebt = market?.currentDebt || 0;
  const newDebt = Math.max(0, currentDebt - totalDeduction);

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

            {/* Coupon Unit Value & Quantity Row */}
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

            {/* Coupon Code / Reference (Optional) */}
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

            {/* Optional Note */}
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

            {/* Calculations preview */}
            <View style={[styles.calcPreviewBox, { borderColor: '#DDD6FE' }]}>
              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>{t('currentMoneyOnHim')}</Text>
                <Text style={[styles.calcValue, { color: colors.dangerText }]}>
                  {currentDebt.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.calcLabel}>
                  {t('totalCouponDeduction')}
                </Text>
                <Text style={[styles.calcValue, { color: '#7C3AED', fontWeight: '800' }]}>
                  - {totalDeduction.toLocaleString()} {t('currency')}
                  {numQty > 1 ? ` (${numQty} × ${numValue.toLocaleString()})` : ''}
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
// 5. MARKET COUPONS MANAGER MODAL (Add & Partial Redeem)
// ----------------------------------------------------
interface MarketCouponsModalProps {
  visible: boolean;
  market: SubMarket | null;
  onClose: () => void;
  onAddCoupon: (marketId: string, name: string, quantity: number, unitValue: number, note?: string) => Promise<void>;
  onRedeemCoupons: (marketId: string, couponId: string, quantityToRedeem?: number) => Promise<boolean>;
  onUndoRedeemCoupons: (marketId: string, couponId: string, quantityToUndo?: number) => Promise<boolean>;
  onToggleRedemption: (marketId: string, couponId: string) => Promise<boolean>;
  onDeleteCoupon: (marketId: string, couponId: string) => Promise<void>;
}

export const MarketCouponsModal: React.FC<MarketCouponsModalProps> = ({
  visible,
  market,
  onClose,
  onAddCoupon,
  onRedeemCoupons,
  onUndoRedeemCoupons,
  onToggleRedemption,
  onDeleteCoupon,
}) => {
  const { t, isRTL } = useLanguage();
  // Form fields for adding new coupons
  const [couponName, setCouponName] = useState('');
  const [couponQuantity, setCouponQuantity] = useState('1');
  const [couponUnitValue, setCouponUnitValue] = useState('');
  const [adding, setAdding] = useState(false);

  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'REDEEMED'>('ALL');

  // State for partial redemption dialog
  const [redeemingItem, setRedeemingItem] = useState<MarketCoupon | null>(null);
  const [redeemQtyInput, setRedeemQtyInput] = useState('1');
  const [redeemingAction, setRedeemingAction] = useState(false);

  // State for undo dialog
  const [undoingItem, setUndoingItem] = useState<MarketCoupon | null>(null);
  const [undoQtyInput, setUndoQtyInput] = useState('1');
  const [undoingAction, setUndoingAction] = useState(false);

  if (!market) return null;

  const coupons = market.coupons || [];

  // Helper stats
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

  const totalActiveValue = coupons.reduce((sum, c) => {
    const totalQty = c.totalQuantity || 1;
    const redeemedQty = c.redeemedQuantity || (c.isRedeemed ? totalQty : 0);
    const rem = Math.max(0, totalQty - redeemedQty);
    return sum + rem * (c.unitValue || c.value);
  }, 0);

  const totalRedeemedValue = coupons.reduce((sum, c) => {
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

  const numNewQty = parseInt(couponQuantity, 10) || 0;
  const numNewVal = parseFloat(couponUnitValue) || 0;

  const handleCreateCoupon = async () => {
    if (!couponName.trim()) {
      Alert.alert('Validation Error', isRTL ? 'يرجى إدخال اسم الكوبون' : 'Please enter coupon name.');
      return;
    }
    if (numNewQty <= 0) {
      Alert.alert('Validation Error', isRTL ? 'يرجى إدخال عدد الكوبونات (١ على الأقل)' : 'Please enter valid number of coupons (at least 1).');
      return;
    }
    if (numNewVal <= 0) {
      Alert.alert('Validation Error', isRTL ? 'يرجى إدخال قيمة صحيحة للكوبون' : 'Please enter a valid coupon value.');
      return;
    }

    setAdding(true);
    await onAddCoupon(market.id, couponName.trim(), numNewQty, numNewVal);
    setCouponName('');
    setCouponQuantity('1');
    setCouponUnitValue('');
    setAdding(false);
  };

  const handleQuickRedeemOne = async (c: MarketCoupon) => {
    const unitVal = c.unitValue || c.value;
    const msg = isRTL
      ? `هل تريد صرف كوبون واحد من "${c.name || c.code}" بقيمة ${unitVal.toLocaleString()} ج.م؟`
      : `Redeem 1 coupon of "${c.name || c.code}" (${unitVal.toLocaleString()} EGP)?`;

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(msg) : true;
      if (ok) {
        await onRedeemCoupons(market.id, c.id, 1);
      }
      return;
    }

    Alert.alert(
      isRTL ? 'صرف كوبون' : 'Redeem Coupon',
      msg,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: isRTL ? 'صرف (١)' : 'Redeem (1)',
          style: 'default',
          onPress: async () => {
            await onRedeemCoupons(market.id, c.id, 1);
          },
        },
      ]
    );
  };

  const handleConfirmCustomRedeem = async () => {
    if (!redeemingItem) return;
    const qty = parseInt(redeemQtyInput, 10) || 0;
    const totalQty = redeemingItem.totalQuantity || 1;
    const redeemedQty = redeemingItem.redeemedQuantity || (redeemingItem.isRedeemed ? totalQty : 0);
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

    setRedeemingAction(true);
    await onRedeemCoupons(market.id, redeemingItem.id, qty);
    setRedeemingAction(false);
    setRedeemingItem(null);
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
    await onUndoRedeemCoupons(market.id, undoingItem.id, qty);
    setUndoingAction(false);
    setUndoingItem(null);
  };

  const handleDelete = (coupon: MarketCoupon) => {
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
            {/* Market Debt & Coupons Stats Bar */}
            <View style={styles.couponHeroCard}>
              <View style={[styles.calcRow, isRTL && styles.rowRtl]}>
                <Text style={styles.couponHeroLabel}>{t('currentMoneyOnHim')}</Text>
                <Text style={[styles.couponHeroDebt, { color: market.currentDebt > 0 ? colors.dangerText : colors.successText }]}>
                  {market.currentDebt.toLocaleString()} {t('currency')}
                </Text>
              </View>

              <View style={[styles.couponHeroStatsRow, isRTL && styles.rowRtl]}>
                <View style={[styles.couponStatPill, { backgroundColor: '#EDE9FE', flex: 1 }]}>
                  <Text style={styles.couponStatPillText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {isRTL ? 'متبقي للصرف' : 'Available'}: {totalActiveValue.toLocaleString()} {t('currency')}
                  </Text>
                </View>
                <View style={[styles.couponStatPill, { backgroundColor: colors.successLight, flex: 1 }]}>
                  <Text style={[styles.couponStatPillText, { color: colors.successText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {isRTL ? 'تم صرفه' : 'Redeemed'}: {totalRedeemedValue.toLocaleString()} {t('currency')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section: Add New Coupons */}
            <View style={styles.addCouponCard}>
              <View style={[styles.titleRow, isRTL && styles.rowRtl, { marginBottom: 10 }]}>
                <MaterialCommunityIcons name="ticket-percent" size={20} color="#7C3AED" />
                <Text style={[styles.label, { fontWeight: '800', color: '#6D28D9', marginLeft: 6, marginBottom: 0 }, isRTL && { textAlign: 'right', marginRight: 6, marginLeft: 0 }]}>
                  {isRTL ? 'إضافة كوبونات جديدة للمنفذ' : 'Add New Coupons'}
                </Text>
              </View>

              {/* 1. Coupon Name */}
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.subLabel, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? 'اسم الكوبون *' : 'Coupon Name *'}
                </Text>
                <TextInput
                  style={[styles.input, { height: 40 }, isRTL && { textAlign: 'right' }]}
                  placeholder={isRTL ? 'مثال: وجبة عائلية، كوبون ٥٠، كود خصم' : 'e.g. VIP Meal, 50 EGP Voucher'}
                  placeholderTextColor={colors.textMuted}
                  value={couponName}
                  onChangeText={setCouponName}
                />
              </View>

              {/* 2. Quantity & Money Value */}
              <View style={[styles.calcRow, isRTL && styles.rowRtl, { marginBottom: 8 }]}>
                <View style={{ flex: 1, marginHorizontal: 3 }}>
                  <Text style={[styles.subLabel, isRTL && { textAlign: 'right' }]}>
                    {isRTL ? 'عدد الكوبونات *' : 'Number of Coupons *'}
                  </Text>
                  <TextInput
                    style={[styles.input, { height: 40, fontWeight: '700' }, isRTL && { textAlign: 'right' }]}
                    placeholder={isRTL ? 'مثال: 10' : 'e.g. 10'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={couponQuantity}
                    onChangeText={(val) => setCouponQuantity(val.replace(/[^0-9]/g, ''))}
                  />
                </View>

                <View style={{ flex: 1, marginHorizontal: 3 }}>
                  <Text style={[styles.subLabel, isRTL && { textAlign: 'right' }]}>
                    {isRTL ? 'قيمة الكوبون الواحد (ج.م) *' : 'Money Value (EGP) *'}
                  </Text>
                  <TextInput
                    style={[styles.input, { height: 40, fontWeight: '700', color: '#7C3AED' }, isRTL && { textAlign: 'right' }]}
                    placeholder={isRTL ? 'مثال: 50' : 'e.g. 50'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={couponUnitValue}
                    onChangeText={setCouponUnitValue}
                  />
                </View>
              </View>

              {/* Computed Live Summary */}
              {numNewQty > 0 && numNewVal > 0 && (
                <View style={[styles.couponSummaryPill, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="calculator" size={15} color="#7C3AED" />
                  <Text style={[styles.couponSummaryPillText, isRTL && { textAlign: 'right' }]}>
                    {isRTL
                      ? `الإجمالي: ${numNewQty} كوبون × ${numNewVal.toLocaleString()} ج.م = ${(numNewQty * numNewVal).toLocaleString()} ج.م`
                      : `Total: ${numNewQty} coupons × ${numNewVal.toLocaleString()} EGP = ${(numNewQty * numNewVal).toLocaleString()} EGP`}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.addCouponSubmitBtn, adding && { opacity: 0.6 }]}
                onPress={handleCreateCoupon}
                disabled={adding}
              >
                <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
                <Text style={styles.addCouponSubmitText}>
                  {isRTL ? 'حفظ وإضافة الكوبونات' : 'Save & Add Coupons'}
                </Text>
              </TouchableOpacity>
            </View>

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
                  {isRTL ? 'متاح للصرف' : 'Active'} ({activeCoupons.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.couponFilterBtn, filterTab === 'REDEEMED' && styles.couponFilterBtnActive]}
                onPress={() => setFilterTab('REDEEMED')}
              >
                <Text style={[styles.couponFilterText, filterTab === 'REDEEMED' && styles.couponFilterTextActive]}>
                  {isRTL ? 'مكتمل الصرف' : 'Fully Redeemed'} ({redeemedCoupons.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* List of Coupons with Partial Redeem Controls! */}
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

                      {/* Delete */}
                      <TouchableOpacity
                        style={styles.deleteCouponBtn}
                        onPress={() => handleDelete(c)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>

                    {/* Progress counts row */}
                    <View style={[styles.couponCounterRow, isRTL && styles.rowRtl]}>
                      <View style={[styles.counterTag, isFullyRedeemed ? styles.counterTagFinished : styles.counterTagActive]}>
                        <Text style={[styles.counterTagText, isFullyRedeemed ? styles.counterTagFinishedText : styles.counterTagActiveText]}>
                          {isRTL
                            ? `متبقي: ${remainingQty} من ${totalQty} (${remainingValue.toLocaleString()} ج.م)`
                            : `Available: ${remainingQty} of ${totalQty} (${remainingValue.toLocaleString()} EGP)`}
                        </Text>
                      </View>

                      {redeemedQty > 0 && (
                        <View style={[styles.counterTag, styles.counterTagRedeemed]}>
                          <Text style={[styles.counterTagText, styles.counterTagRedeemedText]}>
                            {isRTL
                              ? `تم صرف: ${redeemedQty} كوبون (-${(redeemedQty * unitVal).toLocaleString()} ج.م)`
                              : `Redeemed: ${redeemedQty} (-${(redeemedQty * unitVal).toLocaleString()} EGP)`}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Action buttons on card: Quick 1-tap redeem, Custom amount, and Undo */}
                    <View style={[styles.couponActionsRow, isRTL && styles.rowRtl]}>
                      {remainingQty > 0 && (
                        <>
                          <TouchableOpacity
                            style={[styles.quickRedeemBtn, isRTL && styles.rowRtl]}
                            onPress={() => handleQuickRedeemOne(c)}
                          >
                            <MaterialCommunityIcons name="check" size={15} color={colors.white} />
                            <Text style={styles.quickRedeemBtnText}>
                              {isRTL ? `صرف ١ (-${unitVal.toLocaleString()} ج.م)` : `Redeem 1 (-${unitVal.toLocaleString()} EGP)`}
                            </Text>
                          </TouchableOpacity>

                          {remainingQty > 1 && (
                            <TouchableOpacity
                              style={[styles.customRedeemBtn, isRTL && styles.rowRtl]}
                              onPress={() => {
                                setRedeemingItem(c);
                                setRedeemQtyInput(String(Math.min(2, remainingQty)));
                              }}
                            >
                              <MaterialCommunityIcons name="layers-outline" size={15} color="#7C3AED" />
                              <Text style={styles.customRedeemBtnText}>
                                {isRTL ? 'صرف عدد...' : 'Custom Qty...'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}

                      {redeemedQty > 0 && (
                        <TouchableOpacity
                          style={[styles.undoBtn, isRTL && styles.rowRtl]}
                          onPress={() => {
                            setUndoingItem(c);
                            setUndoQtyInput('1');
                          }}
                        >
                          <MaterialCommunityIcons name="undo" size={14} color={colors.danger} />
                          <Text style={styles.undoBtnText}>
                            {isRTL ? 'تراجع / استرجاع' : 'Undo'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {c.redeemedBy && (
                      <Text style={[styles.redeemedByNotice, isRTL && { textAlign: 'right' }]}>
                        {t('loggedBy')} {c.redeemedBy}
                      </Text>
                    )}
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

        {/* SUB-MODAL: CUSTOM REDEEM QUANTITY */}
        {redeemingItem && (
          <Modal visible={!!redeemingItem} animationType="fade" transparent>
            <View style={styles.dialogOverlay}>
              <View style={styles.dialogCard}>
                <View style={[styles.dialogHeader, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="ticket-confirmation" size={22} color="#7C3AED" />
                  <Text style={styles.dialogTitle}>
                    {isRTL ? 'صرف كوبونات' : 'Redeem Coupons'}
                  </Text>
                </View>

                <Text style={[styles.dialogSub, isRTL && { textAlign: 'right' }]}>
                  {redeemingItem.name || redeemingItem.code}
                </Text>

                {(() => {
                  const total = redeemingItem.totalQuantity || 1;
                  const done = redeemingItem.redeemedQuantity || (redeemingItem.isRedeemed ? total : 0);
                  const available = Math.max(0, total - done);
                  const uVal = redeemingItem.unitValue || redeemingItem.value;
                  const currentInputQty = Math.max(1, Math.min(available, parseInt(redeemQtyInput, 10) || 1));
                  const totalDeduction = currentInputQty * uVal;

                  return (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[styles.subLabel, isRTL && { textAlign: 'right' }]}>
                        {isRTL ? `المتبقي المتاح للصرف: ${available} كوبون` : `Available to redeem: ${available} coupons`}
                      </Text>

                      {/* Stepper for Quantity */}
                      <View style={[styles.stepperRow, isRTL && styles.rowRtl]}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setRedeemQtyInput(String(Math.max(1, currentInputQty - 1)))}
                        >
                          <MaterialCommunityIcons name="minus" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>

                        <TextInput
                          style={styles.stepperInput}
                          keyboardType="number-pad"
                          value={redeemQtyInput}
                          onChangeText={(val) => setRedeemQtyInput(val.replace(/[^0-9]/g, ''))}
                        />

                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setRedeemQtyInput(String(Math.min(available, currentInputQty + 1)))}
                        >
                          <MaterialCommunityIcons name="plus" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>

                      {/* Quick Chips */}
                      <View style={[styles.quickChipsRow, isRTL && styles.rowRtl]}>
                        <TouchableOpacity style={styles.chipBtn} onPress={() => setRedeemQtyInput('1')}>
                          <Text style={styles.chipBtnText}>{isRTL ? '١ كوبون' : '1'}</Text>
                        </TouchableOpacity>
                        {available >= 2 && (
                          <TouchableOpacity style={styles.chipBtn} onPress={() => setRedeemQtyInput('2')}>
                            <Text style={styles.chipBtnText}>{isRTL ? '٢ كوبون' : '2'}</Text>
                          </TouchableOpacity>
                        )}
                        {available >= 5 && (
                          <TouchableOpacity style={styles.chipBtn} onPress={() => setRedeemQtyInput('5')}>
                            <Text style={styles.chipBtnText}>{isRTL ? '٥ كوبونات' : '5'}</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.chipBtn, styles.chipBtnAll]} onPress={() => setRedeemQtyInput(String(available))}>
                          <Text style={[styles.chipBtnText, { color: '#7C3AED', fontWeight: '800' }]}>
                            {isRTL ? `صرف الكل (${available})` : `All (${available})`}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Deduction preview */}
                      <View style={styles.deductionBox}>
                        <Text style={[styles.deductionBoxText, isRTL && { textAlign: 'right' }]}>
                          {isRTL
                            ? `سيتم خصم: ${totalDeduction.toLocaleString()} ج.م من حساب المنفذ`
                            : `Will deduct: ${totalDeduction.toLocaleString()} EGP from market debt`}
                        </Text>
                      </View>

                      {/* Buttons */}
                      <View style={[styles.dialogBtnRow, isRTL && styles.rowRtl]}>
                        <TouchableOpacity
                          style={styles.dialogCancelBtn}
                          onPress={() => setRedeemingItem(null)}
                          disabled={redeemingAction}
                        >
                          <Text style={styles.dialogCancelText}>{t('cancel')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.dialogConfirmBtn, redeemingAction && { opacity: 0.6 }]}
                          onPress={handleConfirmCustomRedeem}
                          disabled={redeemingAction}
                        >
                          <Text style={styles.dialogConfirmText}>
                            {isRTL ? `تأكيد صرف ${currentInputQty} كوبون` : `Confirm (${currentInputQty})`}
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

        {/* SUB-MODAL: UNDO REDEEM QUANTITY */}
        {undoingItem && (
          <Modal visible={!!undoingItem} animationType="fade" transparent>
            <View style={styles.dialogOverlay}>
              <View style={styles.dialogCard}>
                <View style={[styles.dialogHeader, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="undo" size={22} color={colors.danger} />
                  <Text style={styles.dialogTitle}>
                    {isRTL ? 'تراجع عن صرف كوبونات' : 'Undo Coupon Redemption'}
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
                        {isRTL ? `الكوبونات المصروفة حالياً: ${done} كوبون` : `Redeemed coupons: ${done}`}
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
                            ? `سيتم إعادة: ${totalRestore.toLocaleString()} ج.م إلى حساب المنفذ`
                            : `Will restore: ${totalRestore.toLocaleString()} EGP to market debt`}
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
});
