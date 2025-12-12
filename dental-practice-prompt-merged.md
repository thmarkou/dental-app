# React Native Dental Practice Management Application - Unified Prompt for Cursor.ai

## Context & Requirements

Develop a comprehensive React Native mobile application for managing a **single small Greek dental practice** (NOT multi-tenant). The practice typically consists of 2-3 staff members:

- **Doctor (Dentist)**: Primary user with full access to all features, creates treatment plans, performs treatments
- **Assistant**: Can perform most functions, uploads files, assists with treatments, but cannot approve large financial transactions or modify sensitive patient data
- **Secretary/Receptionist**: Handles appointments, invoicing, patient communication, check-in/check-out (often the assistant also serves as secretary)

**Critical Constraint**: The application must run in an isolated environment (using environment variables and proper isolation) because there are 2 other applications in the same folder that should not be affected or cause conflicts.

## Technology Stack

- **Framework**: React Native (latest stable version)
- **Language**: TypeScript (strict mode, no 'any' types unless absolutely necessary)
- **State Management**: Choose appropriate solution (Redux Toolkit, Zustand, or Context API)
- **Navigation**: React Navigation
- **Database**: SQLite (local) with offline-first architecture, background sync when online
- **Styling**: Tailwind CSS v4 (use v4 syntax exclusively)
- **Offline Support**: Full offline capability with local database, queue for offline actions, automatic synchronization when connection is available
- **Platforms**: iOS and Android
- **Localization**: Greek (UTF-8), date format dd/mm/yyyy, timezone Europe/Athens

## Core Modules & Features

### A. Appointment Scheduling / Calendar Management

#### Appointment Management

- **Create/Edit/Cancel/Reschedule Appointments**:
  - Select patient (search/select from list)
  - Choose date and time
  - Select appointment type (examination, treatment, follow-up, emergency)
  - **Multiple time slots**: 30 minutes for check-up, 90 minutes for implant, customizable durations (15, 30, 45, 60, 90, 120 minutes)
  - Add notes/remarks
  - Assign to doctor
  - Assign to specific chair/operatory (if multiple available)
  - Set reminder preferences

- **Appointment Types**:
  - Initial consultation (~15-30€)
  - Regular check-up
  - Cleaning/hygiene (~20-50€)
  - Treatment session
  - Follow-up visit
  - Emergency
  - Consultation only

- **Blocked Hours Management**:
  - Block time slots for cleaning, sterilization, breaks
  - Visual indication of "available" vs "blocked" hours
  - Recurring blocked hours (e.g., daily lunch break, weekly cleaning)

- **Calendar Views**:
  - Day view
  - Week view
  - Month view
  - List view (upcoming appointments)
  - Color coding by appointment type, status, or doctor
  - Multiple chairs/operatories view (if practice has multiple)

- **Appointment Chain / Follow-up Scheduling**:
  - Create appointment chains for multi-visit treatments
  - Automatic scheduling: e.g., "1st session, repeat in 7 days"
  - Example chains:
    - Root canal: 1 week, 1 month, 6 months follow-ups
    - Implant: 1 week, 1 month, 3 months, 6 months check-ups
    - Extraction: 1 week follow-up
    - Orthodontic adjustments: Every 4-6 weeks
  - Link appointments to treatment plans

- **Appointment Reminders** (in Greek):
  - SMS reminders (24-48 hours before, customizable timing)
  - Email reminders
  - Push notifications
  - Reminder preferences per patient
  - Automatic reminder scheduling
  - Greek language templates

- **Appointment Modifications**:
  - Reschedule appointments
  - Cancel appointments (with reason tracking)
  - Mark as completed
  - Mark as no-show
  - Convert to different appointment type

**User Access**: Secretary/Receptionist and Assistant can manage appointments

### B. Patient History & Medical Records

#### Patient Registration & Profile

