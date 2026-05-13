import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { screenHeaderTheme, useTheme } from '../../contexts/ThemeContext';

type Props = {
  title: string;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export default function ScreenHeader({ title, right, style }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
      {right ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: screenHeaderTheme.layout.height,
    paddingHorizontal: screenHeaderTheme.layout.horizontalPadding,
    paddingTop: screenHeaderTheme.layout.topPadding,
    paddingBottom: screenHeaderTheme.layout.bottomPadding,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  title: {
    ...screenHeaderTheme.text.title,
  },
});
