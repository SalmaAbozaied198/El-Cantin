import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { InventoryItem, SubMarket, Transaction, MainStoreStats, CantinProfile } from '../types';
import { StorageService, formatDateTime, DEFAULT_CANTIN } from '../services/storage';
import { FirebaseSyncService } from '../services/firebaseSync';
import { useAuth } from './AuthContext';

interface DataContextType {
  activeCantin: CantinProfile;
  allCantins: CantinProfile[];
  inventory: InventoryItem[];
  subMarkets: SubMarket[];
  transactions: Transaction[];
  stats: MainStoreStats;
  isLoading: boolean;
  isCloudSynced: boolean;
  switchCantin: (id: string) => Promise<void>;
  createCantin: (name: string, isShared: boolean) => Promise<CantinProfile>;
  joinCantinByCode: (code: string) => Promise<CantinProfile | null>;
  deleteCantin: (cantinId: string) => Promise<boolean>;
  renameCantin: (cantinId: string, newName: string) => Promise<void>;
  clearAllAppData: () => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'piecesPerCardboard' | 'costPerCardboard' | 'totalPieces' | 'totalCost' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInventoryItem: (id: string, item: Omit<InventoryItem, 'id' | 'piecesPerCardboard' | 'costPerCardboard' | 'totalPieces' | 'totalCost' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addSubMarket: (name: string, location?: string, phone?: string, hasCoupons?: boolean) => Promise<void>;
  toggleMarketCoupons: (subMarketId: string) => Promise<void>;
  addMarketCoupon: (subMarketId: string, code: string, value: number, note?: string) => Promise<void>;
  toggleCouponRedemption: (subMarketId: string, couponId: string) => Promise<boolean>;
  deleteMarketCoupon: (subMarketId: string, couponId: string) => Promise<void>;
  transferGoodsValue: (subMarketId: string, amount: number, note?: string) => Promise<boolean>;
  recordSubMarketGain: (subMarketId: string, amount: number, note?: string) => Promise<boolean>;
  redeemCoupon: (subMarketId: string, couponCode: string, unitValue: number, quantity: number, note?: string) => Promise<boolean>;
  clearAllMarkets: () => Promise<void>;
  resetToDemo: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [activeCantin, setActiveCantin] = useState<CantinProfile>(DEFAULT_CANTIN);
  const [allCantins, setAllCantins] = useState<CantinProfile[]>([DEFAULT_CANTIN]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [subMarkets, setSubMarkets] = useState<SubMarket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransferredValue, setTotalTransferredValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const unsubscribersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    initializeCantinAndData();
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, []);

  const initializeCantinAndData = async () => {
    try {
      setIsLoading(true);
      const [cantins, active] = await Promise.all([
        StorageService.getCantins(),
        StorageService.getActiveCantin(),
      ]);
      setAllCantins(cantins);
      const resolvedActive = active || cantins[0] || DEFAULT_CANTIN;
      setActiveCantin(resolvedActive);
      await loadStoreData(resolvedActive.id);
    } catch (err) {
      console.error('Failed to initialize cantin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoreData = async (cantinId: string) => {
    // 1. Clean up any existing listeners
    unsubscribersRef.current.forEach((unsub) => unsub());
    unsubscribersRef.current = [];

    // 2. Load cached local data
    const [inv, markets, txs, transferred] = await Promise.all([
      StorageService.getInventory(cantinId),
      StorageService.getSubMarkets(cantinId),
      StorageService.getTransactions(cantinId),
      StorageService.getTotalTransferred(cantinId),
    ]);
    setInventory(inv);
    setSubMarkets(markets);
    setTransactions(txs);
    setTotalTransferredValue(transferred);

    // 3. Connect real-time Firestore listeners if Firebase is configured
    if (FirebaseSyncService.isAvailable()) {
      const unsubInv = FirebaseSyncService.subscribeInventory(cantinId, inv, (cloudItems) => {
        setInventory(cloudItems);
        StorageService.saveInventory(cantinId, cloudItems);
      });
      if (unsubInv) unsubscribersRef.current.push(unsubInv);

      const unsubSubs = FirebaseSyncService.subscribeSubMarkets(cantinId, (cloudMarkets) => {
        setSubMarkets(cloudMarkets);
        StorageService.saveSubMarkets(cantinId, cloudMarkets);
      });
      if (unsubSubs) unsubscribersRef.current.push(unsubSubs);

      const unsubTxs = FirebaseSyncService.subscribeTransactions(cantinId, (cloudTxs) => {
        setTransactions(cloudTxs);
        StorageService.saveTransactions(cantinId, cloudTxs);
      });
      if (unsubTxs) unsubscribersRef.current.push(unsubTxs);

      const unsubTrans = FirebaseSyncService.subscribeTransferredValue(cantinId, (cloudVal) => {
        setTotalTransferredValue(cloudVal);
        StorageService.saveTotalTransferred(cantinId, cloudVal);
      });
      if (unsubTrans) unsubscribersRef.current.push(unsubTrans);
    }
  };

  const switchCantin = async (id: string) => {
    const target = allCantins.find((c) => c.id === id);
    if (target) {
      setIsLoading(true);
      setActiveCantin(target);
      await StorageService.setActiveCantinId(target.id);
      await loadStoreData(target.id);
      setIsLoading(false);
    }
  };

  const createCantin = async (name: string, isShared: boolean): Promise<CantinProfile> => {
    const newCantin = await StorageService.createCantin(name, isShared, currentUser);
    const updatedList = await StorageService.getCantins();
    setAllCantins(updatedList);
    setActiveCantin(newCantin);
    await loadStoreData(newCantin.id);
    return newCantin;
  };

  const joinCantinByCode = async (code: string): Promise<CantinProfile | null> => {
    const joined = await StorageService.joinCantinByCode(code, currentUser);
    if (joined) {
      const updatedList = await StorageService.getCantins();
      setAllCantins(updatedList);
      setActiveCantin(joined);
      await loadStoreData(joined.id);
      return joined;
    }
    return null;
  };

  // Helper to compute packaging hierarchy math
  const computeItemMath = (data: {
    cardboardBoxes: number;
    innerBoxes: number;
    piecesPerBox: number;
    pricePerPiece: number;
  }) => {
    const piecesPerCardboard = data.innerBoxes * data.piecesPerBox;
    const costPerCardboard = piecesPerCardboard * data.pricePerPiece;
    const totalPieces = data.cardboardBoxes * piecesPerCardboard;
    const totalCost = data.cardboardBoxes * costPerCardboard;

    return {
      piecesPerCardboard,
      costPerCardboard,
      totalPieces,
      totalCost,
    };
  };

  const grossInventoryValue = inventory.reduce((sum, item) => sum + item.totalCost, 0);
  const totalCardboardCount = inventory.reduce((sum, item) => sum + item.cardboardBoxes, 0);
  const totalPiecesCount = inventory.reduce((sum, item) => sum + item.totalPieces, 0);
  const netAvailableValue = Math.max(0, grossInventoryValue - totalTransferredValue);

  const stats: MainStoreStats = {
    grossInventoryValue,
    totalTransferredValue,
    netAvailableValue,
    totalCardboardCount,
    totalPiecesCount,
  };

  // 1. Add Inventory Item
  const addInventoryItem = async (
    itemData: Omit<InventoryItem, 'id' | 'piecesPerCardboard' | 'costPerCardboard' | 'totalPieces' | 'totalCost' | 'createdAt' | 'updatedAt'>
  ) => {
    const computed = computeItemMath(itemData);
    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      ...itemData,
      ...computed,
      id: `inv_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newItem, ...inventory];
    setInventory(updated);
    await StorageService.saveInventory(activeCantin.id, updated);
    await FirebaseSyncService.pushInventory(activeCantin.id, updated);
  };

  // 2. Update Inventory Item
  const updateInventoryItem = async (
    id: string,
    itemData: Omit<InventoryItem, 'id' | 'piecesPerCardboard' | 'costPerCardboard' | 'totalPieces' | 'totalCost' | 'createdAt' | 'updatedAt'>
  ) => {
    const computed = computeItemMath(itemData);
    const now = new Date().toISOString();
    const updated = inventory.map((item) =>
      item.id === id
        ? {
            ...item,
            ...itemData,
            ...computed,
            updatedAt: now,
          }
        : item
    );

    setInventory(updated);
    await StorageService.saveInventory(activeCantin.id, updated);
    await FirebaseSyncService.pushInventory(activeCantin.id, updated);
  };

  // 3. Delete Inventory Item
  const deleteInventoryItem = async (id: string) => {
    const updated = inventory.filter((item) => item.id !== id);
    setInventory(updated);
    await StorageService.saveInventory(activeCantin.id, updated);
    await FirebaseSyncService.pushInventory(activeCantin.id, updated);
  };

  // 4. Add Sub-Market
  const addSubMarket = async (name: string, location?: string, phone?: string, hasCoupons: boolean = false) => {
    const now = new Date().toISOString();
    const newMarket: SubMarket = {
      id: `sub_${Date.now()}`,
      name,
      location: location || '',
      phone: phone || '',
      hasCoupons: !!hasCoupons,
      currentDebt: 0,
      totalGoodsTaken: 0,
      totalGainPaid: 0,
      totalCouponsRedeemed: 0,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...subMarkets, newMarket];
    setSubMarkets(updated);
    await StorageService.saveSubMarkets(activeCantin.id, updated);
    await FirebaseSyncService.pushSubMarkets(activeCantin.id, updated);
  };

  // 4b. Toggle Coupons support for an existing Sub-Market
  const toggleMarketCoupons = async (subMarketId: string) => {
    const marketIndex = subMarkets.findIndex((m) => m.id === subMarketId);
    if (marketIndex === -1) return;
    const market = subMarkets[marketIndex];
    const updatedMarkets = [...subMarkets];
    updatedMarkets[marketIndex] = {
      ...market,
      hasCoupons: !market.hasCoupons,
      updatedAt: new Date().toISOString(),
    };
    setSubMarkets(updatedMarkets);
    await Promise.all([
      StorageService.saveSubMarkets(activeCantin.id, updatedMarkets),
      FirebaseSyncService.pushSubMarkets(activeCantin.id, updatedMarkets),
    ]);
  };

  // 5. Transfer Goods in terms of money from Main Store to Sub-Market
  const transferGoodsValue = async (subMarketId: string, amount: number, note?: string): Promise<boolean> => {
    if (amount <= 0) return false;

    const marketIndex = subMarkets.findIndex((m) => m.id === subMarketId);
    if (marketIndex === -1) return false;

    const market = subMarkets[marketIndex];
    const prevDebt = market.currentDebt;
    const newDebt = prevDebt + amount;

    const updatedMarkets = [...subMarkets];
    updatedMarkets[marketIndex] = {
      ...market,
      currentDebt: newDebt,
      totalGoodsTaken: market.totalGoodsTaken + amount,
      updatedAt: new Date().toISOString(),
    };

    const newTransferred = totalTransferredValue + amount;

    const dt = formatDateTime(new Date());
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      subMarketId: market.id,
      subMarketName: market.name,
      type: 'TRANSFER_GOODS',
      amount,
      previousBalance: prevDebt,
      newBalance: newDebt,
      timestamp: dt.iso,
      formattedDate: dt.date,
      formattedTime: dt.time,
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      userRole: currentUser?.role || 'admin',
      note: note || 'Goods transferred from Main Store',
    };

    const updatedTxs = [newTx, ...transactions];

    setSubMarkets(updatedMarkets);
    setTotalTransferredValue(newTransferred);
    setTransactions(updatedTxs);

    await Promise.all([
      StorageService.saveSubMarkets(activeCantin.id, updatedMarkets),
      StorageService.saveTotalTransferred(activeCantin.id, newTransferred),
      StorageService.saveTransactions(activeCantin.id, updatedTxs),
      FirebaseSyncService.pushSubMarkets(activeCantin.id, updatedMarkets),
      FirebaseSyncService.pushTransferredValue(activeCantin.id, newTransferred),
      FirebaseSyncService.pushTransactions(activeCantin.id, updatedTxs),
    ]);

    return true;
  };

  // 6. Record Gain / Repayment from Sub-Market
  const recordSubMarketGain = async (subMarketId: string, amount: number, note?: string): Promise<boolean> => {
    if (amount <= 0) return false;

    const marketIndex = subMarkets.findIndex((m) => m.id === subMarketId);
    if (marketIndex === -1) return false;

    const market = subMarkets[marketIndex];
    const prevDebt = market.currentDebt;
    const newDebt = Math.max(0, prevDebt - amount);

    const updatedMarkets = [...subMarkets];
    updatedMarkets[marketIndex] = {
      ...market,
      currentDebt: newDebt,
      totalGainPaid: market.totalGainPaid + amount,
      updatedAt: new Date().toISOString(),
    };

    const dt = formatDateTime(new Date());
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      subMarketId: market.id,
      subMarketName: market.name,
      type: 'RECORD_GAIN',
      amount,
      previousBalance: prevDebt,
      newBalance: newDebt,
      timestamp: dt.iso,
      formattedDate: dt.date,
      formattedTime: dt.time,
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      userRole: currentUser?.role || 'admin',
      note: note || 'Sub-market earnings/payment recorded',
    };

    const updatedTxs = [newTx, ...transactions];

    setSubMarkets(updatedMarkets);
    setTransactions(updatedTxs);

    await Promise.all([
      StorageService.saveSubMarkets(activeCantin.id, updatedMarkets),
      StorageService.saveTransactions(activeCantin.id, updatedTxs),
      FirebaseSyncService.pushSubMarkets(activeCantin.id, updatedMarkets),
      FirebaseSyncService.pushTransactions(activeCantin.id, updatedTxs),
    ]);

    return true;
  };

  // 6b. Redeem Coupon for Sub-Market (reduces debt like a gain, without affecting store inventory)
  const redeemCoupon = async (
    subMarketId: string,
    couponCode: string,
    unitValue: number,
    quantity: number,
    note?: string
  ): Promise<boolean> => {
    const qty = Math.max(1, Math.floor(quantity || 1));
    const totalAmount = unitValue * qty;
    if (totalAmount <= 0) return false;

    const marketIndex = subMarkets.findIndex((m) => m.id === subMarketId);
    if (marketIndex === -1) return false;

    const market = subMarkets[marketIndex];
    const prevDebt = market.currentDebt;
    const newDebt = Math.max(0, prevDebt - totalAmount);
    const totalCoupons = (market.totalCouponsRedeemed || 0) + totalAmount;

    const updatedMarkets = [...subMarkets];
    updatedMarkets[marketIndex] = {
      ...market,
      currentDebt: newDebt,
      totalGainPaid: market.totalGainPaid + totalAmount,
      totalCouponsRedeemed: totalCoupons,
      updatedAt: new Date().toISOString(),
    };

    const dt = formatDateTime(new Date());
    const cleanCode = couponCode.trim().toUpperCase();
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      subMarketId: market.id,
      subMarketName: market.name,
      type: 'REDEEM_COUPON',
      amount: totalAmount,
      couponCode: cleanCode || undefined,
      couponUnitValue: unitValue,
      couponQuantity: qty,
      previousBalance: prevDebt,
      newBalance: newDebt,
      timestamp: dt.iso,
      formattedDate: dt.date,
      formattedTime: dt.time,
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      userRole: currentUser?.role || 'admin',
      note: note || (cleanCode ? `Coupon redeemed: ${cleanCode} (${qty}x)` : `${qty} coupons redeemed`),
    };

    const updatedTxs = [newTx, ...transactions];

    setSubMarkets(updatedMarkets);
    setTransactions(updatedTxs);

    await Promise.all([
      StorageService.saveSubMarkets(activeCantin.id, updatedMarkets),
      StorageService.saveTransactions(activeCantin.id, updatedTxs),
      FirebaseSyncService.pushSubMarkets(activeCantin.id, updatedMarkets),
      FirebaseSyncService.pushTransactions(activeCantin.id, updatedTxs),
    ]);

    return true;
  };

  // 6c. Add user-defined coupon to a sub-market
  const addMarketCoupon = async (
    subMarketId: string,
    code: string,
    value: number,
    note?: string
  ) => {
    if (value <= 0) return;
    const marketIndex = subMarkets.findIndex((m) => m.id === subMarketId);
    if (marketIndex === -1) return;

    const market = subMarkets[marketIndex];
    const newCoupon = {
      id: `cpn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      code: code.trim() || `CPN-${(market.coupons?.length || 0) + 1}`,
      value,
      isRedeemed: false,
      note: note?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedCoupons = [...(market.coupons || []), newCoupon];
    const updatedMarkets = [...subMarkets];
    updatedMarkets[marketIndex] = {
      ...market,
      hasCoupons: true,
      coupons: updatedCoupons,
      updatedAt: new Date().toISOString(),
    };

    setSubMarkets(updatedMarkets);
    await Promise.all([
      StorageService.saveSubMarkets(activeCantin.id, updatedMarkets),
      FirebaseSyncService.pushSubMarkets(activeCantin.id, updatedMarkets),
    ]);
  };

  // 6d. Check / Uncheck coupon as redeemed (removes coupon value from sub-market debt upon check!)
  const toggleCouponRedemption = async (
    subMarketId: string,
    couponId: string
  ): Promise<boolean> => {
    const marketIndex = subMarkets.findIndex((m) => m.id === subMarketId);
    if (marketIndex === -1) return false;

    const market = subMarkets[marketIndex];
    const coupons = market.coupons || [];
    const couponIndex = coupons.findIndex((c) => c.id === couponId);
    if (couponIndex === -1) return false;

    const coupon = coupons[couponIndex];
    const nowCheckingAsRedeemed = !coupon.isRedeemed;

    const updatedCoupons = [...coupons];
    let newDebt = market.currentDebt;
    let newTotalCoupons = market.totalCouponsRedeemed || 0;
    let newTotalGain = market.totalGainPaid;
    let updatedTxs = [...transactions];

    if (nowCheckingAsRedeemed) {
      // 1. Mark as redeemed
      updatedCoupons[couponIndex] = {
        ...coupon,
        isRedeemed: true,
        redeemedAt: new Date().toISOString(),
        redeemedBy: currentUser?.name || 'Admin',
      };
      // 2. Remove coupon value from sub-market debt!
      const prevDebt = market.currentDebt;
      newDebt = Math.max(0, prevDebt - coupon.value);
      newTotalCoupons += coupon.value;
      newTotalGain += coupon.value;

      // 3. Record transaction in history
      const dt = formatDateTime(new Date());
      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        subMarketId: market.id,
        subMarketName: market.name,
        type: 'REDEEM_COUPON',
        amount: coupon.value,
        couponCode: coupon.code,
        couponUnitValue: coupon.value,
        couponQuantity: 1,
        previousBalance: prevDebt,
        newBalance: newDebt,
        timestamp: dt.iso,
        formattedDate: dt.date,
        formattedTime: dt.time,
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'Admin',
        userRole: currentUser?.role || 'admin',
        note: `Coupon ${coupon.code} checked as redeemed (-${coupon.value} EGP removed from debt)`,
      };
      updatedTxs = [newTx, ...transactions];
    } else {
      // Unchecking / undoing redemption -> restore debt
      updatedCoupons[couponIndex] = {
        ...coupon,
        isRedeemed: false,
        redeemedAt: undefined,
        redeemedBy: undefined,
      };
      newDebt = market.currentDebt + coupon.value;
      newTotalCoupons = Math.max(0, newTotalCoupons - coupon.value);
      newTotalGain = Math.max(0, newTotalGain - coupon.value);
    }

    const updatedMarkets = [...subMarkets];
    updatedMarkets[marketIndex] = {
      ...market,
      currentDebt: newDebt,
      totalCouponsRedeemed: newTotalCoupons,
      totalGainPaid: newTotalGain,
      coupons: updatedCoupons,
      updatedAt: new Date().toISOString(),
    };

    setSubMarkets(updatedMarkets);
    setTransactions(updatedTxs);

    await Promise.all([
      StorageService.saveSubMarkets(activeCantin.id, updatedMarkets),
      StorageService.saveTransactions(activeCantin.id, updatedTxs),
      FirebaseSyncService.pushSubMarkets(activeCantin.id, updatedMarkets),
      FirebaseSyncService.pushTransactions(activeCantin.id, updatedTxs),
    ]);

    return true;
  };

  // 6e. Delete a coupon from market
  const deleteMarketCoupon = async (subMarketId: string, couponId: string) => {
    const marketIndex = subMarkets.findIndex((m) => m.id === subMarketId);
    if (marketIndex === -1) return;

    const market = subMarkets[marketIndex];
    const coupons = market.coupons || [];
    const coupon = coupons.find((c) => c.id === couponId);
    if (!coupon) return;

    // If it was redeemed, optionally adjust or remove
    const updatedCoupons = coupons.filter((c) => c.id !== couponId);
    const updatedMarkets = [...subMarkets];
    updatedMarkets[marketIndex] = {
      ...market,
      coupons: updatedCoupons,
      updatedAt: new Date().toISOString(),
    };

    setSubMarkets(updatedMarkets);
    await Promise.all([
      StorageService.saveSubMarkets(activeCantin.id, updatedMarkets),
      FirebaseSyncService.pushSubMarkets(activeCantin.id, updatedMarkets),
    ]);
  };

  // 7. Delete Cantin
  const deleteCantin = async (cantinId: string): Promise<boolean> => {
    if (allCantins.length <= 1) {
      return false;
    }
    await StorageService.deleteCantin(cantinId);
    const updated = await StorageService.getCantins();
    setAllCantins(updated);
    if (activeCantin.id === cantinId) {
      const next = updated[0] || DEFAULT_CANTIN;
      setActiveCantin(next);
      await StorageService.setActiveCantinId(next.id);
      await loadStoreData(next.id);
    }
    return true;
  };

  // 8. Rename Cantin
  const renameCantin = async (cantinId: string, newName: string): Promise<void> => {
    await StorageService.updateCantin(cantinId, { name: newName.trim() });
    const updated = await StorageService.getCantins();
    setAllCantins(updated);
    if (activeCantin.id === cantinId) {
      setActiveCantin((prev) => ({ ...prev, name: newName.trim() }));
    }
  };

  // 9. Clear all app data
  const clearAllAppData = async (): Promise<void> => {
    await StorageService.clearAllData();
    setAllCantins([]);
    setActiveCantin(DEFAULT_CANTIN);
    setInventory([]);
    setSubMarkets([]);
    setTransactions([]);
    setTotalTransferredValue(0);
  };

  // 10. Clear all sub-markets in active cantin
  const clearAllMarkets = async () => {
    setSubMarkets([]);
    setTransactions([]);
    setTotalTransferredValue(0);
    await Promise.all([
      StorageService.saveSubMarkets(activeCantin.id, []),
      StorageService.saveTransactions(activeCantin.id, []),
      StorageService.saveTotalTransferred(activeCantin.id, 0),
      FirebaseSyncService.pushSubMarkets(activeCantin.id, []),
      FirebaseSyncService.pushTransactions(activeCantin.id, []),
      FirebaseSyncService.pushTransferredValue(activeCantin.id, 0),
    ]);
  };

  // 11. Reset to demo data
  const resetToDemo = async () => {
    await StorageService.resetAllToDemo(activeCantin.id);
    await loadStoreData(activeCantin.id);
  };

  return (
    <DataContext.Provider
      value={{
        activeCantin,
        allCantins,
        inventory,
        subMarkets,
        transactions,
        stats,
        isLoading,
        isCloudSynced: FirebaseSyncService.isAvailable(),
        switchCantin,
        createCantin,
        joinCantinByCode,
        deleteCantin,
        renameCantin,
        clearAllAppData,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addSubMarket,
        toggleMarketCoupons,
        addMarketCoupon,
        toggleCouponRedemption,
        deleteMarketCoupon,
        transferGoodsValue,
        recordSubMarketGain,
        redeemCoupon,
        clearAllMarkets,
        resetToDemo,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
