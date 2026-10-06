import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { InventoryItem, SubMarket, Transaction, MainStoreStats, User } from '../types';
import { Language } from '../i18n/translations';

interface GeneratePdfOptions {
  period: 'TODAY' | 'WEEK' | 'ALL';
  language: Language;
  currentUser: User | null;
  stats: MainStoreStats;
  inventory: InventoryItem[];
  subMarkets: SubMarket[];
  transactions: Transaction[];
}

export const PdfReportService = {
  async generateAndDownloadPdf(options: GeneratePdfOptions): Promise<string> {
    const { period, language, currentUser, stats, inventory, transactions } = options;
    const isAr = language === 'ar';

    const now = new Date();
    const formattedDate = now.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Filter transactions by period
    const filteredTxs = transactions.filter((tx) => {
      if (period === 'ALL') return true;
      const txDate = new Date(tx.timestamp);
      if (period === 'TODAY') {
        return (
          txDate.getDate() === now.getDate() &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
      if (period === 'WEEK') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return txDate >= oneWeekAgo;
      }
      return true;
    });

    const gainTransactions = filteredTxs.filter((tx) => tx.type === 'RECORD_GAIN' || tx.type === 'REDEEM_COUPON' || tx.type === 'RECORD_COUPON_GAIN');
    const totalDailyGain = gainTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Group gains by market
    const marketGainsMap: Record<string, { marketName: string; amount: number; count: number }> = {};
    gainTransactions.forEach((tx) => {
      if (!marketGainsMap[tx.subMarketId]) {
        marketGainsMap[tx.subMarketId] = {
          marketName: tx.subMarketName,
          amount: 0,
          count: 0,
        };
      }
      marketGainsMap[tx.subMarketId].amount += tx.amount;
      marketGainsMap[tx.subMarketId].count += 1;
    });
    const marketGainsList = Object.values(marketGainsMap);

    const currency = isAr ? 'ج.م' : 'EGP';
    const periodLabel =
      period === 'TODAY'
        ? (isAr ? 'يومي (اليوم)' : "Today's Daily")
        : period === 'WEEK'
        ? (isAr ? 'أسبوعي (آخر 7 أيام)' : 'This Week (Past 7 Days)')
        : (isAr ? 'شامل (جميع الأوقات)' : 'All Time');

    // Build HTML template
    const html = `
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${language}">
      <head>
        <meta charset="utf-8" />
        <title>EL Cantin Report</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
          body { padding: 30px; color: #1e293b; background: #ffffff; }
          .header { border-bottom: 2px solid #0d9488; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .title-area h1 { color: #0d9488; font-size: 24px; margin-bottom: 4px; }
          .title-area p { color: #64748b; font-size: 13px; }
          .meta-box { text-align: ${isAr ? 'left' : 'right'}; font-size: 12px; color: #475569; }
          .meta-box strong { color: #0f172a; }
          
          .section { margin-bottom: 28px; }
          .section-title { font-size: 16px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px; display: flex; align-items: center; }
          
          .kpi-container { display: flex; gap: 15px; margin-bottom: 16px; }
          .kpi-card { flex: 1; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; }
          .kpi-card.green { background: #ecfdf5; border-color: #a7f3d0; }
          .kpi-card.teal { background: #f0fdfa; border-color: #99f6e4; }
          .kpi-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #047857; margin-bottom: 4px; }
          .kpi-label.teal-text { color: #0f766e; }
          .kpi-value { font-size: 22px; font-weight: 900; color: #065f46; }
          .kpi-value.teal-text { color: #0f766e; }
          .kpi-sub { font-size: 11px; color: #64748b; margin-top: 4px; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #f1f5f9; color: #334155; font-weight: 700; padding: 9px 12px; border: 1px solid #e2e8f0; text-align: ${isAr ? 'right' : 'left'}; }
          td { padding: 9px 12px; border: 1px solid #e2e8f0; color: #1e293b; }
          tr:nth-child(even) { background: #f8fafc; }
          .amount-cell { font-weight: bold; color: #0f766e; }
          .green-cell { font-weight: bold; color: #047857; }
          
          .footer { margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="title-area">
            <h1>${isAr ? 'الكانتين • تقرير الأداء والمراجعة' : 'EL cantin • Performance & Audit Report'}</h1>
            <p>${isAr ? 'تقرير إداري رسمي صادر عند الطلب' : 'Official Store & Sub-Market Management Report'}</p>
          </div>
          <div class="meta-box">
            <div>${isAr ? 'الفترة:' : 'Period:'} <strong>${periodLabel}</strong></div>
            <div>${isAr ? 'تاريخ التقرير:' : 'Date:'} <strong>${formattedDate} • ${formattedTime}</strong></div>
            <div>${isAr ? 'المستخدم المسؤول:' : 'Generated By:'} <strong>${currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Store User'}</strong></div>
          </div>
        </div>

        <!-- Section 1 -->
        <div class="section">
          <div class="section-title">
            <span>${isAr ? '📌 القسم الأول: مكاسب المنافذ وإجمالي المكسب اليومي' : '📌 Section 1: Market Gains & Total Daily Revenue'}</span>
          </div>

          <div class="kpi-container">
            <div class="kpi-card green">
              <div class="kpi-label">${isAr ? 'إجمالي المكسب المحصل بالفترة' : 'Total Gain Collected'}</div>
              <div class="kpi-value">${totalDailyGain.toLocaleString()} ${currency}</div>
              <div class="kpi-sub">${isAr ? `تم خصمها من مستحقات المنافذ عبر ${gainTransactions.length} عملية` : `Subtracted from market liabilities across ${gainTransactions.length} payments`}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label teal-text">${isAr ? 'عدد المنافذ المسددة' : 'Contributing Markets'}</div>
              <div class="kpi-value teal-text">${marketGainsList.length}</div>
              <div class="kpi-sub">${isAr ? 'منافذ حققت وسددت مبالغ' : 'Sub-markets with active collections'}</div>
            </div>
          </div>

          ${
            marketGainsList.length > 0
              ? `
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>${isAr ? 'اسم المنفذ الفرعي' : 'Sub-Market Name'}</th>
                  <th>${isAr ? 'عدد عمليات السداد' : 'Payments Count'}</th>
                  <th>${isAr ? 'إجمالي المبلغ المسدد (المكسب)' : 'Total Gained / Paid Back'}</th>
                </tr>
              </thead>
              <tbody>
                ${marketGainsList
                  .map(
                    (m, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${m.marketName}</strong></td>
                    <td>${m.count}</td>
                    <td class="green-cell">+ ${m.amount.toLocaleString()} ${currency}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
              : `<p style="font-size: 12px; color: #64748b; padding: 10px; background: #f8fafc; border-radius: 8px;">${
                  isAr ? 'لم يتم تسجيل أي مكاسب خلال هذه الفترة.' : 'No market gains recorded for this period.'
                }</p>`
          }
        </div>

        <!-- Section 2 -->
        <div class="section">
          <div class="section-title">
            <span>${isAr ? '📌 القسم الثاني: إجمالي البضائع المدخلة والقيمة التقديرية للمخزن' : '📌 Section 2: Goods Entered & Total Store Valuation'}</span>
          </div>

          <div class="kpi-container">
            <div class="kpi-card teal">
              <div class="kpi-label teal-text">${isAr ? 'إجمالي القيمة التقديرية للبضائع' : 'Total Goods Gross Valuation'}</div>
              <div class="kpi-value teal-text">${stats.grossInventoryValue.toLocaleString()} ${currency}</div>
              <div class="kpi-sub">${isAr ? `المتاح حالياً بالمخزن: ${stats.netAvailableValue.toLocaleString()} ${currency}` : `Net Available: ${stats.netAvailableValue.toLocaleString()} ${currency}`}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label teal-text">${isAr ? 'إجمالي الكراتين والقطع' : 'Total Cartons & Pieces'}</div>
              <div class="kpi-value teal-text">${stats.totalCardboardCount} ${isAr ? 'كرتونة' : 'ctn'}</div>
              <div class="kpi-sub">${stats.totalPiecesCount.toLocaleString()} ${isAr ? 'قطعة إجمالية' : 'total pieces'} • ${inventory.length} ${isAr ? 'أصناف' : 'varieties'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${isAr ? 'اسم الصنف' : 'Item Name'}</th>
                <th>${isAr ? 'توزيع التعبئة (كرتونة × علبة × قطعة)' : 'Packaging Breakdown'}</th>
                <th>${isAr ? 'سعر القطعة' : 'Unit Price'}</th>
                <th>${isAr ? 'إجمالي القطع' : 'Total Pieces'}</th>
                <th>${isAr ? 'القيمة الإجمالية' : 'Total Value'}</th>
              </tr>
            </thead>
            <tbody>
              ${inventory
                .map(
                  (item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${item.name}</strong> <span style="font-size: 10px; color: #64748b;">(${item.category || 'General'})</span></td>
                  <td>${item.cardboardBoxes} ctn × ${item.innerBoxes} box × ${item.piecesPerBox} pcs</td>
                  <td>${item.pricePerPiece.toFixed(2)} ${currency}</td>
                  <td>${item.totalPieces.toLocaleString()}</td>
                  <td class="amount-cell">${item.totalCost.toLocaleString()} ${currency}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div>${isAr ? 'تطبيق الكانتين لإدارة المخازن والمنافذ' : 'EL cantin Warehouse & Sub-Market Management'}</div>
          <div>${isAr ? 'تم استخراج التقرير آلياً' : 'Automated Official System Report'}</div>
        </div>
      </body>
      </html>
    `;

    // 1. Generate real PDF file
    const file = await Print.printToFileAsync({ html });

    // 2. Open native Save/Download/Share dialogue
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        UTI: '.pdf',
        dialogTitle: isAr ? 'تحميل وحفظ تقرير الكانتين PDF' : 'Download / Save EL Cantin Report PDF',
      });
    }

    return file.uri;
  },
};
