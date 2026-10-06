import assert from 'node:assert';
import test from 'node:test';

// Logic under test: packaging hierarchy calculations
function calculateItemPackaging(cardboardBoxes, innerBoxes, piecesPerBox, pricePerPiece) {
  const piecesPerCardboard = innerBoxes * piecesPerBox;
  const costPerCardboard = piecesPerCardboard * pricePerPiece;
  const totalPieces = cardboardBoxes * piecesPerCardboard;
  const totalCost = cardboardBoxes * costPerCardboard;

  return {
    piecesPerCardboard,
    costPerCardboard,
    totalPieces,
    totalCost,
  };
}

// Logic under test: main store valuation aggregate
function calculateMainStoreValuation(items) {
  return items.reduce((sum, item) => sum + item.totalCost, 0);
}

// Logic under test: transfer money value from store to sub-market
function transferGoodsValue(currentStoreValue, marketCurrentDebt, transferAmount) {
  const newStoreValue = Math.max(0, currentStoreValue - transferAmount);
  const newMarketDebt = marketCurrentDebt + transferAmount;
  return { newStoreValue, newMarketDebt };
}

// Logic under test: record gain / repayment (subtract from money on him)
function recordMarketGain(marketCurrentDebt, gainAmount) {
  const newDebt = Math.max(0, marketCurrentDebt - gainAmount);
  return { newDebt };
}

test('Packaging hierarchy calculation - Indomie example', () => {
  // 15 cartons, 4 packs per carton, 10 pieces per pack, 10 EGP each
  const result = calculateItemPackaging(15, 4, 10, 10.0);
  assert.strictEqual(result.piecesPerCardboard, 40);
  assert.strictEqual(result.costPerCardboard, 400.0);
  assert.strictEqual(result.totalPieces, 600);
  assert.strictEqual(result.totalCost, 6000.0);
});

test('Packaging hierarchy calculation - Molto Croissant example', () => {
  // 20 cartons, 6 boxes per carton, 12 pieces per box, 12.5 EGP each
  const result = calculateItemPackaging(20, 6, 12, 12.5);
  assert.strictEqual(result.piecesPerCardboard, 72);
  assert.strictEqual(result.costPerCardboard, 900.0);
  assert.strictEqual(result.totalPieces, 1440);
  assert.strictEqual(result.totalCost, 18000.0);
});

test('Main Store valuation sum aggregate', () => {
  const items = [
    { totalCost: 6000.0 },
    { totalCost: 18000.0 },
    { totalCost: 9000.0 },
  ];
  const totalValuation = calculateMainStoreValuation(items);
  assert.strictEqual(totalValuation, 33000.0);
});

test('Goods transfer decreases Main Store value and increases Sub-Market debt', () => {
  const storeValue = 33000.0;
  const marketDebt = 2000.0;
  const transferAmount = 5000.0;

  const { newStoreValue, newMarketDebt } = transferGoodsValue(storeValue, marketDebt, transferAmount);
  assert.strictEqual(newStoreValue, 28000.0);
  assert.strictEqual(newMarketDebt, 7000.0);
});

test('Record gain subtracts from the money on sub-market', () => {
  const marketDebt = 7000.0;
  const gainAmount = 2500.0;

  const { newDebt } = recordMarketGain(marketDebt, gainAmount);
  assert.strictEqual(newDebt, 4500.0);
});

// Logic under test: Report Section 1 (market gains & daily total)
function calculateSection1Report(transactions) {
  const gainTxs = transactions.filter((tx) => tx.type === 'RECORD_GAIN');
  const totalDailyGain = gainTxs.reduce((sum, tx) => sum + tx.amount, 0);

  const marketMap = {};
  gainTxs.forEach((tx) => {
    if (!marketMap[tx.subMarketId]) {
      marketMap[tx.subMarketId] = { marketName: tx.subMarketName, totalGained: 0, count: 0 };
    }
    marketMap[tx.subMarketId].totalGained += tx.amount;
    marketMap[tx.subMarketId].count += 1;
  });

  return { totalDailyGain, marketBreakdown: Object.values(marketMap) };
}

