import React from 'react';
import { Image, StyleSheet, ImageSourcePropType } from 'react-native';

type ImageSpriteProps = {
  source: ImageSourcePropType;
  width?: number;
  height?: number;
};

export default function ImageSprite({ 
  source, 
  width = 45, 
  height = 45 
}: ImageSpriteProps) {
  return (
    <Image
      source={source}
      style={[
        styles.image,
        { width, height }
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
    imageRendering: 'pixelated',
  } as any,
});
