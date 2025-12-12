# Dental Practice Management System - Detailed Specification Document

## Executive Summary

This document provides comprehensive specifications for a React Native mobile application designed to manage a small Greek dental practice. The system is tailored for practices with 2-3 staff members (dentist, assistant, and optionally a secretary) and addresses all aspects of practice management including patient care, appointments, treatments, financial management, and compliance with Greek regulations.

**Critical Requirement**: The application must operate in complete isolation from other applications in the same directory, using environment variables and isolated configurations to prevent conflicts.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Native Application                │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer (UI Components)                      │
│  - Patient Management UI                                 │
│  - Appointment Scheduling UI                             │
│  - Treatment Recording UI                               │
│  - Financial Management UI                              │
│  - Reports & Analytics UI                               │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                    │
│  - Patient Service                                       │
│  - Appointment Service                                   │
│  - Treatment Service                                     │
│  - Financial Service                                     │
│  - Inventory Service                                     │
│  - Notification Service                                  │
├─────────────────────────────────────────────────────────┤
│  Data Access Layer                                       │
│  - Local Database (SQLite/WatermelonDB)                 │
│  - Sync Manager                                          │
│  - Cache Manager                                         │
├─────────────────────────────────────────────────────────┤
│  Integration Layer                                       │
│  - SMS Gateway API                                       │
│  - Email Service API                                     │
│  - myDATA API (Greek Tax)                                │
│  - Cloud Backup Service (Optional)                       │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → UI Component → Service Layer → Data Access Layer → Local DB
                                                      ↓
                                              Sync Manager
                                                      ↓
                                            Cloud/External APIs
