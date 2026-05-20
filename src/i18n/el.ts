/**
 * Greek UI strings (κύριες οθόνες).
 */

export const el = {
  common: {
    cancel: 'Ακύρωση',
    done: 'Τέλος',
    save: 'Αποθήκευση',
    delete: 'Διαγραφή',
    edit: 'Επεξεργασία',
    add: 'Προσθήκη',
    ok: 'OK',
    error: 'Σφάλμα',
    success: 'Επιτυχία',
    loading: 'Φόρτωση…',
    today: 'Σήμερα',
    tomorrow: 'Αύριο',
    yesterday: 'Χέθες',
    yes: 'Ναι',
    no: 'Όχι',
    patient: 'Ασθενής',
    patients: 'Ασθενείς',
    notes: 'Σημειώσεις',
    amount: 'Ποσό',
    date: 'Ημερομηνία',
    time: 'Ώρα',
    status: 'Κατάσταση',
    type: 'Τύπος',
    minutes: 'λεπτά',
    tapToChange: 'Πάτα για αλλαγή',
    tryAgain: 'Προσπαθήστε ξανά.',
  },

  nav: {
    tabToday: 'Σήμερα',
    tabPatients: 'Ασθενείς',
    tabAppointments: 'Ραντεβού',
    tabClinic: 'Κλινική',
    tabCash: 'Ταμείο',
    tabReports: 'Αναφορές',
    tabSettings: 'Ρυθμίσεις',
    todayClinicFlow: 'Σήμερα · Ροή κλινικής',
    clinicDailyFlow: 'Κλινική · Ροή ημέρας',
    overview: 'Επισκόπηση',
    patientDetails: 'Στοιχεία ασθενή',
    addPatient: 'Νέος ασθενής',
    editPatient: 'Επεξεργασία ασθενή',
    dentalChart: 'Οδοντόγραμμα',
    treatmentHistory: 'Ιστορικό θεραπειών',
    accountPayments: 'Λογιστήριο / πληρωμές',
    documentsXrays: 'Έγγραφα & ακτινογραφίες',
    invoicesReceipts: 'Τιμολόγια & αποδείξεις',
    treatmentPlans: 'Σχέδια θεραπείας',
    treatmentPlan: 'Σχέδιο θεραπείας',
    appointments: 'Ραντεβού',
    appointmentDetails: 'Λεπτομέρειες ραντεβού',
    addAppointment: 'Νέο ραντεβού',
    editAppointment: 'Επεξεργασία ραντεβού',
    dashboard: 'Πίνακας',
    cashRegister: 'Ταμείο',
    reports: 'Αναφορές',
    settings: 'Ρυθμίσεις',
    inventory: 'Αποθήκη',
  },

  auth: {
    signUp: 'Εγγραφή',
    noAccount: 'Δεν έχετε λογαριασμό;',
    footerSecure: 'Ασφαλής πρόσβαση στα δεδομένα της πρακτικής σας',
    loginTitle: 'Οδοντιατρείο',
    loginSubtitle: 'Σύστημα διαχείρισης',
    loginDescription: 'Συνδεθείτε για πρόσβαση στον πίνακα ελέγχου',
    username: 'Όνομα χρήστη',
    password: 'Κωδικός',
    login: 'Σύνδεση',
    forgotPassword: 'Ξεχάσατε τον κωδικό;',
    forgotPasswordBody:
      'Για επαναφορά κωδικού, επικοινωνήστε με τον διαχειριστή.\n\nΓια τον προεπιλεγμένο λογαριασμό admin, η επαναφορά γίνεται μέσω της βάσης.',
    enterUsername: 'Εισάγετε όνομα χρήστη',
    enterPassword: 'Εισάγετε κωδικό',
    authFailed: 'Αποτυχία σύνδεσης',
    invalidCredentials: 'Λάθος στοιχεία σύνδεσης. Δοκιμάστε ξανά.',
    hasAccount: 'Έχετε ήδη λογαριασμό;',
    createAccount: 'Δημιουργία λογαριασμού',
    createAccountSubtitle: 'Εγγραφή νέου χρήστη',
    firstName: 'Όνομα',
    lastName: 'Επώνυμο',
    phoneOptional: 'Τηλέφωνο (προαιρετικό)',
    confirmPasswordLabel: 'Επιβεβαίωση κωδικού',
    role: 'Ρόλος',
    enterEmail: 'Εισάγετε email',
    enterFirstName: 'Εισάγετε όνομα',
    enterLastName: 'Εισάγετε επώνυμο',
    usernameMin: 'Το όνομα χρήστη πρέπει να έχει τουλάχιστον 3 χαρακτήρες',
    validEmail: 'Εισάγετε έγκυρο email',
    passwordsMismatch: 'Οι κωδικοί δεν ταιριάζουν',
    registrationFailed: 'Αποτυχία εγγραφής',
    registrationFailedBody: 'Αποτυχία δημιουργίας λογαριασμού. Δοκιμάστε ξανά.',
    registrationSuccess: 'Ο λογαριασμός δημιουργήθηκε.',
    chooseUsername: 'Επιλέξτε όνομα χρήστη',
    chooseRole: 'Επιλέξτε ρόλο',
    registrationSuccessBody: 'Ο λογαριασμός δημιουργήθηκε. Μπορείτε να συνδεθείτε.',
    roleReceptionist: 'Υποδοχή',
    roleAssistant: 'Βοηθός',
    roleDentist: 'Οδοντίατρος',
  },

  patients: {
    searchPlaceholder: 'Όνομα, τηλέφωνο, email ή ΑΜΚΑ…',
    addPatient: 'Νέος ασθενής',
    loadingPatients: 'Φόρτωση ασθενών…',
    noPatientsYet: 'Δεν υπάρχουν ασθενείς ακόμα',
    addFirstPatient: 'Προσθέστε τον πρώτο ασθενή για να ξεκινήσετε',
    noPatients: 'Δεν βρέθηκαν ασθενείς',
    noPatientsSearch: 'Δοκιμάστε άλλη αναζήτηση',
    loadFailed: 'Αποτυχία φόρτωσης ασθενών.',
    deletePatient: 'Διαγραφή ασθενή',
    deletePatientConfirm:
      'Να διαγραφεί ο ασθενής; Η ενέργεια δεν αναιρείται.',
    patientNotFound: 'Ο ασθενής δεν βρέθηκε.',
    loadPatientFailed: 'Αποτυχία φόρτωσης στοιχείων ασθενή.',
    personalInfo: 'Προσωπικά στοιχεία',
    contactInfo: 'Επικοινωνία',
    gdprConsent: 'Συγκατάθεση GDPR',
    gdprSigned: 'Καταγράφηκε συγκατάθεση',
    gdprMissing: 'Λείπει συγκατάθεση',
    recordConsent: 'Καταχώρηση συγκατάθεσης',
    gdprConfirmTitle: 'Συγκατάθεση GDPR',
    gdprConfirmBody:
      'Επιβεβαιώστε ότι ο ασθενής (ή νόμιμος εκπρόσωπος) υπέγραψε τη φόρμα απορρήτου.',
    gdprSaved: 'Η συγκατάθεση καταγράφηκε.',
    gdprUpdateFailed: 'Αποτυχία ενημέρωσης συγκατάθεσης.',
    deleteSuccess: 'Ο ασθενής διαγράφηκε.',
    deleteFailed: 'Αποτυχία διαγραφής ασθενή.',
    dentalChart: 'Οδοντόγραμμα',
    treatmentPlans: 'Σχέδια θεραπείας',
    accountPayments: 'Λογιστήριο',
    documents: 'Έγγραφα',
    invoices: 'Τιμολόγια',
    amka: 'ΑΜΚΑ',
    afm: 'ΑΦΜ',
    phone: 'Τηλέφωνο',
    email: 'Email',
    dob: 'Ημ. γέννησης',
    gender: 'Φύλο',
    occupation: 'Επάγγελμα',
    address: 'Διεύθυνση',
    loadingPatient: 'Φόρτωση στοιχείων ασθενή…',
    goBack: 'Επιστροφή',
    gdprRequired: 'Απαιτείται συγκατάθεση GDPR',
    gdprRequiredHint:
      'Δεν υπάρχει έγκυρη συγκατάθεση. Καταγράψτε υπογεγραμμένη φόρμα πριν από ευαίσθητα δεδομένα.',
    yearsOld: 'ετών',
    notAvailable: '—',
    signConsent: 'Υπογραφή συγκατάθεσης',
    personalInformation: 'Προσωπικά στοιχεία',
    contactInformation: 'Επικοινωνία',
    emergencyContact: 'Επαφή έκτακτης ανάγκης',
    recordInformation: 'Μεταδεδομένα καρτέλας',
    created: 'Δημιουργία',
    lastUpdated: 'Τελευταία ενημέρωση',
    name: 'Όνομα',
    relationship: 'Σχέση',
    editPatient: 'Επεξεργασία ασθενή',
    deletePatientBtn: 'Διαγραφή ασθενή',
    male: 'Άνδρας',
    female: 'Γυναίκα',
    otherGender: 'Άλλο',
    formLoading: 'Φόρτωση φόρμας…',
    addressInformation: 'Διεύθυνση',
    emergencyContactSection: 'Επαφή έκτακτης ανάγκης',
    changePhoto: 'Αλλαγή φωτογραφίας',
    addPhoto: 'Προσθήκη φωτογραφίας',
    firstNameRequired: 'Απαιτείται όνομα',
    lastNameRequired: 'Απαιτείται επώνυμο',
    dobFuture: 'Η ημ. γέννησης δεν μπορεί να είναι στο μέλλον',
    phoneRequired: 'Απαιτείται τηλέφωνο',
    phoneInvalid: 'Μη έγκυρο τηλέφωνο',
    emailInvalid: 'Μη έγκυρο email',
    afmInvalid: 'Το ΑΦΜ πρέπει να είναι 9 ψηφία',
    taxOffice: 'ΔΟΥ',
    taxOfficePlaceholder: 'π.χ. Αθήνα',
    street: 'Οδός',
    city: 'Πόλη',
    postalCode: 'Τ.Κ.',
    country: 'Χώρα',
    createSuccess: 'Ο ασθενής δημιουργήθηκε.',
    updateSuccess: 'Ο ασθενής ενημερώθηκε.',
    saveFailed: 'Αποτυχία αποθήκευσης ασθενή.',
    photoPermission: 'Απαιτείται πρόσβαση στη συλλογή φωτογραφιών.',
    photoPickFailed: 'Αποτυχία επιλογής φωτογραφίας.',
    createPatient: 'Δημιουργία ασθενή',
    updatePatient: 'Ενημέρωση ασθενή',
    occupationPlaceholder: 'Επάγγελμα',
    emergencyName: 'Όνομα επαφής',
    emergencyPhone: 'Τηλέφωνο επαφής',
    removePhoto: 'Αφαίρεση',
    gdprFormHint: 'Καταγραφή συγκατάθεσης επεξεργασίας προσωπικών δεδομένων υγείας (GDPR).',
    greece: 'Ελλάδα',
  },

  appointments: {
    viewDay: 'Ημέρα',
    viewWeek: 'Εβδομάδα',
    viewMonth: 'Μήνας',
    viewYear: 'Έτος',
    tapChangeDate: 'Πάτα για αλλαγή ημερομηνίας',
    tapJumpDate: 'Πάτα για μετάβαση σε ημερομηνία',
    noAppointments: 'Δεν υπάρχουν ραντεβού',
    noAppointmentsDay: 'Δεν υπάρχουν ραντεβού για',
    noAppointmentsPeriod: 'Δεν υπάρχουν ραντεβού στην περίοδο',
    addAppointment: 'Νέο ραντεβού',
    loadingAppointments: 'Φόρτωση ραντεβού…',
    patientIdFallback: 'Ασθενής',
    loadFailed: 'Αποτυχία φόρτωσης ραντεβού.',
    deleteTitle: 'Διαγραφή ραντεβού',
    deleteConfirm: 'Να διαγραφεί το ραντεβού;',
    deleteSuccess: 'Το ραντεβού διαγράφηκε.',
    deleteFailed: 'Αποτυχία διαγραφής ραντεβού.',
    appointmentInfo: 'Στοιχεία ραντεβού',
    formLoading: 'Φόρτωση φόρμας…',
    selectPatient: 'Επιλογή ασθενή',
    startTime: 'Ώρα έναρξης',
    duration: 'Διάρκεια (λεπτά)',
    create: 'Δημιουργία ραντεβού',
    update: 'Ενημέρωση ραντεβού',
    patientRequired: 'Απαιτείται ασθενής',
    datePast: 'Η ημερομηνία δεν μπορεί να είναι στο παρελθόν',
    startTimeRequired: 'Απαιτείται ώρα έναρξης',
    durationInvalid: 'Η διάρκεια πρέπει να είναι > 0',
    validationError: 'Διορθώστε τα σφάλματα στη φόρμα',
    createSuccess: 'Το ραντεβού δημιουργήθηκε.',
    updateSuccess: 'Το ραντεβού ενημερώθηκε.',
    saveFailed: 'Αποτυχία αποθήκευσης ραντεβού.',
    validationErrorTitle: 'Σφάλμα επικύρωσης',
    userNotFound: 'Δεν βρέθηκε χρήστης',
    notesPlaceholder: 'Πρόσθετες σημειώσεις…',
    loadPatientsFailed: 'Αποτυχία φόρτωσης ασθενών',
    loadAppointmentFailed: 'Αποτυχία φόρτωσης ραντεβού',
    checkInSuccess: 'Check-in επιτυχές',
    checkInFailed: 'Αποτυχία check-in',
    treatmentStarted: 'Η θεραπεία ξεκίνησε',
    treatmentStartFailed: 'Αποτυχία έναρξης θεραπείας',
    checkoutSuccess: 'Η επίσκεψη ολοκληρώθηκε',
    checkoutFailed: 'Αποτυχία check-out',
    cancelTitle: 'Ακύρωση ραντεβού',
    cancelPrompt: 'Λόγος ακύρωσης (προαιρετικό):',
    cancelConfirm: 'Επιβεβαίωση',
    cancelSuccess: 'Το ραντεβού ακυρώθηκε',
    cancelFailed: 'Αποτυχία ακύρωσης',
    completeVisit: 'Ολοκλήρωση επίσκεψης',
    editAppointment: 'Επεξεργασία ραντεβού',
    loadingAppointmentDetail: 'Φόρτωση ραντεβού…',
    patientInformation: 'Στοιχεία ασθενή',
    appointmentDetailsSection: 'Λεπτομέρειες ραντεβού',
    checkedInAt: 'Check-in',
    checkedOutAt: 'Check-out',
    cancellationReason: 'Λόγος ακύρωσης',
    minutesLong: 'λεπτά',
    notFound: 'Το ραντεβού δεν βρέθηκε.',
    loadingAppointment: 'Φόρτωση ραντεβού…',
    checkIn: 'Check-in',
    startTreatment: 'Έναρξη θεραπείας',
    complete: 'Ολοκλήρωση',
    cancelAppointment: 'Ακύρωση ραντεβού',
    deleteAppointment: 'Διαγραφή',
    weekPlanLegend:
      'Πλάνο · πάτα μπλοκ για άνοιγμα · πάτα κεφαλίδα ημέρας για λίστα',
    monthPlanLegend:
      'Μηνιαίο πλάνο · πάτα ημέρα για λίστα · πάτα γραμμή για λεπτομέρειες',
    yearOverview: 'Επισκόπηση έτους · πάτα μήνα για μηνιαίο πλάνο',
    monthCol: 'Μήνας',
    apptsCol: 'Ραντεβού',
    daysCol: 'Ημέρες',
    activityCol: 'Δραστηριότητα',
    totalYear: 'Σύνολο',
    weekdays: ['Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ', 'Κυρ'] as const,
    status: {
      scheduled: 'Προγραμματισμένο',
      confirmed: 'Επιβεβαιωμένο',
      checked_in: 'Check-in',
      in_progress: 'Σε εξέλιξη',
      completed: 'Ολοκληρωμένο',
      cancelled: 'Ακυρωμένο',
      no_show: 'Δεν προσήλθε',
    },
    types: {
      initial_consultation: 'Αρχική εξέταση',
      regular_checkup: 'Συνήθης επίσκεψη',
      cleaning: 'Καθαρισμός',
      treatment: 'Θεραπεία',
      follow_up: 'Επανέλεγχος',
      emergency: 'Επείγον',
      consultation: 'Συνέλευση',
    },
  },

  clinic: {
    scheduledColumn: 'Προγραμματισμένα',
    scheduledSubtitle: 'Ραντεβού της ημέρας — ακόμα χωρίς check-in',
    confirmAppointment: 'Επιβεβαίωση',
    confirmFailed: 'Αποτυχία επιβεβαίωσης ραντεβού.',
    waitingRoom: 'Αναμονή',
    waitingSubtitle: 'Επιβεβαιωμένο ή check-in',
    inChair: 'Στην έδρα',
    inChairSubtitle: 'Θεραπεία σε εξέλιξη',
    checkout: 'Ταμείο / εκκρεμεί πληρωμή',
    checkoutSubtitle: 'Ολοκληρωμένες σήμερα, με υπόλοιπο',
    noPatientsHere: 'Κανένας ασθενής',
    emptyChair: 'Κενό',
    allClear: 'Όλα εντάξει',
    quickPayment: 'Γρήγορη πληρωμή',
    due: 'Οφείλεται',
    balance: 'Υπόλοιπο',
    checkIn: 'Check-in',
    startTreatment: 'Έναρξη θεραπείας',
    complete: 'Ολοκλήρωση',
    paymentRecordedTitle: 'Πληρωμή',
    paymentRecorded: 'Η πληρωμή καταγράφηκε και το λογιστήριο ενημερώθηκε.',
    paymentFailed: 'Αποτυχία καταχώρησης πληρωμής.',
    completeFailed: 'Αποτυχία ολοκλήρωσης επίσκεψης.',
    checkInFailed: 'Αποτυχία check-in',
    startFailed: 'Αποτυχία έναρξης θεραπείας',
    method: 'Τρόπος πληρωμής',
    receipt: 'Απόδειξη',
    invalidAmount: 'Εισάγετε έγκυρο ποσό.',
    overviewLink: 'Επισκόπηση',
    amountTitle: 'Ποσό',
    receiptIssued: 'Έκδοση απόδειξης (πριν myDATA)',
    optionalNotes: 'Προαιρετικά',
    record: 'Καταχώρηση',
  },

  settings: {
    title: 'Ρυθμίσεις',
    subtitle: 'Προφίλ, αντίγραφα ασφαλείας και αποσύνωση',
    profile: 'Προφίλ',
    name: 'Όνομα',
    email: 'Email',
    role: 'Ρόλος',
    system: 'Σύστημα',
    systemDesc:
      'Εξαγωγή πλήρους αντιγράφου δεδομένων ή μηνιαίας αναφοράς πληρωμών για τον λογιστή.',
    backupNow: 'Backup τώρα',
    exportCsvBtn: 'Εξαγωγή CSV',
    reminderTitle: 'Εβδομαδιαία υπενθύμιση backup',
    reminderOnTitle: 'Υπενθύμιση ενεργή',
    reminderOnBody:
      'Προγραμματίστηκε εβδομαδιαία υπενθύμιση (Δευτέρα 09:00, τοπική ώρα συσκευής).',
    autoReminder: 'Αυτόματη υπενθύμιση backup',
    autoReminderDesc: 'Εβδομαδιαία ειδοποίηση (μόνο κινητό) για χειροκίνητο backup.',
    exportCsvLong: 'Εξαγωγή μηνιαίου CSV για λογιστή',
    reminderNotAvailable:
      'Οι τοπικές ειδοποιήσεις δεν υποστηρίζονται στο web. Χρησιμοποιήστε την εφαρμογή κινητού.',
    reminderFailed: 'Αποτυχία ενημέρωσης υπενθυμίσεων',
    mustBeSignedIn: 'Πρέπει να είστε συνδεδεμένοι για αλλαγή κωδικού.',
    enterPasswords: 'Συμπληρώστε τρέχον και νέο κωδικό.',
    passwordDifferent: 'Ο νέος κωδικός πρέπει να διαφέρει από τον τρέχοντα.',
    passwordUpdateFailed: 'Αποτυχία ενημέρωσης κωδικού',
    exportCsvFailed: 'Αποτυχία δημιουργίας CSV',
    account: 'Λογαριασμός',
    changePassword: 'Αλλαγή κωδικού',
    currentPassword: 'Τρέχων κωδικός',
    newPassword: 'Νέος κωδικός',
    confirmPassword: 'Επιβεβαίωση κωδικού',
    updatePassword: 'Ενημέρωση κωδικού',
    passwordUpdated: 'Ο κωδικός ενημερώθηκε.',
    passwordMismatch: 'Οι κωδικοί δεν ταιριάζουν.',
    passwordTooShort: 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.',
    backup: 'Αντίγραφα ασφαλείας',
    exportDb: 'Εξαγωγή βάσης (.db)',
    exportCsv: 'Εξαγωγή CSV (αναφορά)',
    weeklyReminder: 'Εβδομαδιαία υπενθύμιση backup',
    logout: 'Αποσύνωση',
    logoutConfirm: 'Να αποσυνδεθείτε;',
    backupFailed: 'Αποτυχία backup',
    exportFailed: 'Αποτυχία εξαγωγής',
    practice: 'Ιατρείο',
    practiceDesc:
      'Στοιχεία εκδότη για τιμολόγια, αποδείξεις και myDATA. Εμφανίζονται στο PDF τιμολογίου.',
    legalName: 'Επωνυμία επιχείρησης',
    legalNamePlaceholder: 'π.χ. ΙΩΑΝΝΗΣ ΠΑΠΑΔΟΠΟΥΛΟΣ ΟΔΟΝΤΙΑΤΡΟΣ',
    tradeName: 'Διακριτικός τίτλος',
    tradeNamePlaceholder: 'π.χ. Smile Dental Clinic',
    practiceAfm: 'ΑΦΜ ιατρείου',
    practiceDoy: 'ΔΟΥ',
    activityCode: 'ΚΑΔ (προαιρετικά)',
    practicePhone: 'Τηλέφωνο ιατρείου',
    practiceEmail: 'Email ιατρείου',
    website: 'Ιστοσελίδα',
    defaultVat: 'Προεπιλεγμένο ΦΠΑ (%)',
    invoiceFooter: 'Υποσημείωση τιμολογίου',
    invoiceFooterPlaceholder: 'π.χ. Τραπεζικός λογαριασμός, όροι πληρωμής…',
    practiceSaved: 'Τα στοιχεία ιατρείου αποθηκεύτηκαν.',
    practiceSaveFailed: 'Αποτυχία αποθήκευσης.',
    practiceInvalidAfm: 'Το ΑΦΜ πρέπει να είναι 9 ψηφία.',
    practiceInvalidVat: 'Έγκυρο ποσοστό ΦΠΑ (0–100).',
    practiceIncompleteHint:
      'Συμπληρώστε τουλάχιστον επωνυμία και ΑΦΜ για πλήρη τιμολόγια.',
  },

  overview: {
    welcome: 'Καλώς ήρθατε',
    practiceSummary: 'Σύνοψη πρακτικής',
    monthRevenue: 'Έσοδα (μήνας)',
    outstandingBalances: 'Συνολικά υπόλοιπα',
    outstandingHint: 'Χρεώσεις μείον πληρωμές, για ασθενείς με θετικό υπόλοιπο.',
    appointmentsToday: 'Ραντεβού σήμερα',
  },

  financial: {
    cashRegister: 'Ταμείο',
    recentPayments: 'Πρόσφατες πληρωμές (όλοι οι ασθενείς)',
    dailyTotals: 'Εισπράξεις ημέρας (ανά τρόπο)',
    noPayments: 'Δεν υπάρχουν πληρωμές',
    noPaymentsDay: 'Δεν υπάρχουν πληρωμές αυτή την ημέρα.',
    noPaymentsYet: 'Δεν έχουν καταγραφεί πληρωμές ακόμα.',
    total: 'Σύνολο',
    receiptTag: 'Απόδειξη',
    todaySuffix: ' · Σήμερα',
  },

  reports: {
    title: 'Αναφορές',
    subtitle: 'Μηνιαία απόδοση και απαιτήσεις',
    revenue: 'Έσοδα',
    newPatients: 'Νέοι ασθενείς',
    clinicalProcedures: 'Κλινικές πράξεις',
    noProceduresMonth: 'Δεν υπάρχουν πράξεις αυτόν τον μήνα',
    topOutstanding: 'Μεγαλύτερα υπόλοιπα',
    noReceivables: 'Δεν υπάρχουν απαιτήσεις',
    loadFailed: 'Αποτυχία φόρτωσης αναφορών.',
    openInventory: 'Αποθήκη υλικών',
    openInventoryHint: 'Απόθεμα, χαμηλό stock, κινήσεις',
  },

  inventory: {
    title: 'Αποθήκη',
    subtitle: 'Υλικά και αναλώσιμα ιατρείου',
    totalItems: 'Είδη',
    lowStock: 'Λίγα τεμάχια',
    filterAll: 'Όλα',
    filterLow: 'Λίγα τεμάχια',
    empty: 'Δεν υπάρχουν είδη.',
    emptyLow: 'Κανένα είδος κάτω από το όριο.',
    addItem: 'Νέο είδος',
    editItem: 'Επεξεργασία είδους',
    movementModalTitle: 'Αλλαγή αποθέματος',
    statusNow: 'Τώρα έχετε',
    statusWarnAt: 'Προειδοποίηση κάτω από',
    editItemHint: 'Στοιχεία είδους (όνομα, όριο κ.λπ.)',
    stockMovement: 'Εφαρμογή',
    sku: 'Κωδικός (SKU)',
    name: 'Ονομασία',
    category: 'Κατηγορία',
    unit: 'Μονάδα μέτρησης',
    quantity: 'Πόσα έχετε τώρα',
    quantityPlaceholder: 'π.χ. 20',
    quantityHint:
      'Ο αριθμός που εμφανίζεται στη λίστα — πόσα τεμάχια είναι στην αποθήκη.',
    formAdjustmentNote: 'Αλλαγή από επεξεργασία',
    minQuantity: 'Όριο προειδοποίησης',
    minQuantityHint:
      'Όταν μείνουν τόσα ή λιγότερα, εμφανίζεται «Λίγα τεμάχια» στη λίστα.',
    listMinShort: 'όριο',
    initialStockNote: 'Αρχικό απόθεμα',
    unitCost: 'Κόστος μονάδας (€)',
    supplier: 'Προμηθευτής',
    location: 'Θέση αποθήκευσης',
    notes: 'Σημειώσεις',
    save: 'Αποθήκευση',
    cancel: 'Ακύρωση',
    movementType: 'Τι θέλετε να κάνετε;',
    amount: 'Πόσα τεμάχια;',
    amountHintAdd: 'Π.χ. ήρθαν 5 από προμηθευτή → γράψτε 5.',
    amountHintRemove: 'Π.χ. χρησιμοποιήσατε 3 → γράψτε 3.',
    amountHintAdjust:
      'Για μικρή διόρθωση: θετικός αριθμός προσθέτει, αρνητικός αφαιρεί.',
    recentMovements: 'Ιστορικό αλλαγών',
    noMovements: 'Δεν υπάρχουν ακόμα αλλαγές.',
    loadFailed: 'Αποτυχία φόρτωσης αποθήκης.',
    saveFailed: 'Αποτυχία αποθήκευσης.',
    movementFailed: 'Δεν έγινε η αλλαγή. Δοκιμάστε ξανά.',
    nameRequired: 'Η ονομασία είναι υποχρεωτική.',
    invalidAmount: 'Εισάγετε έγκυρη ποσότητα.',
    insufficientStock: 'Δεν υπάρχουν αρκετά τεμάχια για αφαίρεση.',
    deactivate: 'Απενεργοποίηση',
    reactivate: 'Επανενεργοποίηση',
    inactive: 'Ανενεργό',
    categories: {
      anesthetic: 'Αναισθητικά',
      filling_materials: 'Υλικά σφραγίσματος',
      crowns: 'Στεφάνες / γέφυρες',
      implants: 'Εμφυτεύματα',
      orthodontic: 'Ορθοδοντικά',
      periodontal: 'Περιοδοντικά',
      cleaning_supplies: 'Καθαρισμός',
      disposables: 'Αναλώσιμα',
      equipment: 'Εξοπλισμός',
      other: 'Άλλο',
    },
    movementTypes: {
      purchase: 'Πρόσθεσε',
      usage: 'Αφαίρεσε',
      adjustment: 'Διόρθωση (+/−)',
    },
  },

  chart: {
    history: 'Ιστορικό',
    loadFailed: 'Αποτυχία φόρτωσης οδοντογράμματος.',
    invalidCost: 'Μη έγκυρο ποσό',
    invalidCostBody: 'Εισάγετε αριθμό ή αφήστε κενό το κόστος.',
    saveFailed: 'Αποτυχία αποθήκευσης θεραπείας.',
    deleteTitle: 'Διαγραφή θεραπείας',
    deleteConfirm: 'Να αφαιρεθεί η θεραπεία;',
    deleted: 'Η θεραπεία αφαιρέθηκε.',
    deleteFailed: 'Αποτυχία διαγραφής θεραπείας.',
    loading: 'Φόρτωση οδοντογράμματος…',
    generalVisit: 'Γενική επίσκεψη',
    tooth: 'Δόντι',
    notesLabel: 'Σημειώσεις',
    notesPlaceholder: 'Κλινικές σημειώσεις…',
    costOptional: 'Κόστος (προαιρετικό)',
    deleteTreatment: 'Διαγραφή θεραπείας',
    saveTreatment: 'Αποθήκευση θεραπείας',
    selectProcedure: 'Επιλέξτε πράξη',
    savedGeneral: 'Η γενική θεραπεία αποθηκεύτηκε.',
    savedUpdated: 'Η θεραπεία ενημερώθηκε και το chart ανανεώθηκε.',
    savedNew: 'Η θεραπεία καταγράφηκε και το chart ενημερώθηκε.',
    deleteGeneralConfirm: 'Να αφαιρεθεί αυτή η γενική θεραπεία;',
    deleteToothConfirm:
      'Να αφαιρεθεί αυτή η εγγραφή; Το chart θα ακολουθήσει την τελευταία θεραπεία του δοντιού.',
    deletedChartUpdated: 'Η θεραπεία αφαιρέθηκε. Το chart ενημερώθηκε.',
  },

  history: {
    tooth: 'Δόντι',
    noNotes: 'Χωρίς σημειώσεις',
    tapEditDelete: 'Πάτα για επεξεργασία ή διαγραφή',
    noTreatments: 'Δεν υπάρχουν καταγεγραμμένες θεραπείες.',
    loading: 'Φόρτωση…',
    cost: 'Κόστος',
    general: 'Γενική',
    appointment: 'Ραντεβού',
    editHint: 'Πάτα για επεξεργασία στο οδοντόγραμμα',
  },

  documents: {
    loading: 'Φόρτωση εγγράφων…',
    headerSuffix: '— Έγγραφα & ακτινογραφίες',
    intro: 'Ακτινογραφίες, συγκαταθέσεις και άλλα αρχεία. Αποθήκευση μόνο στη συσκευή.',
    gdprWarning:
      'Δεν υπάρχει συγκατάθεση GDPR. Καταγράψτε συγκατάθεση στο προφίλ πριν από ευαίσθητες εικόνες.',
    addDocument: 'Προσθήκη εγγράφου',
    noDocuments: 'Δεν υπάρχουν έγγραφα',
    noDocumentsHint: 'Πατήστε Προσθήκη για αποθήκευση από συλλογή ή κάμερα.',
    untitled: 'Χωρίς τίτλο',
    uploadFailed: 'Αποτυχία αποστολής',
    uploadFailedBody: 'Αποτυχία αποθήκευσης εγγράφου.',
    libraryPermission: 'Απαιτείται πρόσβαση στη συλλογή.',
    cameraPermission: 'Απαιτείται πρόσβαση στην κάμερα.',
    addTitle: 'Προσθήκη εγγράφου',
    addBody: 'Επιλέξτε τύπο και πηγή.',
    source: 'Πηγή',
    photoLibrary: 'Συλλογή φωτογραφιών',
    camera: 'Κάμερα',
    deleteTitle: 'Διαγραφή εγγράφου',
    deleteConfirm: 'Να αφαιρεθεί',
    deleteFailed: 'Αποτυχία διαγραφής εγγράφου.',
    typeXray: 'Ακτινογραφία',
    typeConsent: 'Συγκατάθεση',
    typeOther: 'Άλλο',
    defaultXray: 'Ακτινογραφία',
    defaultConsent: 'Συγκατάθεση',
    defaultDocument: 'Έγγραφο',
  },

  invoices: {
    description: 'Περιγραφή',
    descriptionPlaceholder: 'Περιγραφή υπηρεσίας',
    netAmount: 'Καθαρό ποσό (EUR)',
    validation: 'Συμπληρώστε περιγραφή και έγκυρο ποσό.',
    invoiceCreated: 'Το τιμολόγιο αποθηκεύτηκε.',
    invoiceCreateFailed: 'Αποτυχία δημιουργίας τιμολογίου.',
    receiptCreated: 'Η απόδειξη και η πληρωμή καταγράφηκαν.',
    receiptCreateFailed: 'Αποτυχία δημιουργίας απόδειξης.',
    paid: 'Πληρώθηκε',
    paidLinked: 'Η πληρωμή συνδέθηκε με το τιμολόγιο.',
    cancelInvoice: 'Ακύρωση τιμολογίου',
    cancelConfirm: 'Να ακυρωθεί',
    mydataSubmitted: 'Υποβλήθηκε (προσομοίωση). Mark:',
    submitFailed: 'Αποτυχία υποβολής.',
    newInvoice: 'Νέο τιμολόγιο',
    newReceipt: 'Νέα απόδειξη',
    markPaid: 'Σήμανση πληρωμένου',
    submitMydata: 'Υποβολή myDATA',
    noInvoices: 'Δεν υπάρχουν τιμολόγια',
    loading: 'Φόρτωση…',
    status: {
      draft: 'Πρόχειρο',
      issued: 'Εκδόθηκε',
      paid: 'Πληρωμένο',
      cancelled: 'Ακυρωμένο',
    },
    tabInvoices: 'Τιμολόγια',
    tabReceipts: 'Αποδείξεις',
    afmMissing: 'Λείπει έγκυρο ΑΦΜ — η υποβολή myDATA μπορεί να αποτύχει.',
    defaultService: 'Οδοντιατρικές υπηρεσίες',
    intro:
      'Τιμολόγια (B2B) και αποδείξεις (λιανική). Αύξων αριθμός ανά έτος.',
    vatHint:
      'Το ΦΠΑ υπολογίζεται αυτόματα (ποσοστό από Ρυθμίσεις → Ιατρείο).',
    newInvoiceTitle: 'Νέο τιμολόγιο',
    newReceiptTitle: 'Νέα απόδειξη',
    recordPayment: 'Καταχώρηση πληρωμής',
    emptyInvoices: 'Δεν υπάρχουν τιμολόγια ακόμα.',
    emptyReceipts: 'Δεν υπάρχουν αποδείξεις ακόμα.',
    netLabel: 'Καθαρά',
    vatLabel: 'ΦΠΑ',
    recordPaymentTitle: 'Καταχώρηση πληρωμής',
    record: 'Καταχώρηση',
    paymentRecordFailed: 'Αποτυχία καταχώρησης πληρωμής.',
    cancelInvoiceNo: 'Όχι',
    headerSuffix: '— Τιμολόγια & αποδείξεις',
    quantity: 'Ποσότητα',
    unitPrice: 'Τιμή μονάδας (€)',
    addLine: 'Προσθήκη γραμμής',
    lineNumber: 'Γραμμή',
    importTreatments: 'Εισαγωγή από θεραπείες (χρεώσεις)',
    importTreatmentsEmpty: 'Δεν υπάρχουν χρεώσεις με ποσό για εισαγωγή.',
    linesCount: 'γραμμές',
    sharePdf: 'PDF / Κοινοποίηση',
    pdfFailed: 'Αποτυχία δημιουργίας PDF.',
    pdfTitle: 'ΤΙΜΟΛΟΓΙΟ',
    pdfSubtitle: 'Τιμολόγιο παροχής υπηρεσιών',
    pdfIssuer: 'Εκδότης',
    pdfCustomer: 'Πελάτης',
    pdfIssueDate: 'Ημ/νία έκδοσης',
    pdfDueDate: 'Ημ/νία πληρωμής',
    pdfTotal: 'Σύνολο',
    pdfColDescription: 'Περιγραφή',
    pdfColQty: 'Ποσ.',
    pdfColUnit: 'Τιμή',
    pdfColTotal: 'Σύνολο',
    pdfFooter: 'Έγγραφο από Dental Practice Management',
    pdfShareTitle: 'Τιμολόγιο',
  },

  receipts: {
    validation: 'Προσθέστε τουλάχιστον μία έγκυρη γραμμή (περιγραφή, ποσότητα, τιμή).',
    defaultService: 'Οδοντιατρικές υπηρεσίες',
    newReceiptTitle: 'Νέα απόδειξη',
    paymentHint:
      'Η συνολική πληρωμή καταχωρείται αυτόματα στο λογιστήριο με την απόδειξη.',
    linesCount: 'γραμμές',
    lineNumber: 'Γραμμή',
    description: 'Περιγραφή',
    descriptionPlaceholder: 'Περιγραφή υπηρεσίας',
    quantity: 'Ποσότητα',
    unitPrice: 'Τιμή μονάδας (€)',
    addLine: 'Προσθήκη γραμμής',
    importTreatments: 'Εισαγωγή από θεραπείες (χρεώσεις)',
    importTreatmentsEmpty: 'Δεν υπάρχουν χρεώσεις με ποσό για εισαγωγή.',
    netLabel: 'Καθαρά',
    vatLabel: 'ΦΠΑ',
    totalLabel: 'Σύνολο',
    sharePdf: 'PDF / Κοινοποίηση',
    pdfFailed: 'Αποτυχία δημιουργίας PDF.',
    pdfTitle: 'ΑΠΟΔΕΙΞΗ',
    pdfSubtitle: 'Απόδειξη λιανικής πώλησης / παροχής υπηρεσιών',
    pdfIssuer: 'Εκδότης',
    pdfCustomer: 'Πελάτης',
    pdfIssueDate: 'Ημ/νία έκδοσης',
    pdfPayment: 'Τρόπος πληρωμής',
    pdfTotal: 'Σύνολο',
    pdfColDescription: 'Περιγραφή',
    pdfColQty: 'Ποσ.',
    pdfColUnit: 'Τιμή',
    pdfColVat: 'ΦΠΑ %',
    pdfColTotal: 'Σύνολο',
    pdfFooter: 'Έγγραφο από Dental Practice Management',
    pdfShareTitle: 'Απόδειξη',
  },

  ledger: {
    loading: 'Φόρτωση λογιστικής…',
    patientFallback: 'Ασθενής',
    accountTitle: 'Λογαριασμός',
    intro:
      'Χρεώσεις (θεραπείες) και πληρωμές. Υποβολή στο myDATA για κάθε πληρωμή όταν απαιτείται.',
    afmBanner:
      'Λείπει έγκυρο ΑΦΜ (9 ψηφία). Η υποβολή στο myDATA είναι απενεργοποιημένη — συμπληρώστε το ΑΦΜ στο προφίλ του ασθενούς.',
    noMovements: 'Δεν υπάρχουν κινήσεις.',
    charge: 'Χρέωση',
    payment: 'Πληρωμή',
    mydataSubmitted: 'myDATA — υποβλήθηκε',
    receiptRecorded: 'Απόδειξη καταχωρημένη',
    submitMydata: 'Υποβολή στο myDATA',
    issueReceipt: 'Έκδοση απόδειξης',
    invoicesLink: 'Τιμολόγια & αποδείξεις',
    missingAfmHint: 'Λείπει ΑΦΜ',
    alertTitle: 'myDATA (προσομοίωση)',
    alertErr: 'Σφάλμα',
    alertErrBody: 'Αδυναμία υποβολής στο myDATA',
    balanceLabel: 'Υπόλοιπο',
    recordPayment: 'Καταχώρηση πληρωμής',
    legendCharges:
      'Χρέωση (θεραπεία): κόκκινο ποσό με + (ο ασθενής χρεώνεται).',
    legendPayments:
      'Πληρωμή: πράσινη γραμμή με − (τα χρήσαμε). Μετά: «Έκδοση απόδειξης» → «Υποβολή στο myDATA».',
    totalCharges: 'Σύνολο χρεώσεων',
    totalPayments: 'Πληρωμές',
    noCostHint:
      'Ποσό €0 — ανοίξτε Οδοντόγραμμα, πάτα το δόντι, επέλεξε θεραπεία και βάλε κόστος (π.χ. 15 ή 60).',
    zeroChargesBanner:
      'Οι θεραπείες είναι χωρίς ποσό. Το υπόλοιπο δεν μπορεί να είναι €60 μέχρι να καταχωρηθούν ποσά στο chart.',
    payModalTitle: 'Καταχώρηση πληρωμής',
    paySaved: 'Η πληρωμή καταχωρήθηκε.',
    swipeDeleteHint:
      'Σύρε χρέωση αριστερά → «Διαγραφή» ή πάτα τη γραμμή για επεξεργασία στο chart.',
    deleteAction: 'Διαγραφή',
    deleteChargeTitle: 'Διαγραφή χρέωσης',
    deleteChargeCancel: 'Ακύρωση',
    deleteChargeConfirm: 'Διαγραφή',
    deleteChargeOk: 'Η θεραπεία αφαιρέθηκε.',
    invalidAmount: 'Εισάγετε έγκυρο ποσό.',
    paymentFailed: 'Αποτυχία καταχώρησης πληρωμής.',
    issueReceiptFailed: 'Αποτυχία έκδοσης απόδειξης.',
    deleteTreatmentFailed: 'Αποτυχία διαγραφής θεραπείας.',
    amountEur: 'Ποσό (€)',
    paymentMethod: 'Τρόπος πληρωμής',
    notesOptional: 'Σημείωση (προαιρετικά)',
  },

  treatmentPlans: {
    headerSuffix: 'Σχέδια θεραπείας',
    intro: 'Φάσεις και ευρύτερες θεραπείες ανά ασθενή.',
    newPlan: 'Νέο σχέδιο',
    noPlans: 'Δεν υπάρχουν σχέδια.',
    titleRequired: 'Δώστε τίτλο σχεδίου.',
    createFailed: 'Αποτυχία δημιουργίας σχεδίου.',
    newPlanModalTitle: 'Νέο σχέδιο θεραπείας',
    titleLabel: 'Τίτλος',
    titlePlaceholder: 'π.χ. Πλήρης θεραπεία',
    descriptionOptional: 'Περιγραφή (προαιρετικά)',
    create: 'Δημιουργία',
    ledgerAllPosted: 'Έχει περαστεί στο λογιστήριο',
    ledgerNonePosted: 'Καμία χρέωση στο λογιστήριο',
    ledgerPartial: 'Χρεώσεις στο λογιστήριο',
    planStatus: {
      draft: 'Πρόχειρο',
      presented: 'Παρουσιάστηκε',
      approved: 'Εγκεκριμένο',
      in_progress: 'Σε εξέλιξη',
      completed: 'Ολοκληρώθηκε',
      cancelled: 'Ακυρώθηκε',
    },
    itemStatus: {
      pending: 'Αναμονή',
      scheduled: 'Προγραμματισμένη',
      completed: 'Ολοκληρώθηκε',
      cancelled: 'Ακυρώθηκε',
    },
    priority: {
      urgent: 'Επείγουσα',
      high: 'Υψηλή',
      medium: 'Μεσαία',
      low: 'Χαμηλή',
    },
    zeroCost: '€0 (χωρίς κόστος)',
    invalidCost: 'Έγκυρο ποσό.',
    ledgerTitle: 'Λογιστήριο',
    postToLedger: 'Καταχώρηση στο λογιστήριο',
    postToLedgerBtn: 'Καταχώρηση',
    markCompleteOnly: 'Μόνο ολοκλήρωση',
    completeAndCharge: 'Ολοκλήρωση + χρέωση',
    completeItemTitle: 'Ολοκλήρωση και χρέωση',
    chargeRecorded: 'Η χρέωση καταχωρήθηκε.',
    completePlanTitle: 'Ολοκλήρωση σχεδίου',
    completePlanOnly: 'Μόνο ολοκλήρωση',
    completePlanAndCharge: 'Ολοκλήρωση + χρέωση',
    planCompleted: 'Ολοκληρώθηκε',
    deletePlan: 'Διαγραφή σχεδίου',
    deletePhase: 'Διαγραφή φάσης',
    removeItem: 'Αφαίρεση',
    removeItemTitle: 'Αφαίρεση θεραπείας',
    pendingNoChargeBanner: 'Ολοκληρωμένες χωρίς χρέωση στο λογιστήριο',
    treatmentsCount: 'θεραπείες',
    tapToPost: 'Πάτα για καταχώρηση',
    newPhase: 'Νέα φάση',
    addPhaseHint: 'Προσθέστε μία φάση και προσθέστε θεραπείες.',
    noItemsInPhase: 'Καμία θεραπεία.',
    teeth: 'Δόντι: ',
    onLedger: ' · Στο λογιστήριο',
    treatmentInPhase: 'Θεραπεία στη φάση',
    deletePlanBtn: 'Διαγραφή σχεδίου',
    newPhaseModal: 'Νέα φάση',
    phaseNamePlaceholder: 'Έναρξη φάσης',
    priorityLabel: 'Προτεραιότητα',
    save: 'Αποθήκευση',
    treatmentModal: 'Θεραπεία',
    procedureType: 'Τύπος',
    teethFdi: 'Δόντι (FDI, π.χ. 11, 12 ή 25)',
    teethPlaceholder: '11, 12',
    description: 'Περιγραφή',
    estimatedCost: 'Εκτιμώμενο κόστος (€)',
    noNewPostings: 'Δεν υπήρχε νέα καταχώρηση.',
    energyIrreversible: 'Η ενέργεια δεν αναιρείται.',
    completePlanNoCharges:
      'Θέλετε να ολοκληρώσετε όλο το σχέδιο; (όλες οι θεραπείες είναι ήδη στο λογιστήριο.)',
    completeItemIntro:
      'Θα σημειωθεί ως ολοκληρωμένη και θα καταχωρηθεί χρέωση {amount} στο Λογιστήριο / Πληρωμές.',
    pendingBannerSub: '{count} θεραπείες · {total} · Πάτα για καταχώρηση',
    sharePdf: 'PDF / Κοινοποίηση',
    pdfFailed: 'Αποτυχία δημιουργίας PDF.',
    pdfTitle: 'ΣΧΕΔΙΟ ΘΕΡΑΠΕΙΑΣ',
    pdfSubtitle: 'Πρόταση θεραπείας για τον ασθενή',
    pdfClinic: 'Ιατρείο',
    pdfPatient: 'Ασθενής',
    pdfCreated: 'Ημ/νία δημιουργίας',
    pdfEstimatedTotal: 'Εκτιμώμενο σύνολο',
    pdfPhasePriority: 'Προτεραιότητα',
    pdfPhaseStatus: 'Κατάσταση φάσης',
    pdfColTeeth: 'Δόντια',
    pdfColStatus: 'Κατάσταση',
    pdfFooter: 'Έγγραφο από Dental Practice Management',
    pdfShareTitle: 'Σχέδιο θεραπείας',
    alternatives: 'Εναλλακτικές',
    newAlternative: 'Νέα εναλλακτική',
    alternativeModalTitle: 'Εναλλακτική πρόταση',
    alternativeNamePlaceholder: 'π.χ. Συντηρητική / Εμφυτεύματα',
    alternativeDescriptionOptional: 'Σημειώσεις (προαιρετικά)',
    selectedAlternative: 'Επιλεγμένη',
    deleteAlternative: 'Διαγραφή εναλλακτικής',
    deleteAlternativeBody:
      'Θα διαγραφούν όλες οι φάσεις και θεραπείες αυτής της πρότασης.',
    cannotDeleteLastAlternative: 'Πρέπει να υπάρχει τουλάχιστον μία εναλλακτική.',
    pdfAlternativeSection: 'Πρόταση',
    pdfAlternativeTotal: 'Σύνολο πρότασης',
    pdfSelectedAlternative: 'Επιλεγμένη πρόταση',
  },

  paymentMethods: {
    cash: 'Μετρητά',
    card: 'Κάρτα',
    bank_transfer: 'Τραπεζική κατάθεση',
    check: 'Επιταγή',
    other: 'Άλλο',
  },
} as const;

