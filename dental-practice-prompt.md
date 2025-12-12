# React Native Dental Practice Management Application - Cursor.ai Prompt

## Context & Requirements

Develop a comprehensive React Native mobile application for managing a small Greek dental practice. The practice typically consists of 2-3 staff members:

- **Doctor (Dentist)**: Primary user with full access to all features
- **Assistant**: Can perform most functions except financial approvals and sensitive patient data modifications
- **Secretary**: Handles appointments, invoicing, and patient communication (often the assistant also serves as secretary)

**Critical Constraint**: The application must run in an isolated environment (using environment variables and proper isolation) because there are 2 other applications in the same folder that should not be affected or cause conflicts.

## Technology Stack

- **Framework**: React Native (latest stable version)
- **Language**: TypeScript (strict mode, no 'any' types unless absolutely necessary)
- **State Management**: Choose appropriate solution (Redux Toolkit, Zustand, or Context API)
- **Navigation**: React Navigation
- **Database**: Local database (SQLite/WatermelonDB) with cloud sync capability
- **Styling**: Tailwind CSS v4 (use v4 syntax exclusively)
- **Offline Support**: Full offline capability with data synchronization
- **Platforms**: iOS and Android

## Core Modules & Features

### 1. Patient Management Module

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
  - Known allergies (especially to medications, materials)
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

#### Patient Search & Filtering

- Search by name, phone, AMKA, or email
- Filter by last visit date
- Filter by treatment type
- Filter by outstanding balance
- Quick access to frequently visited patients

#### Patient Dashboard

- Overview of patient information
- Recent visits summary
- Active treatment plans
- Outstanding appointments
- Financial status (balance, payment history)
- Next recommended visit date

### 2. Appointment Scheduling Module

#### Appointment Management

- **Create Appointment**:

  - Select patient (search/select from list)
  - Choose date and time
  - Select appointment type (examination, treatment, follow-up, emergency)
  - Set duration (15, 30, 45, 60, 90 minutes)
  - Add notes/remarks
  - Assign to doctor
  - Set reminder preferences

- **Appointment Types**:

  - Initial consultation
  - Regular check-up
  - Cleaning/hygiene
  - Treatment session
  - Follow-up visit
  - Emergency
  - Consultation only

- **Recurring Appointments**:

  - Schedule series of appointments for multi-visit treatments
  - Set frequency (weekly, bi-weekly, monthly)
  - Set number of appointments or end date
  - Automatic scheduling based on treatment plan

- **Appointment Modifications**:

  - Reschedule appointments
  - Cancel appointments (with reason tracking)
  - Mark as completed
  - Mark as no-show
  - Convert to different appointment type

- **Calendar Views**:

  - Day view
  - Week view
  - Month view
  - List view (upcoming appointments)
  - Color coding by appointment type or status

- **Appointment Reminders**:

  - SMS reminders (24 hours before, customizable)
  - Email reminders
  - In-app notifications
  - Reminder preferences per patient
  - Automatic reminder scheduling

- **Follow-up Scheduling**:
  - Automatic follow-up suggestions based on treatment type
  - Post-treatment check-ups (1 week, 1 month, 3 months, 6 months)
  - Maintenance appointments (cleanings every 6 months)
  - Orthodontic adjustment appointments
  - Implant healing check-ups

### 3. Examination & Treatment Management Module

#### Dental Examinations

**Clinical Examinations**:

- Intraoral examination
- Extraoral examination
- Periodontal examination (pocket depth, bleeding, mobility)
- Occlusion analysis
- TMJ examination
- Oral cancer screening
- Caries detection
- Tooth mobility assessment
- Gum health assessment

**Diagnostic Procedures**:

- **X-rays**:

  - Bitewing X-rays
  - Periapical X-rays
  - Panoramic X-ray (OPG)
  - CBCT (Cone Beam Computed Tomography)
  - Cephalometric X-ray (for orthodontics)
  - X-ray comparison (before/after)

- **Impressions**:

  - Digital impressions
  - Traditional impressions (alginate, silicone)
  - Bite registration
  - Shade selection

- **Photographs**:

  - Intraoral photographs
  - Extraoral photographs
  - Before/after treatment photos
  - Smile analysis photos
  - Progress documentation

- **Other Diagnostic Tools**:
  - Caries detection devices
  - Periodontal probing records
  - Occlusal analysis records

#### Treatment Categories & Procedures

**1. Preventive Treatments**:

- Professional dental cleaning (scaling and polishing)
- Fluoride treatment
- Sealants
- Oral hygiene instruction
- Dietary counseling

**2. Restorative Treatments**:

