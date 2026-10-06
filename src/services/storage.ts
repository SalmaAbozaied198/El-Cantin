import AsyncStorage from '@react-native-async-storage/async-storage';
import { InventoryItem, SubMarket, Transaction, User, CantinProfile } from '../types';

const STORAGE_KEYS = {
  USERS: '@el_cantin_users',
  CURRENT_USER: '@el_cantin_current_user',
  CANTINS: '@el_cantin_profiles',
  ACTIVE_CANTIN_ID: '@el_cantin_active_id',
  INVENTORY_PREFIX: '@el_cantin_inv_',
  SUB_MARKETS_PREFIX: '@el_cantin_subs_',
  TRANSACTIONS_PREFIX: '@el_cantin_txs_',
  TOTAL_TRANSFERRED_PREFIX: '@el_cantin_transferred_',
};

// Default initial Cantin profile
export const DEFAULT_CANTIN: CantinProfile = {
  id: 'cantin_main_store',
  name: "Salma's Main Cantin",
  code: 'ELC-101',
  isShared: true,
  role: 'admin',
  ownerName: 'Salma (Admin)',
  createdAt: new Date().toISOString(),
};

// Seed initial users
export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin_1',
    name: 'Salma (Admin)',
    email: 'admin@elcantin.com',
    role: 'admin',
    phone: '+20 100 123 4567',
  },
  {
    id: 'user_staff_1',
    name: 'Ahmed (Staff)',
    email: 'ahmed@elcantin.com',
    role: 'user',
    phone: '+20 111 234 5678',
  },
  {
    id: 'user_staff_2',
    name: 'Omar (Market Rep)',
    email: 'omar@elcantin.com',
    role: 'user',
    phone: '+20 122 345 6789',
  },
];

// Seed initial inventory items
export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv_1',
    name: 'Indomie Chicken Flavored',
    category: 'Snacks & Noodles',
    cardboardBoxes: 15,
    innerBoxes: 4,
    piecesPerBox: 10,
    pricePerPiece: 10.0,
    piecesPerCardboard: 40,
    costPerCardboard: 400.0,
    totalPieces: 600,
    totalCost: 6000.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_2',
    name: 'Molto Croissant Chocolate',
    category: 'Bakery',
    cardboardBoxes: 20,
    innerBoxes: 6,
    piecesPerBox: 12,
    pricePerPiece: 12.5,
    piecesPerCardboard: 72,
    costPerCardboard: 900.0,
    totalPieces: 1440,
    totalCost: 18000.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_3',
    name: 'Pepsi Can 330ml',
    category: 'Beverages',
    cardboardBoxes: 25,
    innerBoxes: 4,
    piecesPerBox: 6,
    pricePerPiece: 15.0,
    piecesPerCardboard: 24,
    costPerCardboard: 360.0,
    totalPieces: 600,
    totalCost: 9000.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_4',
    name: 'Chipsy Salt & Vinegar',
    category: 'Snacks',
    cardboardBoxes: 10,
    innerBoxes: 2,
    piecesPerBox: 24,
    pricePerPiece: 8.0,
    piecesPerCardboard: 48,
    costPerCardboard: 384.0,
    totalPieces: 480,
    totalCost: 3840.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SUB_MARKETS: SubMarket[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];

// Helper to format date and time cleanly
export const formatDateTime = (date: Date = new Date()) => {
  const optionsDate: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  const optionsTime: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return {
    date: date.toLocaleDateString('en-US', optionsDate),
    time: date.toLocaleTimeString('en-US', optionsTime),
    iso: date.toISOString(),
  };
};

