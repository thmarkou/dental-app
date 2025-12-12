/**
 * App Navigator
 * Main navigation setup using React Navigation
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useAuthStore} from '../store/auth.store';

// Screens (to be created)
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import PatientsScreen from '../screens/patients/PatientsScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import TreatmentsScreen from '../screens/treatments/TreatmentsScreen';
import FinancialScreen from '../screens/financial/FinancialScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Appointments: undefined;
  Treatments: undefined;
  Financial: undefined;
  Reports: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main Tab Navigator (shown after login)
 */
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientsScreen}
        options={{
          title: 'Ασθενείς',
          tabBarLabel: 'Ασθενείς',
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          title: 'Ραντεβού',
          tabBarLabel: 'Ραντεβού',
        }}
      />
      <Tab.Screen
        name="Treatments"
        component={TreatmentsScreen}
        options={{
          title: 'Θεραπείες',
          tabBarLabel: 'Θεραπείες',
        }}
      />
      <Tab.Screen
        name="Financial"
        component={FinancialScreen}
        options={{
          title: 'Οικονομικά',
          tabBarLabel: 'Οικονομικά',
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'Αναφορές',
          tabBarLabel: 'Αναφορές',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Ρυθμίσεις',
          tabBarLabel: 'Ρυθμίσεις',
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Root Navigator
 */
const AppNavigator = () => {
  const {isAuthenticated} = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

