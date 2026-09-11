export type Locale = 'en' | 'fr' | 'he';

export const LOCALES: Locale[] = ['en', 'fr', 'he'];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  he: 'עברית',
};

export const LOCALE_STORAGE_KEY = 'pealuna.locale';

export type Messages = {
  brand: string;
  nav: {
    services: string;
    howItWorks: string;
    trust: string;
    signIn: string;
    bookRepair: string;
    language: string;
    overview: string;
    book: string;
    myWigs: string;
    myAppointments: string;
    proSpace: string;
    clientSpace: string;
    logout: string;
    proDashboard: string;
    proOrders: string;
    availability: string;
    myProfile: string;
    reviews: string;
    admin: string;
    adminExperts: string;
    clients: string;
  };
  home: {
    eyebrow: string;
    titleLine1: string;
    titleAccent: string;
    subtitle: string;
    ctaBook: string;
    ctaBecomeExpert: string;
    trustEscrowTitle: string;
    trustEscrowDesc: string;
    trustLogisticsTitle: string;
    trustLogisticsDesc: string;
    trustHistoryTitle: string;
    trustHistoryDesc: string;
    howTitle: string;
    howStep1: string;
    howStep2: string;
    howStep3: string;
    howStep4: string;
    footer: string;
  };
  common: {
    loading: string;
    total: string;
    continue: string;
    back: string;
    save: string;
    delete: string;
    cancel: string;
    confirmDelete: string;
    choose: string;
    yes: string;
    no: string;
    active: string;
    dateTbd: string;
    requiredProfile: string;
    actionFailed: string;
  };
  dashboard: {
    hello: string;
    subtitle: string;
    bookCare: string;
    addWig: string;
    wigs: string;
    appointments: string;
    upcoming: string;
    seeAll: string;
    noAppointments: string;
    ordersTitle: string;
    ordersSubtitle: string;
  };
  wigs: {
    title: string;
    subtitle: string;
    add: string;
    empty: string;
    deleted: string;
    deleteConfirm: string;
    name: string;
    brand: string;
    color: string;
    fiber: string;
    length: string;
    condition: string;
    createFailed: string;
    lastExpert: string;
    viewState: string;
    mediaCount: string;
    deleteFailed: string;
  };
  review: {
    title: string;
    subtitle: string;
    ratingLabel: string;
    commentLabel: string;
    commentPlaceholder: string;
    submit: string;
    submitting: string;
    later: string;
    thanks: string;
    already: string;
    leaveReview: string;
    proTitle: string;
    proEmpty: string;
    proSubtitle: string;
  };
  payment: {
    title: string;
    status: string;
    escrowExplain: string;
    payHold: string;
    paying: string;
    prepareIntent: string;
    payCard: string;
    stripeHeld: string;
    release: string;
    releasing: string;
    captured: string;
    waitingExpert: string;
    releaseWhenComplete: string;
    platformFee: string;
    appointment: string;
    homeVenue: string;
    salonVenue: string;
    notes: string;
    notFound: string;
    services: string;
    simulationReady: string;
    stripeCreated: string;
    failed: string;
    simulationFailed: string;
    releaseFailed: string;
    reviewFailed: string;
  };
  book: {
    eyebrow: string;
    title: string;
    subtitle: string;
    stepServices: string;
    stepWig: string;
    stepExpert: string;
    stepSlot: string;
    stepConfirm: string;
    stepMedia: string;
    mediaTitle: string;
    mediaHint: string;
    takePhoto: string;
    chooseLibrary: string;
    mediaOptional: string;
    skip: string;
    locateMe: string;
    nearby: string;
    chooseWig: string;
    addWigLink: string;
    pickWigFirst: string;
    needService: string;
    needWig: string;
    needExpert: string;
    needSlot: string;
    bookFailed: string;
    addressPlaceholder: string;
    choosePlaceholder: string;
    city: string;
    postalCode: string;
    service: string;
    nearbyDistance: string;
  };
  admin: {
    title: string;
    services: string;
    add: string;
    price: string;
    name: string;
    category: string;
    minutes: string;
    inactive: string;
    expertsTitle: string;
    expertsSubtitle: string;
    approve: string;
    reject: string;
    noExperts: string;
    actionFailed: string;
    filters: {
      all: string;
      review: string;
      approved: string;
      rejected: string;
    };
  };
  auth: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
    noAccount: string;
    createOne: string;
    error: string;
    demoTitle: string;
    demoAdmin: string;
    demoExpert: string;
    joinTitle: string;
    joinSubtitle: string;
    firstName: string;
    lastName: string;
    passwordHint: string;
    terms: string;
    creating: string;
    createAccount: string;
    hasAccount: string;
    registerError: string;
    verifyTitle: string;
    verifyPending: string;
    verifySuccess: string;
    verifyError: string;
    verifyCta: string;
    resend: string;
    resending: string;
    resent: string;
  };
  job: {
    title: string;
    customer: string;
    wig: string;
    address: string;
    photos: string;
    noPhotos: string;
    complete: string;
    completing: string;
    completed: string;
    waitingAccept: string;
    open: string;
    accept: string;
    decline: string;
  };
  tracker: {
    sent: string;
    accepted: string;
    inProgress: string;
    completed: string;
    cancelled: string;
    rejected: string;
  };
  status: {
    DRAFT: string;
    SUBMITTED: string;
    WAITING_FOR_TECHNICIAN: string;
    ACCEPTED: string;
    PICKUP_SCHEDULED: string;
    RECEIVED: string;
    IN_DIAGNOSIS: string;
    WAITING_CUSTOMER_APPROVAL: string;
    IN_REPAIR: string;
    QUALITY_CONTROL: string;
    READY: string;
    DELIVERY_SCHEDULED: string;
    COMPLETED: string;
    CANCELLED: string;
    ARCHIVED: string;
    UNPAID: string;
    AUTHORIZED: string;
    CAPTURING: string;
    CAPTURED: string;
    REFUNDED: string;
    FAILED: string;
    VOIDED: string;
    UNDER_REVIEW: string;
    APPROVED: string;
    REJECTED: string;
    PENDING_APPLICATION: string;
    SUSPENDED: string;
    SUBMIT: string;
    ASSIGN_TECHNICIAN: string;
    ACCEPT: string;
    DECLINE: string;
    SCHEDULE_PICKUP: string;
    CONFIRM_RECEIVED: string;
    START_DIAGNOSIS: string;
    REQUEST_CUSTOMER_APPROVAL: string;
    APPROVE_ESTIMATE: string;
    START_REPAIR: string;
    SUBMIT_FOR_QC: string;
    PASS_QC: string;
    MARK_READY: string;
    SCHEDULE_DELIVERY: string;
    COMPLETE: string;
    CANCEL: string;
    ARCHIVE: string;
  };
  pro: {
    reserved: string;
    reservedHint: string;
    createProfile: string;
    eyebrow: string;
    title: string;
    appointments: string;
    ongoing: string;
    revenue: string;
    rating: string;
    bookings14: string;
    bookings14hint: string;
    revenue14: string;
    revenue14hint: string;
    upcoming: string;
    none: string;
    stripeTitle: string;
    stripeHint: string;
    stripeReady: string;
    stripeSetup: string;
    stripeRedirect: string;
    stripeSim: string;
    wigHistory: string;
    finishCare: string;
    applyTitle: string;
    applyEdit: string;
    applyHint: string;
    applyHintEdit: string;
    displayName: string;
    headline: string;
    headlinePlaceholder: string;
    city: string;
    postal: string;
    salon: string;
    years: string;
    applySubmit: string;
    applyUpdate: string;
    updated: string;
    applyFailed: string;
    updateFailed: string;
    needService: string;
    loadingProfile: string;
    clientsTitle: string;
    clientsEmpty: string;
    wigCount: string;
    availabilityTitle: string;
    availabilitySaved: string;
    saveFailed: string;
    weekdays: [string, string, string, string, string, string, string];
    bio: string;
    homeOffer: string;
    salonOffer: string;
    offeredServices: string;
    availabilityHint: string;
    closed: string;
    viewCareSheet: string;
  };
  geo: {
    meters: string;
    km: string;
    denied: string;
    unavailable: string;
    emptyExperts: string;
  };
  orders: {
    title: string;
    subtitle: string;
    newBooking: string;
    empty: string;
  };
};