- **Fillings**:

  - Composite fillings (white fillings)
  - Amalgam fillings (silver fillings)
  - Glass ionomer fillings
  - Temporary fillings

- **Inlays & Onlays**:

  - Composite inlays/onlays
  - Ceramic inlays/onlays
  - Gold inlays/onlays

- **Crowns**:
  - Full crown
  - Partial crown
  - Temporary crown
  - Material types (porcelain, metal-ceramic, zirconia, gold)

**3. Endodontic Treatments (Root Canal)**:

- Root canal treatment (single-rooted tooth)
- Root canal treatment (multi-rooted tooth)
- Root canal retreatment
- Apicectomy (root end surgery)
- Pulp capping
- Emergency pulpotomy

**4. Surgical Procedures**:

- **Extractions**:

  - Simple extraction
  - Surgical extraction
  - Wisdom tooth extraction
  - Impacted tooth extraction

- **Oral Surgery**:
  - Implant placement
  - Bone grafting
  - Sinus lift
  - Gum surgery
  - Biopsy
  - Frenectomy

**5. Prosthetic Treatments**:

- **Fixed Prosthetics**:

  - Single crown
  - Bridge (2-3 units, 4+ units)
  - Implant-supported crown
  - Implant-supported bridge
  - Veneers (porcelain, composite)

- **Removable Prosthetics**:
  - Full denture
  - Partial denture
  - Immediate denture
  - Overdenture
  - Flexible partial denture

**6. Orthodontic Treatments**:

- **Fixed Orthodontics**:

  - Metal braces
  - Ceramic braces
  - Self-ligating braces
  - Lingual braces

- **Removable Orthodontics**:

  - Clear aligners (Invisalign, etc.)
  - Removable appliances
  - Retainers (fixed, removable)

- **Orthodontic Procedures**:
  - Initial consultation and records
  - Braces placement
  - Adjustment appointments
  - Braces removal
  - Retainer fitting
  - Retainer adjustments

**7. Periodontal Treatments**:

- Scaling and root planing (deep cleaning)
- Periodontal maintenance
- Gum surgery
- Bone regeneration
- Gum grafting

**8. Aesthetic Treatments**:

- Teeth whitening (in-office, take-home)
- Composite bonding
- Porcelain veneers
- Gum contouring
- Smile makeover

**9. Emergency Treatments**:

- Emergency examination
- Pain relief
- Temporary filling
- Emergency extraction
- Trauma treatment

#### Treatment Recording

For each treatment, record:

- **Treatment Details**:

  - Treatment type and procedure
  - Tooth/teeth involved (tooth numbering system - FDI or Universal)
  - Date and time
  - Duration
  - Doctor who performed treatment
  - Assistant who assisted

- **Clinical Notes**:

  - Pre-treatment condition
  - Procedure performed
  - Materials used
  - Complications or issues
  - Post-treatment instructions
  - Patient response

- **Materials & Supplies Used**:

  - Anesthetic type and amount
  - Filling materials
  - Crown/bridge materials
  - Implant system and size
  - Orthodontic materials
  - Track inventory usage

- **Treatment Plan Integration**:
  - Link to treatment plan
  - Mark treatment as completed
  - Update treatment plan progress
  - Schedule next appointment if needed

#### Treatment Plans

- **Create Treatment Plan**:

  - Select patient
  - Add multiple treatments/procedures
  - Set priority (urgent, high, medium, low)
  - Estimate costs for each treatment
  - Set timeline/phases
  - Add notes and recommendations

- **Treatment Plan Phases**:

  - Phase 1: Emergency/Urgent treatments
  - Phase 2: Primary treatments
  - Phase 3: Aesthetic/Elective treatments
  - Phase 4: Maintenance

- **Treatment Plan Approval**:

  - Present plan to patient
  - Get patient approval/signature
  - Store consent form
  - Track plan acceptance date

- **Treatment Plan Tracking**:
  - View plan progress
  - Mark treatments as completed
  - Update plan as needed
  - Generate plan summary

#### Dental Charting (Odontogram)

- Visual representation of teeth
- Chart conditions for each tooth:

  - Healthy
  - Caries (cavity)
  - Filling
  - Crown
  - Missing
  - Impacted
  - Root canal treated
  - Implant
  - Bridge
  - Mobility
  - Other conditions

- Update chart after each treatment
- Historical charting (view changes over time)
- Print chart for patient records

### 4. Financial Management Module

#### Service Pricing & Cost Management

- **Service Catalog**:

  - List of all services/examinations/treatments
  - Default prices for each service
  - Price variations (e.g., different materials)
  - Package deals (e.g., cleaning + examination)
  - Discount rules