// Logic under test: Report Section 2 (goods entered and total value)
function calculateSection2Report(items) {
  const totalGrossValue = items.reduce((sum, i) => sum + i.totalCost, 0);
  const totalCartons = items.reduce((sum, i) => sum + i.cardboardBoxes, 0);
  const totalPieces = items.reduce((sum, i) => sum + i.totalPieces, 0);
  return { totalGrossValue, totalCartons, totalPieces, totalVarieties: items.length };
}

test('Report Section 1: accurately computes total daily gain and per-market gains', () => {
  const testTxs = [
    { subMarketId: 'm1', subMarketName: 'Market Alpha', type: 'RECORD_GAIN', amount: 1500.0 },
    { subMarketId: 'm2', subMarketName: 'Market Beta', type: 'RECORD_GAIN', amount: 2000.0 },
    { subMarketId: 'm1', subMarketName: 'Market Alpha', type: 'RECORD_GAIN', amount: 500.0 },
    { subMarketId: 'm1', subMarketName: 'Market Alpha', type: 'TRANSFER_GOODS', amount: 4000.0 }, // Not a gain
  ];

  const report = calculateSection1Report(testTxs);
  assert.strictEqual(report.totalDailyGain, 4000.0);
  assert.strictEqual(report.marketBreakdown.length, 2);

  const alpha = report.marketBreakdown.find((m) => m.marketName === 'Market Alpha');
  assert.strictEqual(alpha.totalGained, 2000.0);
  assert.strictEqual(alpha.count, 2);

  const beta = report.marketBreakdown.find((m) => m.marketName === 'Market Beta');
  assert.strictEqual(beta.totalGained, 2000.0);
  assert.strictEqual(beta.count, 1);
});

test('Report Section 2: accurately computes total goods entered and total value', () => {
  const testItems = [
    { name: 'Item 1', cardboardBoxes: 10, totalPieces: 400, totalCost: 4000.0 },
    { name: 'Item 2', cardboardBoxes: 5, totalPieces: 250, totalCost: 5000.0 },
  ];

  const report = calculateSection2Report(testItems);
  assert.strictEqual(report.totalGrossValue, 9000.0);
  assert.strictEqual(report.totalCartons, 15);
  assert.strictEqual(report.totalPieces, 650);
  assert.strictEqual(report.totalVarieties, 2);
});

// Logic under test: Multi-cantin creation and code matching
function createCantinWorkspace(name, isShared, ownerName) {
  const code = `ELC-${Math.floor(100 + Math.random() * 900)}`;
  return {
    id: `cantin_${Date.now()}`,
    name,
    code,
    isShared,
    ownerName,
    role: 'admin',
  };
}

function matchCantinByCode(cantins, searchCode) {
  const clean = searchCode.trim().toUpperCase();
  return cantins.find((c) => c.code.toUpperCase() === clean) || null;
}

test('Multi-Cantin: Create independent workspace with code', () => {
  const cantin = createCantinWorkspace("Omar's Kiosk", false, 'Omar');
  assert.strictEqual(cantin.name, "Omar's Kiosk");
  assert.strictEqual(cantin.isShared, false);
  assert.strictEqual(cantin.role, 'admin');
  assert.match(cantin.code, /^ELC-\d{3}$/);
});

test('Multi-Cantin: Join shared workspace by code', () => {
  const storeA = { id: 'c1', name: "Salma's Main Store", code: 'ELC-101', isShared: true };
  const storeB = { id: 'c2', name: 'Private Kiosk', code: 'ELC-202', isShared: false };
  const cantins = [storeA, storeB];

  const found = matchCantinByCode(cantins, 'elc-101');
  assert.notStrictEqual(found, null);
  assert.strictEqual(found.id, 'c1');
  assert.strictEqual(found.name, "Salma's Main Store");

  const notFound = matchCantinByCode(cantins, 'ELC-999');
  assert.strictEqual(notFound, null);
});