- **Personal Information**:
  - Full name (First name, Last name)
  - Date of birth
  - Gender
  - AMKA (Greek Social Security Number) - optional but recommended
  - Contact information (phone, email, address)
  - Emergency contact
  - Occupation
  - Insurance information (if applicable)

- **Medical History**:
  - General medical conditions
  - Current medications
  - Known allergies (especially to medications, materials) - **CRITICAL for safety**
  - Previous surgeries
  - Chronic diseases (diabetes, heart conditions, etc.)
  - Pregnancy status (for female patients)
  - Blood pressure (if relevant)

- **Dental History**:
  - Previous dental treatments
  - Previous orthodontic treatment
  - Oral hygiene habits
  - Smoking/alcohol consumption
  - Bruxism (teeth grinding)
  - TMJ (temporomandibular joint) issues

- **Patient Documents**:
  - Consent forms (GDPR compliance)
  - Medical history forms
  - Treatment plan approvals
  - Insurance documents
  - Previous X-rays and photographs (from other practices)

#### Dental Chart / Odontogram

- **Visual Dental Formula**:
  - Graphic representation of teeth (FDI or Universal numbering)
  - Chart conditions for each tooth:
    - Healthy
    - Caries (cavity)
    - Filling (composite, amalgam)
    - Crown
    - Missing
    - Impacted
    - Root canal treated
    - Implant
    - Bridge
    - Mobility
    - Extraction needed
    - Other conditions
  - Notes per tooth (e.g., "extensive work", "root canal", "crowns")
  - Update chart after each treatment
  - Historical charting (view changes over time)
  - Print chart for patient records

#### Clinical Notes per Visit

- **Visit Documentation**:
  - Date and time of visit
  - Doctor who performed examination/treatment
  - Assistant who assisted
  - Clinical findings
  - Treatment performed
  - Materials used
  - Post-treatment instructions
  - Patient response/complications
  - Images (intraoral, extraoral, OPG)
  - Attachments (PDF, X-rays)

**User Access**: Doctor and Assistant can record clinical notes; Secretary can only set contact information

### C. Image / X-ray Management

#### Digital Image Storage

- **Image Types**:
  - Intraoral photographs
  - Extraoral photographs
  - Panoramic X-rays (OPG)
  - Periapical X-rays
  - Bitewing X-rays
  - CBCT scans
  - Before/after treatment photos

- **Image Features**:
  - Upload from device camera or gallery
  - **Scanner/Digital X-ray Integration**: Connect with digital X-ray scanner/DICOM integration
  - Preview on mobile/tablet
  - **Image Annotation**: Mark areas, add notes, highlight regions
  - **Before/After Comparison**: Side-by-side view of images from different dates
  - Link images to specific teeth in dental chart
  - Link images to treatments
  - Organize by visit date

**User Access**: Doctor views/annotates images; Assistant uploads files

### D. Treatment Plans & Cost Estimation

#### Treatment Plan Creation

- **Multiple Treatment Plan Alternatives**:
  - Create multiple treatment plan options for the same patient
  - Example: "Conservative approach" vs "Implant solution"
  - Compare costs and timelines
  - Present alternatives to patient

- **Treatment Plan Components**:
  - Select patient
  - Add multiple treatments/procedures
  - Set priority (urgent, high, medium, low)
  - **Cost estimation for each treatment** (with Greek pricing)
  - Set timeline/phases
  - Add notes and recommendations
  - Link to appointments

- **Treatment Plan Phases**:
  - Phase 1: Emergency/Urgent treatments
  - Phase 2: Primary treatments
  - Phase 3: Aesthetic/Elective treatments
  - Phase 4: Maintenance

- **Cost Calculation**:
  - **Down payment calculation** (prokatavoli)
  - **Installment plans**: Number of installments, amounts, due dates
  - Total cost summary
  - Cost breakdown by treatment

- **Treatment Plan Export**:
  - **Send estimate/quote to patient**: PDF or email
  - Professional format in Greek
  - Include practice information
  - Include treatment descriptions and costs

