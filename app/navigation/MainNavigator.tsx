import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeFeedScreen from '../screens/main/HomeFeedScreen';
import ProfileDashboardScreen from '../screens/main/ProfileDashboardScreen';
import QuestScreen from '../screens/main/QuestScreen';
import QuestDetailScreen from '../screens/main/QuestDetailScreen';
import PostScreen from '../screens/main/PostScreen';
import ShopScreen from '../screens/main/Shop';
import SettingsScreen from '../screens/main/SettingsScreen';
import CustomizeScreen from '../screens/main/CustomizeScreen';
// Import the upcoming Leaderboard screen
// import LeaderboardScreen from '../screens/main/LeaderboardScreen'; 
import { MainTab } from '../components/BottomNav';

const Stack = createNativeStackNavigator();

const MainTabsScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const [activeTab, setActiveTab] = useState<MainTab>('Feed');
  const tabBeforePostRef = useRef<MainTab>('Feed');

  const handleTabPress = useCallback(
    (tab: MainTab) => {
      if (tab === 'Feed' || tab === 'Quests' || tab === 'Profile' || tab === 'Shop') {
        setActiveTab(tab);
      } else if (tab === 'Post') {
        if (activeTab === 'Feed' || activeTab === 'Quests' || activeTab === 'Profile' || activeTab === 'Shop') {
          tabBeforePostRef.current = activeTab;
        }
        setActiveTab('Post');
      }
    },
    [activeTab],
  );

  // NEW: Handle incoming tab navigation requests from stack screens (like Leaderboard)
  useEffect(() => {
    if (route?.params?.activeTab) {
      handleTabPress(route.params.activeTab);
      // Clear the parameter after handling it to prevent getting stuck on this tab
      navigation.setParams({ activeTab: undefined });
    }
  }, [route?.params?.activeTab, handleTabPress, navigation]);

  const postNavigation = useMemo(
    () => ({
      ...navigation,
      goBack: () => setActiveTab(tabBeforePostRef.current),
    }),
    [navigation],
  );

  if (activeTab === 'Profile') {
    return (
      <ProfileDashboardScreen
        navigation={navigation}
        onTabPress={handleTabPress}
      />
    );
  }

  if (activeTab === 'Quests') {
    return (
      <QuestScreen
        navigation={navigation}
        onTabPress={handleTabPress}
      />
    );
  }

  if (activeTab === 'Post') {
    return <PostScreen navigation={postNavigation} />;
  }

  if (activeTab === 'Shop') {
    return <ShopScreen onTabPress={handleTabPress} />;
  }

  return (
    <HomeFeedScreen
      navigation={navigation}
      onTabPress={handleTabPress}
    />
  );
};

const MainNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#1A1A1F' }
      }}
    >
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
      
      {/* NEW: Leaderboard Screen registration */}
      <Stack.Screen 
        name="Leaderboard" 
        getComponent={() => require('../screens/main/LeaderboardScreen').default} 
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;