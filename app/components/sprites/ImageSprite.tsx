import React from 'react';
import { Image, StyleSheet, ImageSourcePropType, StyleProp, ImageStyle, Platform } from 'react-native';

type ImageSpriteProps = {
  source: ImageSourcePropType;
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ImageStyle>;
  tintColor?: string;
};

export default function ImageSprite({ 
  source, 
  width = 45, 
  height = 45,
  style,
  tintColor
}: ImageSpriteProps) {
  return (
    <Image
      source={source}
      style={[
        styles.image,
        { width: width as any, height: height as any },
        tintColor ? { tintColor } : undefined,
        style
      ]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
    // Applies pixelated rendering cleanly on web platforms without TS errors
    ...(Platform.OS === 'web' ? { imageRendering: 'pixelated' } : {}),
  } as ImageStyle,
});