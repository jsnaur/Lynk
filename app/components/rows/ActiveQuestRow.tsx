import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FEED_COLORS } from '../../constants/colors';

type ActiveQuestRowProps = {
  category?: 'Favor' | 'Study' | 'Item' | 'Pending';
  title?: string;
  role?: string;
  status?: string;
  onPress?: () => void;
  onResolve?: () => void;
};

export default function ActiveQuestRow({
  category = 'Favor',
  title = 'Quest Title',
  role = 'You...',
  status = 'Status',
  onPress,
  onResolve,
}: ActiveQuestRowProps) {
  const isPending = category === 'Pending';
  
  const getCategoryColor = () => {
    switch (category) {
      case 'Favor':
        return FEED_COLORS.favor;
      case 'Study':
        return FEED_COLORS.study;
      case 'Item':
        return FEED_COLORS.item;
      case 'Pending':
        return '#ffffff';
      default:
        return FEED_COLORS.favor;
    }
  };

  const stripeColor = getCategoryColor();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
      
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{role}</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{status}</Text>
        </View>
      </View>

      {!isPending && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color="#8a8a9a"
        />
      )}

      {isPending && (
        <TouchableOpacity
          style={styles.resolveButton}
          onPress={onResolve}
          activeOpacity={0.7}
        >
          <Text style={styles.resolveText}>Resolve</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26262e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a48',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    width: 342,
  },
  stripe: {
    width: 3,
    height: '100%',
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  title: {
    color: '#f0f0f5',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DM_Sans-SemiBold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    color: '#8a8a9a',
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'DM_Sans-Regular',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8a8a9a',
  },
  resolveButton: {
    backgroundColor: FEED_COLORS.item,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resolveText: {
    color: '#1a1a1f',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'DM_Sans-SemiBold',
  },
});
