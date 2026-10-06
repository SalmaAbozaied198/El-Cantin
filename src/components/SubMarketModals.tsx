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
// 5. MARKET COUPONS MANAGER MODAL (Add & Check-to-Redeem)
// ----------------------------------------------------
interface MarketCouponsModalProps {
  visible: boolean;
  market: SubMarket | null;
  onClose: () => void;
  onAddCoupon: (marketId: string, code: string, value: number, note?: string) => Promise<void>;
  onToggleRedemption: (marketId: string, couponId: string) => Promise<boolean>;
  onDeleteCoupon: (marketId: string, couponId: string) => Promise<void>;
}

export const MarketCouponsModal: React.FC<MarketCouponsModalProps> = ({
  visible,
  market,
  onClose,
  onAddCoupon,
  onToggleRedemption,
  onDeleteCoupon,
}) => {
  const { t, isRTL } = useLanguage();
  const [newCode, setNewCode] = useState('');
  const [newValue, setNewValue] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'REDEEMED'>('ALL');
  const [adding, setAdding] = useState(false);

  if (!market) return null;

  const coupons = market.coupons || [];
  const activeCoupons = coupons.filter((c) => !c.isRedeemed);
  const redeemedCoupons = coupons.filter((c) => c.isRedeemed);

  const totalActiveValue = activeCoupons.reduce((sum, c) => sum + c.value, 0);
  const totalRedeemedValue = redeemedCoupons.reduce((sum, c) => sum + c.value, 0);

  const displayedCoupons = coupons.filter((c) => {
    if (filterTab === 'ACTIVE') return !c.isRedeemed;
    if (filterTab === 'REDEEMED') return c.isRedeemed;
    return true;
  });

  const handleCreateCoupon = async () => {
    const val = parseFloat(newValue);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Validation Error', isRTL ? 'يرجى إدخال قيمة صحيحة للكوبون' : 'Please enter a valid coupon value.');
      return;
    }
    setAdding(true);
    await onAddCoupon(market.id, newCode.trim(), val);
    setNewCode('');
    setNewValue('');
    setAdding(false);
  };

  const handleToggleRedeem = (coupon: MarketCoupon) => {
    if (!coupon.isRedeemed) {
      Alert.alert(
        t('redeemAction'),
        t('markAsRedeemedPrompt')
          .replace('{code}', coupon.code)
          .replace('{amount}', coupon.value.toLocaleString())
          .replace('{currency}', t('currency')),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('redeemAction'),
            style: 'default',
            onPress: async () => {
              await onToggleRedemption(market.id, coupon.id);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        t('undoRedemption'),
        t('undoRedemptionPrompt')
          .replace('{code}', coupon.code)
          .replace('{amount}', coupon.value.toLocaleString())
          .replace('{currency}', t('currency')),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('undoRedemption'),
            style: 'destructive',
            onPress: async () => {
              await onToggleRedemption(market.id, coupon.id);
            },
          },
        ]
      );
    }
  };

  const handleDelete = (coupon: MarketCoupon) => {
    Alert.alert(
      t('delete'),
      t('deleteCouponConfirm').replace('{code}', coupon.code),
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
        <View style={[styles.modalContent, { maxHeight: '90%' }]}>
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
                    {t('activeCouponsTab')}: {activeCoupons.length} ({totalActiveValue.toLocaleString()} {t('currency')})
                  </Text>
                </View>
                <View style={[styles.couponStatPill, { backgroundColor: colors.successLight, flex: 1 }]}>
                  <Text style={[styles.couponStatPillText, { color: colors.successText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {t('redeemedCouponsTab')}: {redeemedCoupons.length} ({totalRedeemedValue.toLocaleString()} {t('currency')})
                  </Text>
                </View>
              </View>
            </View>

            {/* Section: Add New Coupon */}
            <View style={styles.addCouponCard}>
              <Text style={[styles.label, { fontWeight: '800', color: '#6D28D9', marginBottom: 8 }, isRTL && { textAlign: 'right' }]}>
                {t('addCouponBtn')}
              </Text>
              <View style={[styles.addCouponInputsRow, isRTL && styles.rowRtl]}>
                <TextInput
                  style={[styles.input, { flex: 1.2, marginHorizontal: 3, height: 42 }, isRTL && { textAlign: 'right' }]}
                  placeholder={t('couponCodeFieldPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={newCode}
                  onChangeText={setNewCode}
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginHorizontal: 3, height: 42, fontWeight: '700', color: '#7C3AED' }, isRTL && { textAlign: 'right' }]}
                  placeholder={t('couponValuePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={newValue}
                  onChangeText={setNewValue}
                />
                <TouchableOpacity
                  style={[styles.addCouponSubmitBtn, adding && { opacity: 0.6 }]}
                  onPress={handleCreateCoupon}
                  disabled={adding}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
                  <Text style={styles.addCouponSubmitText}>{t('addCouponBtn')}</Text>
                </TouchableOpacity>
              </View>
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
                  {t('activeCouponsTab')} ({activeCoupons.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.couponFilterBtn, filterTab === 'REDEEMED' && styles.couponFilterBtnActive]}
                onPress={() => setFilterTab('REDEEMED')}
              >
                <Text style={[styles.couponFilterText, filterTab === 'REDEEMED' && styles.couponFilterTextActive]}>
                  {t('redeemedCouponsTab')} ({redeemedCoupons.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* List of Coupons with interactive Checkbox to Redeem! */}
            {displayedCoupons.length === 0 ? (
              <View style={styles.emptyCouponsBox}>
                <MaterialCommunityIcons name="ticket-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyCouponsText}>{t('noCouponsInMarket')}</Text>
              </View>
            ) : (
              displayedCoupons.map((c) => {
                return (
                  <View
                    key={c.id}
                    style={[
                      styles.couponItemCard,
                      c.isRedeemed && styles.couponItemCardRedeemed,
                      isRTL && styles.rowRtl,
                    ]}
                  >
                    {/* Checkbox Button */}
                    <TouchableOpacity
                      style={[styles.checkboxTouch, isRTL && styles.rowRtl]}
                      onPress={() => handleToggleRedeem(c)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={c.isRedeemed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                        size={24}
                        color={c.isRedeemed ? colors.successText : '#7C3AED'}
                      />
                      <View style={[{ flex: 1, marginHorizontal: 8 }, isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                        <View style={[styles.couponHeaderRow, isRTL && styles.rowRtl]}>
                          <Text style={[styles.couponItemCode, c.isRedeemed && styles.couponCodeRedeemed]} numberOfLines={1}>
                            {c.code}
                          </Text>
                          <View
                            style={[
                              styles.couponStatusTag,
                              c.isRedeemed ? styles.tagRedeemed : styles.tagActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.couponStatusTagText,
                                c.isRedeemed ? styles.tagRedeemedText : styles.tagActiveText,
                              ]}
                            >
                              {c.isRedeemed ? t('redeemedStatus') : t('redeemAction')}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.couponItemValue, c.isRedeemed && styles.couponValueRedeemed]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                          {c.value.toLocaleString()} {t('currency')}
                          {c.isRedeemed ? ` (${t('couponDeducted')} -${c.value.toLocaleString()})` : ''}
                        </Text>

                        {c.redeemedBy && (
                          <Text style={styles.redeemedByNotice} numberOfLines={1}>
                            {t('loggedBy')} {c.redeemedBy}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Delete Icon */}
                    <TouchableOpacity
                      style={styles.deleteCouponBtn}
                      onPress={() => handleDelete(c)}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#7C3AED', justifyContent: 'center' }]} onPress={onClose}>
              <Text style={styles.saveText}>{t('cancel')}</Text>
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
});