export const en: Messages = {
  brand: 'PeaLuna',
  nav: {
    services: 'Services',
    howItWorks: 'How it works',
    trust: 'Trust',
    signIn: 'Sign in',
    bookRepair: 'Book a repair',
    language: 'Language',
    overview: 'Overview',
    book: 'Book',
    myWigs: 'My wigs',
    myAppointments: 'My appointments',
    proSpace: 'Pro space',
    clientSpace: 'Client space',
    logout: 'Log out',
    proDashboard: 'Dashboard',
    proOrders: 'My appointments',
    availability: 'Availability',
    myProfile: 'My profile',
    reviews: 'Reviews',
    admin: 'Admin',
    adminExperts: 'Experts',
    clients: 'Clients',
  },
  home: {
    eyebrow: 'Premium wig care marketplace',
    titleLine1: 'Restore. Transform.',
    titleAccent: 'Trust every strand.',
    subtitle:
      'PeaLuna connects you with expert wig technicians for repair, care, and transformation — with full lifecycle tracking, secure payments, and white-glove logistics.',
    ctaBook: 'Book a care appointment',
    ctaBecomeExpert: 'Become an expert',
    trustEscrowTitle: 'Escrow-grade payments',
    trustEscrowDesc: 'Funds protected until your service is completed to our quality standards.',
    trustLogisticsTitle: 'Pickup & delivery',
    trustLogisticsDesc: 'Coordinated logistics with every milestone tracked in your dashboard.',
    trustHistoryTitle: 'Full wig history',
    trustHistoryDesc: 'Every repair archived to your wig profile — built for long-term care.',
    howTitle: 'How PeaLuna works',
    howStep1: 'Upload photos of your wig and select services',
    howStep2: 'Receive an estimate and matched specialist',
    howStep3: 'Schedule pickup — track every repair stage',
    howStep4: 'Approve milestones, pay securely, receive delivery',
    footer: 'EU-hosted · GDPR-ready architecture.',
  },
  common: {
    loading: 'Loading…',
    total: 'Total',
    continue: 'Continue',
    back: 'Back',
    save: 'Save',
    delete: 'Delete',
    cancel: 'Cancel',
    confirmDelete: 'Delete this wig?',
    choose: 'Choose…',
    yes: 'Yes',
    no: 'No',
    active: 'Active',
    dateTbd: 'Date to confirm',
    requiredProfile: 'Expert profile required.',
    actionFailed: 'This action could not be completed.',
  },
  dashboard: {
    hello: 'Hello, {name}',
    subtitle: 'Your appointments, care history, and wigs — all in one place.',
    bookCare: 'Book a care',
    addWig: 'Add a wig',
    wigs: 'Wigs',
    appointments: 'Appointments',
    upcoming: 'Upcoming appointments',
    seeAll: 'See all',
    noAppointments: 'No appointments yet. Book your first care.',
    ordersTitle: 'Appointments',
    ordersSubtitle: 'Track every booking from request to completion.',
  },
  wigs: {
    title: 'My wigs',
    subtitle: 'Each profile keeps repair history attached to the unit.',
    add: 'Add wig',
    empty: 'No wig profiles yet.',
    deleted: 'Wig removed.',
    deleteConfirm: 'Remove this wig from your account?',
    name: 'Name',
    brand: 'Brand',
    color: 'Color',
    fiber: 'Fiber',
    length: 'Length (cm)',
    condition: 'Condition notes',
    createFailed: 'Could not create the wig.',
    lastExpert: 'Last expert',
    viewState: 'Wig condition',
    mediaCount: '{n} media',
    deleteFailed: 'Could not delete the wig.',
  },
  review: {
    title: 'Rate your expert',
    subtitle: 'Your feedback helps other clients choose with confidence.',
    ratingLabel: 'Rating',
    commentLabel: 'Comment',
    commentPlaceholder: 'What went well? Any detail to share…',
    submit: 'Send review',
    submitting: 'Sending…',
    later: 'Maybe later',
    thanks: 'Thank you for your review.',
    already: 'You already reviewed this appointment.',
    leaveReview: 'Leave a review',
    proTitle: 'Client reviews',
    proEmpty: 'No reviews yet.',
    proSubtitle: 'Feedback from clients you have worked with.',
  },
  payment: {
    title: 'Escrow payment',
    status: 'Status',
    escrowExplain:
      'Funds are held until you validate the service, then released to the expert (80%) — PeaLuna keeps 20%.',
    payHold: 'Pay & hold funds',
    paying: 'Paying…',
    prepareIntent: 'Prepare PaymentIntent',
    payCard: 'Pay by card',
    stripeHeld: 'Card authorized — funds are held in escrow.',
    release: 'Validate service & release escrow',
    releasing: 'Releasing…',
    captured: 'Payment captured — commission recorded.',
    waitingExpert: 'Payment is locked until the expert accepts this appointment.',
    releaseWhenComplete: 'Funds are held. You can release payment after the expert completes the service.',
    platformFee: 'Platform fee (20%)',
    appointment: 'Appointment',
    homeVenue: 'At home',
    salonVenue: 'Salon',
    notes: 'Notes',
    notFound: 'Order not found.',
    services: 'Services',
    simulationReady: 'Simulation mode ready — hold funds below.',
    stripeCreated: 'Stripe PaymentIntent created.',
    failed: 'Payment failed',
    simulationFailed: 'Simulation failed',
    releaseFailed: 'Release failed',
    reviewFailed: 'Review failed',
  },
  book: {
    eyebrow: 'Booking',
    title: 'Repair & care',
    subtitle:
      'Services → wig → local expert → slot → expert confirmation → escrow payment.',
    stepServices: 'Services',
    stepWig: 'Wig',
    stepExpert: 'Expert',
    stepSlot: 'Time slot',
    stepConfirm: 'Confirmation',
    stepMedia: 'Photos',
    mediaTitle: 'Add photos or a short video',
    mediaHint: 'Optional — only if you want. On a phone, Camera opens the rear camera (max 50 MB).',
    takePhoto: 'Camera',
    chooseLibrary: 'Library',
    mediaOptional: 'Optional',
    skip: 'Skip',
    locateMe: 'Use my location',
    nearby: 'Sorted by rating, near you',
    chooseWig: 'Which wig?',
    addWigLink: 'Add a wig',
    pickWigFirst: 'Add a wig first to continue.',
    needService: 'Choose at least one service.',
    needWig: 'Choose a wig.',
    needExpert: 'Choose an expert.',
    needSlot: 'Choose a date and time.',
    bookFailed: 'Booking could not be completed.',
    addressPlaceholder: 'Street, city',
    choosePlaceholder: 'Choose…',
    city: 'City',
    postalCode: 'Postal code',
    service: 'Service',
    nearbyDistance: 'Sorted by distance from you',
  },
  admin: {
    title: 'Catalog',
    services: 'Service options',
    add: 'Add a service',
    price: 'Price (agorot / cents)',
    name: 'Name',
    category: 'Category',
    minutes: 'Minutes',
    inactive: 'Hide',
    expertsTitle: 'Experts',
    expertsSubtitle: 'Approve new technicians before they appear in booking.',
    approve: 'Approve',
    reject: 'Reject',
    noExperts: 'No experts in this filter.',
    actionFailed: 'Could not update this expert.',
    filters: {
      all: 'All',
      review: 'Under review',
      approved: 'Approved',
      rejected: 'Rejected',
    },
  },
  auth: {
    title: 'Welcome back',
    subtitle: 'Sign in to your PeaLuna account',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in…',
    noAccount: 'No account?',
    createOne: 'Create one',
    error: 'Unable to sign in',
    demoTitle: 'Demo accounts',
    demoAdmin: 'Admin',
    demoExpert: 'Expert',
    joinTitle: 'Join PeaLuna',
    joinSubtitle: 'Create your customer account',
    firstName: 'First name',
    lastName: 'Last name',
    passwordHint: 'At least 10 characters',
    terms: 'I accept the terms of use',
    creating: 'Creating…',
    createAccount: 'Create account',
    hasAccount: 'Already have an account?',
    registerError: 'Unable to create account',
    verifyTitle: 'Verify your email',
    verifyPending: 'We sent a confirmation link. Open it to book and apply as an expert.',
    verifySuccess: 'Email confirmed. You can now book and apply as an expert.',
    verifyError: 'This confirmation link is invalid or expired.',
    verifyCta: 'Go to dashboard',
    resend: 'Resend email',
    resending: 'Sending…',
    resent: 'A new link was sent.',
  },
  job: {
    title: 'Appointment',
    customer: 'Client',
    wig: 'Wig',
    address: 'Address',
    photos: 'Photos & video',
    noPhotos: 'No photos attached.',
    complete: 'Mark service as done',
    completing: 'Saving…',
    completed: 'Service completed — the client can now leave a review.',
    waitingAccept: 'Waiting for your confirmation',
    open: 'Open dossier',
    accept: 'Accept',
    decline: 'Decline',
  },
  tracker: {
    sent: 'Request sent',
    accepted: 'Accepted',
    inProgress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Declined',
  },
  status: {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    WAITING_FOR_TECHNICIAN: 'Waiting for expert',
    ACCEPTED: 'Accepted',
    PICKUP_SCHEDULED: 'Appointment confirmed',
    RECEIVED: 'Received',
    IN_DIAGNOSIS: 'Diagnosis',
    WAITING_CUSTOMER_APPROVAL: 'Waiting for your approval',
    IN_REPAIR: 'In care',
    QUALITY_CONTROL: 'Quality check',
    READY: 'Ready',
    DELIVERY_SCHEDULED: 'Return scheduled',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    ARCHIVED: 'Archived',
    UNPAID: 'Unpaid',
    AUTHORIZED: 'Funds held',
    CAPTURED: 'Paid',
    REFUNDED: 'Refunded',
    FAILED: 'Failed',
    CAPTURING: 'Capturing payment',
    VOIDED: 'Authorization cancelled',
    UNDER_REVIEW: 'Under review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PENDING_APPLICATION: 'Pending',
    SUSPENDED: 'Suspended',
    SUBMIT: 'Submit',
    ASSIGN_TECHNICIAN: 'Assign expert',
    ACCEPT: 'Accept',
    DECLINE: 'Decline',
    SCHEDULE_PICKUP: 'Confirm appointment',
    CONFIRM_RECEIVED: 'Confirm received',
    START_DIAGNOSIS: 'Start diagnosis',
    REQUEST_CUSTOMER_APPROVAL: 'Request approval',
    APPROVE_ESTIMATE: 'Approve estimate',
    START_REPAIR: 'Start care',
    SUBMIT_FOR_QC: 'Submit for quality check',
    PASS_QC: 'Pass quality check',
    MARK_READY: 'Mark ready',
    SCHEDULE_DELIVERY: 'Schedule return',
    COMPLETE: 'Complete',
    CANCEL: 'Cancel',
    ARCHIVE: 'Archive',
  },
  pro: {
    reserved: 'Expert space',
    reservedHint: 'This space is for approved experts. Create a profile to offer your services.',
    createProfile: 'Create my expert profile',
    eyebrow: 'Expert',
    title: 'Dashboard',
    appointments: 'Appointments',
    ongoing: 'In progress',
    revenue: 'Revenue',
    rating: 'Rating',
    bookings14: 'Appointments — last 14 days',
    bookings14hint: 'Incoming request volume',
    revenue14: 'Revenue — last 14 days',
    revenue14hint: 'Validated amounts (before commission)',
    upcoming: 'Upcoming appointments',
    none: 'No appointments yet.',
    stripeTitle: 'Stripe Connect payouts',
    stripeHint: 'Connect your account to receive 80% after the client validates.',
    stripeReady: 'Account ready.',
    stripeSetup: 'Set up Stripe Connect',
    stripeRedirect: 'Redirecting…',
    stripeSim: 'Stripe is not configured — payments run in simulation mode.',
    wigHistory: 'Wig history',
    finishCare: 'Finish this care',
    applyTitle: 'Become an expert',
    applyEdit: 'My profile',
    applyHint: 'Create your expert profile to appear on the map.',
    applyHintEdit: 'Status: {status}. Keep your details up to date so clients find you on the map.',
    displayName: 'Display name',
    headline: 'Specialty',
    headlinePlaceholder: 'Lace & baby hair specialist',
    city: 'City',
    postal: 'Postal code',
    salon: 'Salon address',
    years: 'Years of experience',
    applySubmit: 'Create my expert profile',
    applyUpdate: 'Save profile',
    updated: 'Profile updated',
    applyFailed: 'Could not create the profile',
    updateFailed: 'Could not update the profile',
    needService: 'Select at least one service',
    loadingProfile: 'Loading profile…',
    clientsTitle: 'My clients',
    clientsEmpty: 'No clients yet.',
    wigCount: '{n} wig(s)',
    availabilityTitle: 'Availability',
    availabilitySaved: 'Availability saved',
    saveFailed: 'Could not save',
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    bio: 'Bio',
    homeOffer: 'Home visits',
    salonOffer: 'In salon',
    offeredServices: 'Services offered',
    availabilityHint: 'Set your weekly recurring slots.',
    closed: 'Closed',
    viewCareSheet: 'View care report',
  },
  geo: {
    meters: '{n} m',
    km: '{n} km',
    denied: 'Location was not shared. You can still pick an expert from the list.',
    unavailable: 'Location is not available on this device.',
    emptyExperts: 'No experts found for these filters.',
  },
  orders: {
    title: 'Appointments',
    subtitle: 'Track every booking from request to completion.',
    newBooking: 'New booking',
    empty: 'No appointments yet.',
  },
};