// Helper simulation functions for user & cantin management
function deleteUserFromList(users, currentUserId, targetId) {
  const updatedUsers = users.filter((u) => u.id !== targetId);
  let nextCurrentUser = currentUserId;
  if (currentUserId === targetId) {
    nextCurrentUser = updatedUsers.length > 0 ? updatedUsers[0].id : null;
  }
  return { updatedUsers, nextCurrentUser };
}

function deleteCantinFromList(cantins, activeCantinId, targetId) {
  if (cantins.length <= 1) {
    return { success: false, cantins, nextActiveId: activeCantinId };
  }
  const updated = cantins.filter((c) => c.id !== targetId);
  let nextActiveId = activeCantinId;
  if (activeCantinId === targetId) {
    nextActiveId = updated[0].id;
  }
  return { success: true, cantins: updated, nextActiveId };
}

function renameCantinInList(cantins, targetId, newName) {
  return cantins.map((c) => (c.id === targetId ? { ...c, name: newName.trim() } : c));
}

test('User Management: Delete unwanted user preserves remaining users', () => {
  const users = [
    { id: 'u1', name: 'Salma', role: 'admin' },
    { id: 'u2', name: 'Ahmed', role: 'user' },
    { id: 'u3', name: 'Omar', role: 'user' },
  ];

  const result = deleteUserFromList(users, 'u1', 'u2');
  assert.strictEqual(result.updatedUsers.length, 2);
  assert.strictEqual(result.updatedUsers.some((u) => u.id === 'u2'), false);
  assert.strictEqual(result.nextCurrentUser, 'u1');
});

test('User Management: Deleting active user switches to next remaining user', () => {
  const users = [
    { id: 'u1', name: 'Salma', role: 'admin' },
    { id: 'u2', name: 'Ahmed', role: 'user' },
  ];

  const result = deleteUserFromList(users, 'u1', 'u1');
  assert.strictEqual(result.updatedUsers.length, 1);
  assert.strictEqual(result.nextCurrentUser, 'u2');
});

test('User Management: Deleting only user logs out (null currentUser)', () => {
  const users = [{ id: 'u1', name: 'Salma', role: 'admin' }];
  const result = deleteUserFromList(users, 'u1', 'u1');
  assert.strictEqual(result.updatedUsers.length, 0);
  assert.strictEqual(result.nextCurrentUser, null);
});

test('Cantin Management: Rename active cantin', () => {
  const cantins = [{ id: 'c1', name: 'Old Cantin', code: 'ELC-101' }];
  const updated = renameCantinInList(cantins, 'c1', 'Salma New Cantin');
  assert.strictEqual(updated[0].name, 'Salma New Cantin');
});

test('Cantin Management: Prevent deleting only remaining cantin', () => {
  const cantins = [{ id: 'c1', name: 'Sole Store', code: 'ELC-101' }];
  const res = deleteCantinFromList(cantins, 'c1', 'c1');
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.cantins.length, 1);
});

test('Cantin Management: Delete cantin and switch active cantin', () => {
  const cantins = [
    { id: 'c1', name: 'Main Store', code: 'ELC-101' },
    { id: 'c2', name: 'Branch 2', code: 'ELC-202' },
  ];
  const res = deleteCantinFromList(cantins, 'c1', 'c1');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.cantins.length, 1);
  assert.strictEqual(res.cantins[0].id, 'c2');
  assert.strictEqual(res.nextActiveId, 'c2');
});

// Coupon redemption simulation function
function redeemMarketCoupon(market, couponCode, unitValue, quantity = 1, storeInventory = []) {
  const qty = Math.max(1, Math.floor(quantity || 1));
  const totalAmount = unitValue * qty;
  const prevDebt = market.currentDebt;
  const newDebt = Math.max(0, prevDebt - totalAmount);
  const updatedMarket = {
    ...market,
    currentDebt: newDebt,
    totalGainPaid: market.totalGainPaid + totalAmount,
    totalCouponsRedeemed: (market.totalCouponsRedeemed || 0) + totalAmount,
  };

  const tx = {
    type: 'REDEEM_COUPON',
    subMarketId: market.id,
    subMarketName: market.name,
    amount: totalAmount,
    couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
    couponUnitValue: unitValue,
    couponQuantity: qty,
    previousBalance: prevDebt,
    newBalance: newDebt,
  };

  // Inventory in store remains completely untouched!
  const untouchedStoreInventory = [...storeInventory];

  return { updatedMarket, tx, storeInventory: untouchedStoreInventory };
}

