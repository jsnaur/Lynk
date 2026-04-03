import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeFeedScreen from '../screens/main/HomeFeedScreen';
import ProfileDashboardScreen from '../screens/main/ProfileDashboardScreen';
import QuestDetailScreen from '../screens/main/QuestDetailScreen';
import QuestResolutionScreen from '../screens/main/QuestResolutionScreen';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeFeed" component={HomeFeedScreen} />
      <Stack.Screen name="ProfileDashboard" component={ProfileDashboardScreen} />
      <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
      <Stack.Screen name="QuestResolution" component={QuestResolutionScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