```

### Environment Isolation Strategy

**Isolation Requirements**:
1. **Separate Configuration**:
   - Environment variables file: `.env.dentalapp`
   - Separate `package.json` with unique package name
   - Isolated `node_modules` directory
   - Separate build configuration files

2. **Database Isolation**:
   - Separate database file: `dentalapp.db` (not shared)
   - Isolated database schema with prefix: `dentalapp_`
   - Separate migration files

3. **Storage Isolation**:
   - Separate AsyncStorage keys with prefix: `@dentalapp:`
   - Isolated file storage paths
   - Separate cache directories

4. **App Identification**:
   - Unique bundle identifier (iOS): `com.dentalapp.practice`
   - Unique package name (Android): `com.dentalapp.practice`
   - Separate app icons and assets

5. **Dependency Management**:
   - No shared dependencies that could conflict
   - Version pinning for all dependencies
   - Separate lock files

## Module Specifications

### 1. Patient Management Module

#### Data Fields

**Personal Information**:
```typescript
interface PatientPersonalInfo {
  id: string;                    // UUID
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  amka?: string;                 // Greek Social Security Number (optional)
  phone: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;             // Default: Greece
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  occupation?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Medical History**:
```typescript
interface MedicalHistory {
  patientId: string;
  generalConditions: string[];    // e.g., ["Diabetes", "Hypertension"]
  currentMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  allergies: Array<{
    substance: string;
    reaction: string;
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  previousSurgeries: string[];
  chronicDiseases: string[];
  pregnancyStatus?: 'not_pregnant' | 'pregnant' | 'breastfeeding';
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    date: Date;
  };
  notes?: string;
  lastUpdated: Date;
}
```

**Dental History**:
```typescript
interface DentalHistory {
  patientId: string;
  previousTreatments: Array<{
    treatmentType: string;
    date: Date;
    description: string;
    performedBy?: string;         // Other dentist/practice
  }>;
  orthodonticHistory: {
    hasPreviousTreatment: boolean;
    treatmentType?: string;
    duration?: string;
    completionDate?: Date;
  };
  oralHygiene: {
    brushingFrequency: 'once' | 'twice' | 'thrice' | 'more';
    flossingFrequency: 'daily' | 'weekly' | 'rarely' | 'never';
    mouthwashUsage: boolean;
  };
  habits: {
    smoking: {
      status: 'never' | 'former' | 'current';
      frequency?: string;
      duration?: string;
    };
    alcohol: {
      status: 'never' | 'occasional' | 'regular';
      frequency?: string;
    };
    bruxism: boolean;
    tmjIssues: boolean;
  };
  lastUpdated: Date;
}
```

**Patient Documents**:
```typescript
interface PatientDocument {
  id: string;
  patientId: string;
  type: 'consent' | 'medical_history' | 'treatment_plan' | 'insurance' | 'xray' | 'photo' | 'other';
  title: string;
  filePath: string;
  fileType: string;              // MIME type
  fileSize: number;              // bytes
  uploadedAt: Date;
  uploadedBy: string;            // User ID
  notes?: string;
}
```

#### Functionality

**Patient Registration Workflow**:
1. Create new patient record
2. Enter personal information
3. Complete medical history form
4. Complete dental history form
5. Upload consent forms (GDPR)
6. Save patient record
7. Generate patient ID

**Patient Search**:
- Full-text search on: name, phone, email, AMKA
- Filter by: last visit date, treatment type, outstanding balance
- Sort by: name, last visit, registration date

**Patient Profile View**:
- Personal information card
- Medical history summary
- Dental history summary
- Active treatment plans
- Recent appointments
- Financial summary
- Documents list
- Dental chart (odontogram)

**Patient Update Workflow**:
1. Select patient
2. Edit relevant section
3. Save changes
4. Log update (audit trail)

### 2. Appointment Management Module

#### Data Model

```typescript
interface Appointment {
  id: string;
  patientId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  duration: number;              // minutes
  type: AppointmentType;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  doctorId: string;
  notes?: string;
  reminderSent: boolean;
  reminderSentAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

enum AppointmentType {
  INITIAL_CONSULTATION = 'initial_consultation',
  REGULAR_CHECKUP = 'regular_checkup',
  CLEANING = 'cleaning',
  TREATMENT = 'treatment',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  CONSULTATION = 'consultation'
}
```

**Recurring Appointment Series**:
```typescript
interface RecurringAppointmentSeries {
  id: string;
  patientId: string;
  baseAppointment: Appointment;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  numberOfAppointments?: number;  // If set, series ends after this many
  endDate?: Date;                 // If set, series ends on this date
  generatedAppointments: string[]; // Array of appointment IDs
  isActive: boolean;
  createdAt: Date;
}
```

#### Scheduling Rules

**Business Hours**:
- Default: Monday-Friday 9:00-18:00
- Configurable per day
- Lunch break configuration
- Holiday calendar

**Appointment Duration Defaults**:
- Initial consultation: 60 minutes
- Regular check-up: 30 minutes
- Cleaning: 45 minutes
- Treatment: 30-90 minutes (configurable)
- Follow-up: 15-30 minutes
- Emergency: 30-60 minutes

**Conflict Prevention**:
- Check doctor availability
- Check patient existing appointments
- Prevent double booking
- Warn about short intervals between appointments

#### Follow-up Scheduling Logic

**Automatic Follow-up Suggestions**:

1. **Post-Treatment Follow-ups**:
   - Root canal: 1 week, 1 month, 6 months
   - Extraction: 1 week
   - Implant placement: 1 week, 1 month, 3 months, 6 months
   - Surgery: 1 week, 1 month
   - Crown/bridge placement: 1 week

2. **Maintenance Appointments**:
   - Cleaning: Every 6 months
   - Orthodontic adjustment: Every 4-6 weeks
   - Implant check: Every 6-12 months

3. **Treatment Plan Phases**:
   - Automatically schedule next phase appointments
   - Link appointments to treatment plan

#### Reminder System

**Reminder Configuration**:
```typescript
interface ReminderSettings {
  enabled: boolean;
  methods: ('sms' | 'email' | 'push')[];
  timing: {
    hoursBefore: number;         // e.g., 24 hours
    additionalReminders?: number[]; // e.g., [48, 72] hours
  };
  patientPreferences?: {
    [patientId: string]: {
      preferredMethod: 'sms' | 'email' | 'push';
      optOut: boolean;
    };
  };
}
```

**Reminder Workflow**:
1. System checks upcoming appointments
2. Calculates reminder send time
3. Sends reminder via configured method
4. Marks reminder as sent
5. Logs reminder delivery status

### 3. Examination & Treatment Management Module

#### Examination Types

**Clinical Examinations**:
```typescript
interface ClinicalExamination {
  id: string;
  patientId: string;
  date: Date;
  type: 'intraoral' | 'extraoral' | 'periodontal' | 'occlusion' | 'tmj' | 'cancer_screening';
  findings: {
    [key: string]: string | number | boolean;
  };
  notes: string;
  performedBy: string;
  images?: string[];              // Image file paths
}
```

**X-ray Examinations**:
```typescript
interface XRayExamination {
  id: string;
  patientId: string;
  date: Date;
  type: 'bitewing' | 'periapical' | 'panoramic' | 'cbct' | 'cephalometric';
  imagePath: string;
  description?: string;
  findings?: string;
  takenBy: string;
  comparisonWith?: string;        // Previous X-ray ID
}
```

**Photographic Examinations**:
```typescript
interface PhotographicExamination {
  id: string;
  patientId: string;
  date: Date;
  type: 'intraoral' | 'extraoral' | 'smile_analysis' | 'before_after';
  images: Array<{
    path: string;
    description: string;
    toothNumbers?: number[];      // If applicable
  }>;
  takenBy: string;
}
```

#### Treatment Data Model

```typescript
interface Treatment {
  id: string;
  patientId: string;
  treatmentPlanId?: string;      // If part of a treatment plan
  date: Date;
  startTime: Date;
  endTime: Date;
  type: TreatmentType;
  category: TreatmentCategory;
  teeth: number[];                // FDI tooth numbering
  description: string;
  clinicalNotes: string;
  preTreatmentCondition: string;
  procedurePerformed: string;
  complications?: string;
  postTreatmentInstructions: string;
  doctorId: string;
  assistantId?: string;
  materialsUsed: MaterialUsage[];
  cost: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
  images?: string[];
  xrays?: string[];               // Linked X-ray IDs
  createdAt: Date;
  updatedAt: Date;
}

enum TreatmentCategory {
  PREVENTIVE = 'preventive',
  RESTORATIVE = 'restorative',
  ENDODONTIC = 'endodontic',
  SURGICAL = 'surgical',
  PROSTHETIC = 'prosthetic',
  ORTHODONTIC = 'orthodontic',
  PERIODONTAL = 'periodontal',
  AESTHETIC = 'aesthetic',
  EMERGENCY = 'emergency'
}

enum TreatmentType {
  // Preventive
  CLEANING = 'cleaning',
  FLUORIDE_TREATMENT = 'fluoride_treatment',
  SEALANT = 'sealant',
  
  // Restorative
  COMPOSITE_FILLING = 'composite_filling',
  AMALGAM_FILLING = 'amalgam_filling',
  INLAY = 'inlay',
  ONLAY = 'onlay',
  CROWN = 'crown',
  TEMPORARY_CROWN = 'temporary_crown',
  
  // Endodontic
  ROOT_CANAL_SINGLE = 'root_canal_single',
  ROOT_CANAL_MULTI = 'root_canal_multi',
  ROOT_CANAL_RETREATMENT = 'root_canal_retreatment',
  APICECTOMY = 'apicectomy',
  
  // Surgical
  SIMPLE_EXTRACTION = 'simple_extraction',
  SURGICAL_EXTRACTION = 'surgical_extraction',
  WISDOM_TOOTH_EXTRACTION = 'wisdom_tooth_extraction',
  IMPLANT_PLACEMENT = 'implant_placement',
  BONE_GRAFT = 'bone_graft',
  SINUS_LIFT = 'sinus_lift',
  GUM_SURGERY = 'gum_surgery',
  
  // Prosthetic
  FULL_DENTURE = 'full_denture',
  PARTIAL_DENTURE = 'partial_denture',
  BRIDGE = 'bridge',
  VENEER = 'veneer',
  
  // Orthodontic
  BRACES_PLACEMENT = 'braces_placement',
  BRACES_ADJUSTMENT = 'braces_adjustment',
  BRACES_REMOVAL = 'braces_removal',
  RETAINER_FITTING = 'retainer_fitting',
  CLEAR_ALIGNERS = 'clear_aligners',
  
  // Periodontal
  SCALING_ROOT_PLANING = 'scaling_root_planing',
  PERIODONTAL_MAINTENANCE = 'periodontal_maintenance',
  GUM_GRAFT = 'gum_graft',
  
  // Aesthetic
  TEETH_WHITENING = 'teeth_whitening',
  COMPOSITE_BONDING = 'composite_bonding',
  GUM_CONTOURING = 'gum_contouring',
  
  // Emergency
  EMERGENCY_EXAMINATION = 'emergency_examination',
  PAIN_RELIEF = 'pain_relief',
  TEMPORARY_FILLING = 'temporary_filling',
  TRAUMA_TREATMENT = 'trauma_treatment'
}

interface MaterialUsage {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  cost: number;
}
```

#### Treatment Plan Model

```typescript
interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  description: string;
  phases: TreatmentPlanPhase[];
  totalEstimatedCost: number;
  status: 'draft' | 'presented' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  approvedAt?: Date;
  approvedBy?: string;            // Patient signature/user
  consentFormId?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

interface TreatmentPlanPhase {
  id: string;
  phaseNumber: number;
  name: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  treatments: TreatmentPlanItem[];
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

interface TreatmentPlanItem {
  treatmentType: TreatmentType;
  teeth: number[];
  description: string;
  estimatedCost: number;
  estimatedDuration: number;       // minutes
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  treatmentId?: string;            // If treatment has been performed
}
```

#### Dental Charting (Odontogram)

```typescript
interface DentalChart {
  patientId: string;
  lastUpdated: Date;
  teeth: {
    [toothNumber: number]: {      // FDI numbering (11-18, 21-28, 31-38, 41-48)
      condition: ToothCondition;
      treatments: string[];        // Treatment IDs
      notes?: string;
      lastUpdated: Date;
    };
  };
  history: DentalChartSnapshot[];  // Historical snapshots
}

enum ToothCondition {
  HEALTHY = 'healthy',
  CARIES = 'caries',
  FILLING = 'filling',
  CROWN = 'crown',
  MISSING = 'missing',
  IMPACTED = 'impacted',
  ROOT_CANAL_TREATED = 'root_canal_treated',
  IMPLANT = 'implant',
  BRIDGE = 'bridge',
  MOBILITY = 'mobility',
  EXTRACTION_NEEDED = 'extraction_needed',
  OTHER = 'other'
}

interface DentalChartSnapshot {
  date: Date;
  chart: DentalChart;
  reason: string;                  // e.g., "After root canal treatment"
}
```

### 4. Financial Management Module

#### Service Pricing Model

```typescript
interface Service {
  id: string;
  code: string;                    // Service code
  name: string;
  nameGreek: string;               // Greek name
  category: TreatmentCategory;
  defaultPrice: number;
  vatRate: number;                 // 24% in Greece (if applicable)
  duration: number;                 // minutes
  isActive: boolean;
  description?: string;
  materials?: string[];             // Common materials used
  priceHistory: PriceHistoryEntry[];
}

interface PriceHistoryEntry {
  price: number;
  effectiveDate: Date;
  changedBy: string;
}

interface PatientSpecificPrice {
  patientId: string;
  serviceId: string;
  customPrice: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason: string;
  };
  validUntil?: Date;
}
```

#### Invoice Model

```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;           // Sequential, unique
  patientId: string;
  date: Date;
  dueDate?: Date;
  services: InvoiceItem[];
  subtotal: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  paymentMethod?: PaymentMethod;
  payments: Payment[];
  outstandingBalance: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}
```

#### Receipt Model (Greek Requirements)

```typescript
interface Receipt {
  id: string;
  receiptNumber: string;           // Sequential, unique
  invoiceId?: string;              // If linked to invoice
  patientId: string;
  date: Date;
  time: Date;
  services: ReceiptItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;       // Transaction reference
  myDataSubmitted: boolean;
  myDataSubmissionId?: string;
  myDataSubmittedAt?: Date;
  qrCode?: string;                 // QR code for myDATA
  practiceInfo: {
    name: string;
    address: string;
    taxId: string;                 // AFM (ΑΦΜ)
    phone: string;
    email?: string;
  };
  createdAt: Date;
  createdBy: string;
}

interface ReceiptItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  totalPrice: number;
}

enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  INSTALLMENT = 'installment'
}
```

#### Payment Model

```typescript
interface Payment {
  id: string;
  invoiceId?: string;
  receiptId?: string;
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  referenceNumber?: string;
  notes?: string;
  isInstallment: boolean;
  installmentPlanId?: string;
  recordedBy: string;
  createdAt: Date;
}

interface InstallmentPlan {
  id: string;
  patientId: string;
  invoiceId: string;
  totalAmount: number;
  numberOfInstallments: number;
  installmentAmount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: Date;
  installments: Installment[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

interface Installment {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: Date;
  paymentId?: string;
}
```

#### myDATA Integration

**myDATA Requirements** (Greek Tax Authority):
- Submit receipt data to myDATA platform
- Include practice information (AFM, name, address)
- Include patient information (if required)
- Include service details with VAT
- Generate QR code
- Track submission status
- Handle submission errors

**myDATA API Integration**:
```typescript
interface MyDataSubmission {
  receiptId: string;
  submissionData: {
    // Practice info
    practiceAFM: string;
    practiceName: string;
    // Receipt info
    receiptNumber: string;
    date: Date;
    totalAmount: number;
    vatAmount: number;
    // Services
    services: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
    }>;
  };
  status: 'pending' | 'submitted' | 'success' | 'failed';
  submittedAt?: Date;
  errorMessage?: string;
  retryCount: number;
}
```

### 5. Inventory Management Module

#### Inventory Data Model

```typescript
interface InventoryItem {
  id: string;
  code: string;                    // Item code/SKU
  name: string;
  category: InventoryCategory;
  description?: string;
  unit: string;                    // e.g., "pieces", "ml", "grams"
  currentStock: number;
  minimumStock: number;            // Reorder point
  maximumStock: number;
  unitCost: number;
  supplierId?: string;
  supplierName?: string;
  expirationDate?: Date;
  location?: string;               // Storage location
  isActive: boolean;
  lastRestocked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

enum InventoryCategory {
  ANESTHETIC = 'anesthetic',
  FILLING_MATERIALS = 'filling_materials',
  CROWNS = 'crowns',
  IMPLANTS = 'implants',
  ORTHODONTIC = 'orthodontic',
  PERIODONTAL = 'periodontal',
  CLEANING_SUPPLIES = 'cleaning_supplies',
  DISPOSABLES = 'disposables',
  EQUIPMENT = 'equipment',
  OTHER = 'other'
}

interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'purchase' | 'usage' | 'adjustment' | 'transfer' | 'expired' | 'damaged';
  quantity: number;               // Positive for purchase, negative for usage
  unitCost?: number;               // For purchases
  totalCost?: number;
  referenceId?: string;            // Treatment ID, Purchase Order ID, etc.
  notes?: string;
  performedBy: string;
  date: Date;
  createdAt: Date;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  orderDate: Date;
  expectedDeliveryDate?: Date;
  receivedDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
```

#### Inventory Operations

**Stock Usage Tracking**:
- Automatically deduct from inventory when materials are used in treatments
- Link usage to specific treatment
- Track cost per treatment

**Low Stock Alerts**:
- Check stock levels daily
- Alert when stock <= minimumStock
- Generate reorder suggestions
- Priority alerts for critical items

**Inventory Reports**:
- Current stock levels
- Low stock items
- Usage statistics (by item, by period)
- Cost analysis
- Expiring items (if applicable)
- Purchase history

### 6. Reporting & Analytics Module

#### Report Types

**Patient Reports**:
```typescript
interface PatientReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalPatients: number;
  newPatients: number;
  activePatients: number;
  inactivePatients: number;
  demographics: {
    ageGroups: { [ageGroup: string]: number };
    genderDistribution: { [gender: string]: number };
  };
  topTreatments: Array<{
    treatmentType: string;
    count: number;
  }>;
}
```

**Financial Reports**:
```typescript
interface FinancialReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalRevenue: number;
  totalExpenses?: number;
  netProfit?: number;
  revenueByService: Array<{
    serviceName: string;
    count: number;
    totalRevenue: number;
  }>;
  revenueByPaymentMethod: {
    [method: string]: number;
  };
  outstandingReceivables: number;
  averageTransactionValue: number;
  dailyRevenue: Array<{
    date: Date;
    revenue: number;
    transactions: number;
  }>;
}
```

**Treatment Reports**:
```typescript
interface TreatmentReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalTreatments: number;
  treatmentsByCategory: {
    [category: string]: number;
  };
  mostCommonTreatments: Array<{
    treatmentType: string;
    count: number;
  }>;
  treatmentTrends: Array<{
    month: string;
    count: number;
  }>;
}
```

**Operational Reports**:
```typescript
interface OperationalReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  noShowRate: number;
  averageAppointmentDuration: number;
  busiestDays: Array<{
    day: string;
    appointmentCount: number;
  }>;
  busiestTimes: Array<{
    hour: number;
    appointmentCount: number;
  }>;
  doctorProductivity: Array<{
    doctorId: string;
    doctorName: string;
    appointments: number;
    treatments: number;
    revenue: number;
  }>;
}
```

### 7. Communication Module

#### SMS Integration

```typescript
interface SMSMessage {
  id: string;
  patientId: string;
  phoneNumber: string;
  message: string;
  templateId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  cost?: number;
  createdAt: Date;
}

interface SMSTemplate {
  id: string;
  name: string;
  type: 'appointment_reminder' | 'payment_reminder' | 'follow_up' | 'general';
  message: string;
  variables: string[];             // e.g., ["{patientName}", "{appointmentDate}"]
  isActive: boolean;
}
```

#### Email Integration

```typescript
interface EmailMessage {
  id: string;
  patientId: string;
  emailAddress: string;
  subject: string;
  body: string;
  templateId?: string;
  attachments?: string[];
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: 'appointment_confirmation' | 'appointment_reminder' | 'treatment_instructions' | 'general';
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
}
```

### 8. User Management & Roles

#### User Model

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;            // Hashed, never store plain text
  role: UserRole;
  personalInfo: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

enum UserRole {
  DOCTOR = 'doctor',
  ASSISTANT = 'assistant',
  SECRETARY = 'secretary'
}

enum Permission {
  // Patient permissions
  VIEW_PATIENTS = 'view_patients',
  CREATE_PATIENTS = 'create_patients',
  EDIT_PATIENTS = 'edit_patients',
  DELETE_PATIENTS = 'delete_patients',
  VIEW_MEDICAL_HISTORY = 'view_medical_history',
  EDIT_MEDICAL_HISTORY = 'edit_medical_history',
  