- **Treatment Plan Approval**:
  - Present plan to patient
  - Get patient approval/signature (electronic)
  - Store consent form
  - Track plan acceptance date

- **Treatment Plan Tracking**:
  - View plan progress
  - Mark treatments as completed
  - Update plan as needed
  - Generate plan summary

**User Access**: Doctor and Secretary collaborate - Doctor defines treatments and timeline, Secretary handles cost presentation

### E. Appointment/Clinical Flow Functions

#### Check-in / Check-out System

- **Patient Check-in**:
  - Mark patient arrival
  - Record check-in time
  - Assign to chair/operatory
  - Notify doctor of patient arrival

- **Patient Check-out**:
  - Mark patient departure
  - Record check-out time
  - Calculate visit duration (for statistics)
  - Complete visit documentation

- **Visit Statistics**:
  - Track visit durations
  - Average visit time per treatment type
  - Time between check-in and treatment start
  - Time between treatment end and check-out

#### Multiple Chairs/Operatories Management

- **Operatory Management** (if practice has multiple):
  - Assign appointments to specific chairs/operatories
  - View availability per chair
  - Track which chair is in use
  - Block chairs for maintenance/cleaning
  - Equipment tracking per chair

**User Access**: Secretary/Receptionist and Assistant manage check-in/out

### F. Service Catalog & Pricing

#### Treatment/Service Catalog

- **Service Catalog with Greek Pricing**:
  - Complete list of all services/examinations/treatments
  - **Default prices based on Greek market** (see pricing section below)
  - Practice can customize/adjust all prices
  - Price variations (e.g., different materials, complexity)
  - Package deals (e.g., cleaning + examination)

- **Greek Market Pricing Reference** (indicative, practice can adjust):
  - Clinical examination (initial consultation): ~15-30€
  - Digital X-ray (periapical/OPG): ~10-40€ (varies by type)
  - Cleaning / scaling & polishing: ~20-50€
  - Composite filling: ~30-80€ (varies by size)
  - Tooth extraction (simple): ~30-100€
  - Surgical extraction / wisdom tooth: ~50-150€
  - Root canal treatment: ~80-300€ (varies by tooth)
  - Crown / Porcelain crown: ~300-900€ per tooth
  - Zirconia crown: ~400-1000€ per tooth
  - Implant placement: ~699-1200€+ per implant
  - All-on-X full restoration: ~11,000€+ per arch
  - Dentures (removable): Variable cost
  - Teeth whitening: Variable cost
  - Veneers: ~350-750€ per tooth
  - Aesthetic treatments: Variable by clinic

- **Regional Price Variations**:
  - Support different price lists per region/clinic location
  - Example: Attica vs Province pricing
  - Practice can set base prices and regional multipliers

- **Price Management**:
  - Update prices
  - Set special prices for specific patients
  - Apply discounts (percentage or fixed amount)
  - Track price history
  - Bulk price updates

### G. Accounting / Financial Management

#### Invoicing & Receipts

- **Invoice/Receipt Generation** (in Greek):
  - Create invoice for services rendered
  - **Simple receipt** (apodeixi) or **corporate invoice** (timologio)
  - Include practice information (name, address, tax ID/AFM)
  - Patient information
  - List all services with descriptions in Greek
  - Show individual prices
  - Calculate subtotal
  - Apply VAT (24% in Greece - if applicable)
  - Show total amount
  - Payment terms
  - Invoice/receipt number (sequential, unique)
  - Date and time
  - QR code for myDATA integration

- **myDATA Integration** (Greek Tax Authority):
  - Send receipt data to myDATA platform
  - Compliance with AADE (Greek Independent Authority for Public Revenue) requirements
  - Automatic submission or manual trigger
  - Track submission status
  - Handle submission errors

#### Payment Management

