export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  firebaseUid?: string;
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
  code: string;            // e.g. "CPN-01", "Kiosk Coupon #1"
  value: number;           // Face value of money (e.g. 50.00 EGP)
  isRedeemed: boolean;     // Whether it has been checked/redeemed
  redeemedAt?: string;     // ISO timestamp when redeemed
  redeemedBy?: string;     // User who checked/redeemed it
  note?: string;           // Optional note
  createdAt: string;
}

export interface SubMarket {
  id: string;
  name: string;
  location?: string;
  phone?: string;
  hasCoupons?: boolean;        // Whether coupons are enabled for this sub-market
  coupons?: MarketCoupon[];    // List of coupons assigned to this sub-market
  currentDebt: number;        // Money on him (المبلغ المستحق عليه)
  totalGoodsTaken: number;    // Cumulative goods value received
  totalGainPaid: number;      // Cumulative payments / gain paid back
  totalCouponsRedeemed?: number; // Cumulative coupons value redeemed
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'TRANSFER_GOODS' | 'RECORD_GAIN' | 'REDEEM_COUPON';

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
  grossInventoryValue: number;    // Total cost of all cardboard boxes in the store
  totalTransferredValue: number;  // Value transferred to sub markets
  netAvailableValue: number;      // Store value after sub market transfers
  totalCardboardCount: number;    // Total cardboard cartons in stock
  totalPiecesCount: number;       // Total pieces across all items
}