test('Coupons: Redeeming coupon reduces sub-market debt without altering store goods', () => {
  const market = {
    id: 'm1',
    name: 'Kiosk North',
    currentDebt: 800,
    totalGoodsTaken: 1200,
    totalGainPaid: 400,
    totalCouponsRedeemed: 0,
    hasCoupons: true,
  };

  const initialInventory = [
    { id: 'i1', name: 'Indomie Chicken', cardboardBoxes: 10, totalCost: 4000 },
  ];

  const { updatedMarket, tx, storeInventory } = redeemMarketCoupon(
    market,
    'CPN-501',
    150,
    1,
    initialInventory
  );

  // 1. Market debt is reduced by 150
  assert.strictEqual(updatedMarket.currentDebt, 650);
  assert.strictEqual(updatedMarket.totalGainPaid, 550);
  assert.strictEqual(updatedMarket.totalCouponsRedeemed, 150);

  // 2. Transaction tracks coupon code and balances
  assert.strictEqual(tx.type, 'REDEEM_COUPON');
  assert.strictEqual(tx.couponCode, 'CPN-501');
  assert.strictEqual(tx.amount, 150);
  assert.strictEqual(tx.previousBalance, 800);
  assert.strictEqual(tx.newBalance, 650);

  // 3. Store goods inventory remains 100% untouched
  assert.strictEqual(storeInventory.length, 1);
  assert.strictEqual(storeInventory[0].cardboardBoxes, 10);
  assert.strictEqual(storeInventory[0].totalCost, 4000);
});

test('Coupons: Multiple quantity calculation (value × qty) accurately deducts debt', () => {
  const market = {
    id: 'm1',
    name: 'Kiosk North',
    currentDebt: 500,
    totalGoodsTaken: 1000,
    totalGainPaid: 500,
    totalCouponsRedeemed: 0,
    hasCoupons: true,
  };

  // 4 coupons of 25 EGP each = 100 EGP total deduction
  const { updatedMarket, tx } = redeemMarketCoupon(market, 'BATCH-25', 25, 4);

  assert.strictEqual(tx.amount, 100);
  assert.strictEqual(tx.couponUnitValue, 25);
  assert.strictEqual(tx.couponQuantity, 4);
  assert.strictEqual(updatedMarket.currentDebt, 400);
  assert.strictEqual(updatedMarket.totalGainPaid, 600);
  assert.strictEqual(updatedMarket.totalCouponsRedeemed, 100);
});

test('Coupons: Over-redeeming coupon floors debt at 0 without negative balance', () => {
  const market = {
    id: 'm2',
    name: 'Kiosk South',
    currentDebt: 40,
    totalGoodsTaken: 200,
    totalGainPaid: 160,
    totalCouponsRedeemed: 0,
    hasCoupons: true,
  };

  const { updatedMarket, tx } = redeemMarketCoupon(market, 'VOUCHER-100', 100, 1, []);
  assert.strictEqual(updatedMarket.currentDebt, 0);
  assert.strictEqual(updatedMarket.totalGainPaid, 260);
  assert.strictEqual(updatedMarket.totalCouponsRedeemed, 100);
  assert.strictEqual(tx.newBalance, 0);
});