export const fr: Messages = {
  brand: 'PeaLuna',
  nav: {
    services: 'Services',
    howItWorks: 'Comment ça marche',
    trust: 'Confiance',
    signIn: 'Connexion',
    bookRepair: 'Réserver un soin',
    language: 'Langue',
    overview: 'Vue d’ensemble',
    book: 'Réserver',
    myWigs: 'Mes perruques',
    myAppointments: 'Mes RDV',
    proSpace: 'Espace pro',
    clientSpace: 'Espace client',
    logout: 'Déconnexion',
    proDashboard: 'Tableau de bord',
    proOrders: 'Mes rendez-vous',
    availability: 'Disponibilités',
    myProfile: 'Mon profil',
    reviews: 'Avis',
    admin: 'Admin',
    adminExperts: 'Expertes',
    clients: 'Clientes',
  },
  home: {
    eyebrow: 'Marketplace premium de soins pour perruques',
    titleLine1: 'Réparer. Transformer.',
    titleAccent: 'Confiance à chaque mèche.',
    subtitle:
      'PeaLuna vous met en relation avec des expertes en réparation et soin de perruques — suivi complet, paiements sécurisés et logistique soignée.',
    ctaBook: 'Réserver un soin',
    ctaBecomeExpert: 'Devenir experte',
    trustEscrowTitle: 'Paiement escrow',
    trustEscrowDesc:
      'Fonds protégés jusqu’à la validation du service selon nos standards qualité.',
    trustLogisticsTitle: 'Enlèvement & livraison',
    trustLogisticsDesc: 'Logistique coordonnée, chaque étape visible dans votre espace.',
    trustHistoryTitle: 'Historique complet',
    trustHistoryDesc:
      'Chaque réparation archivée sur le profil de votre perruque — pour un suivi durable.',
    howTitle: 'Comment PeaLuna fonctionne',
    howStep1: 'Ajoutez votre perruque et choisissez vos services',
    howStep2: 'Trouvez une experte près de chez vous',
    howStep3: 'Réservez un créneau — suivez chaque étape',
    howStep4: 'Payez en escrow après acceptation, validez, récupérez',
    footer: 'Hébergé en UE · Architecture prête RGPD.',
  },
  common: {
    loading: 'Chargement…',
    total: 'Total',
    continue: 'Continuer',
    back: 'Retour',
    save: 'Enregistrer',
    delete: 'Supprimer',
    cancel: 'Annuler',
    confirmDelete: 'Supprimer cette perruque ?',
    choose: 'Choisir…',
    yes: 'Oui',
    no: 'Non',
    active: 'Actif',
    dateTbd: 'Date à confirmer',
    requiredProfile: 'Profil prestataire requis.',
    actionFailed: 'Action impossible.',
  },
  dashboard: {
    hello: 'Bonjour, {name}',
    subtitle: 'Tes rendez-vous, l’historique de soins et tes perruques — tout au même endroit.',
    bookCare: 'Réserver un soin',
    addWig: 'Ajouter une perruque',
    wigs: 'Perruques',
    appointments: 'Rendez-vous',
    upcoming: 'Prochains RDV',
    seeAll: 'Tout voir',
    noAppointments: 'Aucun rendez-vous. Réserve ton premier soin.',
    ordersTitle: 'Rendez-vous',
    ordersSubtitle: 'Suis chaque réservation, de la demande à la fin du soin.',
  },
  wigs: {
    title: 'Mes perruques',
    subtitle: 'Chaque profil conserve l’historique de soins de la pièce.',
    add: 'Ajouter une perruque',
    empty: 'Aucune perruque pour le moment.',
    deleted: 'Perruque supprimée.',
    deleteConfirm: 'Retirer cette perruque de ton compte ?',
    name: 'Nom',
    brand: 'Marque',
    color: 'Couleur',
    fiber: 'Fibre',
    length: 'Longueur (cm)',
    condition: 'Notes d’état',
    createFailed: 'Impossible de créer la perruque.',
    lastExpert: 'Dernière experte',
    viewState: 'État de ma perruque',
    mediaCount: '{n} média(s)',
    deleteFailed: 'Impossible de supprimer la perruque.',
  },
  review: {
    title: 'Noter ton experte',
    subtitle: 'Ton avis aide les autres clientes à choisir en confiance.',
    ratingLabel: 'Note',
    commentLabel: 'Commentaire',
    commentPlaceholder: 'Qu’est-ce qui s’est bien passé ? Un détail à partager…',
    submit: 'Envoyer l’avis',
    submitting: 'Envoi…',
    later: 'Plus tard',
    thanks: 'Merci pour ton avis.',
    already: 'Tu as déjà noté ce rendez-vous.',
    leaveReview: 'Laisser un avis',
    proTitle: 'Avis clients',
    proEmpty: 'Aucun avis pour le moment.',
    proSubtitle: 'Les retours des clientes pour qui tu as travaillé.',
  },
  payment: {
    title: 'Paiement escrow',
    status: 'Statut',
    escrowExplain:
      'Les fonds sont bloqués jusqu’à ta validation du service, puis reversés à l’experte (80%) — PeaLuna conserve 20%.',
    payHold: 'Payer & bloquer les fonds',
    paying: 'Paiement…',
    prepareIntent: 'Préparer PaymentIntent',
    payCard: 'Payer par carte',
    stripeHeld: 'Carte autorisée — fonds bloqués en escrow.',
    release: 'Valider le service & libérer l’escrow',
    releasing: 'Libération…',
    captured: 'Paiement capturé — commission enregistrée.',
    waitingExpert: 'Le paiement est bloqué tant que l’experte n’a pas accepté le rendez-vous.',
    releaseWhenComplete:
      'Les fonds sont bloqués. Vous pourrez les libérer une fois le service terminé par l’experte.',
    platformFee: 'Commission plateforme (20%)',
    appointment: 'RDV',
    homeVenue: 'À domicile',
    salonVenue: 'Salon',
    notes: 'Notes',
    notFound: 'Commande introuvable.',
    services: 'Services',
    simulationReady: 'Mode simulation prêt — bloque les fonds ci-dessous.',
    stripeCreated: 'PaymentIntent Stripe créé.',
    failed: 'Paiement impossible',
    simulationFailed: 'Simulation impossible',
    releaseFailed: 'Libération impossible',
    reviewFailed: 'Avis impossible',
  },
  book: {
    eyebrow: 'Réservation',
    title: 'Réparer & soigner',
    subtitle:
      'Services → perruque → expert près de chez toi → créneau → confirmation experte → paiement escrow.',
    stepServices: 'Services',
    stepWig: 'Perruque',
    stepExpert: 'Expert',
    stepSlot: 'Créneau',
    stepConfirm: 'Confirmation',
    stepMedia: 'Photos',
    mediaTitle: 'Ajoute des photos ou une courte vidéo',
    mediaHint: 'Optionnel — seulement si tu veux. Sur téléphone, Photo ouvre la caméra arrière (max 50 Mo).',
    takePhoto: 'Photo',
    chooseLibrary: 'Galerie',
    mediaOptional: 'Optionnel',
    skip: 'Passer',
    locateMe: 'Utiliser ma position',
    nearby: 'Triées par note, près de toi',
    chooseWig: 'Quelle perruque ?',
    addWigLink: 'Ajouter une perruque',
    pickWigFirst: 'Ajoute d’abord une perruque pour continuer.',
    needService: 'Choisis au moins un service.',
    needWig: 'Choisis une perruque.',
    needExpert: 'Choisis une experte.',
    needSlot: 'Choisis une date et une heure.',
    bookFailed: 'Réservation impossible.',
    addressPlaceholder: 'Rue, ville',
    choosePlaceholder: 'Choisir…',
    city: 'Ville',
    postalCode: 'Code postal',
    service: 'Service',
    nearbyDistance: 'Triées par distance',
  },
  admin: {
    title: 'Catalogue',
    services: 'Options de service',
    add: 'Ajouter un service',
    price: 'Prix (agorot / centimes)',
    name: 'Nom',
    category: 'Catégorie',
    minutes: 'Minutes',
    inactive: 'Masquer',
    expertsTitle: 'Expertes',
    expertsSubtitle: 'Approuve les nouvelles expertes avant qu’elles apparaissent à la réservation.',
    approve: 'Approuver',
    reject: 'Refuser',
    noExperts: 'Aucune experte dans ce filtre.',
    actionFailed: 'Impossible de mettre à jour cette experte.',
    filters: {
      all: 'Toutes',
      review: 'En revue',
      approved: 'Approuvées',
      rejected: 'Refusées',
    },
  },
  auth: {
    title: 'Bon retour',
    subtitle: 'Connecte-toi à ton compte PeaLuna',
    email: 'Email',
    password: 'Mot de passe',
    submit: 'Connexion',
    submitting: 'Connexion…',
    noAccount: 'Pas de compte ?',
    createOne: 'Créer un compte',
    error: 'Impossible de se connecter',
    demoTitle: 'Comptes démo',
    demoAdmin: 'Admin',
    demoExpert: 'Experte',
    joinTitle: 'Rejoindre PeaLuna',
    joinSubtitle: 'Crée ton compte cliente',
    firstName: 'Prénom',
    lastName: 'Nom',
    passwordHint: 'Au moins 10 caractères',
    terms: 'J’accepte les conditions d’utilisation',
    creating: 'Création…',
    createAccount: 'Créer le compte',
    hasAccount: 'Déjà un compte ?',
    registerError: 'Impossible de créer le compte',
    verifyTitle: 'Vérifie ton email',
    verifyPending: 'Un lien de confirmation a été envoyé. Ouvre-le pour réserver ou postuler comme experte.',
    verifySuccess: 'Email confirmé. Tu peux maintenant réserver et postuler comme experte.',
    verifyError: 'Ce lien est invalide ou expiré.',
    verifyCta: 'Aller au tableau de bord',
    resend: 'Renvoyer l’email',
    resending: 'Envoi…',
    resent: 'Un nouveau lien a été envoyé.',
  },
  job: {
    title: 'Rendez-vous',
    customer: 'Cliente',
    wig: 'Perruque',
    address: 'Adresse',
    photos: 'Photos et vidéo',
    noPhotos: 'Aucune photo jointe.',
    complete: 'Marquer le service comme terminé',
    completing: 'Enregistrement…',
    completed: 'Service terminé — la cliente peut maintenant laisser un avis.',
    waitingAccept: 'En attente de ta confirmation',
    open: 'Ouvrir le dossier',
    accept: 'Accepter',
    decline: 'Refuser',
  },
  tracker: {
    sent: 'Réservation envoyée',
    accepted: 'Acceptée',
    inProgress: 'En préparation',
    completed: 'Terminée',
    cancelled: 'Annulée',
    rejected: 'Refusée',
  },
  status: {
    DRAFT: 'Brouillon',
    SUBMITTED: 'Envoyée',
    WAITING_FOR_TECHNICIAN: 'En attente de l’experte',
    ACCEPTED: 'Acceptée',
    PICKUP_SCHEDULED: 'Rendez-vous confirmé',
    RECEIVED: 'Reçue',
    IN_DIAGNOSIS: 'Diagnostic',
    WAITING_CUSTOMER_APPROVAL: 'En attente de ta validation',
    IN_REPAIR: 'Soin en cours',
    QUALITY_CONTROL: 'Contrôle qualité',
    READY: 'Prête',
    DELIVERY_SCHEDULED: 'Retour prévu',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
    ARCHIVED: 'Archivée',
    UNPAID: 'Impayé',
    AUTHORIZED: 'Fonds bloqués',
    CAPTURED: 'Payé',
    REFUNDED: 'Remboursé',
    FAILED: 'Échoué',
    CAPTURING: 'Capture en cours',
    VOIDED: 'Autorisation annulée',
    UNDER_REVIEW: 'En revue',
    APPROVED: 'Approuvée',
    REJECTED: 'Refusée',
    PENDING_APPLICATION: 'En attente',
    SUSPENDED: 'Suspendue',
    SUBMIT: 'Envoyer',
    ASSIGN_TECHNICIAN: 'Assigner une experte',
    ACCEPT: 'Accepter',
    DECLINE: 'Refuser',
    SCHEDULE_PICKUP: 'Confirmer le rendez-vous',
    CONFIRM_RECEIVED: 'Confirmer la réception',
    START_DIAGNOSIS: 'Démarrer le diagnostic',
    REQUEST_CUSTOMER_APPROVAL: 'Demander validation',
    APPROVE_ESTIMATE: 'Valider le devis',
    START_REPAIR: 'Démarrer le soin',
    SUBMIT_FOR_QC: 'Envoyer au contrôle qualité',
    PASS_QC: 'Valider le contrôle qualité',
    MARK_READY: 'Marquer comme prête',
    SCHEDULE_DELIVERY: 'Planifier le retour',
    COMPLETE: 'Terminer',
    CANCEL: 'Annuler',
    ARCHIVE: 'Archiver',
  },
  pro: {
    reserved: 'Espace prestataire',
    reservedHint: 'Cet espace est réservé aux expertes. Crée un profil pour proposer tes services.',
    createProfile: 'Créer mon profil experte',
    eyebrow: 'Prestataire',
    title: 'Tableau de bord',
    appointments: 'Rendez-vous',
    ongoing: 'En cours',
    revenue: 'Revenus',
    rating: 'Note',
    bookings14: 'RDV — 14 derniers jours',
    bookings14hint: 'Volume de demandes reçues',
    revenue14: 'Revenus — 14 derniers jours',
    revenue14hint: 'Montants validés (hors commission)',
    upcoming: 'Prochains RDV',
    none: 'Aucun rendez-vous pour le moment.',
    stripeTitle: 'Paiements Stripe Connect',
    stripeHint: 'Connecte ton compte pour recevoir les 80% après validation cliente.',
    stripeReady: 'Compte prêt.',
    stripeSetup: 'Configurer Stripe Connect',
    stripeRedirect: 'Redirection…',
    stripeSim: 'Stripe non configuré — les paiements tournent en mode simulation.',
    wigHistory: 'Historique de la perruque',
    finishCare: 'Terminer le soin',
    applyTitle: 'Devenir experte',
    applyEdit: 'Mon profil',
    applyHint: 'Crée ton profil prestataire pour apparaître sur la carte.',
    applyHintEdit: 'Statut : {status}. Mets à jour tes infos pour apparaître correctement sur la carte.',
    displayName: 'Nom affiché',
    headline: 'Spécialité',
    headlinePlaceholder: 'Spécialiste lace & baby hair',
    city: 'Ville',
    postal: 'Code postal',
    salon: 'Adresse salon',
    years: 'Années d’expérience',
    applySubmit: 'Créer mon profil experte',
    applyUpdate: 'Enregistrer le profil',
    updated: 'Profil mis à jour',
    applyFailed: 'Impossible de créer le profil',
    updateFailed: 'Impossible de mettre à jour',
    needService: 'Sélectionne au moins un service',
    loadingProfile: 'Chargement du profil…',
    clientsTitle: 'Mes clientes',
    clientsEmpty: 'Aucune cliente pour le moment.',
    wigCount: '{n} perruque(s)',
    availabilityTitle: 'Disponibilités',
    availabilitySaved: 'Disponibilités enregistrées',
    saveFailed: 'Enregistrement impossible',
    weekdays: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    bio: 'Bio',
    homeOffer: 'À domicile',
    salonOffer: 'En salon',
    offeredServices: 'Services proposés',
    availabilityHint: 'Définis tes créneaux hebdomadaires (récurrent).',
    closed: 'Fermé',
    viewCareSheet: 'Voir la fiche de soin',
  },
  geo: {
    meters: '{n} m',
    km: '{n} km',
    denied: 'Position non partagée. Tu peux quand même choisir une experte dans la liste.',
    unavailable: 'La géolocalisation n’est pas disponible sur cet appareil.',
    emptyExperts: 'Aucune experte pour ces filtres.',
  },
  orders: {
    title: 'Rendez-vous',
    subtitle: 'Suis chaque réservation, de la demande à la fin du soin.',
    newBooking: 'Nouvelle réservation',
    empty: 'Aucun rendez-vous pour le moment.',
  },
};

