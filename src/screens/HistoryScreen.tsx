import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Transaction } from '../types';

export const HistoryScreen: React.FC = () => {
  const { transactions } = useData();
  const { t, isRTL } = useLanguage();
  const [filterType, setFilterType] = useState<'ALL' | 'RECORD_GAIN' | 'TRANSFER_GOODS' | 'REDEEM_COUPON'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter = filterType === 'ALL' || tx.type === filterType;
    const matchesSearch =
      tx.subMarketName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.couponCode && tx.couponCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isGain = item.type === 'RECORD_GAIN';
    const isCoupon = item.type === 'REDEEM_COUPON';

    let iconName: any = 'truck-delivery';
    let iconBg = colors.infoLight;
    let iconColor = colors.infoText;
    let typeLabel = t('goodsValueTransferred');
    let amountSign = '+';
    let amountColor = colors.infoText;

    if (isGain) {
      iconName = 'cash-check';
      iconBg = colors.successLight;
      iconColor = colors.successText;
      typeLabel = t('gainPaymentRecorded');
      amountSign = '-';
      amountColor = colors.successText;
    } else if (isCoupon) {
      iconName = 'ticket-percent';
      iconBg = '#EDE9FE';
      iconColor = '#7C3AED';
      typeLabel = t('couponRedemptionRecorded');
      amountSign = '-';
      amountColor = '#7C3AED';
    }

    return (
      <View style={styles.card}>
        <View style={[styles.cardTop, isRTL && styles.rowRtl]}>
          <View style={[styles.typeBadgeContainer, isRTL && styles.rowRtl, { flex: 1, marginRight: 8 }]}>
            <View
              style={[
                styles.typeIcon,
                { backgroundColor: iconBg },
              ]}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={18}
                color={iconColor}
              />
            </View>
            <View style={[{ flex: 1 }, isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
              <Text style={styles.typeName} numberOfLines={1}>
                {typeLabel}
              </Text>
              <View style={[styles.subMarketRow, isRTL && styles.rowRtl]}>
                <Text style={styles.subMarketTarget} numberOfLines={1}>{item.subMarketName}</Text>
                {item.couponQuantity && item.couponQuantity > 1 ? (
                  <View style={[styles.couponCodeTag, { backgroundColor: '#F5F3FF' }, isRTL && { marginRight: 6, marginLeft: 0 }]}>
                    <Text style={[styles.couponCodeTagText, { color: '#6D28D9' }]}>
                      {item.couponQuantity} × {item.couponUnitValue} {t('currency')}
                    </Text>
                  </View>
                ) : null}
                {item.couponCode ? (
                  <View style={[styles.couponCodeTag, isRTL && { marginRight: 6, marginLeft: 0 }]}>
                    <Text style={styles.couponCodeTagText}>🎟️ {item.couponCode}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <Text
            style={[styles.amountText, { color: amountColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {amountSign} {item.amount.toLocaleString()} {t('currency')}
          </Text>
        </View>

        {/* Note if available */}
        {item.note ? (
          <View style={[styles.noteBox, isRTL && styles.rowRtl]}>
            <MaterialCommunityIcons name="text-box-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.noteText, isRTL && { marginRight: 6, marginLeft: 0 }]}>{item.note}</Text>
          </View>
        ) : null}

        {/* Balance Change Line */}
        <View style={[styles.balanceRow, isRTL && styles.rowRtl]}>
          <Text style={styles.balanceTitle}>{t('moneyOnHim')}</Text>
          <Text style={styles.balanceChange}>
            {item.previousBalance.toLocaleString()} →{' '}
            <Text style={{ fontWeight: '800', color: (isGain || isCoupon) ? colors.successText : colors.dangerText }}>
              {item.newBalance.toLocaleString()} {t('currency')}
            </Text>
          </Text>
        </View>

        {/* Metadata Footer: Date, Time & Stamped User */}
        <View style={[styles.metaFooter, isRTL && styles.rowRtl]}>
          <View style={[styles.timeTag, isRTL && styles.rowRtl]}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.textSecondary} />
            <Text style={[styles.timeText, isRTL && { marginRight: 4, marginLeft: 0 }]}>
              {item.formattedDate} • {item.formattedTime}
            </Text>
          </View>

          <View style={[styles.userTag, isRTL && styles.rowRtl]}>
            <MaterialCommunityIcons
              name={item.userRole === 'admin' ? 'shield-account' : 'account-circle'}
              size={14}
              color={item.userRole === 'admin' ? colors.accentDark : colors.primaryDark}
            />
            <Text style={[styles.userText, isRTL && { marginRight: 4, marginLeft: 0 }]}>{item.userName}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, isRTL && styles.rowRtl]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, isRTL && { textAlign: 'right', marginRight: 8, marginLeft: 0 }]}
            placeholder={t('searchHistory')}
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
      </View>

      {/* Filter Tabs - Horizontal Scroll to prevent overlapping */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabsRow, isRTL && styles.rowRtl]}
      >
        <TouchableOpacity
          style={[styles.tabBtn, filterType === 'ALL' && styles.activeTabBtn]}
          onPress={() => setFilterType('ALL')}
        >
          <Text style={[styles.tabText, filterType === 'ALL' && styles.activeTabText]}>
            {t('allFilter')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, filterType === 'RECORD_GAIN' && styles.activeTabBtn]}
          onPress={() => setFilterType('RECORD_GAIN')}
        >
          <Text style={[styles.tabText, filterType === 'RECORD_GAIN' && styles.activeTabText]}>
            {t('gainsRepaidFilter')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, filterType === 'TRANSFER_GOODS' && styles.activeTabBtn]}
          onPress={() => setFilterType('TRANSFER_GOODS')}
        >
          <Text style={[styles.tabText, filterType === 'TRANSFER_GOODS' && styles.activeTabText]}>
            {t('goodsTransferredFilter')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, filterType === 'REDEEM_COUPON' && styles.activeTabBtn]}
          onPress={() => setFilterType('REDEEM_COUPON')}
        >
          <Text style={[styles.tabText, filterType === 'REDEEM_COUPON' && styles.activeTabText]}>
            {t('filterCoupons')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Transactions Feed */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('noTransactionsFound')}</Text>
          </View>
        }
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.cardHover,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTabBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  typeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subMarketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 1,
  },
  subMarketTarget: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  couponCodeTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  couponCodeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  gainAmount: {
    color: colors.successText,
  },
  transferAmount: {
    color: colors.infoText,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardHover,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 10,
  },
  balanceTitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  balanceChange: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  userTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardHover,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  userText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 4,
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
});