  // Appointment permissions
  VIEW_APPOINTMENTS = 'view_appointments',
  CREATE_APPOINTMENTS = 'create_appointments',
  EDIT_APPOINTMENTS = 'edit_appointments',
  CANCEL_APPOINTMENTS = 'cancel_appointments',
  
  // Treatment permissions
  VIEW_TREATMENTS = 'view_treatments',
  CREATE_TREATMENTS = 'create_treatments',
  EDIT_TREATMENTS = 'edit_treatments',
  DELETE_TREATMENTS = 'delete_treatments',
  CREATE_TREATMENT_PLANS = 'create_treatment_plans',
  APPROVE_TREATMENT_PLANS = 'approve_treatment_plans',
  
  // Financial permissions
  VIEW_FINANCIALS = 'view_financials',
  CREATE_INVOICES = 'create_invoices',
  CREATE_RECEIPTS = 'create_receipts',
  RECORD_PAYMENTS = 'record_payments',
  APPROVE_LARGE_TRANSACTIONS = 'approve_large_transactions',
  VIEW_REPORTS = 'view_reports',
  
  // Inventory permissions
  VIEW_INVENTORY = 'view_inventory',
  EDIT_INVENTORY = 'edit_inventory',
  CREATE_PURCHASE_ORDERS = 'create_purchase_orders',
  