- **Payment Recording**:
  - Record payment for invoice
  - Payment methods:
    - Cash
    - Credit/Debit card
    - Bank transfer
    - Check
    - Installment payment
  - Partial payments
  - Full payment
  - Payment date and reference number
  - **Refunds**: Record returns/refunds

- **Payment Tracking**:
  - Outstanding balances per patient
  - Payment history
  - Overdue payments
  - Payment reminders
  - **Down payments** (prokatavoles)
  - **Open debts** (anoichtes ofeiles)

- **Installment Plans**:
  - Create payment plans for expensive treatments
  - Set number of installments
  - Set installment amounts
  - Set due dates
  - Track installment payments
  - Send reminders for upcoming installments

#### Simple Accounting Reports

- **Financial Reports** (for accountant export):
  - **Revenue/Expenses by month**: Simple monthly reports
  - **Payable accounts**: Track what needs to be paid
  - **VAT calculation**: Where applicable
  - **Export to CSV/Excel**: For accountant import
  - Daily revenue summary
  - Payment method breakdown
  - Outstanding receivables

**Critical Requirement**: Small clinics need simple, clear accounting module that can export data to accountant. Keep it straightforward, not overly complex.

**User Access**: Secretary handles invoicing; Doctor approves large transactions

### H. Inventory Management

#### Material & Supply Tracking

- **Inventory Items**:
  - Material name
  - Category (anesthetic, filling materials, crowns, implants, adhesives, disposable tools, etc.)
  - Supplier information
  - Unit of measurement (pieces, ml, grams, etc.)
  - Current stock quantity
  - Minimum stock level (reorder point)
  - Maximum stock level
  - Unit cost
  - **Expiration dates** (critical for materials)
  - Location/storage

- **Inventory Operations**:
  - Add new items
  - Update stock quantities
  - Record usage (linked to treatments - automatic deduction)
  - Record purchases
  - Adjust inventory (corrections)
  - Transfer items
  - **Archive suppliers**: Keep supplier information

- **Stock Alerts**:
  - **Low stock warnings**: Alert when stock <= minimum level
  - **Expiration date warnings**: Alert for expiring materials
  - Automatic reorder suggestions
  - Critical stock alerts

- **Purchase Management**:
  - Create purchase orders
  - Record received items
  - Track supplier information
  - Purchase history
  - Cost tracking

- **Inventory Reports**:
  - Current stock levels
  - Low stock items
  - Usage statistics
  - Cost analysis
  - Expiring items

**User Access**: Assistant/Secretary updates stock

### I. Communication & Marketing

#### Patient Communication

- **SMS Templates** (in Greek):
  - Appointment reminders
  - Payment reminders
  - Treatment follow-up reminders
  - General announcements
  - **Marketing offers**: Promotional messages
  - Customizable templates
  - Bulk SMS sending
  - SMS delivery status tracking

- **Email Templates** (in Greek):
  - Appointment confirmations
  - Appointment reminders
  - Treatment instructions
  - Post-treatment care instructions
  - General communications
  - **Newsletter** (optional)
  - **Marketing offers** (optional)
  - Customizable templates
  - Email delivery tracking

- **Communication History**:
  - Track all communications with patients
  - View communication history per patient
  - Communication preferences per patient

**User Access**: Secretary manages communications

### J. Consent & Legal/Regulatory Compliance

#### Electronic Consent Forms

- **Consent Management**:
  - **Electronic consent forms** before complex treatments (e.g., surgery, implants)
  - Digital signature capture
  - Store consent forms with date/time
  - Link consent to specific treatment
  - Consent expiration management
  - Withdrawal of consent handling

#### GDPR Compliance

- **Data Protection**:
  - Encrypt sensitive patient data
  - Secure data storage
  - Access controls and logging
  - Data backup and recovery

- **Privacy Policy**:
  - Archive privacy policy
  - Patient acknowledgment of privacy policy

- **Patient Rights**:
  - **Right to access data**: Export patient data
  - **Right to rectification**: Edit patient data
  - **Right to erasure**: Delete patient data (with restrictions for medical records)
  - **Right to data portability**: Export in machine-readable format
  - **Data export functionality**: Export all patient data

