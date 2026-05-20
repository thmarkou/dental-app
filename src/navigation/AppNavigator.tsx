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
import {el} from '../i18n';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import OverviewScreen from '../screens/dashboard/OverviewScreen';
import DailyFlowScreen from '../screens/dashboard/DailyFlowScreen';
import PatientsScreen from '../screens/patients/PatientsScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import GlobalTransactionsScreen from '../screens/financial/GlobalTransactionsScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import InventoryScreen from '../screens/admin/InventoryScreen';
import ProcedureInventoryLinksScreen from '../screens/admin/ProcedureInventoryLinksScreen';
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
import PatientDocumentsScreen from '../screens/clinical/PatientDocumentsScreen';
import PatientInvoicesScreen from '../screens/financial/PatientInvoicesScreen';
import PatientTreatmentPlansScreen from '../screens/clinical/PatientTreatmentPlansScreen';
import PatientTreatmentPlanDetailScreen from '../screens/clinical/PatientTreatmentPlanDetailScreen';

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
          title: el.nav.todayClinicFlow,
        }}
      />
      <DashboardStack.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          title: el.nav.overview,
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
          title: el.nav.clinicDailyFlow,
        }}
      />
      <ClinicStack.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          title: el.nav.overview,
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
          title: el.nav.tabPatients,
        }}
      />
      <PatientsStack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{
          title: el.nav.patientDetails,
        }}
      />
      <PatientsStack.Screen
        name="AddEditPatient"
        component={AddEditPatientScreen}
        options={({route}) => ({
          title:
            route.params.mode === 'add' ? el.nav.addPatient : el.nav.editPatient,
        })}
      />
      <PatientsStack.Screen
        name="PatientChart"
        component={PatientChartScreen}
        options={{
          title: el.nav.dentalChart,
        }}
      />
      <PatientsStack.Screen
        name="PatientTreatmentHistory"
        component={PatientTreatmentHistoryScreen}
        options={{
          title: el.nav.treatmentHistory,
        }}
      />
      <PatientsStack.Screen
        name="PatientLedger"
        component={PatientLedgerScreen}
        options={{
          title: el.nav.accountPayments,
        }}
      />
      <PatientsStack.Screen
        name="PatientDocuments"
        component={PatientDocumentsScreen}
        options={{
          title: el.nav.documentsXrays,
        }}
      />
      <PatientsStack.Screen
        name="PatientInvoices"
        component={PatientInvoicesScreen}
        options={{
          title: el.nav.invoicesReceipts,
        }}
      />
      <PatientsStack.Screen
        name="PatientTreatmentPlans"
        component={PatientTreatmentPlansScreen}
        options={{
          title: el.nav.treatmentPlans,
        }}
      />
      <PatientsStack.Screen
        name="PatientTreatmentPlanDetail"
        component={PatientTreatmentPlanDetailScreen}
        options={{
          title: el.nav.treatmentPlan,
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
          title: el.nav.appointments,
        }}
      />
      <AppointmentsStack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{
          title: el.nav.appointmentDetails,
        }}
      />
      <AppointmentsStack.Screen
        name="AddEditAppointment"
        component={AddEditAppointmentScreen}
        options={({route}) => ({
          title:
            route.params.mode === 'add'
              ? el.nav.addAppointment
              : el.nav.editAppointment,
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
    <ReportsStack.Screen name="Inventory" component={InventoryScreen} />
    <ReportsStack.Screen
      name="ProcedureInventoryLinks"
      component={ProcedureInventoryLinksScreen}
    />
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
          title: el.nav.dashboard,
          tabBarLabel: el.nav.tabToday,
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
          title: el.nav.tabPatients,
          tabBarLabel: el.nav.tabPatients,
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsStackNavigator}
        options={{
          title: el.nav.appointments,
          tabBarLabel: el.nav.tabAppointments,
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="event" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Treatments"
        component={ClinicStackNavigator}
        options={{
          title: el.nav.tabClinic,
          tabBarLabel: el.nav.tabClinic,
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="medical-services" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Financial"
        component={FinancialStackNavigator}
        options={{
          title: el.nav.cashRegister,
          tabBarLabel: el.nav.tabCash,
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsStackNavigator}
        options={{
          title: el.nav.reports,
          tabBarLabel: el.nav.tabReports,
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="assessment" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          title: el.nav.settings,
          tabBarLabel: el.nav.tabSettings,
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