- **Price Management**:
  - Update prices
  - Set special prices for specific patients
  - Apply discounts (percentage or fixed amount)
  - Track price history

#### Invoicing & Receipts

- **Invoice Generation**:

  - Create invoice for services rendered
  - Include patient information
  - List all services with descriptions
  - Show individual prices
  - Calculate subtotal
  - Apply VAT (24% in Greece - if applicable)
  - Show total amount
  - Payment terms
  - Invoice number (sequential, unique)

- **Receipt Generation** (Greek Requirements):

  - Generate receipts compliant with Greek tax regulations
  - Include practice information (name, address, tax ID, etc.)
  - Patient information
  - Service details
  - Amount paid
  - Payment method
  - Receipt number
  - Date and time
  - QR code for myDATA integration (if applicable)

- **myDATA Integration** (Greek Tax Authority):
  - Send receipt data to myDATA platform
  - Compliance with AADE (Greek Independent Authority for Public Revenue) requirements
  - Automatic submission or manual trigger
  - Track submission status

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

- **Payment Tracking**:

  - Outstanding balances per patient
  - Payment history
  - Overdue payments
  - Payment reminders
  - Payment plans/installments

- **Installment Plans**:
  - Create payment plans for expensive treatments
  - Set number of installments
  - Set installment amounts
  - Set due dates
  - Track installment payments
  - Send reminders for upcoming installments

#### Financial Reports

- **Daily Reports**:

  - Total revenue
  - Number of patients
  - Services provided
  - Payment methods breakdown

- **Period Reports** (Weekly, Monthly, Yearly):

  - Total revenue
  - Total expenses (if tracked)
  - Net profit
  - Services breakdown
  - Patient statistics
  - Outstanding receivables
  - Payment method analysis

- **Patient Financial Summary**:
  - Total amount billed
  - Total amount paid
  - Outstanding balance
  - Payment history
  - Invoice history

### 5. Inventory Management Module

#### Material & Supply Tracking

- **Inventory Items**:

  - Material name
  - Category (anesthetic, filling materials, crowns, implants, etc.)
  - Supplier information
  - Unit of measurement (pieces, ml, grams, etc.)
  - Current stock quantity
  - Minimum stock level (reorder point)
  - Maximum stock level
  - Unit cost
  - Expiration date (if applicable)
  - Location/storage

- **Inventory Operations**:

  - Add new items
  - Update stock quantities
  - Record usage (linked to treatments)
  - Record purchases
  - Adjust inventory (corrections)
  - Transfer items

- **Stock Alerts**:

  - Low stock warnings
  - Expiration date warnings
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

### 6. Reporting & Analytics Module

#### Patient Reports

- **Patient Statistics**:

  - Total number of patients
  - New patients (by period)
  - Active patients
  - Inactive patients
  - Patient demographics

- **Treatment Reports**:
  - Most common treatments
  - Treatment success rates
  - Treatment frequency
  - Treatment trends

#### Financial Analytics

- Revenue trends
- Service profitability
- Payment method preferences
- Outstanding receivables analysis
- Patient payment behavior

#### Operational Reports

- Appointment statistics
- No-show rates
- Average appointment duration
- Busiest times/days
- Doctor productivity

#### Custom Reports

- Generate custom reports based on filters
- Export reports (PDF, Excel, CSV)
- Schedule automatic report generation
- Email reports

### 7. Communication Module

#### Patient Communication

- **SMS Notifications**:

  - Appointment reminders
  - Payment reminders
  - Treatment follow-up reminders
  - General announcements
  - SMS templates
  - Bulk SMS sending

- **Email Notifications**:

  - Appointment confirmations
  - Appointment reminders
  - Treatment instructions
  - Post-treatment care instructions
  - General communications
  - Email templates

- **In-App Notifications**:
  - Appointment reminders
  - Payment due reminders
  - Treatment plan updates
  - System notifications

#### Communication History

- Track all communications with patients
- View communication history per patient
- Communication preferences per patient

### 8. Compliance & Security Module

#### GDPR Compliance

- **Data Protection**:

  - Encrypt sensitive patient data
  - Secure data storage
  - Access controls and logging
  - Data backup and recovery

- **Consent Management**:

  - Patient consent forms
  - Consent tracking
  - Consent expiration management
  - Withdrawal of consent handling

- **Data Retention**:

  - Configure retention periods
  - Automatic data archival
  - Secure data deletion

- **Patient Rights**:
  - Right to access data
  - Right to rectification
  - Right to erasure
  - Right to data portability
  - Export patient data

#### Greek Dental Association Compliance

- Maintain patient records as required
- Document all treatments properly
- Keep records for required period
- Professional standards compliance

#### Security Features