- **Data Retention**:
  - Configure retention periods (10 years for medical records in Greece)
  - Automatic data archival
  - Secure data deletion

**User Access**: Doctor and Secretary handle legal compliance

### K. Reports / KPIs

#### Business Reports

- **Daily/Monthly Reports**:
  - **Number of patients**: New, returning, total
  - **Top treatments**: Most performed treatments
  - **Revenue per doctor**: If multiple doctors
  - **Cancellation rate**: Percentage of cancelled appointments
  - **Average time between appointments**: Patient return frequency
  - **Revenue trends**: Daily, weekly, monthly
  - **Service profitability**: Which treatments are most profitable

#### Operational KPIs

- **Appointment Statistics**:
  - Total appointments
  - Completed appointments
  - Cancelled appointments
  - No-show rate
  - Average appointment duration
  - Busiest times/days

- **Patient Statistics**:
  - Total patients
  - New patients (by period)
  - Active patients
  - Inactive patients
  - Patient demographics

- **Financial KPIs**:
  - Total revenue
  - Outstanding receivables
  - Average transaction value
  - Payment method distribution

**User Access**: Owner/Doctor uses for business decisions

### L. Multi-User Permissions & Role Management

#### User Roles

- **Admin (Owner)**:
  - Full access to all features
  - User management
  - System settings
  - Financial approvals
  - All reports

- **Dentist (Doctor)**:
  - Full access to patient medical records
  - Create and modify treatment plans
  - Perform treatments
  - View financial information
  - Cannot modify system settings
  - Cannot manage users (unless also admin)

- **Assistant**:
  - View patient information
  - Schedule appointments
  - Record treatments (with doctor approval)
  - Upload images/files
  - Update inventory
  - View financial information (read-only)
  - **Cannot**: Modify sensitive patient data, approve large financial transactions, create treatment plans

- **Receptionist (Secretary)**:
  - Schedule and manage appointments
  - Check-in/check-out patients
  - Create invoices and receipts
  - Record payments
  - View patient basic information (not full medical history)
  - Send communications
  - Update contact information
  - **Cannot**: Modify medical records, create treatment plans, view sensitive medical data

#### Permission System

- **Role-based access control**: Restrict access to financial/sensitive data
- **Permission granularity**: Fine-grained permissions per feature
- **Activity logging**: Track who did what and when
- **Session management**: Automatic logout after inactivity

**Critical**: Small practices need flexible roles where assistant can also be secretary. System should support role combinations.

### M. Offline-First & Mobile-First UX

#### Offline Capability

- **Full Offline Functionality**:
  - App usable offline on doctor's tablet
  - All core functions work without internet
  - Local SQLite database for all operations
  - Queue for actions performed offline
  - **Background sync** when connection is available
  - Conflict resolution for data sync
  - Sync status indicators

#### Mobile-First Design

- **Touch-Friendly Interface**:
  - Large buttons (minimum 44x44pt touch targets)
  - Swipe gestures where appropriate
  - Fast, responsive UI that doesn't slow down workflow
  - Optimized for tablet use in clinic
  - Portrait and landscape support

- **Performance**:
  - Fast app startup (< 3 seconds)
  - Smooth navigation
  - Efficient database queries
  - Optimized image handling
  - Lazy loading where appropriate
  - Efficient memory usage

- **User Experience**:
  - Intuitive navigation
  - Clear visual hierarchy
  - Consistent design patterns
  - Quick access to frequently used features
  - Minimal taps to complete common tasks

## Treatment/Examination Catalog with Greek Pricing

### Examinations

1. **Clinical Examination** (Kliniki Exetasi / Eisagogi Istorikou)
   - Initial consultation with history taking
   - Indicative price: ~15-30€

