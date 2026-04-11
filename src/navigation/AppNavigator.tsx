/**
 * App Navigator
 * Main navigation setup using React Navigation
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useAuthStore} from '../store/auth.store';
import {MaterialIcons} from '@expo/vector-icons';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import OverviewScreen from '../screens/dashboard/OverviewScreen';
import DailyFlowScreen from '../screens/dashboard/DailyFlowScreen';
import PatientsScreen from '../screens/patients/PatientsScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import GlobalTransactionsScreen from '../screens/financial/GlobalTransactionsScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Patient screens
import PatientDetailScreen from '../screens/patients/PatientDetailScreen';
import AddEditPatientScreen from '../screens/patients/AddEditPatientScreen';

// Appointment screens
import AppointmentDetailScreen from '../screens/appointments/AppointmentDetailScreen';
import AddEditAppointmentScreen from '../screens/appointments/AddEditAppointmentScreen';

import PatientChartScreen from '../screens/clinical/PatientChartScreen';
import PatientTreatmentHistoryScreen from '../screens/clinical/PatientTreatmentHistoryScreen';
import PatientLedgerScreen from '../screens/patients/PatientLedgerScreen';

export type {
  RootStackParamList,
  PatientsStackParamList,
  AppointmentsStackParamList,
  DashboardStackParamList,
  FinancialStackParamList,
  ReportsStackParamList,
  SettingsStackParamList,
  MainTabParamList,
} from './navigation.types';

import type {
  RootStackParamList,
  PatientsStackParamList,
  AppointmentsStackParamList,
  DashboardStackParamList,
  FinancialStackParamList,
  ReportsStackParamList,
  SettingsStackParamList,
  MainTabParamList,
} from './navigation.types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const ClinicStack = createNativeStackNavigator<DashboardStackParamList>();
const PatientsStack = createNativeStackNavigator<PatientsStackParamList>();
const AppointmentsStack = createNativeStackNavigator<AppointmentsStackParamList>();
const FinancialStack = createNativeStackNavigator<FinancialStackParamList>();
const ReportsStack = createNativeStackNavigator<ReportsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const DashboardStackNavigator = () => {
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerShown: true,
      }}>
      <DashboardStack.Screen
        name="DailyFlow"
        component={DailyFlowScreen}
        options={{
          title: 'Today · Clinic flow',
        }}
      />
      <DashboardStack.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          title: 'Overview',
        }}
      />
    </DashboardStack.Navigator>
  );
};

/** Clinic tab: same DailyFlow + Overview as dashboard. */
const ClinicStackNavigator = () => {
  return (
    <ClinicStack.Navigator
      screenOptions={{
        headerShown: true,
      }}>
      <ClinicStack.Screen
        name="DailyFlow"
        component={DailyFlowScreen}
        options={{
          title: 'Clinic · Daily flow',
        }}
      />
      <ClinicStack.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          title: 'Overview',
        }}
      />
    </ClinicStack.Navigator>
  );
};

/**
 * Patients Stack Navigator (nested in Patients tab)
 */
const PatientsStackNavigator = () => {
  return (
    <PatientsStack.Navigator
      screenOptions={{
        headerShown: true,
      }}>
      <PatientsStack.Screen
        name="PatientsList"
        component={PatientsScreen}
        options={{
          title: 'Patients',
        }}
      />
      <PatientsStack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{
          title: 'Patient Details',
        }}
      />
      <PatientsStack.Screen
        name="AddEditPatient"
        component={AddEditPatientScreen}
        options={({route}) => ({
          title: route.params.mode === 'add' ? 'Add Patient' : 'Edit Patient',
        })}
      />
      <PatientsStack.Screen
        name="PatientChart"
        component={PatientChartScreen}
        options={{
          title: 'Dental Chart',
        }}
      />
      <PatientsStack.Screen
        name="PatientTreatmentHistory"
        component={PatientTreatmentHistoryScreen}
        options={{
          title: 'Treatment History',
        }}
      />
      <PatientsStack.Screen
        name="PatientLedger"
        component={PatientLedgerScreen}
        options={{
          title: 'Account & payments',
        }}
      />
    </PatientsStack.Navigator>
  );
};

/**
 * Appointments Stack Navigator (nested in Appointments tab)
 */
const AppointmentsStackNavigator = () => {
  return (
    <AppointmentsStack.Navigator
      screenOptions={{
        headerShown: true,
      }}>
      <AppointmentsStack.Screen
        name="AppointmentsList"
        component={AppointmentsScreen}
        options={{
          title: 'Appointments',
        }}
      />
      <AppointmentsStack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{
          title: 'Appointment Details',
        }}
      />
      <AppointmentsStack.Screen
        name="AddEditAppointment"
        component={AddEditAppointmentScreen}
        options={({route}) => ({
          title: route.params.mode === 'add' ? 'Add Appointment' : 'Edit Appointment',
        })}
      />
    </AppointmentsStack.Navigator>
  );
};

/** Cash register tab — custom in-screen header only. */
const FinancialStackNavigator = () => (
  <FinancialStack.Navigator screenOptions={{headerShown: false}}>
    <FinancialStack.Screen
      name="GlobalTransactions"
      component={GlobalTransactionsScreen}
    />
  </FinancialStack.Navigator>
);

/** Reports — in-screen title; no native header. */
const ReportsStackNavigator = () => (
  <ReportsStack.Navigator screenOptions={{headerShown: false}}>
    <ReportsStack.Screen name="ReportsHome" component={ReportsScreen} />
  </ReportsStack.Navigator>
);

/** Settings — in-screen layout; no native header (same safe area as Cash / Reports). */
const SettingsStackNavigator = () => (
  <SettingsStack.Navigator screenOptions={{headerShown: false}}>
    <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} />
  </SettingsStack.Navigator>
);

/**
 * Main Tab Navigator (shown after login)
 */
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {fontSize: 10},
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Today',
          headerShown: false,
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="event" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientsStackNavigator}
        options={{
          title: 'Patients',
          tabBarLabel: 'Patients',
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsStackNavigator}
        options={{
          title: 'Appointments',
          tabBarLabel: 'Appointments',
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="event" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Treatments"
        component={ClinicStackNavigator}
        options={{
          title: 'Clinic',
          tabBarLabel: 'Clinic',
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="medical-services" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Financial"
        component={FinancialStackNavigator}
        options={{
          title: 'Cash register',
          tabBarLabel: 'Cash',
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsStackNavigator}
        options={{
          title: 'Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="assessment" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
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
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

