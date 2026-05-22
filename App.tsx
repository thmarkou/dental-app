/**
 * Dental Practice Management Application
 * Main App Component
 */

import './src/polyfills/crypto';
import './global.css';
import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet, Platform} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import {initDatabase} from './src/services/database';
import {
  ensureAppointmentNotificationChannel,
  processDueSmsReminders,
} from './src/services/appointment/reminderScheduler.service';
import {startAppointmentReminderTick} from './src/services/appointment/reminderTick.service';
import {registerExpoPushTokenOnLaunch} from './src/services/appointment/pushToken.service';
import {registerNotificationPresentationHandler} from './src/services/system/backupReminder.service';
import {useAuthStore} from './src/store/auth.store';

if (Platform.OS !== 'web') {
  registerNotificationPresentationHandler();
}

const App = (): React.JSX.Element => {
  const [isInitializing, setIsInitializing] = useState(true);
  const {checkAuth} = useAuthStore();

  useEffect(() => {
    let stopReminderTick: (() => void) | undefined;

    const initializeApp = async () => {
      try {
        // Initialize database
        // Note: expo-sqlite requires development build
        // If running in Expo Go, database init will be skipped gracefully
        await initDatabase();
        await checkAuth();
        setIsInitializing(false);

        if (Platform.OS !== 'web') {
          void (async () => {
            await ensureAppointmentNotificationChannel();
            void processDueSmsReminders();
            stopReminderTick = startAppointmentReminderTick();
            void registerExpoPushTokenOnLaunch();
          })();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Don't block app startup - allow UI to show
        setIsInitializing(false);
      }
    };

    void initializeApp();

    return () => {
      stopReminderTick?.();
    };
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
      <StatusBar style="dark" backgroundColor="#ffffff" />
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

