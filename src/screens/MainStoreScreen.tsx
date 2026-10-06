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
import { InventoryItem, StoreCouponItem } from '../types';
import { StatCard } from '../components/StatCard';
import { AddInventoryModal } from '../components/AddInventoryModal';
import { AddStoreCouponModal, TransferStoreCouponModal } from '../components/StoreCouponModals';

export const MainStoreScreen: React.FC = () => {
  const {
    inventory,
    storeCoupons,
    subMarkets,
    stats,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addStoreCoupon,
    deleteStoreCoupon,
    transferStoreCouponsToMarket,
    isAdmin,
  } = useData();
  const { t, isRTL } = useLanguage();

  const [activeStoreTab, setActiveStoreTab] = useState<'GOODS' | 'COUPONS'>('GOODS');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Store Coupon Modals state
  const [addCouponModalVisible, setAddCouponModalVisible] = useState(false);
  const [transferCouponModalVisible, setTransferCouponModalVisible] = useState(false);
  const [selectedStoreCoupon, setSelectedStoreCoupon] = useState<StoreCouponItem | null>(null);

  const filteredItems = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredStoreCoupons = storeCoupons.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (item: InventoryItem) => {
    if (!isAdmin) {
      Alert.alert(t('permissionDenied'), t('onlyAdminsCanModify'));
      return;
    }
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = (item: InventoryItem) => {
    if (!isAdmin) {
      Alert.alert(t('permissionDenied'), t('onlyAdminsCanModify'));
      return;
    }

    if (Platform.OS === 'web') {
      const msg = `${t('confirmDeleteMsg')} "${item.name}"?`;
      const confirmed = typeof window !== 'undefined' ? window.confirm(msg) : true;
      if (confirmed) {
        deleteInventoryItem(item.id);
      }
      return;
    }

    Alert.alert(
      t('confirmDelete'),
      `${t('confirmDeleteMsg')} "${item.name}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteInventoryItem(item.id),
        },
      ]
    );
  };

  const handleDeleteStoreCoupon = (coupon: StoreCouponItem) => {
    if (!isAdmin) return;
    const msg = isRTL
      ? `هل أنت متأكد من حذف كوبون "${coupon.name}" من المخزن؟`
      : `Are you sure you want to delete store coupon "${coupon.name}"?`;

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(msg) : true;
      if (confirmed) {
        deleteStoreCoupon(coupon.id);
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
            await deleteStoreCoupon(coupon.id);
          },
        },
      ]
    );
  };

  const handleSaveItem = (itemData: {
    name: string;
    category?: string;
    cardboardBoxes: number;
    innerBoxes: number;
    piecesPerBox: number;
    pricePerPiece: number;
  }) => {
    if (editingItem) {
      updateInventoryItem(editingItem.id, itemData);
    } else {
      addInventoryItem(itemData);
    }
    setModalVisible(false);
    setEditingItem(null);
  };

  // Render Goods Inventory Item
  const renderItem = ({ item }: { item: InventoryItem }) => {
    return (
      <View style={styles.itemCard}>
        <View style={[styles.itemHeader, isRTL && styles.rowRtl]}>
          <View style={[styles.itemHeaderLeft, isRTL && styles.rowRtl]}>
            <View style={styles.itemIconContainer}>
              <MaterialCommunityIcons name="package-variant-closed" size={22} color={colors.primary} />
            </View>
            <View style={[{ flex: 1 }, isRTL && { alignItems: 'flex-end' }]}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.category ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {isAdmin ? (
            <View style={[styles.actionButtons, isRTL && styles.rowRtl]}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
                <MaterialCommunityIcons name="pencil" size={18} color={colors.primaryDark} />
              </TouchableOpacity>
              <View style={{ width: 8 }} />
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Packaging Hierarchy Visualizer */}
        <View style={[styles.hierarchyRow, isRTL && styles.rowRtl]}>
          <View style={[styles.hierarchyChip, isRTL && styles.rowRtl]}>
            <MaterialCommunityIcons name="archive-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.hierarchyChipText}>{item.cardboardBoxes} {t('cartons')}</Text>
          </View>
          <MaterialCommunityIcons name={isRTL ? "arrow-left" : "arrow-right"} size={12} color={colors.textMuted} />
          <View style={[styles.hierarchyChip, isRTL && styles.rowRtl]}>
            <MaterialCommunityIcons name="package-variant" size={14} color={colors.textSecondary} />
            <Text style={styles.hierarchyChipText}>{item.innerBoxes} {t('boxes')}</Text>
          </View>
          <MaterialCommunityIcons name={isRTL ? "arrow-left" : "arrow-right"} size={12} color={colors.textMuted} />
          <View style={[styles.hierarchyChip, isRTL && styles.rowRtl]}>
            <MaterialCommunityIcons name="cube-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.hierarchyChipText}>{item.piecesPerBox} {t('pcs')}</Text>
          </View>
        </View>

        {/* Math & Value Breakdown */}
        <View style={[styles.itemMathContainer, isRTL && styles.rowRtl]}>
          <View style={[styles.mathCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.mathLabel} numberOfLines={2}>
              {isRTL ? 'سعة الكرتونة' : 'Carton Capacity'}
            </Text>
            <Text style={styles.mathValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.piecesPerCardboard} {t('pcs')}
            </Text>
          </View>
          <View style={[styles.mathCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.mathLabel} numberOfLines={2}>
              {isRTL ? 'سعر القطعة' : 'Piece Price'}
            </Text>
            <Text style={styles.mathValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.pricePerPiece.toLocaleString()} {t('currency')}
            </Text>
          </View>
          <View style={[styles.mathCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.mathLabel} numberOfLines={2}>
              {isRTL ? 'تكلفة الكرتونة' : 'Carton Cost'}
            </Text>
            <Text style={styles.mathValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.costPerCardboard.toLocaleString()} {t('currency')}
            </Text>
          </View>
          <View style={[styles.mathCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.mathLabel} numberOfLines={2}>{t('stockQty')}</Text>
            <Text style={styles.mathValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.totalPieces} {t('pcs')}
            </Text>
          </View>
        </View>

        <View style={[styles.itemFooter, isRTL && styles.rowRtl]}>
          <Text style={[styles.footerLabel, { flex: 1 }, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
            {t('totalValueInStore')}
          </Text>
          <Text style={styles.totalItemPrice} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {item.totalCost.toLocaleString()} {t('currency')}
          </Text>
        </View>
      </View>
    );
  };

  // Render Store Coupon Item
  const renderStoreCouponItem = ({ item }: { item: StoreCouponItem }) => {
    const isTransferredAll = item.inStockQuantity === 0;

    return (
      <View style={styles.itemCard}>
        <View style={[styles.itemHeader, isRTL && styles.rowRtl]}>
          <View style={[styles.itemHeaderLeft, isRTL && styles.rowRtl]}>
            <View style={[styles.itemIconContainer, { backgroundColor: '#EDE9FE' }]}>
              <MaterialCommunityIcons name="ticket-percent" size={22} color="#7C3AED" />
            </View>
            <View style={[{ flex: 1 }, isRTL && { alignItems: 'flex-end' }]}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: '#EDE9FE' }]}>
                <Text style={[styles.categoryText, { color: '#6D28D9', fontWeight: '800' }]}>
                  {item.unitValue.toLocaleString()} {t('currency')} {isRTL ? '/ للكوبون' : '/ coupon'}
                </Text>
              </View>
            </View>
          </View>

          {isAdmin ? (
            <TouchableOpacity onPress={() => handleDeleteStoreCoupon(item)} style={styles.iconBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Quantities & Valuation Breakdown */}
        <View style={[styles.itemMathContainer, isRTL && styles.rowRtl]}>
          <View style={[styles.mathCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.mathLabel} numberOfLines={2}>{isRTL ? 'المتبقي بالمخزن' : 'In Store Stock'}</Text>
            <Text style={[styles.mathValue, { color: item.inStockQuantity > 0 ? '#6D28D9' : colors.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.inStockQuantity} {isRTL ? 'كوبون' : 'pcs'}
            </Text>
          </View>
          <View style={[styles.mathCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.mathLabel} numberOfLines={2}>{isRTL ? 'قيمة متبقي المخزن' : 'In Stock Value'}</Text>
            <Text style={[styles.mathValue, { color: item.inStockQuantity > 0 ? '#6D28D9' : colors.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.inStockValue.toLocaleString()} {t('currency')}
            </Text>
          </View>
          <View style={[styles.mathCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.mathLabel} numberOfLines={2}>{isRTL ? 'محول للمنافذ' : 'Distributed'}</Text>
            <Text style={styles.mathValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.transferredQuantity} {isRTL ? 'كوبون' : 'pcs'}
            </Text>
          </View>
          <View style={[styles.mathCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.mathLabel} numberOfLines={2}>{isRTL ? 'إجمالي المشتريات' : 'Total Bought'}</Text>
            <Text style={styles.mathValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.totalQuantity} {isRTL ? 'كوبون' : 'pcs'}
            </Text>
          </View>
        </View>

        {/* Action Button: Transfer to Kiosk */}
        <View style={[styles.itemFooter, isRTL && styles.rowRtl]}>
          <Text style={[styles.footerLabel, { flex: 1 }, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
            {isRTL ? 'إجمالي قيمة الدفعة:' : 'Total Batch Value:'} {item.totalValue.toLocaleString()} {t('currency')}
          </Text>

          {item.inStockQuantity > 0 ? (
            <TouchableOpacity
              style={[styles.transferCouponBtn, isRTL && styles.rowRtl]}
              onPress={() => {
                setSelectedStoreCoupon(item);
                setTransferCouponModalVisible(true);
              }}
            >
              <MaterialCommunityIcons name="truck-fast" size={16} color={colors.white} />
              <Text style={styles.transferCouponBtnText}>
                {isRTL ? 'صرف / تحويل لمنفذ' : 'Transfer to Kiosk'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.transferredAllBadge}>
              <Text style={styles.transferredAllText}>{isRTL ? 'تم توزيع الكل بالكامل' : 'Fully Transferred'}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Main Store Valuation Cards */}
      <View style={styles.statsGrid}>
        {/* 1. GRAND COMBINED STORE VALUE (Goods + Coupons combined without mixing balances) */}
        <StatCard
          title={isRTL ? 'إجمالي القيمة الكلية الشاملة للمخزن' : 'Grand Combined Store Value'}
          value={`${stats.totalCombinedStoreValue.toLocaleString()} ${t('currency')}`}
          subtitle={
            isRTL
              ? `بضائع المخزن (${stats.netAvailableValue.toLocaleString()} ج.م) + رصيد الكوبونات (${stats.storeCouponsValue.toLocaleString()} ج.م)`
              : `Goods (${stats.netAvailableValue.toLocaleString()}) + Coupons (${stats.storeCouponsValue.toLocaleString()})`
          }
          icon="cash-multiple"
          variant="primary"
        />

        {/* 2. Store Goods Stock & Store Coupons Stock */}
        <View style={[styles.statsRow, { marginTop: 10 }, isRTL && styles.rowRtl]}>
          <StatCard
            title={t('netAvailable')}
            value={`${stats.netAvailableValue.toLocaleString()} ${t('currency')}`}
            subtitle={`${stats.totalCardboardCount} ${t('cartons')} • ${stats.totalPiecesCount.toLocaleString()} ${t('pcs')}`}
            icon="wallet"
            variant="success"
          />
          <View style={{ width: 10 }} />
          <StatCard
            title={isRTL ? 'رصيد الكوبونات بالمخزن' : 'Store Coupons Stock'}
            value={`${stats.storeCouponsValue.toLocaleString()} ${t('currency')}`}
            subtitle={isRTL ? `${stats.storeCouponsCount} كوبون متاح بالمخزن` : `${stats.storeCouponsCount} coupons in stock`}
            icon="ticket-percent"
            variant="accent"
          />
        </View>

        {/* 3. Goods Transferred Out & Coupons Transferred Out */}
        <View style={[styles.statsRow, { marginTop: 10 }, isRTL && styles.rowRtl]}>
          <StatCard
            title={t('transferredOut')}
            value={`${stats.totalTransferredValue.toLocaleString()} ${t('currency')}`}
            subtitle={t('transferredOutSub')}
            icon="truck-fast"
            variant="info"
          />
          <View style={{ width: 10 }} />
          <StatCard
            title={isRTL ? 'كوبونات محولة للمنافذ' : 'Coupons Transferred'}
            value={`${stats.transferredCouponsValue.toLocaleString()} ${t('currency')}`}
            subtitle={isRTL ? 'عهدة كوبونات بالخارج' : 'Distributed vouchers'}
            icon="ticket-confirmation"
            variant="accent"
          />
        </View>
      </View>

      {/* Store Category Mode Switcher: Store Goods vs Store Coupons */}
      <View style={[styles.tabSelectorBar, isRTL && styles.rowRtl]}>
        <TouchableOpacity
          style={[styles.tabSelectorBtn, activeStoreTab === 'GOODS' && styles.tabSelectorBtnActive, isRTL && styles.rowRtl]}
          onPress={() => setActiveStoreTab('GOODS')}
        >
          <MaterialCommunityIcons
            name="archive-outline"
            size={18}
            color={activeStoreTab === 'GOODS' ? colors.primaryDark : colors.textSecondary}
          />
          <Text style={[styles.tabSelectorText, activeStoreTab === 'GOODS' && styles.tabSelectorTextActive]}>
            {isRTL ? 'بضائع المخزن' : 'Store Goods'} ({filteredItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabSelectorBtn, activeStoreTab === 'COUPONS' && styles.tabSelectorBtnActive, isRTL && styles.rowRtl]}
          onPress={() => setActiveStoreTab('COUPONS')}
        >
          <MaterialCommunityIcons
            name="ticket-percent-outline"
            size={18}
            color={activeStoreTab === 'COUPONS' ? '#7C3AED' : colors.textSecondary}
          />
          <Text style={[styles.tabSelectorText, activeStoreTab === 'COUPONS' && { color: '#7C3AED', fontWeight: '800' }]}>
            {isRTL ? 'كوبونات المخزن' : 'Store Coupons'} ({storeCoupons.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Action Bar */}
      <View style={[styles.searchBarContainer, isRTL && styles.rowRtl]}>
        <View style={[styles.searchInputWrapper, isRTL && styles.rowRtl]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, isRTL && { textAlign: 'right', marginRight: 8, marginLeft: 0 }]}
            placeholder={activeStoreTab === 'GOODS' ? t('searchGoods') : (isRTL ? 'بحث في كوبونات المخزن...' : 'Search store coupons...')}
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
          activeStoreTab === 'GOODS' ? (
            <TouchableOpacity
              style={[styles.addButton, isRTL && { marginLeft: 0, marginRight: 10 }]}
              onPress={() => {
                setEditingItem(null);
                setModalVisible(true);
              }}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>{t('addGoods')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#7C3AED' }, isRTL && { marginLeft: 0, marginRight: 10 }]}
              onPress={() => setAddCouponModalVisible(true)}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>{isRTL ? 'شراء كوبونات' : 'Buy Coupons'}</Text>
            </TouchableOpacity>
          )
        ) : null}
      </View>

      {/* Tab 1: Goods List */}
      {activeStoreTab === 'GOODS' ? (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant-remove" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{t('noGoodsFound')}</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? t('searchGoods') : t('startAddingGoods')}
              </Text>
            </View>
          }
        />
      ) : (
        /* Tab 2: Store Coupons List */
        <FlatList
          data={filteredStoreCoupons}
          keyExtractor={(item) => item.id}
          renderItem={renderStoreCouponItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="ticket-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{isRTL ? 'لا توجد كوبونات بالمخزن' : 'No Store Coupons Found'}</Text>
              <Text style={styles.emptySubtitle}>
                {isRTL
                  ? 'اضغط على زر (شراء كوبونات) لإدخال عهدة كوبونات جديدة للمخزن قبل توزيعها'
                  : 'Tap "Buy Coupons" to stock new coupon vouchers in the main store before distribution'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal for adding/editing goods */}
      <AddInventoryModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editItem={editingItem}
      />

      {/* Modal for adding/buying coupons into Store stock */}
      <AddStoreCouponModal
        visible={addCouponModalVisible}
        onClose={() => setAddCouponModalVisible(false)}
        onSave={addStoreCoupon}
      />

      {/* Modal for transferring coupons from Store to Sub-Market */}
      <TransferStoreCouponModal
        visible={transferCouponModalVisible}
        coupon={selectedStoreCoupon}
        subMarkets={subMarkets}
        onClose={() => {
          setTransferCouponModalVisible(false);
          setSelectedStoreCoupon(null);
        }}
        onTransfer={transferStoreCouponsToMarket}
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabSelectorBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardHover,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabSelectorBtnActive: {
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 6,
  },
  tabSelectorTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    marginLeft: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
    marginHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardHover,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  categoryText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.cardHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hierarchyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardHover,
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  hierarchyChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hierarchyChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: 4,
  },
  itemMathContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 10,
  },
  mathCol: {
    flex: 1,
  },
  mathLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  mathValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  totalItemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  transferCouponBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  transferCouponBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
    marginHorizontal: 4,
  },
  transferredAllBadge: {
    backgroundColor: colors.cardHover,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  transferredAllText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
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