2. **Digital X-ray** (Psifiaki Aktinografia)
   - Periapical X-ray: ~10-25€
   - Panoramic X-ray (OPG): ~20-40€
   - CBCT: ~50-150€ (varies)

### Preventive Treatments

3. **Cleaning / Scaling & Polishing** (Katharismos)
   - Professional dental cleaning
   - Indicative price: ~20-50€

4. **Fluoride Treatment** (Therapia Fluorou)
   - Indicative price: ~15-30€

### Restorative Treatments

5. **Composite Filling** (Sfragisma Composite)
   - Small: ~30-50€
   - Medium: ~50-70€
   - Large: ~70-80€+

6. **Amalgam Filling** (Sfragisma Amalgama)
   - Indicative price: ~25-60€

7. **Crown / Porcelain Crown** (Stemma / Porcelain Stemma)
   - Metal-ceramic: ~300-600€
   - Zirconia: ~400-900€
   - Full porcelain: ~500-1000€

8. **Bridge** (Gefyra)
   - 2-3 units: ~600-1800€
   - 4+ units: ~1200-3000€+

### Endodontic Treatments

9. **Root Canal Treatment** (Aponevrosi / Endodontiki Therapia)
   - Single-rooted tooth: ~80-150€
   - Multi-rooted tooth: ~150-300€
   - Retreatment: ~200-400€

### Surgical Procedures

10. **Simple Extraction** (Apli Exagogi)
    - Indicative price: ~30-80€

11. **Surgical Extraction** (Cheirourgiki Exagogi)
    - Indicative price: ~50-150€

12. **Wisdom Tooth Extraction** (Exagogi Fronimitou)
    - Simple: ~50-100€
    - Surgical: ~100-200€

13. **Implant Placement** (Emfytema)
    - Implant only: ~699-1200€+
    - With crown: ~1200-2000€+

14. **Bone Graft** (Osteoplastiki)
    - Indicative price: ~200-500€

### Prosthetic Treatments

15. **Full Denture** (Oliki Odontostixia)
    - Indicative price: ~400-800€

16. **Partial Denture** (Meriki Odontostixia)
    - Indicative price: ~300-600€

17. **All-on-X Full Restoration** (Oliki Apokatastasi)
    - Per arch: ~11,000€+

### Aesthetic Treatments

18. **Teeth Whitening** (Leukansi)
    - In-office: ~200-400€
    - Take-home: ~150-300€

19. **Veneers** (Opsies)
    - Porcelain: ~350-750€ per tooth
    - Composite: ~150-300€ per tooth

20. **Composite Bonding** (Bonding)
    - Indicative price: ~100-250€ per tooth

**Note**: All prices are indicative based on Greek market research. The practice must be able to customize all prices. The system should support price variations by region (e.g., Attica vs Province).

## Integrations Required

### 1. SMS Gateway
- Integration with SMS gateway API for appointment reminders
- Support for Greek language SMS
- Delivery status tracking
- Cost tracking

### 2. Payment Gateway
- Integration with payment gateway (Stripe, European PSPs, or local Greek providers)
- Support for online payments/down payments
- Payment processing and confirmation

### 3. Digital X-ray / DICOM Integration
- Connect with digital X-ray scanner
- DICOM file support (or simple image upload)
- Image viewer integration

### 4. Printer / PDF Export
- Print receipts/invoices
- Export estimates/treatment plans to PDF
- PDF generation in Greek language
- Professional formatting

### 5. Accounting Software Integration (Optional)
- Export to CSV/Excel for accountant
- Data format compatible with common accounting software
- Monthly/periodic export functionality

## UX & Data Model Requirements

### Application Architecture

- **Single Clinic**: NOT multi-tenant - designed for one practice
- **Offline-First**: SQLite local database, background sync
- **Role-Based Auth**: Admin, Dentist, Assistant, Receptionist
- **Localization**: Greek (UTF-8), date format dd/mm/yyyy, timezone Europe/Athens

### Key Screens

