# EL Cantin 🛒📦

A modern mobile application for inventory packaging valuation, sub-market financial distributions, and real-time payment audit tracking.

---

## 🌟 Key Features

### 1. Multi-User & Role-Based Access Control
- **Store Admin (e.g., Salma):** Full control over inventory items, packaging parameters, creating sub-markets, transferring goods value, and viewing financial metrics.
- **Staff / Reps (e.g., Ahmed, Omar):** Can record collected revenue ("gains") for sub-markets and view transaction history.
- Quick user switcher on the **Settings** screen lets you test both Admin and Staff perspectives with 1 tap.

### 2. Main Store: Packaging Hierarchy & Automatic Calculations
Goods are managed with multi-level packaging breakdown:
* **Cardboard Box (الكرتونة)**: Outer cartons in stock ($C$)
* **Boxes per Cardboard (العلب بالكرتونة)**: Inner boxes per carton ($B$)
* **Pieces per Box (القطع بالعلبة)**: Number of individual pieces per inner box ($P$)
* **Price per Piece (سعر القطعة)**: Unit price ($U$)

**Automatic Calculations:**
- $\text{Pieces per Cardboard} = B \times P$
- $\text{Cost of 1 Cardboard Box} = (B \times P) \times U$
- $\text{Total Pieces in Stock} = C \times (B \times P)$
- $\text{Total Item Valuation} = C \times \text{Cost of 1 Cardboard Box}$
- $\text{Gross Main Store Valuation} = \sum \text{Total Item Valuation}$

### 3. Sub-Markets: Goods Value Allocation
- Sub-markets receive goods in terms of monetary value.
- When an allocation is made, the amount is **deducted from the Main Store's available value** and **added to the sub-market's outstanding liability ("money on him")**.

### 4. Gain / Repayment Tracking with Audit Trail
- Each sub-market has a **"Record Gain / Repay"** option.
- When an amount is entered:
  - It is **subtracted from the money on him** (reducing his debt).
  - An audit log is automatically saved in **History** containing:
    - **Exact Date & Time**
    - **User who recorded the transaction** (Name & Role)
    - **Sub-Market Name**
    - **Previous Balance $\to$ New Balance**
    - **Batch notes / description**

### 5. On-Demand Performance & Audit Reports 📊
- Dedicated **Reports** tab generated upon request:
  - **Filter by Period:** "Today's Daily", "This Week", or "All Time".
  - **Section 1: Market Gains & Revenue:**
    - Which market gained money (itemized list of sub-markets and amounts paid back).
    - **Total Daily Gain** highlighted prominently.
  - **Section 2: Goods Entered & Total Valuation:**
    - Total goods varieties, total cardboard boxes in stock, total piece count.
    - **Total Gross Valuation** of entered goods + Net store value.
    - Itemized breakdown of each product in stock.
  - **Share / Export:** 1-tap "Share" button to copy or send clean formatted text report via WhatsApp, SMS, or Email.

### 6. Firebase & Offline-First Persistence
- Out of the box, all data is persisted locally via `AsyncStorage`, with complete sample data ready to test immediately.
- To connect a live cloud database across multiple physical phones, add your credentials in `src/config/firebase.ts`.

---

## 🚀 How to Run the App

1. Open your terminal in this project folder:
   ```bash
   cd el-cantin
   ```

2. Start the Expo development server:
   ```bash
   npx expo start
   ```

3. **To test on your mobile phone:**
   - Install **Expo Go** from Google Play Store or Apple App Store.
   - Scan the QR code displayed in the terminal with your camera (iOS) or the Expo Go app (Android).
   - Both your computer and phone should be on the same Wi-Fi network.

4. **To run automated tests:**
   ```bash
   npm test
   ```

5. **To verify TypeScript types:**
   ```bash
   npm run typecheck
   ```