  // System permissions
  MANAGE_USERS = 'manage_users',
  SYSTEM_SETTINGS = 'system_settings',
  EXPORT_DATA = 'export_data'
}

// Role-Permission Mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.DOCTOR]: [
    // All permissions
    ...Object.values(Permission)
  ],
  [UserRole.ASSISTANT]: [
    Permission.VIEW_PATIENTS,
    Permission.VIEW_MEDICAL_HISTORY,
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.EDIT_APPOINTMENTS,
    Permission.VIEW_TREATMENTS,
    Permission.CREATE_TREATMENTS,
    Permission.VIEW_FINANCIALS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_REPORTS
  ],
  [UserRole.SECRETARY]: [
    Permission.VIEW_PATIENTS,
    Permission.CREATE_PATIENTS,
    Permission.EDIT_PATIENTS,
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.EDIT_APPOINTMENTS,
    Permission.CANCEL_APPOINTMENTS,
    Permission.VIEW_FINANCIALS,
    Permission.CREATE_INVOICES,
    Permission.CREATE_RECEIPTS,
    Permission.RECORD_PAYMENTS,
    Permission.VIEW_INVENTORY
  ]
};
```

#### Authentication & Authorization

**Authentication Flow**:
1. User enters username/password
2. System validates credentials
3. Generate JWT token
4. Store token securely
5. Set session timeout
6. Log login activity

**Authorization**:
- Check permissions before allowing actions
- Role-based access control
- Audit trail for sensitive operations

### 9. Compliance & Security Module

#### GDPR Compliance

**Data Protection Measures**:
- Encryption at rest for sensitive data
- Encryption in transit (HTTPS/TLS)
- Secure password storage (bcrypt/argon2)
- Access logging
- Regular security audits

**Consent Management**:
```typescript
interface Consent {
  id: string;
  patientId: string;
  type: 'data_processing' | 'treatment' | 'marketing' | 'data_sharing';
  status: 'given' | 'withdrawn' | 'expired';
  givenAt: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  consentFormId?: string;
  ipAddress?: string;
  userAgent?: string;
}
```

**Data Retention**:
- Patient records: 10 years (Greek requirement)
- Financial records: 10 years
- Consent forms: 10 years
- Audit logs: 5 years
- Automatic archival after retention period
- Secure deletion process

**Patient Rights Implementation**:
- Right to access: Export patient data
- Right to rectification: Edit patient data
- Right to erasure: Delete patient data (with restrictions)
- Right to data portability: Export in machine-readable format
- Right to object: Opt-out of certain processing

#### Audit Logging

```typescript
interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;                  // e.g., "patient.created", "treatment.updated"
  entityType: string;              // e.g., "Patient", "Treatment"
  entityId: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
