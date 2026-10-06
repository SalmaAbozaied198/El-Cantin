import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { SubMarket } from '../types';
import { StatCard } from '../components/StatCard';
import {
  AddSubMarketModal,
  TransferGoodsModal,
  RecordGainModal,
  TransferCouponsModal,
  RecordCouponGainModal,
  RedeemCouponModal,
  MarketCouponsModal,
} from '../components/SubMarketModals';

export const SubMarketsScreen: React.FC = () => {
  const {
    subMarkets,
    storeCoupons,
    stats,
    addSubMarket,
    deleteSubMarket,
    toggleMarketCoupons,
    addMarketCoupon,
    redeemMarketCoupons,
    undoRedeemMarketCoupons,
    toggleCouponRedemption,
    deleteMarketCoupon,
    transferGoodsValue,
    recordSubMarketGain,
    recordSubMarketCouponGain,
    transferStoreCouponsToMarket,
    redeemCoupon,
    isAdmin,
  } = useData();
  const { t, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [gainModalVisible, setGainModalVisible] = useState(false);
  const [transferCouponsModalVisible, setTransferCouponsModalVisible] = useState(false);
  const [recordCouponGainModalVisible, setRecordCouponGainModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [couponsModalVisible, setCouponsModalVisible] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<SubMarket | null>(null);
  const [marketForCoupons, setMarketForCoupons] = useState<SubMarket | null>(null);

  const filteredMarkets = subMarkets.filter((market) =>
    market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (market.location && market.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalGoodsDebt = subMarkets.reduce((sum, m) => sum + (m.currentDebt || 0), 0);
  const totalCouponsBalance = subMarkets.reduce(
    (sum, m) => sum + (m.currentCouponsBalance ?? Math.max(0, (m.totalCouponsTaken || 0) - (m.totalCouponsGained || m.totalCouponsRedeemed || 0))),
    0
  );
  const totalOutstandingDebt = totalGoodsDebt + totalCouponsBalance;

  const totalGoodsGain = subMarkets.reduce((sum, m) => sum + (m.totalGainPaid || 0), 0);
  const totalCouponsGain = subMarkets.reduce(
    (sum, m) => sum + (m.totalCouponsGained || m.totalCouponsRedeemed || 0),
    0
  );
  const totalGainsCollected = totalGoodsGain + totalCouponsGain;

  const handleOpenTransfer = (market: SubMarket) => {
    setSelectedMarket(market);
    setTransferModalVisible(true);
  };

  const handleOpenGain = (market: SubMarket) => {
    setSelectedMarket(market);
    setGainModalVisible(true);
  };

  const handleOpenTransferCoupons = (market: SubMarket) => {
    setSelectedMarket(market);
    setTransferCouponsModalVisible(true);
  };

  const handleOpenRecordCouponGain = (market: SubMarket) => {
    setSelectedMarket(market);
    setRecordCouponGainModalVisible(true);
  };

  const handleOpenCoupon = (market: SubMarket) => {
    setSelectedMarket(market);
    setCouponModalVisible(true);
  };

  const handleOpenManageCoupons = (market: SubMarket) => {
    setMarketForCoupons(market);
    setCouponsModalVisible(true);
  };

  const handleDeleteMarket = (market: SubMarket) => {
    if (!isAdmin) return;
    const msg = isRTL
      ? `هل أنت متأكد من حذف منفذ "${market.name}"؟`
      : `Are you sure you want to delete sub-market "${market.name}"?`;

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(msg) : true;
      if (confirmed) {
        deleteSubMarket(market.id);
      }
      return;
    }

    Alert.alert(
      isRTL ? 'حذف المنفذ' : 'Delete Sub-Market',
      msg,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteSubMarket(market.id);
          },
        },
      ]
    );
  };

  const renderMarketItem = ({ item }: { item: SubMarket }) => {
    const couponsBal = item.currentCouponsBalance ?? Math.max(
      0,
      (item.totalCouponsTaken || 0) - (item.totalCouponsGained || item.totalCouponsRedeemed || 0)
    );
    const totalLiability = (item.currentDebt || 0) + couponsBal;
    const hasLiability = totalLiability > 0;
    const couponsTaken = item.totalCouponsTaken || 0;
    const couponsGained = item.totalCouponsGained || item.totalCouponsRedeemed || 0;
    const hasCouponsData = item.hasCoupons || couponsTaken > 0 || couponsBal > 0 || (item.coupons && item.coupons.length > 0);
    const activeCouponsCount = (item.coupons || []).filter((c) => {
      const tot = c.totalQuantity || 1;
      const red = c.redeemedQuantity || (c.isRedeemed ? tot : 0);
      return tot - red > 0;
    }).length;

    return (
      <View style={styles.marketCard}>
        {/* Top Header */}
        <View style={[styles.marketTop, isRTL && styles.rowRtl]}>
          <View style={[styles.marketLeft, isRTL && styles.rowRtl]}>
            <View style={styles.marketIconWrapper}>
              <MaterialCommunityIcons name="storefront" size={22} color={colors.primary} />
            </View>
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <View style={[styles.titleRow, isRTL && styles.rowRtl]}>
                <Text style={styles.marketName}>{item.name}</Text>
                {hasCouponsData && (
                  <TouchableOpacity
                    style={[styles.couponBadge, isRTL && styles.rowRtl]}
                    onPress={() => handleOpenManageCoupons(item)}
                  >
                    <MaterialCommunityIcons name="ticket-percent" size={11} color="#7C3AED" />
                    <Text style={styles.couponBadgeText}>
                      {t('couponsBadge')} {activeCouponsCount > 0 ? `(${activeCouponsCount})` : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {item.location ? (
                <View style={[styles.locationRow, isRTL && styles.rowRtl]}>
                  <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.locationText}>{item.location}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.topRightActions, isRTL && styles.rowRtl]}>
            <View style={[styles.debtTag, hasLiability ? styles.debtActiveTag : styles.debtSettledTag]}>
              <Text style={[styles.debtTagText, hasLiability ? styles.debtActiveText : styles.debtSettledText]}>
                {hasLiability ? t('activeDebt') : t('settled')}
              </Text>
            </View>

            {isAdmin && (
              <TouchableOpacity
                style={styles.deleteMarketIconBtn}
                onPress={() => handleDeleteMarket(item)}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Money on him (Total Combined Outstanding Liability) */}
        <View style={[styles.balanceSection, isRTL && { alignItems: 'flex-end' }]}>
          <Text style={styles.balanceLabel}>{t('totalMoneyOnHim')}</Text>
          <Text style={[styles.balanceAmount, hasLiability ? styles.balanceDebt : styles.balanceClean]}>
            {totalLiability.toLocaleString()} {t('currency')}
          </Text>
          {(item.currentDebt > 0 || couponsBal > 0) && (
            <Text style={styles.breakdownSubText}>
              {t('goodsDebtLabel')}: {item.currentDebt.toLocaleString()} {t('currency')}  •  {t('couponsDebtLabel')}: {couponsBal.toLocaleString()} {t('currency')}
            </Text>
          )}
        </View>

        {/* Parallel Activity Grid (Goods & Coupons) */}
        <View style={[styles.statsRow, isRTL && styles.rowRtl]}>
          <View style={[styles.statCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.statColLabel} numberOfLines={2}>{t('totalGoodsTaken')}</Text>
            <Text style={styles.statColValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.totalGoodsTaken.toLocaleString()} {t('currency')}
            </Text>
          </View>
          <View style={[styles.statCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.statColLabel} numberOfLines={2}>{t('totalGainPaidBack')}</Text>
            <Text style={[styles.statColValue, { color: colors.successText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.totalGainPaid.toLocaleString()} {t('currency')}
            </Text>
          </View>
          {hasCouponsData && (
            <>
              <View style={[styles.statCol, isRTL && { alignItems: 'flex-end' }]}>
                <Text style={styles.statColLabel} numberOfLines={2}>{t('totalCouponsTaken')}</Text>
                <Text style={[styles.statColValue, { color: '#6D28D9' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {couponsTaken.toLocaleString()} {t('currency')}
                </Text>
              </View>
              <View style={[styles.statCol, isRTL && { alignItems: 'flex-end' }]}>
                <Text style={styles.statColLabel} numberOfLines={2}>{t('totalCouponsGained')}</Text>
                <Text style={[styles.statColValue, { color: colors.successText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {couponsGained.toLocaleString()} {t('currency')}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Action Buttons: 2 Rows */}
        {/* Row 1: Goods Actions */}
        <View style={[styles.actionsRow, isRTL && styles.rowRtl, { marginBottom: 6 }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.transferBtn]}
            onPress={() => handleOpenTransfer(item)}
          >
            <MaterialCommunityIcons name="truck-delivery" size={16} color={colors.infoText} />
            <Text style={styles.transferBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {t('transferGoodsValue')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.gainBtn]}
            onPress={() => handleOpenGain(item)}
          >
            <MaterialCommunityIcons name="cash-fast" size={16} color={colors.white} />
            <Text style={styles.gainBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {t('recordGainRepay')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Coupons Actions */}
        <View style={[styles.actionsRow, isRTL && styles.rowRtl]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.couponTransferBtn]}
            onPress={() => handleOpenTransferCoupons(item)}
          >
            <MaterialCommunityIcons name="ticket-confirmation" size={16} color="#7C3AED" />
            <Text style={styles.couponTransferBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {t('transferCouponsBtn')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.couponGainBtn]}
            onPress={() => handleOpenRecordCouponGain(item)}
          >
            <MaterialCommunityIcons name="ticket-percent" size={16} color={colors.white} />
            <Text style={styles.couponGainBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {t('recordCouponGainBtn')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Coupons Breakdown Link */}
        {hasCouponsData && (
          <TouchableOpacity
            style={[styles.couponManageFullBtn, isRTL && styles.rowRtl]}
            onPress={() => handleOpenManageCoupons(item)}
          >
            <View style={[styles.couponManageLeft, isRTL && styles.rowRtl]}>
              <MaterialCommunityIcons name="layers-outline" size={16} color="#7C3AED" />
              <Text style={styles.couponManageTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {t('viewCouponsBtn')}
              </Text>
              <View style={styles.couponCountPill}>
                <Text style={styles.couponCountPillText} numberOfLines={1}>
                  {couponsBal.toLocaleString()} {t('currency')} {isRTL ? 'متبقي' : 'rem.'}
                </Text>
              </View>
            </View>
            <View style={[styles.couponManageRight, isRTL && styles.rowRtl]}>
              <Text style={styles.couponManageActionText}>{isRTL ? 'تفاصيل' : 'Details'}</Text>
              <MaterialCommunityIcons name={isRTL ? "chevron-left" : "chevron-right"} size={16} color="#7C3AED" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Overview Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statsRowGrid, isRTL && styles.rowRtl]}>
          <StatCard
            title={t('totalMoneyOnMarkets')}
            value={`${totalOutstandingDebt.toLocaleString()} ${t('currency')}`}
            subtitle={t('outstandingLiabilities')}
            icon="cash-clock"
            variant="danger"
          />
          <View style={{ width: 10 }} />
          <StatCard
            title={t('totalGainsCollected')}
            value={`${totalGainsCollected.toLocaleString()} ${t('currency')}`}
            subtitle={t('paidBackByMarkets')}
            icon="cash-check"
            variant="success"
          />
        </View>
      </View>

      {/* Search and Add Market Action */}
      <View style={[styles.searchBarContainer, isRTL && styles.rowRtl]}>
        <View style={[styles.searchInputWrapper, isRTL && styles.rowRtl]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, isRTL && { textAlign: 'right', marginRight: 8, marginLeft: 0 }]}
            placeholder={t('searchMarkets')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {isAdmin ? (
          <TouchableOpacity
            style={[styles.addMarketButton, isRTL && { marginLeft: 0, marginRight: 10 }]}
            onPress={() => setAddModalVisible(true)}
          >
            <MaterialCommunityIcons name="store-plus" size={18} color={colors.white} />
            <Text style={styles.addMarketButtonText}>{t('newMarket')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Sub-Markets List */}
      <FlatList
        data={filteredMarkets}
        keyExtractor={(item) => item.id}
        renderItem={renderMarketItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="store-remove" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('noMarketsFound')}</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? t('searchMarkets') : t('addFirstMarket')}
            </Text>
          </View>
        }
      />

      {/* Modals */}
      <AddSubMarketModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={addSubMarket}
      />

      <TransferGoodsModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
        market={selectedMarket}
        availableStoreValue={stats.netAvailableValue}
        onTransfer={transferGoodsValue}
      />

      <RecordGainModal
        visible={gainModalVisible}
        onClose={() => setGainModalVisible(false)}
        market={selectedMarket}
        onRecordGain={recordSubMarketGain}
      />

      <TransferCouponsModal
        visible={transferCouponsModalVisible}
        onClose={() => {
          setTransferCouponsModalVisible(false);
          setSelectedMarket(null);
        }}
        market={selectedMarket}
        storeCoupons={storeCoupons}
        onTransfer={transferStoreCouponsToMarket}
      />

      <RecordCouponGainModal
        visible={recordCouponGainModalVisible}
        onClose={() => {
          setRecordCouponGainModalVisible(false);
          setSelectedMarket(null);
        }}
        market={selectedMarket}
        onRecordCouponGain={recordSubMarketCouponGain}
      />

      <RedeemCouponModal
        visible={couponModalVisible}
        onClose={() => {
          setCouponModalVisible(false);
          setSelectedMarket(null);
        }}
        market={selectedMarket}
        onRedeem={redeemCoupon}
      />

      {/* Comprehensive Sub-Market Coupons Manager Modal */}
      <MarketCouponsModal
        visible={couponsModalVisible}
        market={subMarkets.find((m) => m.id === marketForCoupons?.id) || marketForCoupons}
        onClose={() => {
          setCouponsModalVisible(false);
          setMarketForCoupons(null);
        }}
        onRecordCouponGain={recordSubMarketCouponGain}
        onOpenTransferCoupons={() => {
          if (marketForCoupons) {
            handleOpenTransferCoupons(marketForCoupons);
          }
        }}
        onAddCoupon={addMarketCoupon}
        onRedeemCoupons={redeemMarketCoupons}
        onUndoRedeemCoupons={undoRedeemMarketCoupons}
        onToggleRedemption={toggleCouponRedemption}
        onDeleteCoupon={deleteMarketCoupon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  statsGrid: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  statsRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  addMarketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
    marginLeft: 10,
    shadowColor: colors.accentDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addMarketButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  marketCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  marketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  marketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  marketIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  marketName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  couponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  couponBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED',
    marginHorizontal: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardHover,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  couponToggleBtnActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  couponToggleText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    marginHorizontal: 2,
  },
  couponToggleTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  debtTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  debtActiveTag: {
    backgroundColor: colors.dangerLight,
  },
  debtSettledTag: {
    backgroundColor: colors.successLight,
  },
  deleteMarketIconBtn: {
    padding: 6,
    marginLeft: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  debtActiveText: {
    color: colors.dangerText,
  },
  debtSettledText: {
    color: colors.successText,
  },
  balanceSection: {
    backgroundColor: colors.cardHover,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  balanceDebt: {
    color: colors.dangerText,
  },
  balanceClean: {
    color: colors.successText,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 12,
  },
  statCol: {
    flex: 1,
  },
  statColLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statColValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    marginHorizontal: 3,
  },
  transferBtn: {
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  transferBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.infoText,
    marginHorizontal: 3,
  },
  gainBtn: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  gainBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    marginHorizontal: 3,
  },
  couponBtn: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  couponBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    marginHorizontal: 3,
  },
  couponTransferBtn: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  couponTransferBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
    marginHorizontal: 3,
  },
  couponGainBtn: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  couponGainBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
    marginHorizontal: 3,
  },
  breakdownSubText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  couponManageFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  couponManageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponManageTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
    marginHorizontal: 4,
    flexShrink: 1,
  },
  couponCountPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  couponCountPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  couponManageRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponManageActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    marginHorizontal: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