function toggleMarketCouponRedeem(market, couponId, userName = 'Admin') {
  const coupons = [...(market.coupons || [])];
  const couponIndex = coupons.findIndex((c) => c.id === couponId);
  if (couponIndex === -1) return { market, tx: null };

  const coupon = coupons[couponIndex];
  const nowCheckingAsRedeemed = !coupon.isRedeemed;

  let newDebt = market.currentDebt;
  let newTotalCoupons = market.totalCouponsRedeemed || 0;
  let newTotalGain = market.totalGainPaid || 0;
  let tx = null;

  if (nowCheckingAsRedeemed) {
    coupons[couponIndex] = {
      ...coupon,
      isRedeemed: true,
      redeemedAt: new Date().toISOString(),
      redeemedBy: userName,
    };
    newDebt = Math.max(0, market.currentDebt - coupon.value);
    newTotalCoupons += coupon.value;
    newTotalGain += coupon.value;

    tx = {
      type: 'REDEEM_COUPON',
      amount: coupon.value,
      couponCode: coupon.code,
      previousBalance: market.currentDebt,
      newBalance: newDebt,
    };
  } else {
    coupons[couponIndex] = {
      ...coupon,
      isRedeemed: false,
      redeemedAt: undefined,
      redeemedBy: undefined,
    };
    newDebt = market.currentDebt + coupon.value;
    newTotalCoupons = Math.max(0, newTotalCoupons - coupon.value);
    newTotalGain = Math.max(0, newTotalGain - coupon.value);
  }

  const updatedMarket = {
    ...market,
    currentDebt: newDebt,
    totalCouponsRedeemed: newTotalCoupons,
    totalGainPaid: newTotalGain,
    coupons,
  };

  return { updatedMarket, tx };
}

test('Coupons: Checking a coupon as redeemed removes its value from debt', () => {
  const market = {
    id: 'm1',
    name: 'Main Market',
    currentDebt: 600,
    totalGoodsTaken: 1000,
    totalGainPaid: 400,
    totalCouponsRedeemed: 0,
    coupons: [
      { id: 'c1', code: 'CPN-1', value: 50, isRedeemed: false },
      { id: 'c2', code: 'CPN-2', value: 100, isRedeemed: false },
      { id: 'c3', code: 'CPN-3', value: 50, isRedeemed: false },
      { id: 'c4', code: 'CPN-4', value: 200, isRedeemed: false },
    ],
  };

  // Checking coupon c2 (100 EGP) as redeemed
  const { updatedMarket, tx } = toggleMarketCouponRedeem(market, 'c2', 'Salma');

  // c2 is redeemed
  assert.strictEqual(updatedMarket.coupons.find((c) => c.id === 'c2').isRedeemed, true);
  // c1, c3, c4 remain unredeemed
  assert.strictEqual(updatedMarket.coupons.filter((c) => !c.isRedeemed).length, 3);
  // 100 EGP is removed from debt
  assert.strictEqual(updatedMarket.currentDebt, 500);
  assert.strictEqual(updatedMarket.totalCouponsRedeemed, 100);
  assert.strictEqual(tx.amount, 100);
  assert.strictEqual(tx.newBalance, 500);
});

test('Coupons: Undoing/unchecking a redeemed coupon restores its value to debt', () => {
  const market = {
    id: 'm1',
    name: 'Main Market',
    currentDebt: 500,
    totalGoodsTaken: 1000,
    totalGainPaid: 500,
    totalCouponsRedeemed: 100,
    coupons: [
      { id: 'c1', code: 'CPN-1', value: 50, isRedeemed: false },
      { id: 'c2', code: 'CPN-2', value: 100, isRedeemed: true },
    ],
  };

  const { updatedMarket } = toggleMarketCouponRedeem(market, 'c2');
  assert.strictEqual(updatedMarket.coupons.find((c) => c.id === 'c2').isRedeemed, false);
  assert.strictEqual(updatedMarket.currentDebt, 600);
  assert.strictEqual(updatedMarket.totalCouponsRedeemed, 0);
});

// Logic under test: Canonical Cantin ID normalization for Firestore sync
function getCanonicalCantinId(code) {
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return `cantin_${clean}`;
}

test('Firebase Sync: Canonical Cantin ID generates identical ID across devices for same code', () => {
  const codeDeviceA = 'elc-101';
  const codeDeviceB = 'ELC-101 ';
  const codeDeviceC = ' ELC_101';

  const idA = getCanonicalCantinId(codeDeviceA);
  const idB = getCanonicalCantinId(codeDeviceB);
  const idC = getCanonicalCantinId(codeDeviceC);

  assert.strictEqual(idA, 'cantin_ELC_101');
  assert.strictEqual(idB, 'cantin_ELC_101');
  assert.strictEqual(idC, 'cantin_ELC_101');
  assert.strictEqual(idA, idB);
  assert.strictEqual(idB, idC);
});