```

## Data Model - Entity Relationships

### Entity Relationship Diagram

```
Patient
  ├── MedicalHistory (1:1)
  ├── DentalHistory (1:1)
  ├── Documents (1:N)
  ├── Appointments (1:N)
  ├── Treatments (1:N)
  ├── TreatmentPlans (1:N)
  ├── Invoices (1:N)
  ├── Receipts (1:N)
  ├── Payments (1:N)
  └── DentalChart (1:1)

Appointment
  ├── Patient (N:1)
  ├── Doctor/User (N:1)
  └── Treatment (1:1, optional)

Treatment
  ├── Patient (N:1)
  ├── Doctor/User (N:1)
  ├── Assistant/User (N:1, optional)
  ├── TreatmentPlan (N:1, optional)
  ├── MaterialsUsed (1:N)
  └── XRays (N:N)

TreatmentPlan
  ├── Patient (N:1)
  ├── Phases (1:N)
  └── Treatments (1:N)

Invoice
  ├── Patient (N:1)
  ├── Services (1:N)
  └── Payments (1:N)

Receipt
  ├── Patient (N:1)
  ├── Invoice (N:1, optional)
  └── MyDataSubmission (1:1, optional)

InventoryItem
  └── Transactions (1:N)

User
  ├── CreatedAppointments (1:N)
  ├── PerformedTreatments (1:N)
  └── AuditLogs (1:N)