export const StorageService = {
  // ----------------------------------------------------
  // ----------------------------------------------------
  // CANTINS / MULTI-TENANT WORKSPACES
  // ----------------------------------------------------
  async getCantins(): Promise<CantinProfile[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CANTINS);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveCantins(cantins: CantinProfile[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CANTINS, JSON.stringify(cantins));
  },

  async getActiveCantin(): Promise<CantinProfile | null> {
    try {
      const [cantins, activeId] = await Promise.all([
        this.getCantins(),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_CANTIN_ID),
      ]);
      if (cantins.length === 0) return null;
      const found = cantins.find((c) => c.id === activeId);
      if (found) return found;
      return cantins[0] || null;
    } catch {
      return null;
    }
  },

  async setActiveCantinId(id: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_CANTIN_ID, id);
  },

  async createCantin(name: string, isShared: boolean, currentUser?: User | null): Promise<CantinProfile> {
    const cantins = await this.getCantins();
    const code = `ELC-${Math.floor(100 + Math.random() * 900)}`;
    const newCantin: CantinProfile = {
      id: `cantin_${Date.now()}`,
      name: name.trim(),
      code,
      isShared,
      role: 'admin',
      ownerName: currentUser?.name || 'Admin',
      createdAt: new Date().toISOString(),
    };

    const updated = [...cantins, newCantin];
    await this.saveCantins(updated);
    await this.setActiveCantinId(newCantin.id);
    // Initialize clean empty records for this new cantin
    await this.saveInventory(newCantin.id, []);
    await this.saveSubMarkets(newCantin.id, []);
    await this.saveTransactions(newCantin.id, []);
    await this.saveTotalTransferred(newCantin.id, 0);
    return newCantin;
  },

  async deleteCantin(cantinId: string): Promise<void> {
    const cantins = await this.getCantins();
    const updated = cantins.filter((c) => c.id !== cantinId);
    await this.saveCantins(updated);
    await Promise.all([
      AsyncStorage.removeItem(`${STORAGE_KEYS.INVENTORY_PREFIX}${cantinId}`),
      AsyncStorage.removeItem(`${STORAGE_KEYS.SUB_MARKETS_PREFIX}${cantinId}`),
      AsyncStorage.removeItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${cantinId}`),
      AsyncStorage.removeItem(`${STORAGE_KEYS.TOTAL_TRANSFERRED_PREFIX}${cantinId}`),
    ]);
  },

  async updateCantin(cantinId: string, updates: Partial<CantinProfile>): Promise<void> {
    const cantins = await this.getCantins();
    const updated = cantins.map((c) => (c.id === cantinId ? { ...c, ...updates } : c));
    await this.saveCantins(updated);
  },

  async joinCantinByCode(code: string, currentUser?: User | null): Promise<CantinProfile | null> {
    const cleanCode = code.trim().toUpperCase();
    const cantins = await this.getCantins();

    // Check if already in user's saved cantins
    const existing = cantins.find((c) => c.code.toUpperCase() === cleanCode);
    if (existing) {
      await this.setActiveCantinId(existing.id);
      return existing;
    }

    // Connect to shared cantin
    const joinedCantin: CantinProfile = {
      id: `cantin_shared_${cleanCode.replace(/[^A-Z0-9]/g, '')}`,
      name: `Team Cantin (${cleanCode})`,
      code: cleanCode,
      isShared: true,
      role: 'user', // regular staff by default when joining via code
      ownerName: currentUser?.name || 'Team Manager',
      createdAt: new Date().toISOString(),
    };

    const updated = [...cantins, joinedCantin];
    await this.saveCantins(updated);
    await this.setActiveCantinId(joinedCantin.id);
    return joinedCantin;
  },

  // ----------------------------------------------------
  // USERS
  // ----------------------------------------------------
  async getStoredUsers(): Promise<User[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveUsers(users: User[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  async deleteUser(userId: string): Promise<void> {
    const users = await this.getStoredUsers();
    const updated = users.filter((u) => u.id !== userId);
    await this.saveUsers(updated);
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
      return null;
    } catch {
      return null;
    }
  },

  async setCurrentUser(user: User | null): Promise<void> {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // Clear all storage for complete reset
  async clearAllData(): Promise<void> {
    await AsyncStorage.clear();
  },

  // ----------------------------------------------------
  // STORE SCOPED INVENTORY
  // ----------------------------------------------------
  async getInventory(cantinId: string = 'default'): Promise<InventoryItem[]> {
    try {
      const key = `${STORAGE_KEYS.INVENTORY_PREFIX}${cantinId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveInventory(cantinId: string = 'default', items: InventoryItem[]): Promise<void> {
    const key = `${STORAGE_KEYS.INVENTORY_PREFIX}${cantinId}`;
    await AsyncStorage.setItem(key, JSON.stringify(items));
  },

  // ----------------------------------------------------
  // STORE SCOPED SUB-MARKETS
  // ----------------------------------------------------
  async getSubMarkets(cantinId: string = 'default'): Promise<SubMarket[]> {
    try {
      const key = `${STORAGE_KEYS.SUB_MARKETS_PREFIX}${cantinId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed: SubMarket[] = JSON.parse(data);
        const cleaned = parsed.filter((m) => !['sub_1', 'sub_2', 'sub_3'].includes(m.id));
        if (cleaned.length !== parsed.length) {
          await AsyncStorage.setItem(key, JSON.stringify(cleaned));
        }
        return cleaned;
      }
      await AsyncStorage.setItem(key, JSON.stringify([]));
      return [];
    } catch {
      return [];
    }
  },

  async saveSubMarkets(cantinId: string = 'default', markets: SubMarket[]): Promise<void> {
    const key = `${STORAGE_KEYS.SUB_MARKETS_PREFIX}${cantinId}`;
    await AsyncStorage.setItem(key, JSON.stringify(markets));
  },

  // ----------------------------------------------------
  // STORE SCOPED TRANSACTIONS
  // ----------------------------------------------------
  async getTransactions(cantinId: string = 'default'): Promise<Transaction[]> {
    try {
      const key = `${STORAGE_KEYS.TRANSACTIONS_PREFIX}${cantinId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed: Transaction[] = JSON.parse(data);
        const cleaned = parsed.filter((tx) => !['tx_1', 'tx_2', 'tx_3', 'tx_4'].includes(tx.id));
        if (cleaned.length !== parsed.length) {
          await AsyncStorage.setItem(key, JSON.stringify(cleaned));
        }
        return cleaned;
      }
      await AsyncStorage.setItem(key, JSON.stringify([]));
      return [];
    } catch {
      return [];
    }
  },

  async saveTransactions(cantinId: string = 'default', txs: Transaction[]): Promise<void> {
    const key = `${STORAGE_KEYS.TRANSACTIONS_PREFIX}${cantinId}`;
    await AsyncStorage.setItem(key, JSON.stringify(txs));
  },

  // ----------------------------------------------------
  // TOTAL TRANSFERRED PER CANTIN
  // ----------------------------------------------------
  async getTotalTransferred(cantinId: string = 'default'): Promise<number> {
    try {
      const key = `${STORAGE_KEYS.TOTAL_TRANSFERRED_PREFIX}${cantinId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) return parseFloat(data);
      return 0.0;
    } catch {
      return 0.0;
    }
  },

  async saveTotalTransferred(cantinId: string = 'default', amount: number): Promise<void> {
    const key = `${STORAGE_KEYS.TOTAL_TRANSFERRED_PREFIX}${cantinId}`;
    await AsyncStorage.setItem(key, amount.toString());
  },

  // Reset demo
  async resetAllToDemo(cantinId: string = 'default'): Promise<void> {
    await Promise.all([
      this.saveInventory(cantinId, INITIAL_INVENTORY),
      this.saveSubMarkets(cantinId, []),
      this.saveTransactions(cantinId, []),
      this.saveTotalTransferred(cantinId, 0),
    ]);
  },
};