export const he: Messages = {
  brand: 'PeaLuna',
  nav: {
    services: 'שירותים',
    howItWorks: 'איך זה עובד',
    trust: 'אמון',
    signIn: 'התחברות',
    bookRepair: 'הזמנת תיקון',
    language: 'שפה',
    overview: 'סקירה',
    book: 'הזמנה',
    myWigs: 'הפאות שלי',
    myAppointments: 'התורים שלי',
    proSpace: 'אזור מקצועי',
    clientSpace: 'אזור לקוח',
    logout: 'התנתקות',
    proDashboard: 'לוח בקרה',
    proOrders: 'התורים שלי',
    availability: 'זמינות',
    myProfile: 'הפרופיל שלי',
    reviews: 'ביקורות',
    admin: 'ניהול',
    adminExperts: 'מומחיות',
    clients: 'לקוחות',
  },
  home: {
    eyebrow: 'מרקטפלייס פרימיום לטיפול בפאות',
    titleLine1: 'לשחזר. לשנות.',
    titleAccent: 'אמון בכל תלתל.',
    subtitle:
      'PeaLuna מחברת אותך למומחיות תיקון וטיפול בפאות — מעקב מלא, תשלומים מאובטחים ולוגיסטיקה מקצועית.',
    ctaBook: 'להזמין טיפול',
    ctaBecomeExpert: 'להפוך למומחית',
    trustEscrowTitle: 'תשלום נאמנות (escrow)',
    trustEscrowDesc: 'הכספים מוגנים עד להשלמת השירות לפי תקני האיכות שלנו.',
    trustLogisticsTitle: 'איסוף ומסירה',
    trustLogisticsDesc: 'לוגיסטיקה מתואמת עם מעקב אחר כל שלב בלוח הבקרה.',
    trustHistoryTitle: 'היסטוריית פאה מלאה',
    trustHistoryDesc: 'כל תיקון נשמר בפרופיל הפאה — לטיפול ארוך טווח.',
    howTitle: 'איך PeaLuna עובדת',
    howStep1: 'הוסיפי את הפאה ובחרי שירותים',
    howStep2: 'מצאי מומחית קרובה אליך',
    howStep3: 'קבעי תור — עקבי אחרי כל שלב',
    howStep4: 'שלמי בנאמנות אחרי אישור, אשרי וקבלי בחזרה',
    footer: 'מאוחסן באיחוד האירופי · מוכן ל-GDPR.',
  },
  common: {
    loading: 'טוען…',
    total: 'סה״כ',
    continue: 'המשך',
    back: 'חזרה',
    save: 'שמירה',
    delete: 'מחיקה',
    cancel: 'ביטול',
    confirmDelete: 'למחוק את הפאה?',
    choose: 'בחירה…',
    yes: 'כן',
    no: 'לא',
    active: 'פעיל',
    dateTbd: 'תאריך לאישור',
    requiredProfile: 'נדרש פרופיל מומחית.',
    actionFailed: 'לא ניתן לבצע את הפעולה.',
  },
  dashboard: {
    hello: 'שלום, {name}',
    subtitle: 'התורים שלך, היסטוריית הטיפולים והפאות — הכל במקום אחד.',
    bookCare: 'להזמין טיפול',
    addWig: 'להוסיף פאה',
    wigs: 'פאות',
    appointments: 'תורים',
    upcoming: 'תורים קרובים',
    seeAll: 'הצג הכל',
    noAppointments: 'אין תורים עדיין. הזמיני את הטיפול הראשון.',
    ordersTitle: 'תורים',
    ordersSubtitle: 'מעקב אחרי כל הזמנה מהבקשה ועד הסיום.',
  },
  wigs: {
    title: 'הפאות שלי',
    subtitle: 'כל פרופיל שומר את היסטוריית הטיפולים של היחידה.',
    add: 'הוספת פאה',
    empty: 'אין פאות עדיין.',
    deleted: 'הפאה הוסרה.',
    deleteConfirm: 'להסיר את הפאה מהחשבון?',
    name: 'שם',
    brand: 'מותג',
    color: 'צבע',
    fiber: 'סיב',
    length: 'אורך (ס״מ)',
    condition: 'הערות מצב',
    createFailed: 'לא ניתן ליצור את הפאה.',
    lastExpert: 'מומחית אחרונה',
    viewState: 'מצב הפאה',
    mediaCount: '{n} מדיה',
    deleteFailed: 'לא ניתן למחוק את הפאה.',
  },
  review: {
    title: 'דרגי את המומחית',
    subtitle: 'המשוב שלך עוזר ללקוחות אחרות לבחור בביטחון.',
    ratingLabel: 'דירוג',
    commentLabel: 'תגובה',
    commentPlaceholder: 'מה עבד טוב? פרט שתרצי לשתף…',
    submit: 'שליחת ביקורת',
    submitting: 'שולח…',
    later: 'אולי אחר כך',
    thanks: 'תודה על הביקורת.',
    already: 'כבר דירגת את התור הזה.',
    leaveReview: 'השאירי ביקורת',
    proTitle: 'ביקורות לקוחות',
    proEmpty: 'אין ביקורות עדיין.',
    proSubtitle: 'משוב מלקוחות שעבדת איתן.',
  },
  payment: {
    title: 'תשלום נאמנות',
    status: 'סטטוס',
    escrowExplain:
      'הכספים נחסמים עד לאישור השירות על ידך, ואז מועברים למומחית (80%) — PeaLuna שומרת 20%.',
    payHold: 'שלם וחסום כספים',
    paying: 'משלם…',
    prepareIntent: 'הכן PaymentIntent',
    payCard: 'תשלום בכרטיס',
    stripeHeld: 'הכרטיס אושר — הכספים חסומים בנאמנות.',
    release: 'אשר שירות ושחרר נאמנות',
    releasing: 'משחרר…',
    captured: 'התשלום נלכד — העמלה נרשמה.',
    waitingExpert: 'לא ניתן לשלם לפני שהמומחית מאשרת את התור.',
    releaseWhenComplete: 'הכספים חסומים. אפשר לשחרר תשלום אחרי שהמומחית משלימה את השירות.',
    platformFee: 'עמלת פלטפורמה (20%)',
    appointment: 'תור',
    homeVenue: 'בבית',
    salonVenue: 'בסלון',
    notes: 'הערות',
    notFound: 'ההזמנה לא נמצאה.',
    services: 'שירותים',
    simulationReady: 'מצב סימולציה מוכן — חסימת כספים למטה.',
    stripeCreated: 'נוצר PaymentIntent ב-Stripe.',
    failed: 'התשלום נכשל',
    simulationFailed: 'הסימולציה נכשלה',
    releaseFailed: 'השחרור נכשל',
    reviewFailed: 'הביקורת נכשלה',
  },
  book: {
    eyebrow: 'הזמנה',
    title: 'תיקון וטיפול',
    subtitle: 'שירותים → פאה → מומחית קרובה → משבצת → אישור מומחית → תשלום נאמנות.',
    stepServices: 'שירותים',
    stepWig: 'פאה',
    stepExpert: 'מומחית',
    stepSlot: 'משבצת',
    stepConfirm: 'אישור',
    stepMedia: 'תמונות',
    mediaTitle: 'הוסיפי תמונות או סרטון קצר',
    mediaHint: 'אופציונלי — רק אם תרצי. בטלפון, מצלמה פותחת את המצלמה האחורית (עד 50MB).',
    takePhoto: 'מצלמה',
    chooseLibrary: 'גלריה',
    mediaOptional: 'אופציונלי',
    skip: 'דילוג',
    locateMe: 'השתמשי במיקום שלי',
    nearby: 'ממוינות לפי דירוג, קרוב אלייך',
    chooseWig: 'איזו פאה?',
    addWigLink: 'הוספת פאה',
    pickWigFirst: 'הוסיפי קודם פאה כדי להמשיך.',
    needService: 'בחרי לפחות שירות אחד.',
    needWig: 'בחרי פאה.',
    needExpert: 'בחרי מומחית.',
    needSlot: 'בחרי תאריך ושעה.',
    bookFailed: 'לא ניתן להשלים את ההזמנה.',
    addressPlaceholder: 'רחוב, עיר',
    choosePlaceholder: 'בחירה…',
    city: 'עיר',
    postalCode: 'מיקוד',
    service: 'שירות',
    nearbyDistance: 'ממוינות לפי מרחק ממך',
  },
  admin: {
    title: 'קטלוג',
    services: 'אפשרויות שירות',
    add: 'הוספת שירות',
    price: 'מחיר (אגורות)',
    name: 'שם',
    category: 'קטגוריה',
    minutes: 'דקות',
    inactive: 'הסתרה',
    expertsTitle: 'מומחיות',
    expertsSubtitle: 'אשרי מומחיות חדשות לפני שהן מופיעות בהזמנה.',
    approve: 'אישור',
    reject: 'דחייה',
    noExperts: 'אין מומחיות בסינון הזה.',
    actionFailed: 'לא ניתן לעדכן את המומחית.',
    filters: {
      all: 'הכול',
      review: 'בבדיקה',
      approved: 'מאושרות',
      rejected: 'נדחו',
    },
  },
  auth: {
    title: 'ברוכה השבה',
    subtitle: 'התחברי לחשבון PeaLuna',
    email: 'אימייל',
    password: 'סיסמה',
    submit: 'התחברות',
    submitting: 'מתחברת…',
    noAccount: 'אין חשבון?',
    createOne: 'יצירת חשבון',
    error: 'לא ניתן להתחבר',
    demoTitle: 'חשבונות דמו',
    demoAdmin: 'ניהול',
    demoExpert: 'מומחית',
    joinTitle: 'הצטרפות ל-PeaLuna',
    joinSubtitle: 'יצירת חשבון לקוחה',
    firstName: 'שם פרטי',
    lastName: 'שם משפחה',
    passwordHint: 'לפחות 10 תווים',
    terms: 'אני מאשרת את תנאי השימוש',
    creating: 'יוצרת…',
    createAccount: 'יצירת חשבון',
    hasAccount: 'כבר יש חשבון?',
    registerError: 'לא ניתן ליצור חשבון',
    verifyTitle: 'אימות אימייל',
    verifyPending: 'שלחנו קישור לאימות. פתחי אותו כדי להזמין תור או להגיש מועמדות.',
    verifySuccess: 'האימייל אומת. אפשר להזמין תור ולהגיש מועמדות כמומחית.',
    verifyError: 'הקישור אינו תקף או שפג תוקפו.',
    verifyCta: 'ללוח הבקרה',
    resend: 'שליחה מחדש',
    resending: 'שולחת…',
    resent: 'נשלח קישור חדש.',
  },
  job: {
    title: 'תור',
    customer: 'לקוחה',
    wig: 'פאה',
    address: 'כתובת',
    photos: 'תמונות ווידאו',
    noPhotos: 'אין תמונות מצורפות.',
    complete: 'סמני את השירות כהושלם',
    completing: 'שומר…',
    completed: 'השירות הושלם — הלקוחה יכולה להשאיר ביקורת.',
    waitingAccept: 'ממתין לאישור שלך',
    open: 'פתיחת תיק',
    accept: 'אישור',
    decline: 'סירוב',
  },
  tracker: {
    sent: 'הבקשה נשלחה',
    accepted: 'אושרה',
    inProgress: 'בהכנה',
    completed: 'הושלמה',
    cancelled: 'בוטלה',
    rejected: 'נדחתה',
  },
  status: {
    DRAFT: 'טיוטה',
    SUBMITTED: 'נשלחה',
    WAITING_FOR_TECHNICIAN: 'ממתינה למומחית',
    ACCEPTED: 'אושרה',
    PICKUP_SCHEDULED: 'התור אושר',
    RECEIVED: 'התקבלה',
    IN_DIAGNOSIS: 'אבחון',
    WAITING_CUSTOMER_APPROVAL: 'ממתינה לאישורך',
    IN_REPAIR: 'בטיפול',
    QUALITY_CONTROL: 'בקרת איכות',
    READY: 'מוכנה',
    DELIVERY_SCHEDULED: 'החזרה נקבעה',
    COMPLETED: 'הושלמה',
    CANCELLED: 'בוטלה',
    ARCHIVED: 'בארכיון',
    UNPAID: 'לא שולם',
    AUTHORIZED: 'כספים חסומים',
    CAPTURED: 'שולם',
    REFUNDED: 'הוחזר',
    FAILED: 'נכשל',
    CAPTURING: 'לוכד תשלום',
    VOIDED: 'ההרשאה בוטלה',
    UNDER_REVIEW: 'בבדיקה',
    APPROVED: 'מאושרת',
    REJECTED: 'נדחתה',
    PENDING_APPLICATION: 'ממתינה',
    SUSPENDED: 'מושעית',
    SUBMIT: 'שליחה',
    ASSIGN_TECHNICIAN: 'שיוך מומחית',
    ACCEPT: 'אישור',
    DECLINE: 'סירוב',
    SCHEDULE_PICKUP: 'אישור התור',
    CONFIRM_RECEIVED: 'אישור קבלה',
    START_DIAGNOSIS: 'תחילת אבחון',
    REQUEST_CUSTOMER_APPROVAL: 'בקשת אישור',
    APPROVE_ESTIMATE: 'אישור הצעת מחיר',
    START_REPAIR: 'תחילת טיפול',
    SUBMIT_FOR_QC: 'שליחה לבקרת איכות',
    PASS_QC: 'עמידה בבקרת איכות',
    MARK_READY: 'סימון כמוכנה',
    SCHEDULE_DELIVERY: 'תיאום החזרה',
    COMPLETE: 'סיום',
    CANCEL: 'ביטול',
    ARCHIVE: 'ארכיון',
  },
  pro: {
    reserved: 'אזור מקצועי',
    reservedHint: 'האזור הזה מיועד למומחיות מאושרות. צרי פרופיל כדי להציע שירותים.',
    createProfile: 'יצירת פרופיל מומחית',
    eyebrow: 'מומחית',
    title: 'לוח בקרה',
    appointments: 'תורים',
    ongoing: 'בתהליך',
    revenue: 'הכנסות',
    rating: 'דירוג',
    bookings14: 'תורים — 14 הימים האחרונים',
    bookings14hint: 'נפח הבקשות שהתקבלו',
    revenue14: 'הכנסות — 14 הימים האחרונים',
    revenue14hint: 'סכומים שאושרו (לפני עמלה)',
    upcoming: 'תורים קרובים',
    none: 'אין תורים עדיין.',
    stripeTitle: 'תשלומי Stripe Connect',
    stripeHint: 'חברי חשבון כדי לקבל 80% אחרי אישור הלקוחה.',
    stripeReady: 'החשבון מוכן.',
    stripeSetup: 'הגדרת Stripe Connect',
    stripeRedirect: 'מעביר…',
    stripeSim: 'Stripe לא מוגדר — התשלומים רצים במצב סימולציה.',
    wigHistory: 'היסטוריית הפאה',
    finishCare: 'סיום הטיפול',
    applyTitle: 'להפוך למומחית',
    applyEdit: 'הפרופיל שלי',
    applyHint: 'צרי פרופיל מומחית כדי להופיע על המפה.',
    applyHintEdit: 'סטטוס: {status}. עדכני את הפרטים כדי להופיע נכון על המפה.',
    displayName: 'שם תצוגה',
    headline: 'התמחות',
    headlinePlaceholder: 'מומחית לייס ובייבי הייר',
    city: 'עיר',
    postal: 'מיקוד',
    salon: 'כתובת הסלון',
    years: 'שנות ניסיון',
    applySubmit: 'יצירת פרופיל מומחית',
    applyUpdate: 'שמירת הפרופיל',
    updated: 'הפרופיל עודכן',
    applyFailed: 'לא ניתן ליצור את הפרופיל',
    updateFailed: 'לא ניתן לעדכן את הפרופיל',
    needService: 'בחרי לפחות שירות אחד',
    loadingProfile: 'טוען פרופיל…',
    clientsTitle: 'הלקוחות שלי',
    clientsEmpty: 'אין לקוחות עדיין.',
    wigCount: '{n} פאה/פאות',
    availabilityTitle: 'זמינות',
    availabilitySaved: 'הזמינות נשמרה',
    saveFailed: 'לא ניתן לשמור',
    weekdays: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
    bio: 'ביו',
    homeOffer: 'בבית הלקוחה',
    salonOffer: 'בסלון',
    offeredServices: 'שירותים מוצעים',
    availabilityHint: 'הגדירי את המשבצות השבועיות הקבועות.',
    closed: 'סגור',
    viewCareSheet: 'צפייה בדוח הטיפול',
  },
  geo: {
    meters: '{n} מ׳',
    km: '{n} ק״מ',
    denied: 'המיקום לא שותף. אפשר עדיין לבחור מומחית מהרשימה.',
    unavailable: 'אין מיקום במכשיר הזה.',
    emptyExperts: 'לא נמצאו מומחיות לסינון הזה.',
  },
  orders: {
    title: 'תורים',
    subtitle: 'מעקב אחרי כל הזמנה מהבקשה ועד הסיום.',
    newBooking: 'הזמנה חדשה',
    empty: 'אין תורים עדיין.',
  },
};

export const dictionaries: Record<Locale, Messages> = { en, fr, he };

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'fr' || value === 'he';
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}
