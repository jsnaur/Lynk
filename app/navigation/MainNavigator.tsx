import React, { useCallback, useMemo, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeFeedScreen from '../screens/main/HomeFeedScreen';
import ProfileDashboardScreen from '../screens/main/ProfileDashboardScreen';
import QuestDetailScreen from '../screens/main/QuestDetailScreen';
import QuestResolutionScreen from '../screens/main/QuestResolutionScreen';
import PostScreen from '../screens/main/PostScreen';
import ShopScreen from '../screens/main/Shop';
import { MainTab } from '../components/BottomNav';

const Stack = createNativeStackNavigator();

const MainTabsScreen = ({ navigation }: { navigation: any }) => {
  const [activeTab, setActiveTab] = useState<MainTab>('Feed');
  const tabBeforePostRef = useRef<MainTab>('Feed');

  const handleTabPress = useCallback(
    (tab: MainTab) => {
      if (tab === 'Feed' || tab === 'Profile' || tab === 'Shop') {
        setActiveTab(tab);
      } else if (tab === 'Post') {
        if (activeTab === 'Feed' || activeTab === 'Profile' || activeTab === 'Shop') {
          tabBeforePostRef.current = activeTab;
        }
        setActiveTab('Post');
      }
    },
    [activeTab],
  );

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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      <Stack.Screen name="QuestResolution" component={QuestResolutionScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
