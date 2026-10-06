import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  InventoryItem,
  SubMarket,
  Transaction,
  MainStoreStats,
  CantinProfile,
  MarketCoupon,
  StoreCouponItem,
} from '../types';
import { StorageService, formatDateTime, DEFAULT_CANTIN } from '../services/storage';
import { FirebaseSyncService } from '../services/firebaseSync';
import { useAuth } from './AuthContext';

interface DataContextType {
  activeCantin: CantinProfile;
  allCantins: CantinProfile[];
  inventory: InventoryItem[];
  storeCoupons: StoreCouponItem[];
  subMarkets: SubMarket[];
  transactions: Transaction[];
  stats: MainStoreStats;
  isLoading: boolean;
  isCloudSynced: boolean;
  isAdmin: boolean;
  isOwner: (cantin?: CantinProfile) => boolean;
  switchCantin: (id: string) => Promise<void>;
  createCantin: (name: string, isShared: boolean) => Promise<CantinProfile>;
  joinCantinByCode: (code: string) => Promise<CantinProfile | null>;
  deleteCantin: (cantinId: string) => Promise<boolean>;
  renameCantin: (cantinId: string, newName: string) => Promise<void>;
  updateMemberRole: (memberEmail: string, newRole: 'admin' | 'user') => Promise<void>;
  clearAllAppData: () => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'piecesPerCardboard' | 'costPerCardboard' | 'totalPieces' | 'totalCost' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInventoryItem: (id: string, item: Omit<InventoryItem, 'id' | 'piecesPerCardboard' | 'costPerCardboard' | 'totalPieces' | 'totalCost' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addStoreCoupon: (name: string, quantity: number, unitValue: number, note?: string) => Promise<void>;
  deleteStoreCoupon: (couponId: string) => Promise<void>;
  transferStoreCouponsToMarket: (storeCouponId: string, subMarketId: string, quantity: number, note?: string) => Promise<boolean>;
  addSubMarket: (name: string, location?: string, phone?: string, hasCoupons?: boolean) => Promise<void>;
  deleteSubMarket: (subMarketId: string) => Promise<boolean>;
  toggleMarketCoupons: (subMarketId: string) => Promise<void>;
  addMarketCoupon: (subMarketId: string, nameOrCode: string, quantityOrValue: number, valuePerPiece?: number, note?: string) => Promise<void>;
  redeemMarketCoupons: (subMarketId: string, couponId: string, quantityToRedeem?: number) => Promise<boolean>;
  undoRedeemMarketCoupons: (subMarketId: string, couponId: string, quantityToUndo?: number) => Promise<boolean>;
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
  const [storeCoupons, setStoreCoupons] = useState<StoreCouponItem[]>([]);
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
    const [inv, storeCps, markets, txs, transferred] = await Promise.all([
      StorageService.getInventory(cantinId),
      StorageService.getStoreCoupons(cantinId),
      StorageService.getSubMarkets(cantinId),
      StorageService.getTransactions(cantinId),
      StorageService.getTotalTransferred(cantinId),
    ]);
    setInventory(inv);
    setStoreCoupons(storeCps);
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

      const unsubStoreCoupons = FirebaseSyncService.subscribeStoreCoupons(cantinId, (cloudCoupons) => {
        setStoreCoupons(cloudCoupons);
        StorageService.saveStoreCoupons(cantinId, cloudCoupons);
      });
      if (unsubStoreCoupons) unsubscribersRef.current.push(unsubStoreCoupons);

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

      const unsubProfile = FirebaseSyncService.subscribeCantinProfile(cantinId, (cloudProfile) => {
        if (cloudProfile && cloudProfile.name) {
          setActiveCantin((prev) => ({ ...prev, ...cloudProfile }));
          StorageService.updateCantin(cantinId, cloudProfile);
        }
      });
      if (unsubProfile) unsubscribersRef.current.push(unsubProfile);
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
    await FirebaseSyncService.pushCantinProfile(newCantin);
    const updatedList = await StorageService.getCantins();
    setAllCantins(updatedList);
    setActiveCantin(newCantin);
    await loadStoreData(newCantin.id);
    return newCantin;
  };