```

## User Interface Requirements

### Design Principles

1. **Mobile-First Design**:
   - Optimized for mobile devices
   - Touch-friendly interface (minimum 44x44pt touch targets)
   - Responsive layouts
   - Tablet support with optimized layouts

2. **Greek Language Support**:
   - Full Greek interface
   - Greek date formats (DD/MM/YYYY)
   - Greek number formats
   - Greek currency formatting (€)
   - Right-to-left support where needed

3. **Accessibility**:
   - WCAG 2.1 AA compliance
   - Screen reader support
   - High contrast mode
   - Adjustable font sizes
   - Keyboard navigation

4. **User Experience**:
   - Intuitive navigation
   - Clear visual hierarchy
   - Consistent design patterns
   - Fast loading times
   - Smooth animations
   - Clear error messages
   - Helpful tooltips

### Screen Structure

**Main Navigation**:
- Bottom tab navigation (iOS) / Top tab navigation (Android)
- Tabs: Patients, Appointments, Treatments, Financial, Reports, Settings

**Key Screens**:

1. **Dashboard/Home Screen**:
   - Today's appointments
   - Quick stats
   - Recent patients
   - Pending tasks

2. **Patient List Screen**:
   - Search bar
   - Filter options
   - Patient cards/list
   - Add patient button

3. **Patient Detail Screen**:
   - Patient info tabs
   - Medical history
   - Dental history
   - Appointments
   - Treatments
   - Financial
   - Documents

4. **Appointment Calendar Screen**:
   - Calendar view
   - Day/Week/Month toggle
   - Appointment list
   - Create appointment button

5. **Treatment Recording Screen**:
   - Treatment type selection
   - Tooth selection (odontogram)
   - Notes input
   - Materials used
   - Cost calculation
   - Save button

6. **Invoice/Receipt Screen**:
   - Service selection
   - Price display
   - Payment method
   - Generate receipt
   - Print/Share options

### UI Components

- Consistent button styles
- Form inputs with validation
- Date/time pickers
- Search bars with filters
- Modal dialogs
- Loading indicators
- Empty states
- Error states
- Success notifications
- Confirmation dialogs

## Integration Requirements

### SMS Gateway Integration

**Requirements**:
- Send SMS via SMS gateway API
- Track delivery status
- Handle errors and retries
- Cost tracking
- Template support

**API Integration**:
```typescript
interface SMSGatewayConfig {
  apiKey: string;
  apiUrl: string;
  senderId: string;
  rateLimit: number;              // Messages per minute
}