test('Firebase Sync: Different Cantin codes produce distinct Firestore IDs', () => {
  const id1 = getCanonicalCantinId('ELC-101');
  const id2 = getCanonicalCantinId('ELC-202');

  assert.notStrictEqual(id1, id2);
  assert.strictEqual(id1, 'cantin_ELC_101');
  assert.strictEqual(id2, 'cantin_ELC_202');
});

// Logic under test: Individual Sub-Market Deletion
function deleteSubMarketFromList(markets, marketIdToDelete) {
  return markets.filter((m) => m.id !== marketIdToDelete);
}

test('Sub-Market Management: Admin can delete a single market without clearing all markets', () => {
  const initialMarkets = [
    { id: 'm1', name: 'Kiosk A', currentDebt: 500 },
    { id: 'm2', name: 'Kiosk B', currentDebt: 1000 },
    { id: 'm3', name: 'Kiosk C', currentDebt: 250 },
  ];

  const updated = deleteSubMarketFromList(initialMarkets, 'm2');

  assert.strictEqual(updated.length, 2);
  assert.strictEqual(updated.some((m) => m.id === 'm2'), false);
  assert.strictEqual(updated[0].id, 'm1');
  assert.strictEqual(updated[1].id, 'm3');
});

// Logic under test: Cantin Creator Default Admin & Member Role Permissions
function resolveUserCantinRole(cantin, user) {
  if (!user) return 'user';
  const email = (user.email || '').toLowerCase();
  if (cantin.ownerEmail && cantin.ownerEmail.toLowerCase() === email) {
    return 'admin';
  }
  if (cantin.creatorId && (cantin.creatorId === user.id || cantin.creatorId === user.firebaseUid)) {
    return 'admin';
  }
  if (email && cantin.members && cantin.members[email]) {
    return cantin.members[email].role;
  }
  return cantin.role || 'user';
}

test('Cantin Ownership: Creator is automatically assigned Admin role by default', () => {
  const creatorUser = { id: 'u1', name: 'Salma', email: 'salma@example.com' };
  const newCantin = {
    id: 'cantin_ELC_101',
    name: "Salma's Store",
    code: 'ELC-101',
    role: 'admin',
    ownerEmail: 'salma@example.com',
    creatorId: 'u1',
    members: {
      'salma@example.com': { role: 'admin', email: 'salma@example.com', name: 'Salma' },
    },
  };

  const role = resolveUserCantinRole(newCantin, creatorUser);
  assert.strictEqual(role, 'admin');
});

test('Cantin Ownership: Creator can assign and modify member roles between Admin and Staff', () => {
  const cantin = {
    id: 'cantin_ELC_101',
    ownerEmail: 'salma@example.com',
    creatorId: 'u1',
    members: {
      'salma@example.com': { role: 'admin', email: 'salma@example.com', name: 'Salma' },
      'ahmed@example.com': { role: 'user', email: 'ahmed@example.com', name: 'Ahmed' },
    },
  };

  const memberAhmed = { id: 'u2', name: 'Ahmed', email: 'ahmed@example.com' };
  assert.strictEqual(resolveUserCantinRole(cantin, memberAhmed), 'user');

  // Creator elevates Ahmed to admin
  cantin.members['ahmed@example.com'].role = 'admin';
  assert.strictEqual(resolveUserCantinRole(cantin, memberAhmed), 'admin');

  // Creator reduces Ahmed back to staff
  cantin.members['ahmed@example.com'].role = 'user';
  assert.strictEqual(resolveUserCantinRole(cantin, memberAhmed), 'user');
});

