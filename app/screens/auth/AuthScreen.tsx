import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const AuthScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Lynk</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ProfileSetup')}
      >
        <Text style={styles.buttonText}>Go to Profile Setup</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AuthScreen;
