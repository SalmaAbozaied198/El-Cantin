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
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { InventoryItem } from '../types';
import { StatCard } from '../components/StatCard';
import { AddInventoryModal } from '../components/AddInventoryModal';

export const MainStoreScreen: React.FC = () => {
  const { inventory, stats, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();
  const { isAdmin } = useAuth();
  const { t, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const filteredItems = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
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
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    return (
      <View style={styles.itemCard}>
        <View style={[styles.itemHeader, isRTL && styles.rowRtl]}>
          <View style={[styles.itemHeaderLeft, isRTL && styles.rowRtl]}>
            <View style={styles.itemIconContainer}>
              <MaterialCommunityIcons name="cube-send" size={20} color={colors.primary} />
            </View>
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category || 'General'}</Text>
              </View>
            </View>
          </View>

          {isAdmin ? (
            <View style={[styles.actionButtons, isRTL && styles.rowRtl]}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleEdit(item)}
              >
                <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 }]}
                onPress={() => handleDelete(item)}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Packaging Hierarchy Visual Chips */}
        <View style={[styles.hierarchyRow, isRTL && styles.rowRtl]}>
          <View style={[styles.hierarchyChip, isRTL && styles.rowRtl]}>
            <MaterialCommunityIcons name="archive" size={14} color={colors.primaryDark} />
            <Text style={styles.hierarchyChipText}>{item.cardboardBoxes} {t('cartons')}</Text>
          </View>
          <MaterialCommunityIcons name={isRTL ? "chevron-left" : "chevron-right"} size={14} color={colors.textMuted} />
          <View style={[styles.hierarchyChip, isRTL && styles.rowRtl]}>
            <MaterialCommunityIcons name="package-variant" size={14} color={colors.primaryDark} />
            <Text style={styles.hierarchyChipText}>{item.innerBoxes} {t('boxes')}</Text>
          </View>
          <MaterialCommunityIcons name={isRTL ? "chevron-left" : "chevron-right"} size={14} color={colors.textMuted} />
          <View style={[styles.hierarchyChip, isRTL && styles.rowRtl]}>
            <MaterialCommunityIcons name="cube-outline" size={14} color={colors.primaryDark} />
            <Text style={styles.hierarchyChipText}>{item.piecesPerBox} {t('pcs')}</Text>
          </View>
        </View>

        {/* Math & Value Breakdown */}
        <View style={[styles.itemMathContainer, isRTL && styles.rowRtl]}>
          <View style={[styles.mathCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.mathLabel} numberOfLines={2}>{t('unitPrice')}</Text>
            <Text style={styles.mathValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {item.pricePerPiece.toFixed(2)} {t('currency')}
            </Text>
          </View>
          <View style={[styles.mathCol, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={styles.mathLabel} numberOfLines={2}>{t('costOfOneCarton')}</Text>
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

  return (
    <View style={styles.container}>
      {/* Top Main Store Valuation Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statsRow, isRTL && styles.rowRtl]}>
          <StatCard
            title={t('totalGoodsValue')}
            value={`${stats.grossInventoryValue.toLocaleString()} ${t('currency')}`}
            subtitle={t('totalGoodsValueSub')}
            icon="safe"
            variant="primary"
          />
          <View style={{ width: 10 }} />
          <StatCard
            title={t('netAvailable')}
            value={`${stats.netAvailableValue.toLocaleString()} ${t('currency')}`}
            subtitle={t('netAvailableSub')}
            icon="wallet"
            variant="success"
          />
        </View>
        <View style={[styles.statsRow, { marginTop: 10 }, isRTL && styles.rowRtl]}>
          <StatCard
            title={t('cardboardCartons')}
            value={`${stats.totalCardboardCount} ${t('cartons')}`}
            subtitle={`${stats.totalPiecesCount.toLocaleString()} ${t('pcs')}`}
            icon="archive"
            variant="accent"
          />
          <View style={{ width: 10 }} />
          <StatCard
            title={t('transferredOut')}
            value={`${stats.totalTransferredValue.toLocaleString()} ${t('currency')}`}
            subtitle={t('transferredOutSub')}
            icon="truck-fast"
            variant="info"
          />
        </View>
      </View>

      {/* Search and Action Bar */}
      <View style={[styles.searchBarContainer, isRTL && styles.rowRtl]}>
        <View style={[styles.searchInputWrapper, isRTL && styles.rowRtl]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, isRTL && { textAlign: 'right', marginRight: 8, marginLeft: 0 }]}
            placeholder={t('searchGoods')}
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
            style={[styles.addButton, isRTL && { marginLeft: 0, marginRight: 10 }]}
            onPress={() => {
              setEditingItem(null);
              setModalVisible(true);
            }}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
            <Text style={styles.addButtonText}>{t('addGoods')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Inventory List */}
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
