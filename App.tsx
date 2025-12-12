/**
 * Dental Practice Management Application
 * Main App Component
 */

import React, {useEffect, useState} from 'react';
import {StatusBar, View, ActivityIndicator, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import {initDatabase} from './src/services/database';
import {useAuthStore} from './src/store/auth.store';

const App = (): React.JSX.Element => {
  const [isInitializing, setIsInitializing] = useState(true);
  const {checkAuth} = useAuthStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        await initDatabase();

        // Check authentication
        await checkAuth();

        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [checkAuth]);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default App;