test('Cantin Ownership: Joining user with code always defaults to Staff and is NOT Admin', () => {
  const storeOwner = { id: 'u1', name: 'Salma', email: 'salma@example.com' };
  const storeCantin = {
    id: 'cantin_ELC_101',
    name: "Salma's Main Store",
    code: 'ELC-101',
    ownerEmail: 'salma@example.com',
    creatorId: 'u1',
    members: {
      'salma@example.com': { role: 'admin', email: 'salma@example.com', name: 'Salma' },
    },
  };

  // Ahmed joins with code ELC-101
  const joiningUser = { id: 'u2', name: 'Ahmed', email: 'ahmed@example.com' };

  // Strict check function matching DataContext isCantinAdmin
  function isCantinAdminStrict(cantin, user) {
    if (!user || !user.email) return false;
    const userEmail = user.email.toLowerCase();
    if (cantin.ownerEmail && cantin.ownerEmail.toLowerCase() === userEmail) return true;
    if (cantin.creatorId && cantin.creatorId === user.id) return true;
    if (cantin.members && cantin.members[userEmail]) {
      return cantin.members[userEmail].role === 'admin';
    }
    return false;
  }

  // Before being added to members: not admin
  assert.strictEqual(isCantinAdminStrict(storeCantin, joiningUser), false);

  // When joining, joined as staff
  storeCantin.members['ahmed@example.com'] = {
    userId: 'u2',
    name: 'Ahmed',
    email: 'ahmed@example.com',
    role: 'user',
  };
  assert.strictEqual(isCantinAdminStrict(storeCantin, joiningUser), false);

  // Store Owner Salma IS admin
  assert.strictEqual(isCantinAdminStrict(storeCantin, storeOwner), true);

  // Only when Salma explicitly elevates Ahmed does he become admin
  storeCantin.members['ahmed@example.com'].role = 'admin';
  assert.strictEqual(isCantinAdminStrict(storeCantin, joiningUser), true);
});

// Logic under test: Quantity-based Coupons and Partial Redemption
function createMarketCouponBatch(name, quantity, unitValue) {
  const qty = Math.max(1, Math.floor(quantity));
  return {
    id: `cpn_${Date.now()}`,
    name: name.trim(),
    code: name.trim(),
    unitValue,
    totalQuantity: qty,
    redeemedQuantity: 0,
    value: unitValue * qty,
    isRedeemed: false,
  };
}

function redeemCouponPartial(market, couponId, quantityToRedeem = 1) {
  const coupons = [...(market.coupons || [])];
  const idx = coupons.findIndex((c) => c.id === couponId);
  if (idx === -1) return { updatedMarket: market, deducted: 0 };

  const coupon = coupons[idx];
  const totalQty = coupon.totalQuantity || 1;
  const currentRedeemed = coupon.redeemedQuantity || (coupon.isRedeemed ? totalQty : 0);
  const available = Math.max(0, totalQty - currentRedeemed);
  const qty = Math.min(quantityToRedeem, available);
  if (qty <= 0) return { updatedMarket: market, deducted: 0 };

  const unitVal = coupon.unitValue || coupon.value;
  const deduction = qty * unitVal;
  const newRedeemedQty = currentRedeemed + qty;

  coupons[idx] = {
    ...coupon,
    redeemedQuantity: newRedeemedQty,
    isRedeemed: newRedeemedQty >= totalQty,
  };

  return {
    updatedMarket: {
      ...market,
      currentDebt: Math.max(0, market.currentDebt - deduction),
      totalCouponsRedeemed: (market.totalCouponsRedeemed || 0) + deduction,
      coupons,
    },
    deducted: deduction,
  };
}

function undoCouponPartial(market, couponId, quantityToUndo = 1) {
  const coupons = [...(market.coupons || [])];
  const idx = coupons.findIndex((c) => c.id === couponId);
  if (idx === -1) return { updatedMarket: market, restored: 0 };

  const coupon = coupons[idx];
  const totalQty = coupon.totalQuantity || 1;
  const currentRedeemed = coupon.redeemedQuantity || (coupon.isRedeemed ? totalQty : 0);
  const qty = Math.min(quantityToUndo, currentRedeemed);
  if (qty <= 0) return { updatedMarket: market, restored: 0 };

  const unitVal = coupon.unitValue || coupon.value;
  const restoreAmount = qty * unitVal;
  const newRedeemedQty = currentRedeemed - qty;

  coupons[idx] = {
    ...coupon,
    redeemedQuantity: newRedeemedQty,
    isRedeemed: newRedeemedQty >= totalQty,
  };

  return {
    updatedMarket: {
      ...market,
      currentDebt: market.currentDebt + restoreAmount,
      totalCouponsRedeemed: Math.max(0, (market.totalCouponsRedeemed || 0) - restoreAmount),
      coupons,
    },
    restored: restoreAmount,
  };
}