export type ElStrings = typeof el;

/** Appointment status label */
export function appointmentStatusLabel(status: string): string {
  const map = el.appointments.status as Record<string, string>;
  return map[status] ?? status;
}

/** Appointment type label */
export function appointmentTypeLabel(type: string): string {
  const map = el.appointments.types as Record<string, string>;
  return map[type] ?? type.replace(/_/g, ' ');
}

/** Invoice status label */
export function invoiceStatusLabel(status: string): string {
  const map = el.invoices.status as Record<string, string>;
  return map[status] ?? status;
}

/** Payment method label */
export function paymentMethodLabel(method: string): string {
  const map = el.paymentMethods as Record<string, string>;
  return map[method] ?? method;
}

/** Πλήρης πληρωμή τιμολογίου */
export function invoiceRecordPaymentBody(amount: string, number: string): string {
  return `Πλήρης πληρωμή ${amount} για ${number};`;
}

/** «N ραντεβού» */
export function appointmentCountEl(n: number): string {
  return n === 1 ? '1 ραντεβού' : `${n} ραντεβού`;
}

/** Locale for dates/times in UI */
export const UI_LOCALE = 'el-GR';

export function ledgerAccountTitle(patientName: string): string {
  return `${patientName || el.ledger.patientFallback} — ${el.ledger.accountTitle}`;
}