1. **Login Screen**: User authentication
2. **Dashboard**: Day view, upcoming appointments, quick stats
3. **Patient List / Search**: Search by name, phone, AMKA
4. **Patient Profile**: 
   - Personal info, medical history
   - Dental chart (odontogram)
   - Treatment history
   - Financial status
5. **Appointments Calendar**: Day/Week/Month view, multiple chairs
6. **Create Treatment Plan**: Multi-step form with alternatives
7. **Treatment Recording**: Link to dental chart, add notes, images
8. **Invoices & Payments**: Create receipts, record payments
9. **Inventory**: Stock levels, low stock alerts
10. **Reports**: Daily/monthly KPIs, financial reports
11. **Settings**: Service catalog/pricing, SMS gateway, printer, user management

### Data Model

- **Patient**: Personal info, medical history, dental history, documents
- **Appointment**: Patient, date/time, duration, type, status, chair, reminders
- **Treatment**: Patient, type, teeth, date, doctor, notes, materials, cost, plan
- **Treatment Plan**: Patient, alternatives, treatments, costs, phases, approval
- **Invoice/Receipt**: Patient, services, amounts, payments, myDATA status
- **Payment**: Invoice, amount, method, date, reference
- **Inventory Item**: Name, category, stock, supplier, expiration
- **User**: Role, permissions, activity log
- **Image**: Patient, type, file, annotations, linked to treatment/tooth

## Development Guidelines

### Code Quality

- Follow DRY (Don't Repeat Yourself) principles
- Follow KISS (Keep It Simple, Stupid) principles
- Self-documenting code with descriptive names
- No redundant or speculative code
- Clean up unused code
- Add comments for complex logic

### TypeScript Standards

- Strict TypeScript mode
- No 'any' types unless absolutely necessary (with documentation)
- Fix type errors immediately
- Proper type definitions for all entities
- Type-safe API calls

### React Native Best Practices

- Use functional components with hooks
- Proper state management
- Optimize re-renders
- Handle errors gracefully
- Proper navigation structure
- Handle loading states
- Handle empty states

### Testing

- Unit tests for critical functions
- Integration tests for workflows
- User acceptance testing scenarios
- Test on both iOS and Android
- Test offline functionality
- Test data synchronization

## Deliverables

1. **Complete React Native Application**:
   - All modules implemented (A-M)
   - Full offline capability with SQLite
   - Data synchronization
   - Greek language support (UTF-8, dd/mm/yyyy)
   - Role-based access control
   - Touch-friendly, tablet-optimized UI

2. **Documentation**:
   - User manual (in Greek)
   - Admin guide
   - Technical documentation
   - Integration setup guides

3. **Configuration**:
   - Environment setup guide
   - Database setup
   - Integration setup (SMS, Email, Payment Gateway, myDATA)
   - Deployment guide

## Success Criteria

- Application works fully offline on tablet
- All modules function as specified (A-M)
- Greek language fully supported (UTF-8, proper date/time formats)
- Role-based permissions work correctly
- Data synchronization works reliably
- Application is isolated from other apps in folder
- Performance meets requirements (fast, responsive)
- UI/UX is intuitive and professional (touch-friendly)
- GDPR compliance implemented
- Greek tax requirements met (myDATA integration)
- PDF export in Greek works correctly
- Check-in/check-out workflow smooth
- Treatment plan alternatives functional
- Image annotation and comparison working
- Simple accounting reports exportable for accountant

## Notes

- **Priority**: Simplicity and ease of use for small practice (2-3 staff)
- **Focus**: Essential features first, advanced features can be added later
- **Security**: Data security and privacy are paramount
- **Workflow**: Consider typical day workflow in Greek dental practice
- **Performance**: Fast and responsive - must not slow down clinical workflow
- **Reliability**: Works reliably even with poor internet connection
- **Greek Market**: Prices and features tailored for Greek dental practices
- **Single Practice**: NOT multi-tenant - one practice per installation

