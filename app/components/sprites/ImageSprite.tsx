import React from 'react';
import { Image, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle, ImageStyle } from 'react-native';

type ImageSpriteProps = {
  source: ImageSourcePropType;
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ImageStyle>;
};

export default function ImageSprite({ 
  source, 
  width = 45, 
  height = 45,
  style 
}: ImageSpriteProps) {
  return (
    <Image
      source={source}
      style={[
        styles.image,
        { width: width as any, height: height as any },
        style
      ]}
      resizeMode="contain"
      onLoad={(e) => {
        // Log loaded dimensions for debugging if needed
      }}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
    // Used primarily for web to keep sprites sharp. Ignored safely in native.
    imageRendering: 'pixelated', 
  } as any,
});