export function ledgerReceiptBody(receiptNumber: string): string {
  return `Απόδειξη ${receiptNumber}`;
}

export function ledgerDeleteChargeBody(description: string, amount: string): string {
  return `Να διαγραφεί «${description}» (${amount});\n\nΤο οδοντόγραμμα θα ενημερωθεί.`;
}

export function ledgerMydataSuccessBody(mark: string): string {
  return `Η υποβολή καταγράφηκε στην κονσόλα. Αναφορά: ${mark}`;
}

export function treatmentPlanStatusLabel(status: string): string {
  const map = el.treatmentPlans.planStatus as Record<string, string>;
  return map[status] ?? status;
}

export function planItemStatusLabel(status: string): string {
  const map = el.treatmentPlans.itemStatus as Record<string, string>;
  return map[status] ?? status;
}

export function phasePriorityLabel(priority: string): string {
  const map = el.treatmentPlans.priority as Record<string, string>;
  return map[priority] ?? priority;
}

export function treatmentPlanLedgerPartial(posted: number, total: number): string {
  return `Χρεώσεις στο λογιστήριο: ${posted}/${total}`;
}

export function planPostPendingBody(count: number, total: string): string {
  return `Θέλετε να καταχωρηθούν ${count} ολοκληρωμένες θεραπείες στο Λογιστήριο / Πληρωμές;\n\nΣύνολο χρέωσης: ${total}`;
}