  const joinCantinByCode = async (code: string): Promise<CantinProfile | null> => {
    const cleanCode = code.trim().toUpperCase();
    const joined = await StorageService.joinCantinByCode(cleanCode, currentUser);
    if (joined) {
      // 1. Fetch cloud profile to preserve the store owner and existing collaborators
      const cloudProfile = await FirebaseSyncService.fetchCantinProfile(joined.id);

      const userEmail = currentUser?.email?.toLowerCase() || '';
      const mergedMembers: Record<string, any> = {
        ...(cloudProfile?.members || {}),
        ...(joined.members || {}),
      };

      // 2. Joining users are strictly staff ('user') unless they are the owner
      if (userEmail) {
        const isOwner =
          (cloudProfile?.ownerEmail && cloudProfile.ownerEmail.toLowerCase() === userEmail) ||
          (cloudProfile?.creatorId &&
            (cloudProfile.creatorId === currentUser?.id || cloudProfile.creatorId === currentUser?.firebaseUid));

        const existingRole = cloudProfile?.members?.[userEmail]?.role;

        mergedMembers[userEmail] = {
          userId: currentUser?.id || currentUser?.firebaseUid || `user_${Date.now()}`,
          name: currentUser?.name || 'Staff Member',
          email: userEmail,
          role: isOwner ? 'admin' : (existingRole || 'user'),
          joinedAt: new Date().toISOString(),
        };
      }

      const mergedProfile: CantinProfile = {
        ...joined,
        name: cloudProfile?.name || joined.name,
        ownerName: cloudProfile?.ownerName || joined.ownerName,
        ownerEmail: cloudProfile?.ownerEmail || joined.ownerEmail,
        creatorId: cloudProfile?.creatorId || joined.creatorId,
        role: mergedMembers[userEmail]?.role || 'user',
        members: mergedMembers,
      };

      // 3. Save locally and PUSH to Firestore so owner immediately sees this staff member!
      await StorageService.updateCantin(joined.id, mergedProfile);
      await FirebaseSyncService.pushCantinProfile(mergedProfile);

      const updatedList = await StorageService.getCantins();
      setAllCantins(updatedList);
      setActiveCantin(mergedProfile);
      await loadStoreData(joined.id);
      return mergedProfile;
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

  // Distinct Store Coupons Inventory
  const storeCouponsValue = storeCoupons.reduce((sum, c) => sum + (c.inStockQuantity * c.unitValue), 0);
  const storeCouponsCount = storeCoupons.reduce((sum, c) => sum + c.inStockQuantity, 0);
  const transferredCouponsValue = storeCoupons.reduce((sum, c) => sum + (c.transferredQuantity * c.unitValue), 0);

  // Grand Combined Total (Goods + Coupons combined as requested)
  const totalCombinedStoreValue = netAvailableValue + storeCouponsValue;

  const stats: MainStoreStats = {
    grossInventoryValue,
    totalTransferredValue,
    netAvailableValue,
    totalCardboardCount,
    totalPiecesCount,
    storeCouponsValue,
    storeCouponsCount,
    transferredCouponsValue,
    totalCombinedStoreValue,
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

  // 3b. Add Store Coupon Item (Purchasing / Stocking coupons in Main Store)
  const addStoreCoupon = async (
    name: string,
    quantity: number,
    unitValue: number,
    note?: string
  ): Promise<void> => {
    const qty = Math.max(1, Math.floor(quantity));
    const val = Math.max(0.1, unitValue);
    const now = new Date().toISOString();
    const newCoupon: StoreCouponItem = {
      id: `scpn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      unitValue: val,
      totalQuantity: qty,
      inStockQuantity: qty,
      transferredQuantity: 0,
      totalValue: qty * val,
      inStockValue: qty * val,
      note: note?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newCoupon, ...storeCoupons];
    setStoreCoupons(updated);
    await Promise.all([
      StorageService.saveStoreCoupons(activeCantin.id, updated),
      FirebaseSyncService.pushStoreCoupons(activeCantin.id, updated),
    ]);
  };

  // 3c. Delete Store Coupon Item
  const deleteStoreCoupon = async (couponId: string): Promise<void> => {
    const updated = storeCoupons.filter((c) => c.id !== couponId);
    setStoreCoupons(updated);
    await Promise.all([
      StorageService.saveStoreCoupons(activeCantin.id, updated),
      FirebaseSyncService.pushStoreCoupons(activeCantin.id, updated),
    ]);
  };

  // 3d. Transfer Store Coupons to Sub-Market
  const transferStoreCouponsToMarket = async (
    storeCouponId: string,
    subMarketId: string,
    quantity: number,
    note?: string
  ): Promise<boolean> => {
    const couponIndex = storeCoupons.findIndex((c) => c.id === storeCouponId);
    if (couponIndex === -1) return false;
    const coupon = storeCoupons[couponIndex];

    const qtyToTransfer = Math.min(Math.max(1, Math.floor(quantity)), coupon.inStockQuantity);
    if (qtyToTransfer <= 0) return false;

    const marketIndex = subMarkets.findIndex((m) => m.id === subMarketId);
    if (marketIndex === -1) return false;
    const market = subMarkets[marketIndex];

    const transferValue = qtyToTransfer * coupon.unitValue;

    // 1. Update store coupon stock
    const newInStock = coupon.inStockQuantity - qtyToTransfer;
    const newTransferred = coupon.transferredQuantity + qtyToTransfer;
    const updatedCoupon: StoreCouponItem = {
      ...coupon,
      inStockQuantity: newInStock,
      transferredQuantity: newTransferred,
      inStockValue: newInStock * coupon.unitValue,
      updatedAt: new Date().toISOString(),
    };

    const updatedStoreCoupons = [...storeCoupons];
    updatedStoreCoupons[couponIndex] = updatedCoupon;
    setStoreCoupons(updatedStoreCoupons);

    // 2. Add as market coupon to the target sub-market
    const newMarketCoupon: MarketCoupon = {
      id: `cpn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: coupon.name,
      code: coupon.name,
      unitValue: coupon.unitValue,
      totalQuantity: qtyToTransfer,
      redeemedQuantity: 0,
      value: transferValue,
      isRedeemed: false,
      note: note?.trim() || `Transferred from Store Stock`,
      createdAt: new Date().toISOString(),
    };

    const updatedMarketCoupons = [...(market.coupons || []), newMarketCoupon];
    const updatedMarkets = [...subMarkets];
    updatedMarkets[marketIndex] = {
      ...market,
      hasCoupons: true,
      coupons: updatedMarketCoupons,
      updatedAt: new Date().toISOString(),
    };
    setSubMarkets(updatedMarkets);

    // 3. Record transaction
    const dt = formatDateTime(new Date());
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      subMarketId: market.id,
      subMarketName: market.name,
      type: 'TRANSFER_COUPONS',
      amount: transferValue,
      couponCode: coupon.name,
      couponUnitValue: coupon.unitValue,
      couponQuantity: qtyToTransfer,
      previousBalance: market.currentDebt,
      newBalance: market.currentDebt,
      timestamp: dt.iso,
      formattedDate: dt.date,
      formattedTime: dt.time,
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      userRole: currentUser?.role || 'admin',
      note: `Transferred ${qtyToTransfer}x "${coupon.name}" coupons (${transferValue} EGP) from store to ${market.name}`,
    };
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);

    // 4. Save locally and to Firebase
    await Promise.all([
      StorageService.saveStoreCoupons(activeCantin.id, updatedStoreCoupons),
      StorageService.saveSubMarkets(activeCantin.id, updatedMarkets),
      StorageService.saveTransactions(activeCantin.id, updatedTxs),
      FirebaseSyncService.pushStoreCoupons(activeCantin.id, updatedStoreCoupons),
      FirebaseSyncService.pushSubMarkets(activeCantin.id, updatedMarkets),
      FirebaseSyncService.pushTransactions(activeCantin.id, updatedTxs),
    ]);

    return true;
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
    nameOrCode: string,
    quantityOrValue: number,
    valuePerPiece?: number,
    note?: string
  ) => {
    const qty = typeof valuePerPiece === 'number' ? Math.max(1, Math.floor(quantityOrValue)) : 1;
    const unitVal = typeof valuePerPiece === 'number' ? valuePerPiece : quantityOrValue;
    if (unitVal <= 0 || qty <= 0) return;

    const marketIndex = subMarkets.findIndex((m) => m.id === subMarketId);
    if (marketIndex === -1) return;

    const market = subMarkets[marketIndex];
    const newCoupon: MarketCoupon = {
      id: `cpn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: nameOrCode.trim() || `Coupon ${(market.coupons?.length || 0) + 1}`,
      code: nameOrCode.trim() || `CPN-${(market.coupons?.length || 0) + 1}`,
      unitValue: unitVal,
      totalQuantity: qty,
      redeemedQuantity: 0,
      value: unitVal * qty,
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

  // 6d. Partially or fully redeem specific quantity of coupons
  const redeemMarketCoupons = async (
    subMarketId: string,
    couponId: string,
    quantityToRedeem: number = 1
  ): Promise<boolean> => {
    if (quantityToRedeem <= 0) return false;

    const marketIndex = subMarkets.findIndex((m) => m.id === subMarketId);
    if (marketIndex === -1) return false;

    const market = subMarkets[marketIndex];
    const coupons = market.coupons || [];
    const couponIndex = coupons.findIndex((c) => c.id === couponId);
    if (couponIndex === -1) return false;

    const coupon = coupons[couponIndex];
    const totalQty = coupon.totalQuantity || 1;
    const currentRedeemed = coupon.redeemedQuantity || (coupon.isRedeemed ? totalQty : 0);
    const availableToRedeem = Math.max(0, totalQty - currentRedeemed);

    const actualQtyToRedeem = Math.min(quantityToRedeem, availableToRedeem);
    if (actualQtyToRedeem <= 0) return false;

    const unitVal = coupon.unitValue || coupon.value;
    const deductionAmount = actualQtyToRedeem * unitVal;
    const newRedeemedQty = currentRedeemed + actualQtyToRedeem;
    const isNowFullyRedeemed = newRedeemedQty >= totalQty;

    const updatedCoupon: MarketCoupon = {
      ...coupon,
      name: coupon.name || coupon.code,
      unitValue: unitVal,
      totalQuantity: totalQty,
      redeemedQuantity: newRedeemedQty,
      isRedeemed: isNowFullyRedeemed,
      redeemedAt: new Date().toISOString(),
      redeemedBy: currentUser?.name || 'Staff',
    };

    const updatedCoupons = [...coupons];
    updatedCoupons[couponIndex] = updatedCoupon;

    const prevDebt = market.currentDebt;
    const newDebt = Math.max(0, prevDebt - deductionAmount);
    const newTotalCoupons = (market.totalCouponsRedeemed || 0) + deductionAmount;
    const newTotalGain = (market.totalGainPaid || 0) + deductionAmount;

    const dt = formatDateTime(new Date());
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      subMarketId: market.id,
      subMarketName: market.name,
      type: 'REDEEM_COUPON',
      amount: deductionAmount,
      couponCode: coupon.code || coupon.name,
      couponUnitValue: unitVal,
      couponQuantity: actualQtyToRedeem,
      previousBalance: prevDebt,
      newBalance: newDebt,
      timestamp: dt.iso,
      formattedDate: dt.date,
      formattedTime: dt.time,
      userId: currentUser?.id || 'staff',
      userName: currentUser?.name || 'Staff',
      userRole: currentUser?.role || 'user',
      note: `Redeemed ${actualQtyToRedeem}x "${coupon.name || coupon.code}" (-${deductionAmount} EGP from debt)`,
    };

    const updatedTxs = [newTx, ...transactions];
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

  // 6e. Undo partial or full coupon redemption
  const undoRedeemMarketCoupons = async (
    subMarketId: string,
    couponId: string,
    quantityToUndo: number = 1
  ): Promise<boolean> => {
    if (quantityToUndo <= 0) return false;

    const marketIndex = subMarkets.findIndex((m) => m.id === subMarketId);
    if (marketIndex === -1) return false;

    const market = subMarkets[marketIndex];
    const coupons = market.coupons || [];
    const couponIndex = coupons.findIndex((c) => c.id === couponId);
    if (couponIndex === -1) return false;

    const coupon = coupons[couponIndex];
    const totalQty = coupon.totalQuantity || 1;
    const currentRedeemed = coupon.redeemedQuantity || (coupon.isRedeemed ? totalQty : 0);

    const actualQtyToUndo = Math.min(quantityToUndo, currentRedeemed);
    if (actualQtyToUndo <= 0) return false;

    const unitVal = coupon.unitValue || coupon.value;
    const restoreAmount = actualQtyToUndo * unitVal;
    const newRedeemedQty = currentRedeemed - actualQtyToUndo;
    const isNowFullyRedeemed = newRedeemedQty >= totalQty;

    const updatedCoupon: MarketCoupon = {
      ...coupon,
      name: coupon.name || coupon.code,
      unitValue: unitVal,
      totalQuantity: totalQty,
      redeemedQuantity: newRedeemedQty,
      isRedeemed: isNowFullyRedeemed,
      redeemedAt: newRedeemedQty > 0 ? coupon.redeemedAt : undefined,
      redeemedBy: newRedeemedQty > 0 ? coupon.redeemedBy : undefined,
    };

    const updatedCoupons = [...coupons];
    updatedCoupons[couponIndex] = updatedCoupon;

    const prevDebt = market.currentDebt;
    const newDebt = prevDebt + restoreAmount;
    const newTotalCoupons = Math.max(0, (market.totalCouponsRedeemed || 0) - restoreAmount);
    const newTotalGain = Math.max(0, (market.totalGainPaid || 0) - restoreAmount);

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

    await Promise.all([
      StorageService.saveSubMarkets(activeCantin.id, updatedMarkets),
      FirebaseSyncService.pushSubMarkets(activeCantin.id, updatedMarkets),
    ]);

    return true;
  };

  // 6f. Check / Uncheck coupon as redeemed (1-tap toggle for all remaining or full undo)
  const toggleCouponRedemption = async (
    subMarketId: string,
    couponId: string
  ): Promise<boolean> => {
    const market = subMarkets.find((m) => m.id === subMarketId);
    if (!market) return false;
    const coupon = (market.coupons || []).find((c) => c.id === couponId);
    if (!coupon) return false;

    const totalQty = coupon.totalQuantity || 1;
    const currentRedeemed = coupon.redeemedQuantity || (coupon.isRedeemed ? totalQty : 0);
    const remaining = totalQty - currentRedeemed;

    if (remaining > 0) {
      return await redeemMarketCoupons(subMarketId, couponId, remaining);
    } else {
      return await undoRedeemMarketCoupons(subMarketId, couponId, currentRedeemed);
    }
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

  // 4c. Delete Sub-Market
  const deleteSubMarket = async (subMarketId: string): Promise<boolean> => {
    const updated = subMarkets.filter((m) => m.id !== subMarketId);
    setSubMarkets(updated);
    await Promise.all([
      StorageService.saveSubMarkets(activeCantin.id, updated),
      FirebaseSyncService.pushSubMarkets(activeCantin.id, updated),
    ]);
    return true;
  };

  // 7. Delete Cantin
  const deleteCantin = async (cantinId: string): Promise<boolean> => {
    if (allCantins.length <= 1) {
      return false;
    }
    // Delete in cloud and local storage
    await FirebaseSyncService.deleteCantin(cantinId);
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

  // 7b. Update Member Role inside active Cantin
  const updateMemberRole = async (memberEmail: string, newRole: 'admin' | 'user'): Promise<void> => {
    const cleanEmail = memberEmail.toLowerCase();
    const currentMembers = activeCantin.members || {};
    const member = currentMembers[cleanEmail];
    if (!member) return;

    const updatedMembers = {
      ...currentMembers,
      [cleanEmail]: {
        ...member,
        role: newRole,
      },
    };

    const updatedProfile: CantinProfile = {
      ...activeCantin,
      members: updatedMembers,
    };

    setActiveCantin(updatedProfile);
    await StorageService.updateCantin(activeCantin.id, { members: updatedMembers });
    await FirebaseSyncService.pushCantinProfile(updatedProfile);
    const updatedList = await StorageService.getCantins();
    setAllCantins(updatedList);
  };

  // Determine if current user is admin of active Cantin
  const isCantinAdmin = (): boolean => {
    if (!currentUser) return false;
    const userEmail = currentUser.email?.toLowerCase();
    if (!userEmail) return false;

    // 1. Is owner / creator of this cantin
    if (activeCantin.ownerEmail && activeCantin.ownerEmail.toLowerCase() === userEmail) {
      return true;
    }
    if (
      activeCantin.creatorId &&
      (activeCantin.creatorId === currentUser.id || activeCantin.creatorId === currentUser.firebaseUid)
    ) {
      return true;
    }

    // 2. Is in members list with explicit admin role
    if (activeCantin.members && activeCantin.members[userEmail]) {
      return activeCantin.members[userEmail].role === 'admin';
    }

    // 3. Joining users are strictly staff by default unless promoted by owner
    return false;
  };

  const isCantinOwner = (cantin?: CantinProfile): boolean => {
    const target = cantin || activeCantin;
    if (!currentUser) return false;
    const userEmail = currentUser.email?.toLowerCase();
    if (target.ownerEmail && userEmail && target.ownerEmail.toLowerCase() === userEmail) {
      return true;
    }
    if (target.creatorId && (target.creatorId === currentUser.id || target.creatorId === currentUser.firebaseUid)) {
      return true;
    }
    return false;
  };

  // 8. Rename Cantin
  const renameCantin = async (cantinId: string, newName: string): Promise<void> => {
    await StorageService.updateCantin(cantinId, { name: newName.trim() });
    const updated = await StorageService.getCantins();
    setAllCantins(updated);
    const target = updated.find((c) => c.id === cantinId);
    if (target) {
      await FirebaseSyncService.pushCantinProfile(target);
    }
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
    setStoreCoupons([]);
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
        storeCoupons,
        subMarkets,
        transactions,
        stats,
        isLoading,
        isCloudSynced: FirebaseSyncService.isAvailable(),
        isAdmin: isCantinAdmin(),
        isOwner: isCantinOwner,
        switchCantin,
        createCantin,
        joinCantinByCode,
        deleteCantin,
        renameCantin,
        updateMemberRole,
        clearAllAppData,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addStoreCoupon,
        deleteStoreCoupon,
        transferStoreCouponsToMarket,
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