interface SMSGatewayResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}
```

### Email Service Integration

**Requirements**:
- Send emails via email service (SMTP or API)
- Support HTML emails
- Attachment support
- Delivery tracking
- Template support

**Configuration**:
```typescript
interface EmailServiceConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'other';
  apiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail: string;
  fromName: string;
}
```

### myDATA API Integration

**Requirements**:
- Submit receipts to myDATA platform
- Handle authentication
- Generate QR codes
- Track submission status
- Handle errors and retries
- Compliance with AADE requirements

**API Integration**:
```typescript
interface MyDataAPIConfig {
  apiUrl: string;
  apiKey: string;
  practiceAFM: string;
  practiceName: string;
  practiceAddress: string;
  practiceTaxId: string;
}

interface MyDataAPIResponse {
  success: boolean;
  submissionId?: string;
  qrCode?: string;
  error?: string;
  errorCode?: string;
}
```

### Cloud Backup Integration (Optional)

**Requirements**:
- Encrypted cloud backup
- Automatic or manual backup
- Restore functionality
- Incremental backups
- Backup verification

## Performance Requirements

### Response Times

- App startup: < 3 seconds
- Screen navigation: < 500ms
- Data loading: < 1 second
- Search results: < 500ms
- Report generation: < 5 seconds

### Resource Usage

- Memory usage: < 200MB typical
- Battery efficiency: Optimized for mobile
- Network usage: Minimized, efficient sync
- Storage: Efficient database usage

### Scalability

- Support up to 10,000 patients
- Support up to 100,000 appointments
- Support up to 50,000 treatments
- Efficient database queries with indexes
- Pagination for large lists

## Security Requirements

### Data Security

- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Secure password storage (bcrypt/argon2)
- Secure token storage
- Certificate pinning for API calls

### Access Control

- Role-based access control
- Permission checks on all operations
- Session management
- Automatic logout after inactivity
- Two-factor authentication (optional)

### Data Privacy

- GDPR compliance
- Data minimization
- Purpose limitation
- Storage limitation
- Right to erasure
- Data portability

## Testing Requirements

### Unit Testing

- Test all service functions
- Test data models
- Test utility functions
- Minimum 80% code coverage

### Integration Testing

- Test API integrations
- Test database operations
- Test sync functionality
- Test offline/online transitions

### User Acceptance Testing

- Test all user workflows
- Test on real devices
- Test with real data scenarios
- Performance testing
- Security testing

## Deployment Requirements

### Environment Setup

1. **Development Environment**:
   - Node.js 18+
   - React Native CLI
   - iOS: Xcode 14+
   - Android: Android Studio, JDK 17+

2. **Production Environment**:
   - App Store (iOS)
   - Google Play Store (Android)
   - Code signing certificates
   - App icons and splash screens

### Configuration Management

- Environment variables for all configs
- Separate configs for dev/staging/production
- Secure storage of API keys
- No hardcoded credentials

### Build Process

- Automated builds
- Version management
- Release notes
- Rollback capability

## Maintenance & Support

### Monitoring

- Error tracking (Sentry, etc.)
- Performance monitoring
- Usage analytics
- Crash reporting

### Updates

- Over-the-air updates (if using Expo)
- App store updates
- Database migration support
- Backward compatibility

### Documentation

- User manual
- Admin guide
- Technical documentation
- API documentation
- Troubleshooting guide

## Success Metrics

- User adoption rate
- Daily active users
- Feature usage statistics
- Error rates
- Performance metrics
- User satisfaction

## Appendix

### Greek Dental Terminology

- Οδοντίατρος (Odontiatros) - Dentist
- Βοηθός (Voithos) - Assistant
- Γραμματέας (Grammateas) - Secretary
- Ασθενής (Asthenis) - Patient
- Ραντεβού (Rantevou) - Appointment
- Θεραπεία (Therapeia) - Treatment
- Εξέταση (Exetasi) - Examination
- Απόδειξη (Apodeixi) - Receipt
- Τιμολόγιο (Timologio) - Invoice
- Πληρωμή (Pliromi) - Payment

### Common Dental Procedures (Greek Terms)

- Καθαρισμός (Katharismos) - Cleaning
- Σφράγισμα (Sfragisma) - Filling
- Απονεύρωση (Aponevrosi) - Root Canal
- Εξαγωγή (Exagogi) - Extraction
- Στέμμα (Stemma) - Crown
- Γέφυρα (Gefyra) - Bridge
- Εμφύτευμα (Emfytema) - Implant
- Ορθοδοντική (Orthodontiki) - Orthodontics

This specification document provides comprehensive details for developing the dental practice management application. All requirements should be implemented following best practices, with particular attention to the isolation requirements and Greek-specific compliance needs.

