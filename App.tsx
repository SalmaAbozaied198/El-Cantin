import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from './src/theme/colors';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { Header } from './src/components/Header';
import { MainStoreScreen } from './src/screens/MainStoreScreen';
import { SubMarketsScreen } from './src/screens/SubMarketsScreen';
import { ReportScreen } from './src/screens/ReportScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WelcomeIdentityModal } from './src/screens/WelcomeIdentityModal';

type TabKey = 'STORE' | 'MARKETS' | 'REPORTS' | 'HISTORY' | 'SETTINGS';

function MainApp() {
  const [activeTab, setActiveTab] = useState<TabKey>('STORE');
  const { t, isRTL } = useLanguage();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'STORE':
        return <MainStoreScreen />;
      case 'MARKETS':
        return <SubMarketsScreen />;
      case 'REPORTS':
        return <ReportScreen />;
      case 'HISTORY':
        return <HistoryScreen />;
      case 'SETTINGS':
        return <SettingsScreen />;
      default:
        return <MainStoreScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Top App Header with Language Toggle */}
      <Header onOpenProfile={() => setActiveTab('SETTINGS')} />

      {/* First-time Welcome & Identity setup */}
      <WelcomeIdentityModal />

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={[styles.tabBar, isRTL && styles.tabBarRtl]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'STORE' && styles.tabItemActive]}
          onPress={() => setActiveTab('STORE')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={activeTab === 'STORE' ? 'archive' : 'archive-outline'}
            size={25}
            color={activeTab === 'STORE' ? colors.primaryDark : colors.textMuted}
          />
          <Text style={[styles.tabLabel, activeTab === 'STORE' && styles.tabLabelActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {t('tabStore')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'MARKETS' && styles.tabItemActive]}
          onPress={() => setActiveTab('MARKETS')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={activeTab === 'MARKETS' ? 'storefront' : 'storefront-outline'}
            size={25}
            color={activeTab === 'MARKETS' ? colors.primaryDark : colors.textMuted}
          />
          <Text style={[styles.tabLabel, activeTab === 'MARKETS' && styles.tabLabelActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {t('tabMarkets')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'REPORTS' && styles.tabItemActive]}
          onPress={() => setActiveTab('REPORTS')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={activeTab === 'REPORTS' ? 'file-chart' : 'file-chart-outline'}
            size={25}
            color={activeTab === 'REPORTS' ? colors.primaryDark : colors.textMuted}
          />
          <Text style={[styles.tabLabel, activeTab === 'REPORTS' && styles.tabLabelActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {t('tabReports')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'HISTORY' && styles.tabItemActive]}
          onPress={() => setActiveTab('HISTORY')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={activeTab === 'HISTORY' ? 'history' : 'clock-outline'}
            size={25}
            color={activeTab === 'HISTORY' ? colors.primaryDark : colors.textMuted}
          />
          <Text style={[styles.tabLabel, activeTab === 'HISTORY' && styles.tabLabelActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {t('tabHistory')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'SETTINGS' && styles.tabItemActive]}
          onPress={() => setActiveTab('SETTINGS')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={activeTab === 'SETTINGS' ? 'cog' : 'cog-outline'}
            size={25}
            color={activeTab === 'SETTINGS' ? colors.primaryDark : colors.textMuted}
          />
          <Text style={[styles.tabLabel, activeTab === 'SETTINGS' && styles.tabLabelActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {t('tabSettings')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>
          <MainApp />
        </DataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 8,
    minHeight: 74,
    elevation: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabBarRtl: {
    flexDirection: 'row-reverse',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 14,
  },
  tabItemActive: {
    backgroundColor: colors.primaryLight,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
});