test('Coupons: Created with Name, Quantity, and Unit Value correctly computes total initial value', () => {
  const coupon = createMarketCouponBatch('Meal Voucher', 10, 50);

  assert.strictEqual(coupon.name, 'Meal Voucher');
  assert.strictEqual(coupon.totalQuantity, 10);
  assert.strictEqual(coupon.unitValue, 50);
  assert.strictEqual(coupon.value, 500);
  assert.strictEqual(coupon.redeemedQuantity, 0);
  assert.strictEqual(coupon.isRedeemed, false);
});

test('Coupons: Partial redemption of 1 coupon out of 10 deducts only 1 coupon value and preserves remaining 9', () => {
  const coupon = createMarketCouponBatch('Meal Voucher', 10, 50);
  coupon.id = 'cpn_1';

  let market = {
    id: 'm1',
    name: 'Kiosk A',
    currentDebt: 1000,
    totalCouponsRedeemed: 0,
    coupons: [coupon],
  };

  // Step 1: User redeems just ONE coupon (50 EGP)
  const step1 = redeemCouponPartial(market, 'cpn_1', 1);
  market = step1.updatedMarket;

  assert.strictEqual(step1.deducted, 50);
  assert.strictEqual(market.currentDebt, 950);
  assert.strictEqual(market.totalCouponsRedeemed, 50);

  const c1 = market.coupons[0];
  assert.strictEqual(c1.redeemedQuantity, 1);
  assert.strictEqual(c1.totalQuantity - c1.redeemedQuantity, 9); // 9 remaining
  assert.strictEqual(c1.isRedeemed, false); // NOT fully redeemed yet!

  // Step 2: User later redeems 3 more coupons (150 EGP)
  const step2 = redeemCouponPartial(market, 'cpn_1', 3);
  market = step2.updatedMarket;

  assert.strictEqual(step2.deducted, 150);
  assert.strictEqual(market.currentDebt, 800);
  assert.strictEqual(market.totalCouponsRedeemed, 200);

  const c2 = market.coupons[0];
  assert.strictEqual(c2.redeemedQuantity, 4);
  assert.strictEqual(c2.totalQuantity - c2.redeemedQuantity, 6); // 6 remaining
  assert.strictEqual(c2.isRedeemed, false);

  // Step 3: User redeems remaining 6 coupons (300 EGP)
  const step3 = redeemCouponPartial(market, 'cpn_1', 6);
  market = step3.updatedMarket;

  assert.strictEqual(step3.deducted, 300);
  assert.strictEqual(market.currentDebt, 500);
  assert.strictEqual(market.totalCouponsRedeemed, 500);

  const c3 = market.coupons[0];
  assert.strictEqual(c3.redeemedQuantity, 10);
  assert.strictEqual(c3.totalQuantity - c3.redeemedQuantity, 0); // 0 remaining
  assert.strictEqual(c3.isRedeemed, true); // NOW fully redeemed!

  // Step 4: Undo 2 coupons (restores 100 EGP to debt)
  const step4 = undoCouponPartial(market, 'cpn_1', 2);
  market = step4.updatedMarket;

  assert.strictEqual(step4.restored, 100);
  assert.strictEqual(market.currentDebt, 600);
  assert.strictEqual(market.totalCouponsRedeemed, 400);

  const c4 = market.coupons[0];
  assert.strictEqual(c4.redeemedQuantity, 8);
  assert.strictEqual(c4.totalQuantity - c4.redeemedQuantity, 2); // 2 remaining again
  assert.strictEqual(c4.isRedeemed, false);
});



