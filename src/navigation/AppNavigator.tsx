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
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import PatientsScreen from '../screens/patients/PatientsScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import TreatmentsScreen from '../screens/treatments/TreatmentsScreen';
import FinancialScreen from '../screens/financial/FinancialScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Patient screens
import PatientDetailScreen from '../screens/patients/PatientDetailScreen';
import AddEditPatientScreen from '../screens/patients/AddEditPatientScreen';

// Appointment screens
import AppointmentDetailScreen from '../screens/appointments/AppointmentDetailScreen';
import AddEditAppointmentScreen from '../screens/appointments/AddEditAppointmentScreen';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
};

export type PatientsStackParamList = {
  PatientsList: undefined;
  PatientDetail: {patientId: string};
  AddEditPatient: {mode: 'add' | 'edit'; patientId?: string};
};

export type AppointmentsStackParamList = {
  AppointmentsList: undefined;
  AppointmentDetail: {appointmentId: string};
  AddEditAppointment: {mode: 'add' | 'edit'; appointmentId?: string};
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
const PatientsStack = createNativeStackNavigator<PatientsStackParamList>();
const AppointmentsStack = createNativeStackNavigator<AppointmentsStackParamList>();

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
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          headerShown: true,
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
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
        component={TreatmentsScreen}
        options={{
          title: 'Treatments',
          tabBarLabel: 'Treatments',
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="medical-services" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Financial"
        component={FinancialScreen}
        options={{
          title: 'Financial',
          tabBarLabel: 'Financial',
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
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
        component={SettingsScreen}
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