export function planPostPendingSuccess(posted: number): string {
  return posted > 0
    ? `Καταχωρήθηκαν ${posted} χρέωση(εις).`
    : el.treatmentPlans.noNewPostings;
}

export function planCompleteItemBody(amount: string, procedure: string): string {
  return `${el.treatmentPlans.completeItemIntro.replace('{amount}', amount)}\n\n${procedure}`;
}

export function planCompletePlanWithCharges(count: number, total: string): string {
  return `Θέλετε να ολοκληρώσετε όλο το σχέδιο;\n\nΜε χρέωση: ${count} θεραπείες, σύνολο ${total} στο Λογιστήριο / Πληρωμές.`;
}

export function planCompletePlanSuccess(posted: number): string {
  return `Καταχωρήθηκαν ${posted} χρέωση(εις) στο λογιστήριο.`;
}

export function planDeletePlanDetails(phaseCount: number, itemCount: number): string {
  return `\n\nΠεριέχει ${phaseCount} φάσεις και ${itemCount} θεραπείες. ${el.treatmentPlans.energyIrreversible}`;
}

export function planDeletePlanLedgerNote(count: number): string {
  return `\n\nΘα αφαιρεθούν και ${count} χρέωση(εις) από το Λογιστήριο / Πληρωμές.`;
}

