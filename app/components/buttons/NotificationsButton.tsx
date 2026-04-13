import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type NotificationsButtonProps = {
  count?: number;
  onPress?: () => void;
};

export default function NotificationsButton({
  count = 0,
  onPress,
}: NotificationsButtonProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications" size={24} color="#f0f0f5" />
      
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4d4d',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#26262e',
  },
  badgeText: {
    color: '#f0f0f5',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'DM_Sans-SemiBold',
    textAlign: 'center',
  },
});
