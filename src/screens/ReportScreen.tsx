import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PdfReportService } from '../services/pdfGenerator';

type ReportPeriod = 'TODAY' | 'WEEK' | 'ALL';

export const ReportScreen: React.FC = () => {
  const { inventory, subMarkets, transactions, stats } = useData();
  const { currentUser } = useAuth();
  const { t, language, isRTL } = useLanguage();

  const [period, setPeriod] = useState<ReportPeriod>('TODAY');
  const [reportGenerated, setReportGenerated] = useState<boolean>(true);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [lastGeneratedTime, setLastGeneratedTime] = useState<string>(
    new Date().toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  );

  const now = new Date();
  const todayDateString = now.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleGenerateReport = () => {
    setLastGeneratedTime(
      new Date().toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    );
    setReportGenerated(true);
  };

  // Filter transactions according to selected period
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

  // SECTION 1:
  const gainTransactions = filteredTxs.filter((tx) => tx.type === 'RECORD_GAIN' || tx.type === 'REDEEM_COUPON' || tx.type === 'RECORD_COUPON_GAIN');
  const totalDailyGain = gainTransactions.reduce((sum, tx) => sum + tx.amount, 0);

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

  // SECTION 2:
  const totalGoodsEnteredCost = stats.grossInventoryValue;
  const totalCartonsEntered = stats.totalCardboardCount;
  const totalPiecesEntered = stats.totalPiecesCount;
  const totalItemTypes = inventory.length;

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await PdfReportService.generateAndDownloadPdf({
        period,
        language,
        currentUser,
        stats,
        inventory,
        subMarkets,
        transactions,
      });
    } catch (error) {
      console.error('PDF download error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleShareReport = async () => {
    let reportText = `📊 ${t('appName')} - ${t('reportTitle')}\n`;
    reportText += `Period: ${
      period === 'TODAY' ? t('periodToday') : period === 'WEEK' ? t('periodWeek') : t('periodAll')
    } (${todayDateString})\n`;
    reportText += `${t('loggedBy')} ${currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Store User'}\n`;
    reportText += `------------------------------------\n\n`;

    reportText += `📌 ${t('section1Title')}\n`;
    reportText += `${t('totalDailyGainLabel')} ${totalDailyGain.toLocaleString()} ${t('currency')}\n`;
    reportText += `${t('whichMarketsGained')}\n`;
    if (marketGainsList.length === 0) {
      reportText += `  (${t('noGainsRecorded')})\n`;
    } else {
      marketGainsList.forEach((m, idx) => {
        reportText += `  ${idx + 1}. ${m.marketName}: ${m.amount.toLocaleString()} ${t('currency')} (${m.count} ${t('paymentsCount')})\n`;
      });
    }

    reportText += `\n📌 ${t('section2Title')}\n`;
    reportText += `${t('totalGoodsValuationGross')} ${totalGoodsEnteredCost.toLocaleString()} ${t('currency')}\n`;
    reportText += `${t('netAvailableStore')} ${stats.netAvailableValue.toLocaleString()} ${t('currency')}\n`;
    reportText += `${t('varieties')}: ${totalItemTypes} | ${t('cardboardBoxesStat')}: ${totalCartonsEntered} | ${t('totalPiecesStat')}: ${totalPiecesEntered}\n\n`;

    reportText += `${t('detailedGoodsBreakdown')}\n`;
    inventory.forEach((item, idx) => {
      reportText += `  ${idx + 1}. ${item.name}: ${item.cardboardBoxes} ${t('cartons')} (${item.totalPieces} ${t('pcs')}) = ${item.totalCost.toLocaleString()} ${t('currency')}\n`;
    });

    try {
      await Share.share({
        message: reportText,
        title: `${t('appName')} Report`,
      });
    } catch {
      Alert.alert(t('appName'), 'Report ready');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Request / Generation Control Card */}
      <View style={styles.headerCard}>
        <View style={[styles.headerTop, isRTL && styles.rowRtl]}>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.reportTitle}>{t('reportTitle')}</Text>
            <Text style={styles.reportSubtitle}>
              {t('reportSubtitle')} • {todayDateString} ({lastGeneratedTime})
            </Text>
          </View>

          <TouchableOpacity
            style={styles.generateBtn}
            onPress={handleGenerateReport}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="refresh" size={18} color={colors.white} />
            <Text style={styles.generateBtnText}>{t('generateReportBtn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Period Selector Tabs */}
        <View style={[styles.periodRow, isRTL && styles.rowRtl]}>
          <TouchableOpacity
            style={[styles.periodBtn, period === 'TODAY' && styles.periodBtnActive]}
            onPress={() => setPeriod('TODAY')}
          >
            <Text style={[styles.periodText, period === 'TODAY' && styles.periodTextActive]}>
              {t('periodToday')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.periodBtn, period === 'WEEK' && styles.periodBtnActive]}
            onPress={() => setPeriod('WEEK')}
          >
            <Text style={[styles.periodText, period === 'WEEK' && styles.periodTextActive]}>
              {t('periodWeek')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.periodBtn, period === 'ALL' && styles.periodBtnActive]}
            onPress={() => setPeriod('ALL')}
          >
            <Text style={[styles.periodText, period === 'ALL' && styles.periodTextActive]}>
              {t('periodAll')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions Bar: Download PDF & Share */}
        <View style={[styles.actionButtonsRow, isRTL && styles.rowRtl]}>
          <TouchableOpacity
            style={[styles.downloadPdfBtn, downloadingPdf && { opacity: 0.7 }]}
            onPress={handleDownloadPdf}
            disabled={downloadingPdf}
            activeOpacity={0.7}
          >
            {downloadingPdf ? (
              <ActivityIndicator size="small" color={colors.white} style={{ marginHorizontal: 6 }} />
            ) : (
              <MaterialCommunityIcons name="file-pdf-box" size={20} color={colors.white} style={{ marginHorizontal: 6 }} />
            )}
            <Text style={styles.downloadPdfBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {downloadingPdf ? t('generatingPdf') : t('downloadPdfBtn')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShareReport} activeOpacity={0.7}>
            <MaterialCommunityIcons name="share-variant" size={18} color={colors.primaryDark} style={{ marginHorizontal: 4 }} />
            <Text style={styles.shareBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {t('shareReportBtn')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================================================== */}
      {/* SECTION 1: MARKET GAINS & TOTAL DAILY GAIN */}
      {/* ==================================================== */}
      <View style={styles.sectionCard}>
        <View style={[styles.sectionHeader, isRTL && styles.rowRtl]}>
          <View style={[styles.sectionIconBadge, { backgroundColor: colors.successLight }]}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.successText} />
          </View>
          <View style={[{ flex: 1 }, isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            <Text style={styles.sectionHeading}>{t('section1Title')}</Text>
          </View>
        </View>

        {/* Total Daily Gain KPI */}
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiLabel, isRTL && { textAlign: 'right' }]}>
            {period === 'TODAY' ? t('totalDailyGainLabel') : t('totalGainPeriodLabel')}
          </Text>
          <Text style={[styles.kpiValue, isRTL && { textAlign: 'right' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {totalDailyGain.toLocaleString()} {t('currency')}
          </Text>
          <Text style={[styles.kpiSub, isRTL && { textAlign: 'right' }]}>
            {t('subtractedFromBalances')} {gainTransactions.length} {t('txCount')}
          </Text>
        </View>

        {/* Breakdown of Which Markets Gained Money */}
        <Text style={[styles.subSectionTitle, isRTL && { textAlign: 'right' }]}>
          {t('whichMarketsGained')}
        </Text>

        {marketGainsList.length > 0 ? (
          <View style={styles.gainsList}>
            {marketGainsList.map((m, idx) => (
              <View key={idx} style={[styles.gainRow, isRTL && styles.rowRtl]}>
                <View style={[styles.gainRowLeft, isRTL && styles.rowRtl, { flex: 1, marginRight: 8 }]}>
                  <View style={styles.marketAvatar}>
                    <MaterialCommunityIcons name="storefront" size={18} color={colors.primaryDark} />
                  </View>
                  <View style={[{ flex: 1 }, isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                    <Text style={styles.marketRowName} numberOfLines={1}>{m.marketName}</Text>
                    <Text style={styles.marketRowCount}>
                      {m.count} {t('paymentsCount')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.gainRowAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  + {m.amount.toLocaleString()} {t('currency')}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyNotice, isRTL && styles.rowRtl]}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.emptyNoticeText, isRTL && { marginRight: 8, marginLeft: 0 }]}>
              {t('noGainsRecorded')}
            </Text>
          </View>
        )}
      </View>

      {/* ==================================================== */}
      {/* SECTION 2: TOTAL GOODS ENTERED & TOTAL VALUE */}
      {/* ==================================================== */}
      <View style={styles.sectionCard}>
        <View style={[styles.sectionHeader, isRTL && styles.rowRtl]}>
          <View style={[styles.sectionIconBadge, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="package-variant-closed" size={20} color={colors.primaryDark} />
          </View>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.sectionHeading}>{t('section2Title')}</Text>
          </View>
        </View>

        {/* Total Value KPI */}
        <View style={[styles.kpiBox, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
          <Text style={[styles.kpiLabel, { color: colors.primaryDark }, isRTL && { textAlign: 'right' }]}>
            {t('totalGoodsValuationGross')}
          </Text>
          <Text style={[styles.kpiValue, { color: colors.primaryDark }, isRTL && { textAlign: 'right' }]}>
            {totalGoodsEnteredCost.toLocaleString()} {t('currency')}
          </Text>
          <Text style={[styles.kpiSub, { color: colors.primaryDark }, isRTL && { textAlign: 'right' }]}>
            {t('netAvailableStore')} {stats.netAvailableValue.toLocaleString()} {t('currency')}
          </Text>
        </View>

        {/* Aggregated Goods Packaging Quantities */}
        <View style={[styles.goodsStatsGrid, isRTL && styles.rowRtl]}>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniLabel}>{t('varieties')}</Text>
            <Text style={styles.statMiniValue}>{totalItemTypes}</Text>
          </View>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniLabel}>{t('cardboardBoxesStat')}</Text>
            <Text style={styles.statMiniValue}>{totalCartonsEntered}</Text>
          </View>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniLabel}>{t('totalPiecesStat')}</Text>
            <Text style={styles.statMiniValue}>{totalPiecesEntered.toLocaleString()}</Text>
          </View>
        </View>

        {/* Inventory Items Breakdown */}
        <Text style={[styles.subSectionTitle, isRTL && { textAlign: 'right' }]}>
          {t('detailedGoodsBreakdown')}
        </Text>

        {inventory.map((item) => (
          <View key={item.id} style={[styles.inventoryReportRow, isRTL && styles.rowRtl]}>
            <View style={[styles.invLeft, isRTL && { alignItems: 'flex-end', paddingRight: 0, paddingLeft: 10 }]}>
              <Text style={styles.invName}>{item.name}</Text>
              <Text style={styles.invDetails}>
                {item.cardboardBoxes} {t('cartons')} × {item.innerBoxes} {t('boxes')} × {item.piecesPerBox} {t('pcs')} @ {item.pricePerPiece.toFixed(2)} {t('currency')}
              </Text>
            </View>
            <View style={[styles.invRight, isRTL && { alignItems: 'flex-start' }]}>
              <Text style={styles.invTotalCost}>
                {item.totalCost.toLocaleString()} {t('currency')}
              </Text>
              <Text style={styles.invTotalPieces}>{item.totalPieces} {t('pcs')}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  reportTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  reportSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  generateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 4,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardHover,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodBtnActive: {
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadPdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  downloadPdfBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  kpiBox: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.successText,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.successText,
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: colors.successText,
    fontWeight: '500',
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginTop: 6,
    marginBottom: 10,
  },
  gainsList: {
    backgroundColor: colors.cardHover,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  gainRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  marketAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  marketRowName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  marketRowCount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  gainRowAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.successText,
  },
  emptyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardHover,
    padding: 12,
    borderRadius: 10,
  },
  emptyNoticeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  goodsStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statMiniCard: {
    flex: 1,
    backgroundColor: colors.cardHover,
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statMiniLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statMiniValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  inventoryReportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  invLeft: {
    flex: 1,
    paddingRight: 10,
  },
  invName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  invDetails: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  invRight: {
    alignItems: 'flex-end',
  },
  invTotalCost: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  invTotalPieces: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
});