export function planDeletePlanBody(
  title: string,
  details: string,
  ledgerNote: string,
): string {
  return `Να διαγραφεί οριστικά το σχέδιο «${title}»;${details}${ledgerNote}`;
}

export function planDeletePhaseWithItems(itemCount: number): string {
  return `\n\nΘα διαγραφούν και ${itemCount} θεραπείες της φάσης. ${el.treatmentPlans.energyIrreversible}`;
}

export function planDeletePhaseEmpty(): string {
  return `\n\n${el.treatmentPlans.energyIrreversible}`;
}

export function planDeletePhaseLedgerNote(count: number): string {
  return `\n\nΘα αφαιρεθούν και ${count} χρέωση(εις) από το Λογιστήριο.`;
}

export function planDeletePhaseBody(
  phaseLabel: string,
  details: string,
  ledgerNote: string,
): string {
  return `Να διαγραφεί η φάση «${phaseLabel}»;${details}${ledgerNote}`;
}

export function planDeleteItemLedgerNote(amount: string): string {
  return `\n\nΘα αφαιρεθεί και η χρέωση ${amount} από το Λογιστήριο.`;
}

export function planDeleteItemBody(procedure: string, ledgerNote: string): string {
  return `Να αφαιρεθεί «${procedure}»;${ledgerNote}`;
}

export function planPendingBannerSub(count: number, total: string): string {
  return el.treatmentPlans.pendingBannerSub
    .replace('{count}', String(count))
    .replace('{total}', total);
}

export function inventoryCategoryLabel(category: string): string {
  const map = el.inventory.categories as Record<string, string>;
  return map[category] ?? category;
}

export function inventoryMovementTypeLabel(type: string): string {
  const map = el.inventory.movementTypes as Record<string, string>;
  return map[type] ?? type;
}
