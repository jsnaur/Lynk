import React, { useCallback, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeFeedScreen from '../screens/main/HomeFeedScreen';
import ProfileDashboardScreen from '../screens/main/ProfileDashboardScreen';
import QuestDetailScreen from '../screens/main/QuestDetailScreen';
import QuestResolutionScreen from '../screens/main/QuestResolutionScreen';
import { MainTab } from '../components/BottomNav';

const Stack = createNativeStackNavigator();

const MainTabsScreen = ({ navigation }: { navigation: any }) => {
  const [activeTab, setActiveTab] = useState<MainTab>('Feed');

  const handleTabPress = useCallback((tab: MainTab) => {
    if (tab === 'Feed' || tab === 'Profile') {
      setActiveTab(tab);
    }
  }, []);

  if (activeTab === 'Profile') {
    return (
      <ProfileDashboardScreen
        navigation={navigation}
        onTabPress={handleTabPress}
      />
    );
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
      <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
      <Stack.Screen name="QuestResolution" component={QuestResolutionScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
