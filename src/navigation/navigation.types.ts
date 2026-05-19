/**
 * Shared navigation param lists (import from here to avoid circular deps with AppNavigator).
 */

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
};

export type PatientsStackParamList = {
  PatientsList: undefined;
  PatientDetail: {patientId: string};
  AddEditPatient: {mode: 'add' | 'edit'; patientId?: string};
  PatientChart: {patientId: string; openTreatmentId?: string};
  PatientTreatmentHistory: {patientId: string};
  PatientLedger: {patientId: string};
  PatientDocuments: {patientId: string};
  PatientInvoices: {patientId: string};
  PatientTreatmentPlans: {patientId: string};
  PatientTreatmentPlanDetail: {patientId: string; planId: string};
};

export type AppointmentsStackParamList = {
  AppointmentsList: undefined;
  AppointmentDetail: {appointmentId: string};
  AddEditAppointment: {mode: 'add' | 'edit'; appointmentId?: string};
};

export type DashboardStackParamList = {
  DailyFlow: undefined;
  Overview: undefined;
};

/** Tab root: custom in-screen header only (stack header hidden). */
export type FinancialStackParamList = {
  GlobalTransactions: undefined;
};

export type ReportsStackParamList = {
  ReportsHome: undefined;
  Inventory: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
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
