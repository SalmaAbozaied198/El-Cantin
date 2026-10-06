import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { getFirebaseInstance, isFirebaseConfigured } from '../config/firebase';
import { InventoryItem, SubMarket, Transaction, CantinProfile, StoreCouponItem } from '../types';

export const FirebaseSyncService = {
  isAvailable(): boolean {
    return isFirebaseConfigured();
  },

  // 0. CANTIN PROFILE SYNC
  async pushCantinProfile(cantin: CantinProfile): Promise<void> {
    if (!this.isAvailable()) return;
    const { db } = getFirebaseInstance();
    if (!db) return;

    try {
      const docRef = doc(db, 'cantins', cantin.id);
      await setDoc(docRef, { ...cantin, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firebase push cantin profile error:', e);
    }
  },

  async fetchCantinProfile(cantinId: string): Promise<CantinProfile | null> {
    if (!this.isAvailable()) return null;
    const { db } = getFirebaseInstance();
    if (!db) return null;

    try {
      const docRef = doc(db, 'cantins', cantinId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as CantinProfile;
      }
      return null;
    } catch (e) {
      console.warn('Firebase fetch cantin profile error:', e);
      return null;
    }
  },

  subscribeCantinProfile(
    cantinId: string,
    onData: (cantin: CantinProfile) => void
  ): (() => void) | null {
    if (!this.isAvailable()) return null;
    const { db } = getFirebaseInstance();
    if (!db) return null;

    try {
      const docRef = doc(db, 'cantins', cantinId);
      return onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            onData(snapshot.data() as CantinProfile);
          }
        },
        (error) => {
          console.warn('Firestore cantin profile listener error:', error);
        }
      );
    } catch (e) {
      console.warn('Firebase cantin profile listener error:', e);
      return null;
    }
  },

  async deleteCantin(cantinId: string): Promise<void> {
    if (!this.isAvailable()) return;
    const { db } = getFirebaseInstance();
    if (!db) return;

    try {
      await Promise.all([
        deleteDoc(doc(db, 'cantins', cantinId, 'data', 'inventory')),
        deleteDoc(doc(db, 'cantins', cantinId, 'data', 'store_coupons')),
        deleteDoc(doc(db, 'cantins', cantinId, 'data', 'sub_markets')),
        deleteDoc(doc(db, 'cantins', cantinId, 'data', 'transactions')),
        deleteDoc(doc(db, 'cantins', cantinId, 'data', 'transferred')),
        deleteDoc(doc(db, 'cantins', cantinId)),
      ]);
    } catch (e) {
      console.warn('Firebase delete cantin error:', e);
    }
  },

  // 1. INVENTORY SYNC
  subscribeInventory(
    cantinId: string,
    initialItems: InventoryItem[],
    onData: (items: InventoryItem[]) => void
  ): (() => void) | null {
    if (!this.isAvailable()) return null;
    const { db } = getFirebaseInstance();
    if (!db) return null;

    try {
      const docRef = doc(db, 'cantins', cantinId, 'data', 'inventory');
      return onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data && Array.isArray(data.items)) {
              onData(data.items);
            }
          } else if (initialItems.length > 0) {
            // First device creates the collection in cloud
            this.pushInventory(cantinId, initialItems);
          }
        },
        (error) => {
          console.warn('Firestore inventory listener error (check security rules):', error);
        }
      );
    } catch (e) {
      console.warn('Firebase inventory listener error:', e);
      return null;
    }
  },

  async pushInventory(cantinId: string, items: InventoryItem[]): Promise<void> {
    if (!this.isAvailable()) return;
    const { db } = getFirebaseInstance();
    if (!db) return;

    try {
      const docRef = doc(db, 'cantins', cantinId, 'data', 'inventory');
      await setDoc(docRef, { items, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('Firebase push inventory error:', e);
    }
  },

  // 2. SUB-MARKETS SYNC
  subscribeSubMarkets(
    cantinId: string,
    onData: (markets: SubMarket[]) => void
  ): (() => void) | null {
    if (!this.isAvailable()) return null;
    const { db } = getFirebaseInstance();
    if (!db) return null;

    try {
      const docRef = doc(db, 'cantins', cantinId, 'data', 'sub_markets');
      return onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data && Array.isArray(data.markets)) {
              onData(data.markets);
            }
          }
        },
        (error) => {
          console.warn('Firestore sub_markets listener error (check security rules):', error);
        }
      );
    } catch (e) {
      console.warn('Firebase subMarkets listener error:', e);
      return null;
    }
  },

  async pushSubMarkets(cantinId: string, markets: SubMarket[]): Promise<void> {
    if (!this.isAvailable()) return;
    const { db } = getFirebaseInstance();
    if (!db) return;

    try {
      const docRef = doc(db, 'cantins', cantinId, 'data', 'sub_markets');
      await setDoc(docRef, { markets, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('Firebase push subMarkets error:', e);
    }
  },

  // 3. TRANSACTIONS SYNC
  subscribeTransactions(
    cantinId: string,
    onData: (txs: Transaction[]) => void
  ): (() => void) | null {
    if (!this.isAvailable()) return null;
    const { db } = getFirebaseInstance();
    if (!db) return null;

    try {
      const docRef = doc(db, 'cantins', cantinId, 'data', 'transactions');
      return onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data && Array.isArray(data.transactions)) {
              onData(data.transactions);
            }
          }
        },
        (error) => {
          console.warn('Firestore transactions listener error (check security rules):', error);
        }
      );
    } catch (e) {
      console.warn('Firebase transactions listener error:', e);
      return null;
    }
  },

  async pushTransactions(cantinId: string, transactions: Transaction[]): Promise<void> {
    if (!this.isAvailable()) return;
    const { db } = getFirebaseInstance();
    if (!db) return;

    try {
      const docRef = doc(db, 'cantins', cantinId, 'data', 'transactions');
      await setDoc(docRef, { transactions, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('Firebase push transactions error:', e);
    }
  },

  // 4. TRANSFERRED VALUE SYNC
  subscribeTransferredValue(
    cantinId: string,
    onData: (amount: number) => void
  ): (() => void) | null {
    if (!this.isAvailable()) return null;
    const { db } = getFirebaseInstance();
    if (!db) return null;

    try {
      const docRef = doc(db, 'cantins', cantinId, 'data', 'transferred');
      return onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data && typeof data.amount === 'number') {
              onData(data.amount);
            }
          }
        },
        (error) => {
          console.warn('Firestore transferred listener error:', error);
        }
      );
    } catch (e) {
      console.warn('Firebase transferred listener error:', e);
      return null;
    }
  },

  async pushTransferredValue(cantinId: string, amount: number): Promise<void> {
    if (!this.isAvailable()) return;
    const { db } = getFirebaseInstance();
    if (!db) return;

    try {
      const docRef = doc(db, 'cantins', cantinId, 'data', 'transferred');
      await setDoc(docRef, { amount, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('Firebase push transferred error:', e);
    }
  },

  // 5. STORE COUPONS SYNC (Option 2)
  subscribeStoreCoupons(
    cantinId: string,
    onData: (coupons: StoreCouponItem[]) => void
  ): (() => void) | null {
    if (!this.isAvailable()) return null;
    const { db } = getFirebaseInstance();
    if (!db) return null;

    try {
      const docRef = doc(db, 'cantins', cantinId, 'data', 'store_coupons');
      return onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data && Array.isArray(data.coupons)) {
              onData(data.coupons);
            }
          }
        },
        (error) => {
          console.warn('Firestore store_coupons listener error:', error);
        }
      );
    } catch (e) {
      console.warn('Firebase store_coupons listener error:', e);
      return null;
    }
  },

  async pushStoreCoupons(cantinId: string, coupons: StoreCouponItem[]): Promise<void> {
    if (!this.isAvailable()) return;
    const { db } = getFirebaseInstance();
    if (!db) return;

    try {
      const docRef = doc(db, 'cantins', cantinId, 'data', 'store_coupons');
      await setDoc(docRef, { coupons, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('Firebase push store coupons error:', e);
    }
  },
};
