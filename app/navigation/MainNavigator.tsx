import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native'; // Added AppState for midnight-pass check
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeFeedScreen, { invalidateFeedCache } from '../screens/main/HomeFeedScreen';
import ProfileDashboardScreen from '../screens/main/ProfileDashboardScreen';
import QuestScreen from '../screens/main/QuestScreen';
import QuestDetailScreen from '../screens/main/QuestDetailScreen';
import PostScreen from '../screens/main/PostScreen';
import ShopScreen from '../screens/main/Shop';
import SettingsScreen from '../screens/main/SettingsScreen';
import CustomizeScreen from '../screens/main/CustomizeScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen'; // Added Import
import DailyRewardSheet from '../screens/main/DailyRewardSheet'; // Import the sheet
import { useDailyReward } from '../hooks/useDailyReward'; // Import the hook
import { MainTab } from '../components/BottomNav';
import { useTheme } from '../contexts/ThemeContext';

const Stack = createNativeStackNavigator();

const MainTabsScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const [activeTab, setActiveTab] = useState<MainTab>('Feed');
  const tabBeforePostRef = useRef<MainTab>('Feed');
  const didPublishFromPostRef = useRef(false);
  const [highlightQuestId, setHighlightQuestId] = useState<string | null>(null);
  const [feedRefreshSignal, setFeedRefreshSignal] = useState(0);
  const [optimisticQuest, setOptimisticQuest] = useState<any | null>(null);
  const [optimisticRemovalId, setOptimisticRemovalId] = useState<string | null>(null);
  
  // Daily Reward Logic
  const {
    shouldShowSheet,
    currentDay,
    alreadyClaimed,
    checkDailyReward,
    claimReward,
    dismissSheet,
    openSheet,
  } = useDailyReward();

  const handleTabPress = useCallback((tab: MainTab) => {
    if (tab === 'Post') {
      tabBeforePostRef.current = activeTab;
      setActiveTab('Post');
    } else {
      setActiveTab(tab);
    }
  }, [activeTab]);

  // Check for reward on mount
  useEffect(() => {
    checkDailyReward();
  }, [checkDailyReward]);

  // Optional: Check for reward when app returns from background (handles midnight pass)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkDailyReward();
      }
    });
    return () => subscription.remove();
  }, [checkDailyReward]);

  useEffect(() => {
    if (route?.params?.activeTab) {
      handleTabPress(route.params.activeTab);
      navigation.setParams({ activeTab: undefined });
    }
  }, [route?.params?.activeTab, handleTabPress, navigation]);

  const postNavigation = useMemo(() => ({
    ...navigation,
    goBack: () => {
      // Prevent publish success flow from being overridden by the normal post dismissal goBack.
      if (didPublishFromPostRef.current) {
        didPublishFromPostRef.current = false;
        return;
      }
      setActiveTab(tabBeforePostRef.current);
    },
    onPublishOptimistic: (quest: any, tempId?: string | null) => {
      didPublishFromPostRef.current = true;
      if (quest) setOptimisticQuest(quest);
      // Do not highlight while still posting. Highlight only after server confirms success.
      setActiveTab('Feed');
    },
    onPublishSuccess: (questId?: string | null, tempId?: string | null) => {
      didPublishFromPostRef.current = true;
      invalidateFeedCache();
      setFeedRefreshSignal((v) => v + 1);
      setHighlightQuestId(questId ? String(questId) : null);
      if (tempId) setOptimisticRemovalId(String(tempId));
      setActiveTab('Feed');
    },
    onPublishFailure: (tempId?: string | null) => {
      didPublishFromPostRef.current = true;
      if (tempId) setOptimisticRemovalId(String(tempId));
      setActiveTab('Feed');
    },
  }), [navigation]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Profile': return <ProfileDashboardScreen navigation={navigation} onTabPress={handleTabPress} />;
      case 'Quests': return <QuestScreen navigation={navigation} onTabPress={handleTabPress} />;
      case 'Post': return <PostScreen navigation={postNavigation} />;
      case 'Shop': return <ShopScreen onTabPress={handleTabPress} />;
      default: return (
        <HomeFeedScreen
          navigation={navigation}
          onTabPress={handleTabPress}
          dailyRewardClaimable={!alreadyClaimed}
          onOpenDailyReward={openSheet}
          highlightQuestId={highlightQuestId}
          feedRefreshSignal={feedRefreshSignal}
          onHighlightConsumed={() => setHighlightQuestId(null)}
          optimisticQuest={optimisticQuest}
          optimisticRemovalId={optimisticRemovalId}
          onOptimisticQuestConsumed={() => setOptimisticQuest(null)}
          onOptimisticRemovalConsumed={() => setOptimisticRemovalId(null)}
        />
      );
    }
  };

  return (
    <>
      {renderContent()}
      
      {/* Daily Reward Modal Integration */}
      <DailyRewardSheet 
        visible={shouldShowSheet}
        currentDay={currentDay}
        alreadyClaimed={alreadyClaimed}
        onClose={dismissSheet}
        onClaim={claimReward}
      />
    </>
  );
};

const MainNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="HomeFeed" component={MainTabsScreen} />
      <Stack.Screen
        name="QuestDetail"
        component={QuestDetailScreen}
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Customize" component={CustomizeScreen} />
      {/* Registered ChangePassword Screen */}
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Leaderboard" getComponent={() => require('../screens/main/LeaderboardScreen').default} />
    </Stack.Navigator>
  );
};

export default MainNavigator;