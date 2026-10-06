export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  firebaseUid?: string;
  password?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  // Packaging hierarchy:
  cardboardBoxes: number;   // Number of outer cardboard boxes (الكراتين)
  innerBoxes: number;        // Number of boxes inside each cardboard box (العلب بالكرتونة)
  piecesPerBox: number;      // Number of pieces inside each box (القطع بالعلبة)
  pricePerPiece: number;     // Price per single piece (سعر القطعة)
  // Computed values:
  piecesPerCardboard: number; // innerBoxes * piecesPerBox
  costPerCardboard: number;   // piecesPerCardboard * pricePerPiece
  totalPieces: number;        // cardboardBoxes * piecesPerCardboard
  totalCost: number;          // cardboardBoxes * costPerCardboard
  createdAt: string;
  updatedAt: string;
}

export interface MarketCoupon {
  id: string;
  name: string;             // Coupon Name / Title (اسم الكوبون)
  code: string;             // Reference / Code (كود / رمز الكوبون)
  unitValue: number;        // Face value of money per single coupon (قيمة الكوبون الواحد)
  totalQuantity: number;    // Total number of coupons issued (إجمالي عدد الكوبونات)
  redeemedQuantity: number; // Number of coupons redeemed (عدد الكوبونات المصروفة)
  value: number;            // Total money value (unitValue * totalQuantity)
  isRedeemed: boolean;      // Whether all coupons have been redeemed
  redeemedAt?: string;      // Last redeemed timestamp
  redeemedBy?: string;      // Last redeemed by user
  note?: string;            // Optional note
  createdAt: string;
}

export interface SubMarket {
  id: string;
  name: string;
  location?: string;
  phone?: string;
  hasCoupons?: boolean;        // Whether coupons are enabled for this sub-market
  coupons?: MarketCoupon[];    // List of coupons assigned/transferred to this sub-market
  currentDebt: number;        // Money on him for goods (المبلغ المستحق عليه للبضاعة)
  totalGoodsTaken: number;    // Cumulative goods value received (إجمالي البضاعة المستلمة)
  totalGainPaid: number;      // Cumulative payments / gain paid back (إجمالي توريد البضاعة)
  totalCouponsTaken?: number; // Cumulative coupons value received from store (إجمالي الكوبونات المستلمة)
  totalCouponsGained?: number;// Cumulative coupons value returned / gained (إجمالي الكوبونات الموردة)
  totalCouponsRedeemed?: number; // Cumulative coupons value redeemed (backward compatibility)
  currentCouponsBalance?: number; // Active coupons balance with the market (متبقي رصيد الكوبونات)
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'TRANSFER_GOODS' | 'RECORD_GAIN' | 'REDEEM_COUPON' | 'TRANSFER_COUPONS' | 'RECORD_COUPON_GAIN';

export interface StoreCouponItem {
  id: string;
  name: string;             // Coupon name (اسم الكوبون)
  unitValue: number;        // Face value per coupon (قيمة الكوبون)
  totalQuantity: number;    // Total entered into store (إجمالي العدد المدخل بالمخزن)
  inStockQuantity: number;  // Currently available in store (المتبقي المتاح بالمخزن)
  transferredQuantity: number; // Distributed to sub-markets (المحول للمنافذ)
  totalValue: number;       // totalQuantity * unitValue
  inStockValue: number;     // inStockQuantity * unitValue
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  subMarketId: string;
  subMarketName: string;
  type: TransactionType;
  amount: number;             // Total transaction money amount
  couponCode?: string;        // Optional coupon code/reference
  couponUnitValue?: number;   // Value per coupon
  couponQuantity?: number;    // Number of coupons redeemed
  previousBalance: number;
  newBalance: number;
  timestamp: string;          // ISO string
  formattedDate: string;       // e.g. "04 Oct 2026"
  formattedTime: string;       // e.g. "02:45 PM"
  userId: string;
  userName: string;
  userRole: UserRole;
  note?: string;
}

export interface CantinMember {
  userId: string;
  name: string;
  email: string;
  role: UserRole;             // 'admin' | 'user' in this cantin
  joinedAt: string;
}

export interface CantinProfile {
  id: string;
  name: string;
  code: string;               // e.g. "ELC-101" or "CANTIN-7788"
  isShared: boolean;          // true = team shared, false = private personal
  role: UserRole;             // admin or user in this Cantin
  ownerName: string;
  ownerEmail?: string;        // Email of the creator/admin
  creatorId?: string;         // Unique user ID or firebase UID of creator
  members?: Record<string, CantinMember>; // Map of member email -> CantinMember
  createdAt: string;
  updatedAt?: string;
}

export interface MainStoreStats {
  grossInventoryValue: number;    // Goods only: Total cost of all cardboard boxes in the store
  totalTransferredValue: number;  // Goods transferred to sub markets
  netAvailableValue: number;      // Store goods value available
  totalCardboardCount: number;    // Total cardboard cartons in stock
  totalPiecesCount: number;       // Total pieces across all items
  // Separate Coupon Assets
  storeCouponsValue: number;      // Available coupons in Main Store
  storeCouponsCount: number;      // Total count of available coupons in Main Store
  transferredCouponsValue: number;// Coupons transferred to sub markets
  // Grand Combined Total (Goods + Coupons combined without mixing balances)
  totalCombinedStoreValue: number; // netAvailableValue + storeCouponsValue
}