- User authentication
- Role-based access control
- Activity logging
- Secure data transmission
- Regular security updates

### 9. User Management & Roles

#### User Roles

- **Doctor (Dentist)**:

  - Full access to all features
  - Can modify all patient data
  - Can approve financial transactions
  - Can modify treatment plans
  - Can access all reports

- **Assistant**:

  - Can view patient information
  - Can schedule appointments
  - Can record treatments (with doctor approval)
  - Can view financial information
  - Cannot modify sensitive patient data
  - Cannot approve large financial transactions

- **Secretary**:
  - Can schedule and manage appointments
  - Can create invoices and receipts
  - Can record payments
  - Can view patient basic information
  - Can send communications
  - Cannot modify medical records
  - Cannot create treatment plans

#### User Management

- Add/edit/remove users
- Assign roles
- Set permissions
- Track user activity
- User authentication (login/logout)
- Password management
- Session management

## Technical Requirements

### Environment Isolation

**CRITICAL**: The application must be completely isolated from other applications in the same folder:

- Use environment variables for all configuration
- Separate package.json and node_modules
- Isolated build configuration
- Separate database files
- No shared dependencies that could conflict
- Use environment-specific prefixes for all resources
- Separate app identifiers (bundle IDs, package names)
- Isolated storage paths

### Offline Capability

- Full offline functionality
- Local database for all operations
- Automatic data synchronization when online
- Conflict resolution for data sync
- Queue for actions performed offline
- Sync status indicators

### Data Synchronization

- Cloud backup (optional but recommended)
- Multi-device synchronization
- Real-time or scheduled sync
- Data conflict resolution
- Sync status tracking

### Performance Requirements

- Fast app startup (< 3 seconds)
- Smooth navigation
- Efficient database queries
- Optimized image handling
- Lazy loading where appropriate
- Efficient memory usage

### User Interface Requirements

- **Design Principles**:

  - Clean, modern, professional design
  - Intuitive navigation
  - Mobile-first approach
  - Touch-friendly interface
  - Accessible design (WCAG guidelines)

- **Greek Language Support**:

  - Full Greek language interface
  - Greek date/time formats
  - Greek number formats
  - Greek currency (EUR) formatting
  - Right-to-left text support where needed

- **Responsive Design**:
  - Works on various screen sizes
  - Tablet support
  - Portrait and landscape orientations
  - Adaptive layouts

### Integration Requirements

- **Calendar Integration**:

  - Sync with device calendar (optional)
  - Export appointments to calendar

- **SMS Integration**:

  - Send SMS via SMS gateway API
  - SMS delivery status tracking

- **Email Integration**:

  - Send emails via email service
  - Email templates
  - Email delivery tracking

- **myDATA Integration** (Greek Tax):
  - API integration with myDATA platform
  - Automatic receipt submission
  - Submission status tracking

### Data Model Requirements

- **Patient Entity**:

  - Personal information
  - Medical history
  - Dental history
  - Contact information
  - Financial information
  - Documents
  - Relationships (appointments, treatments, invoices)

- **Appointment Entity**:

  - Patient reference
  - Date and time
  - Duration
  - Type
  - Status
  - Notes
  - Reminder settings

- **Treatment Entity**:

  - Patient reference
  - Treatment type
  - Teeth involved
  - Date
  - Doctor
  - Notes
  - Materials used
  - Cost
  - Treatment plan reference

- **Invoice/Receipt Entity**:

  - Patient reference
  - Services
  - Amounts
  - Payment information
  - Tax information
  - myDATA submission status

- **Inventory Entity**:
  - Item information
  - Stock levels
  - Usage tracking
  - Purchase information

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

   - All modules implemented
   - Full offline capability
   - Data synchronization
   - Greek language support
   - Role-based access control

2. **Documentation**:

   - User manual
   - Admin guide
   - Technical documentation
   - API documentation (if applicable)

3. **Configuration**:
   - Environment setup guide
   - Database setup
   - Integration setup (SMS, Email, myDATA)
   - Deployment guide

## Success Criteria

- Application works fully offline
- All modules function as specified
- Greek language fully supported
- Role-based permissions work correctly
- Data synchronization works reliably
- Application is isolated from other apps in folder
- Performance meets requirements
- UI/UX is intuitive and professional
- GDPR compliance implemented
- Greek tax requirements met (myDATA integration)

## Notes

- Prioritize simplicity and ease of use for small practice (2-3 staff)
- Focus on essential features first, advanced features can be added later
- Ensure data security and privacy are paramount
- Consider the workflow of a typical day in a Greek dental practice
- Make the application fast and responsive
- Ensure it works reliably even with poor internet connection
