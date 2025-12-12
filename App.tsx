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
        // Note: expo-sqlite may need the app to be fully loaded
        // Add a small delay to ensure Expo is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await initDatabase();

        // Check authentication
        await checkAuth();

        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Don't block app startup if database init fails
        // The app can still run, database will be initialized when needed
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

