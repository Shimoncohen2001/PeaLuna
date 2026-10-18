export type Locale = 'en' | 'fr' | 'he';

export const LOCALES: Locale[] = ['en', 'fr', 'he'];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  he: 'עברית',
};

export const LOCALE_CODES: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
  he: 'HE',
};

export const LOCALE_SWITCH_ORDER: Locale[] = ['fr', 'en', 'he'];

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
    menu: string;
    closeMenu: string;
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
    adminHome: string;
    adminCustomers: string;
    adminExperts: string;
    adminSkills: string;
    adminWorkflow: string;
    clients: string;
    notifications: string;
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
    servicesTitle: string;
    serviceRepairTitle: string;
    serviceRepairDesc: string;
    serviceCareTitle: string;
    serviceCareDesc: string;
    serviceDesignTitle: string;
    serviceDesignDesc: string;
    footer: string;
  };
  common: {
    loading: string;
    total: string;
    continue: string;
    back: string;
    save: string;
    delete: string;
    edit: string;
    cancel: string;
    confirmTitle: string;
    confirmDelete: string;
    choose: string;
    yes: string;
    no: string;
    active: string;
    dateTbd: string;
    requiredProfile: string;
    actionFailed: string;
    required: string;
    optional: string;
    search: string;
    noMatches: string;
    previousMonth: string;
    nextMonth: string;
    today: string;
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
    secureLabel: string;
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
    statusDue: string;
    statusConfirmed: string;
    statusPaid: string;
    statusCash: string;
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
  cash: {
    payCash: string;
    chosen: string;
    waitingConfirm: string;
    cancel: string;
    confirmed: string;
    failed: string;
    expertPending: string;
    expertConfirm: string;
    expertConfirming: string;
    expertConfirmPrompt: string;
    expertDue: string;
    expertConfirmed: string;
    optIn: string;
    optInHint: string;
    adminTitle: string;
    adminEmpty: string;
    adminDue: string;
    adminSettled: string;
    adminSettle: string;
    adminTabDue: string;
    adminTabSettled: string;
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
    needAddress: string;
    mediaFailed: string;
    addressPlaceholder: string;
    choosePlaceholder: string;
    city: string;
    postalCode: string;
    service: string;
    nearbyDistance: string;
    noSlots: string;
    pickSlot: string;
    availableLegend: string;
    unavailableLegend: string;
    selectedLegend: string;
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
    hidden: string;
    priceIls: string;
    nameHint: string;
    deleteConfirm: string;
    skills: string;
    skillsSubtitle: string;
    addSkill: string;
    workflow: string;
    workflowSubtitle: string;
    addStep: string;
    stepTitle: string;
    stepDescription: string;
    stepRequired: string;
    inputKind: string;
    inputCheck: string;
    inputText: string;
    moveUp: string;
    moveDown: string;
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
    overview: {
      title: string;
      subtitle: string;
      period7: string;
      period30: string;
      period90: string;
      periodYear: string;
      periodAll: string;
      customers: string;
      customersHint: string;
      new7: string;
      new30: string;
      bookings: string;
      pending: string;
      confirmed: string;
      completed: string;
      cancelled: string;
      gmv: string;
      gmvHint: string;
      commission: string;
      averageBasket: string;
      cancellationRate: string;
      revenueOverTime: string;
      bookingsOverTime: string;
      noChartData: string;
      loadFailed: string;
      recent: string;
      expertsApproved: string;
      expertsReview: string;
      noneRecent: string;
      paidOrders: string;
    };
    customersPage: {
      title: string;
      subtitle: string;
      count: string;
      empty: string;
      bookings: string;
      alsoExpert: string;
      alsoAdmin: string;
      statusActive: string;
      statusPending: string;
      statusSuspended: string;
      search: string;
      searchPlaceholder: string;
      sort: string;
      sortCreated: string;
      sortBookings: string;
      sortSpent: string;
      newest: string;
      oldest: string;
      filterAll: string;
      activityAll: string;
      activityBooked: string;
      activityNone: string;
      phone: string;
      spent: string;
      average: string;
      lastBooking: string;
      signedUp: string;
      openDossier: string;
      backToList: string;
      profile: string;
      signupDate: string;
      country: string;
      language: string;
      verified: string;
      unverified: string;
      summary: string;
      experts: string;
      expertsEmpty: string;
      history: string;
      historyEmpty: string;
      care: string;
      photos: string;
      photosEmpty: string;
      nextCare: string;
      wigs: string;
      wigsEmpty: string;
      archived: string;
      transactions: string;
      transactionsEmpty: string;
      pending: string;
      confirmed: string;
      completed: string;
      cancelled: string;
      paid: string;
      noPhone: string;
      googleAccount: string;
      passwordAccount: string;
      notFound: string;
      pageOf: string;
      nextPage: string;
      prevPage: string;
      results: string;
    };
    expertsPage: {
      title: string;
      subtitle: string;
      search: string;
      searchPlaceholder: string;
      sort: string;
      sortCreated: string;
      sortBookings: string;
      sortGmv: string;
      sortCommission: string;
      sortPayout: string;
      sortRating: string;
      sortCompleted: string;
      sortCancelled: string;
      newest: string;
      oldest: string;
      filterAll: string;
      activityAll: string;
      activityBooked: string;
      activityNone: string;
      empty: string;
      results: string;
      openDossier: string;
      backToList: string;
      notFound: string;
      total: string;
      active: string;
      newPeriod: string;
      reviewQueue: string;
      bookings: string;
      paid: string;
      gmv: string;
      gmvHint: string;
      commission: string;
      commissionHint: string;
      payout: string;
      payoutHint: string;
      transferred: string;
      transferredHint: string;
      cashKept: string;
      cashKeptHint: string;
      cashDue: string;
      rating: string;
      reviews: string;
      reviewsEmpty: string;
      completedRate: string;
      cancellationRate: string;
      profile: string;
      services: string;
      servicesEmpty: string;
      priceBase: string;
      priceCustom: string;
      history: string;
      historyEmpty: string;
      finance: string;
      unpaidBooking: string;
      captured: string;
      city: string;
      signedUp: string;
      stripeReady: string;
      stripeMissing: string;
      home: string;
      salon: string;
      cash: string;
      approve: string;
      reject: string;
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
    verifyHint: string;
    mailTestMode: string;
    mailBlockedRecipient: string;
    mailSendFailed: string;
    continueWithGoogle: string;
    orEmail: string;
    googleError: string;
    googleTerms: string;
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
  notifications: {
    title: string;
    empty: string;
    markAllRead: string;
    unread: string;
    openRequest: string;
    seeAll: string;
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
    CASH_PENDING: string;
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
    applyPending: string;
    applyRejected: string;
    pendingReview: string;
    resubmit: string;
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
    skills: string;
    workflowTitle: string;
    skipStep: string;
    workflowHint: string;
    workflowIncomplete: string;
    markDone: string;
    stepNote: string;
    availabilityHint: string;
    closed: string;
    viewCareSheet: string;
    careDoneBanner: string;
    backToDashboard: string;
  };
  geo: {
    meters: string;
    km: string;
    denied: string;
    unavailable: string;
    emptyExperts: string;
    searchAddress: string;
    noResults: string;
    pickOnMap: string;
    useLocation: string;
  };
  orders: {
    title: string;
    subtitle: string;
    newBooking: string;
    empty: string;
  };
  cookies: {
    title: string;
    message: string;
    accept: string;
    learnMore: string;
    policyTitle: string;
    policyIntro: string;
    essentialTitle: string;
    essentialBody: string;
    optionalTitle: string;
    optionalBody: string;
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
    menu: 'Menu',
    closeMenu: 'Close',
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
    adminHome: 'Overview',
    adminCustomers: 'Clients',
    adminExperts: 'Experts',
    adminSkills: 'Skills',
    adminWorkflow: 'Steps',
    clients: 'Clients',
    notifications: 'Notifications',
  },
  home: {
    eyebrow: 'Premium wig care marketplace',
    titleLine1: 'Restore. Transform.',
    titleAccent: 'Trust every strand.',
    subtitle:
      'PeaLuna connects you with expert wig technicians for repair, care, and transformation — with full lifecycle tracking, secure payments, and white-glove logistics.',
    ctaBook: 'Book a care appointment',
    ctaBecomeExpert: 'Become an expert',
    trustEscrowTitle: 'Secure payment',
    trustEscrowDesc: 'Pay the care price with a protected card payment — simple, professional, and secure.',
    trustLogisticsTitle: 'Pickup & delivery',
    trustLogisticsDesc: 'Coordinated logistics with every milestone tracked in your dashboard.',
    trustHistoryTitle: 'Full wig history',
    trustHistoryDesc: 'Every repair archived to your wig profile — built for long-term care.',
    howTitle: 'How PeaLuna works',
    howStep1: 'Upload photos of your wig and select services',
    howStep2: 'Receive an estimate and matched specialist',
    howStep3: 'Schedule pickup — track every repair stage',
    howStep4: 'Pay securely and confirm once the care is complete',
    servicesTitle: 'Wig repair, care & hair design',
    serviceRepairTitle: 'Wig repair',
    serviceRepairDesc: 'Professional repair of damaged wigs — ventilation, restitching, and restoration.',
    serviceCareTitle: 'Wig care',
    serviceCareDesc: 'Wash, condition, and long-term maintenance tracked on your wig profile.',
    serviceDesignTitle: 'Hair design',
    serviceDesignDesc: 'Cut, restyle, and colour work by specialists near you in Israel.',
    footer: 'EU-hosted · GDPR-ready architecture.',
  },
  common: {
    loading: 'Loading…',
    total: 'Total',
    continue: 'Continue',
    back: 'Back',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    cancel: 'Cancel',
    confirmTitle: 'Confirmation',
    confirmDelete: 'Delete this wig?',
    choose: 'Choose…',
    yes: 'Yes',
    no: 'No',
    active: 'Active',
    dateTbd: 'Date to confirm',
    requiredProfile: 'Expert profile required.',
    actionFailed: 'This action could not be completed.',
    required: 'Required',
    optional: 'Optional',
    search: 'Search',
    noMatches: 'No matching option.',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    today: 'Today',
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
    title: 'Payment',
    status: 'Status',
    secureLabel: 'Secure payment',
    escrowExplain:
      'Your payment is protected until the care is complete. You only pay the total shown.',
    payHold: 'Pay now',
    paying: 'Paying…',
    prepareIntent: 'Pay by card',
    payCard: 'Pay by card',
    stripeHeld: 'Payment confirmed. Your payment is protected until the care is complete.',
    release: 'Confirm the care is complete',
    releasing: 'Confirming…',
    captured: 'Payment confirmed. Thank you.',
    waitingExpert: 'You can pay once the expert has accepted this appointment.',
    releaseWhenComplete:
      'Your payment is confirmed. You will be able to validate the care once it is finished.',
    statusDue: 'Amount due',
    statusConfirmed: 'Payment confirmed',
    statusPaid: 'Paid',
    statusCash: 'Cash on the day of the appointment',
    platformFee: 'Service',
    appointment: 'Appointment',
    homeVenue: 'At home',
    salonVenue: 'Salon',
    notes: 'Notes',
    notFound: 'Order not found.',
    services: 'Services',
    simulationReady: 'Payment confirmed.',
    stripeCreated: 'Continue to secure payment.',
    failed: 'Payment failed',
    simulationFailed: 'Simulation failed',
    releaseFailed: 'Release failed',
    reviewFailed: 'Review failed',
  },
  cash: {
    payCash: 'Pay in cash',
    chosen: 'You chose to pay in cash, directly to the expert on the day of the appointment.',
    waitingConfirm: 'The expert will confirm they received the payment on the day of the appointment.',
    cancel: 'Pay by card instead',
    confirmed: 'Cash payment confirmed by the expert — the order is settled.',
    failed: 'Could not switch to cash',
    expertPending: 'This client pays in cash. Confirm once you have the money in hand.',
    expertConfirm: 'I received the cash payment',
    expertConfirming: 'Confirming…',
    expertConfirmPrompt: 'This confirms you received the full amount and closes the order.',
    expertDue: 'PeaLuna commission you owe on this cash order: {amount}',
    expertConfirmed: 'Cash payment confirmed — the order is settled.',
    optIn: 'I accept cash payments',
    optInHint: 'Clients can then pay you directly. You still owe PeaLuna its 20% commission.',
    adminTitle: 'Cash commissions',
    adminEmpty: 'No cash commission to collect.',
    adminDue: 'To collect',
    adminSettled: 'Settled',
    adminSettle: 'Mark as settled',
    adminTabDue: 'Outstanding',
    adminTabSettled: 'Settled',
  },
  book: {
    eyebrow: 'Booking',
    title: 'Repair & care',
    subtitle:
      'Choose a service, pick an expert, confirm your appointment — then pay securely.',
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
    needAddress: 'Add a home address to continue.',
    mediaFailed: 'Photo upload failed. Try the gallery, or a smaller picture.',
    addressPlaceholder: 'Street, city',
    choosePlaceholder: 'Choose…',
    city: 'City',
    postalCode: 'Postal code',
    service: 'Service',
    nearbyDistance: 'Sorted by distance from you',
    noSlots: 'No times available on this day.',
    pickSlot: 'Available times',
    availableLegend: 'Available',
    unavailableLegend: 'Unavailable',
    selectedLegend: 'Selected',
  },
  admin: {
    title: 'Catalog',
    services: 'Services',
    add: '+ Add',
    price: 'Price',
    name: 'Name',
    category: 'Category',
    minutes: 'Minutes',
    inactive: 'Hide',
    hidden: 'Hidden',
    priceIls: 'Price (ILS)',
    nameHint: 'At least 2 characters. A URL slug is generated automatically.',
    deleteConfirm: 'Remove this item from the catalog?',
    skills: 'Skills',
    skillsSubtitle: 'List of skills — add, edit or remove. Experts tick the same list on their profile and when finishing a care.',
    addSkill: '+ Add a skill',
    workflow: 'Completion steps',
    workflowSubtitle: 'Steps an expert must fill in before finishing a service.',
    addStep: '+ Add a step',
    stepTitle: 'Step title',
    stepDescription: 'Instructions',
    stepRequired: 'Required to finish the service',
    inputKind: 'Input type',
    inputCheck: 'Checkbox',
    inputText: 'Text note',
    moveUp: 'Move up',
    moveDown: 'Move down',
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
    overview: {
      title: 'Dashboard',
      subtitle: 'Live figures from PeaLuna bookings, clients and captured payments.',
      period7: '7 days',
      period30: '30 days',
      period90: '90 days',
      periodYear: '12 months',
      periodAll: 'All time',
      customers: 'Registered clients',
      customersHint: 'Every signup creates a client profile, including experts and unconfirmed emails',
      new7: 'New in 7 days',
      new30: 'New in 30 days',
      bookings: 'Bookings',
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      gmv: 'Gross volume',
      gmvHint: 'Captured payments only',
      commission: 'Platform commission',
      averageBasket: 'Average basket',
      cancellationRate: 'Cancellation rate',
      revenueOverTime: 'Volume over time',
      bookingsOverTime: 'Bookings over time',
      noChartData: 'No activity in this period yet.',
      loadFailed: 'Could not load these figures. Try again in a moment.',
      recent: 'Latest bookings',
      expertsApproved: 'Approved experts',
      expertsReview: 'Experts to review',
      noneRecent: 'No bookings yet.',
      paidOrders: 'Paid bookings',
    },
    customersPage: {
      title: 'Registered clients',
      subtitle: 'Real accounts with a client profile. Experts and admin also appear if they signed up as clients first.',
      count: 'Accounts',
      empty: 'No client profiles match these filters.',
      bookings: 'Bookings',
      alsoExpert: 'Expert',
      alsoAdmin: 'Admin',
      statusActive: 'Active',
      statusPending: 'Email not confirmed',
      statusSuspended: 'Suspended',
      search: 'Search',
      searchPlaceholder: 'Name, email or phone',
      sort: 'Sort',
      sortCreated: 'Sign-up date',
      sortBookings: 'Bookings',
      sortSpent: 'Spend',
      newest: 'Descending',
      oldest: 'Ascending',
      filterAll: 'All statuses',
      activityAll: 'All activity',
      activityBooked: 'With bookings',
      activityNone: 'No bookings yet',
      phone: 'Phone',
      spent: 'Spend',
      average: 'Average booking',
      lastBooking: 'Last booking',
      signedUp: 'Signed up',
      openDossier: 'Open file',
      backToList: 'All clients',
      profile: 'Profile',
      signupDate: 'Sign-up date',
      country: 'Country',
      language: 'Language',
      verified: 'Email confirmed',
      unverified: 'Email not confirmed',
      summary: 'Activity',
      experts: 'Professionals booked',
      expertsEmpty: 'No professional booked yet.',
      history: 'Bookings and care',
      historyEmpty: 'No bookings yet.',
      care: 'Care report',
      photos: 'Before / after photos',
      photosEmpty: 'No before/after photos on file yet.',
      nextCare: 'Next care',
      wigs: 'Registered wigs',
      wigsEmpty: 'No wig registered on the platform.',
      archived: 'Archived',
      transactions: 'Latest transactions',
      transactionsEmpty: 'No captured payments yet.',
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      paid: 'Paid',
      noPhone: 'No phone on file',
      googleAccount: 'Google',
      passwordAccount: 'Email',
      notFound: 'This client file could not be found.',
      pageOf: 'Page {page} of {pages}',
      nextPage: 'Next',
      prevPage: 'Previous',
      results: '{n} accounts',
    },
    expertsPage: {
      title: 'Professionals',
      subtitle:
        'Live tracking of registered experts. Bookings are counted separately from captured payments, commissions and payouts.',
      search: 'Search',
      searchPlaceholder: 'Name, email or city',
      sort: 'Rank by',
      sortCreated: 'Sign-up date',
      sortBookings: 'Bookings',
      sortGmv: 'Captured volume',
      sortCommission: 'PeaLuna commission',
      sortPayout: 'Expert share',
      sortRating: 'Rating',
      sortCompleted: 'Completed rate',
      sortCancelled: 'Cancellation rate',
      newest: 'Descending',
      oldest: 'Ascending',
      filterAll: 'All statuses',
      activityAll: 'All activity',
      activityBooked: 'With bookings',
      activityNone: 'No bookings yet',
      empty: 'No professionals match these filters.',
      results: '{n} professionals',
      openDossier: 'Open file',
      backToList: 'All professionals',
      notFound: 'This professional file could not be found.',
      total: 'Registered',
      active: 'Active',
      newPeriod: 'New in this period',
      reviewQueue: 'To review',
      bookings: 'Bookings',
      paid: 'Captured payments',
      gmv: 'Captured volume',
      gmvHint: 'Customer payments captured only — not every booking.',
      commission: 'PeaLuna commission',
      commissionHint: '20% of captured payments.',
      payout: 'Expert share',
      payoutHint: 'Captured volume minus platform commission.',
      transferred: 'Transferred',
      transferredHint: 'Card payouts actually sent to the expert.',
      cashKept: 'Cash kept',
      cashKeptHint: 'Cash the expert already received, before paying PeaLuna.',
      cashDue: 'Cash commission due',
      rating: 'Average rating',
      reviews: 'Reviews',
      reviewsEmpty: 'No reviews yet.',
      completedRate: 'Completed rate',
      cancellationRate: 'Cancellation rate',
      profile: 'Profile',
      services: 'Services and prices',
      servicesEmpty: 'No services selected.',
      priceBase: 'Catalog',
      priceCustom: 'Custom',
      history: 'Bookings',
      historyEmpty: 'No bookings assigned yet.',
      finance: 'Money',
      unpaidBooking: 'Booking not paid',
      captured: 'Captured',
      city: 'City',
      signedUp: 'Signed up',
      stripeReady: 'Stripe ready',
      stripeMissing: 'Stripe not set up',
      home: 'Home',
      salon: 'Salon',
      cash: 'Cash',
      approve: 'Approve',
      reject: 'Reject',
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
    verifyPending: 'We sent a confirmation link to your inbox. Open it to prove this email exists — you cannot book until you do.',
    verifySuccess: 'Email confirmed. You can now book and apply as an expert.',
    verifyError: 'This confirmation link is invalid or expired.',
    verifyCta: 'Go to dashboard',
    resend: 'Resend email',
    resending: 'Sending…',
    resent: 'A new link was sent. Check inbox and spam.',
    verifyHint:
      'Check inbox and spam. The first email can take a minute — use Resend only if nothing arrives.',
    mailTestMode:
      'Resend refused this address: it is not the email on your Resend account. Sign up with that exact address, or add your domain in Resend → Domains.',
    mailBlockedRecipient:
      'This account uses a fake address (@example.com). Create a new account with your real inbox — the same email as your Resend account.',
    mailSendFailed: 'The confirmation email could not be sent. Try again in a moment.',
    continueWithGoogle: 'Continue with Google',
    orEmail: 'or email',
    googleError: 'Google sign-in failed. Try again.',
    googleTerms: 'By continuing with Google you accept the terms of use.',
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
  notifications: {
    title: 'Notifications',
    empty: 'No notifications yet.',
    markAllRead: 'Mark all as read',
    unread: 'Unread',
    openRequest: 'Open request',
    seeAll: 'See all',
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
    AUTHORIZED: 'Payment confirmed',
    CAPTURED: 'Paid',
    CASH_PENDING: 'Cash on the day',
    REFUNDED: 'Refunded',
    FAILED: 'Failed',
    CAPTURING: 'Confirming payment',
    VOIDED: 'Payment cancelled',
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
    applyPending: 'Application received. An admin will review it before you appear to clients.',
    applyRejected: 'This application was not approved. You can update your details and send it again.',
    pendingReview: 'Your application is under review. You will appear to clients after an admin approves it.',
    resubmit: 'Send application again',
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
    skills: 'Skills I master',
    workflowTitle: 'Service steps',
    skipStep: 'Skip this step',
    workflowHint: 'Tick what’s done, or skip a step that doesn’t apply. Skipping never blocks finishing the care.',
    workflowIncomplete: 'Skip or complete the remaining required steps, then finish.',
    markDone: 'Mark as done',
    stepNote: 'Note',
    availabilityHint: 'Set your weekly recurring slots.',
    closed: 'Closed',
    viewCareSheet: 'View care report',
    careDoneBanner: 'Care completed successfully ✓',
    backToDashboard: 'Back to dashboard',
  },
  geo: {
    meters: '{n} m',
    km: '{n} km',
    denied: 'Location was not shared. You can still pick an expert from the list.',
    unavailable: 'Location is not available on this device.',
    emptyExperts: 'No experts found for these filters.',
    searchAddress: 'Address',
    noResults: 'No matching address in Israel.',
    pickOnMap: 'Or drop a pin on the map.',
    useLocation: 'Use my location',
  },
  orders: {
    title: 'Appointments',
    subtitle: 'Track every booking from request to completion.',
    newBooking: 'New booking',
    empty: 'No appointments yet.',
  },
  cookies: {
    title: 'Cookies',
    message:
      'We only use essential cookies to keep you signed in and remember your language. No ads, no trackers.',
    accept: 'Accept',
    learnMore: 'Learn more',
    policyTitle: 'Cookie policy',
    policyIntro:
      'PeaLuna uses as few cookies as possible. You can use the site after accepting this notice.',
    essentialTitle: 'Essential',
    essentialBody:
      'A secure session cookie keeps you logged in. Your language choice is stored on this device. These are required for the site to work.',
    optionalTitle: 'Optional',
    optionalBody:
      'We do not set advertising or analytics cookies today. If that changes, we will ask again.',
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
    menu: 'Menu',
    closeMenu: 'Fermer',
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
    adminHome: 'Tableau de bord',
    adminCustomers: 'Clientes',
    adminExperts: 'Expertes',
    adminSkills: 'Compétences',
    adminWorkflow: 'Étapes',
    clients: 'Clientes',
    notifications: 'Notifications',
  },
  home: {
    eyebrow: 'Marketplace premium de soins pour perruques',
    titleLine1: 'Réparer. Transformer.',
    titleAccent: 'Confiance à chaque mèche.',
    subtitle:
      'PeaLuna vous met en relation avec des expertes en réparation et soin de perruques — suivi complet, paiements sécurisés et logistique soignée.',
    ctaBook: 'Réserver un soin',
    ctaBecomeExpert: 'Devenir experte',
    trustEscrowTitle: 'Paiement sécurisé',
    trustEscrowDesc:
      'Réglez le prix du soin par un paiement protégé — simple, professionnel et sécurisé.',
    trustLogisticsTitle: 'Enlèvement & livraison',
    trustLogisticsDesc: 'Logistique coordonnée, chaque étape visible dans votre espace.',
    trustHistoryTitle: 'Historique complet',
    trustHistoryDesc:
      'Chaque réparation archivée sur le profil de votre perruque — pour un suivi durable.',
    howTitle: 'Comment PeaLuna fonctionne',
    howStep1: 'Ajoutez votre perruque et choisissez vos services',
    howStep2: 'Trouvez une experte près de chez vous',
    howStep3: 'Réservez un créneau — suivez chaque étape',
    howStep4: 'Payez en toute sécurité, puis confirmez une fois le soin terminé',
    servicesTitle: 'Réparation de perruques, soin et hair design',
    serviceRepairTitle: 'Réparation de perruques',
    serviceRepairDesc: 'Réparation professionnelle : ventilation, couture, restauration de perruques abîmées.',
    serviceCareTitle: 'Soin de perruques',
    serviceCareDesc: 'Lavage, entretien et suivi durable sur le profil de ta perruque.',
    serviceDesignTitle: 'Hair design',
    serviceDesignDesc: 'Coupe, restyle et couleur par des expertes près de chez toi en Israël.',
    footer: 'Hébergé en UE · Architecture prête RGPD.',
  },
  common: {
    loading: 'Chargement…',
    total: 'Total',
    continue: 'Continuer',
    back: 'Retour',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    cancel: 'Annuler',
    confirmTitle: 'Confirmation',
    confirmDelete: 'Supprimer cette perruque ?',
    choose: 'Choisir…',
    yes: 'Oui',
    no: 'Non',
    active: 'Actif',
    dateTbd: 'Date à confirmer',
    requiredProfile: 'Profil prestataire requis.',
    actionFailed: 'Action impossible.',
    required: 'Obligatoire',
    optional: 'Facultatif',
    search: 'Rechercher',
    noMatches: 'Aucune option correspondante.',
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    today: 'Aujourd’hui',
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
    title: 'Paiement',
    status: 'Statut',
    secureLabel: 'Paiement sécurisé',
    escrowExplain:
      'Votre paiement est protégé jusqu’à la fin du soin. Vous réglez uniquement le montant total indiqué.',
    payHold: 'Payer maintenant',
    paying: 'Paiement…',
    prepareIntent: 'Payer par carte',
    payCard: 'Payer par carte',
    stripeHeld: 'Paiement confirmé. Le montant est protégé jusqu’à la fin du soin.',
    release: 'Confirmer que le soin est terminé',
    releasing: 'Confirmation…',
    captured: 'Paiement confirmé. Merci.',
    waitingExpert: 'Vous pourrez payer une fois que l’experte aura accepté le rendez-vous.',
    releaseWhenComplete:
      'Votre paiement est confirmé. Vous pourrez valider le soin une fois qu’il sera terminé.',
    statusDue: 'À régler',
    statusConfirmed: 'Paiement confirmé',
    statusPaid: 'Payé',
    statusCash: 'Espèces le jour du rendez-vous',
    platformFee: 'Service',
    appointment: 'RDV',
    homeVenue: 'À domicile',
    salonVenue: 'Salon',
    notes: 'Notes',
    notFound: 'Commande introuvable.',
    services: 'Services',
    simulationReady: 'Paiement confirmé.',
    stripeCreated: 'Continuer vers le paiement sécurisé.',
    failed: 'Paiement impossible',
    simulationFailed: 'Paiement impossible',
    releaseFailed: 'Validation impossible',
    reviewFailed: 'Avis impossible',
  },
  cash: {
    payCash: 'Payer en espèces',
    chosen: 'Tu as choisi de payer en espèces, directement à l’experte le jour du rendez-vous.',
    waitingConfirm: 'L’experte confirmera avoir reçu le paiement le jour du rendez-vous.',
    cancel: 'Payer par carte finalement',
    confirmed: 'Paiement en espèces confirmé par l’experte — la commande est soldée.',
    failed: 'Passage aux espèces impossible',
    expertPending:
      'Cette cliente paie en espèces. Confirme une fois l’argent reçu en main propre.',
    expertConfirm: 'J’ai reçu le paiement en espèces',
    expertConfirming: 'Confirmation…',
    expertConfirmPrompt: 'Cela confirme que tu as reçu le montant et solde la commande.',
    expertDue: 'Commission PeaLuna à reverser sur cette commande en espèces : {amount}',
    expertConfirmed: 'Paiement en espèces confirmé — la commande est soldée.',
    optIn: 'J’accepte les paiements en espèces',
    optInHint:
      'Les clientes pourront alors te régler directement. Tu restes redevable des 20% de commission PeaLuna.',
    adminTitle: 'Commissions espèces',
    adminEmpty: 'Aucune commission espèces à recouvrer.',
    adminDue: 'À recouvrer',
    adminSettled: 'Réglée',
    adminSettle: 'Marquer comme réglée',
    adminTabDue: 'En attente',
    adminTabSettled: 'Réglées',
  },
  book: {
    eyebrow: 'Réservation',
    title: 'Réparer & soigner',
    subtitle:
      'Choisis un soin, une experte, confirme le rendez-vous — puis paie en toute sécurité.',
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
    needAddress: 'Ajoute une adresse pour le soin à domicile.',
    mediaFailed: 'Échec de l’envoi de la photo. Essaie la galerie, ou une photo plus légère.',
    addressPlaceholder: 'Rue, ville',
    choosePlaceholder: 'Choisir…',
    city: 'Ville',
    postalCode: 'Code postal',
    service: 'Service',
    nearbyDistance: 'Triées par distance',
    noSlots: 'Aucun créneau ce jour-là.',
    pickSlot: 'Horaires disponibles',
    availableLegend: 'Disponible',
    unavailableLegend: 'Indisponible',
    selectedLegend: 'Sélectionné',
  },
  admin: {
    title: 'Catalogue',
    services: 'Prestations',
    add: '+ Ajouter',
    price: 'Prix',
    name: 'Nom',
    category: 'Catégorie',
    minutes: 'Minutes',
    inactive: 'Masquer',
    hidden: 'Masquée',
    priceIls: 'Prix (ILS)',
    nameHint: 'Au moins 2 caractères. Un identifiant URL est généré automatiquement.',
    deleteConfirm: 'Retirer cet élément du catalogue ?',
    skills: 'Compétences',
    skillsSubtitle: 'Liste des compétences — ajoute, modifie ou supprime. Les expertes cochent la même liste sur leur profil et à la fin d’un soin.',
    addSkill: '+ Ajouter une compétence',
    workflow: 'Étapes de réalisation',
    workflowSubtitle: 'Étapes qu’une experte doit renseigner avant de terminer une prestation.',
    addStep: '+ Ajouter une étape',
    stepTitle: 'Titre de l’étape',
    stepDescription: 'Consignes',
    stepRequired: 'Obligatoire pour terminer la prestation',
    inputKind: 'Type de saisie',
    inputCheck: 'Case à cocher',
    inputText: 'Note texte',
    moveUp: 'Monter',
    moveDown: 'Descendre',
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
    overview: {
      title: 'Tableau de bord',
      subtitle: 'Chiffres réels des clientes, réservations et paiements encaissés sur PeaLuna.',
      period7: '7 jours',
      period30: '30 jours',
      period90: '90 jours',
      periodYear: '12 mois',
      periodAll: 'Tout',
      customers: 'Clientes inscrites',
      customersHint: 'Chaque inscription crée un profil cliente, y compris expertes et emails non confirmés',
      new7: 'Nouvelles sur 7 jours',
      new30: 'Nouvelles sur 30 jours',
      bookings: 'Réservations',
      pending: 'En attente',
      confirmed: 'Confirmées',
      completed: 'Terminées',
      cancelled: 'Annulées',
      gmv: 'Chiffre d’affaires',
      gmvHint: 'Paiements encaissés uniquement',
      commission: 'Commission plateforme',
      averageBasket: 'Panier moyen',
      cancellationRate: 'Taux d’annulation',
      revenueOverTime: 'Évolution du volume',
      bookingsOverTime: 'Évolution des réservations',
      noChartData: 'Aucune activité sur cette période.',
      loadFailed: 'Impossible de charger les chiffres. Réessaie dans un instant.',
      recent: 'Dernières réservations',
      expertsApproved: 'Expertes approuvées',
      expertsReview: 'Expertes à valider',
      noneRecent: 'Aucune réservation pour le moment.',
      paidOrders: 'Réservations payées',
    },
    customersPage: {
      title: 'Clientes inscrites',
      subtitle:
        'Comptes réels avec un profil cliente. Les expertes et l’admin apparaissent aussi s’ils se sont d’abord inscrits comme clientes.',
      count: 'Comptes',
      empty: 'Aucun profil cliente ne correspond à ces filtres.',
      bookings: 'Réservations',
      alsoExpert: 'Experte',
      alsoAdmin: 'Admin',
      statusActive: 'Actif',
      statusPending: 'Email non confirmé',
      statusSuspended: 'Suspendu',
      search: 'Recherche',
      searchPlaceholder: 'Nom, email ou téléphone',
      sort: 'Tri',
      sortCreated: 'Date d’inscription',
      sortBookings: 'Réservations',
      sortSpent: 'Dépenses',
      newest: 'Décroissant',
      oldest: 'Croissant',
      filterAll: 'Tous les statuts',
      activityAll: 'Toute activité',
      activityBooked: 'Avec réservations',
      activityNone: 'Sans réservation',
      phone: 'Téléphone',
      spent: 'Dépenses',
      average: 'Panier moyen',
      lastBooking: 'Dernière réservation',
      signedUp: 'Inscription',
      openDossier: 'Ouvrir le dossier',
      backToList: 'Toutes les clientes',
      profile: 'Profil',
      signupDate: 'Date d’inscription',
      country: 'Pays',
      language: 'Langue',
      verified: 'Email confirmé',
      unverified: 'Email non confirmé',
      summary: 'Activité',
      experts: 'Professionnelles réservées',
      expertsEmpty: 'Aucune professionnelle réservée pour le moment.',
      history: 'Réservations et soins',
      historyEmpty: 'Aucune réservation pour le moment.',
      care: 'Rapport de soin',
      photos: 'Photos avant / après',
      photosEmpty: 'Pas encore de photos avant/après.',
      nextCare: 'Prochain soin',
      wigs: 'Perruques enregistrées',
      wigsEmpty: 'Aucune perruque enregistrée sur la plateforme.',
      archived: 'Archivée',
      transactions: 'Dernières transactions',
      transactionsEmpty: 'Aucun paiement encaissé pour le moment.',
      pending: 'En attente',
      confirmed: 'Confirmées',
      completed: 'Terminées',
      cancelled: 'Annulées',
      paid: 'Payées',
      noPhone: 'Pas de téléphone',
      googleAccount: 'Google',
      passwordAccount: 'Email',
      notFound: 'Ce dossier cliente est introuvable.',
      pageOf: 'Page {page} sur {pages}',
      nextPage: 'Suivant',
      prevPage: 'Précédent',
      results: '{n} comptes',
    },
    expertsPage: {
      title: 'Professionnelles',
      subtitle:
        'Suivi réel des expertes inscrites. Les réservations sont séparées des paiements encaissés, des commissions et des reversements.',
      search: 'Recherche',
      searchPlaceholder: 'Nom, email ou ville',
      sort: 'Classement',
      sortCreated: 'Date d’inscription',
      sortBookings: 'Réservations',
      sortGmv: 'Volume encaissé',
      sortCommission: 'Commission PeaLuna',
      sortPayout: 'Part experte',
      sortRating: 'Note',
      sortCompleted: 'Taux terminé',
      sortCancelled: 'Taux d’annulation',
      newest: 'Décroissant',
      oldest: 'Croissant',
      filterAll: 'Tous les statuts',
      activityAll: 'Toute activité',
      activityBooked: 'Avec réservations',
      activityNone: 'Sans réservation',
      empty: 'Aucune professionnelle ne correspond à ces filtres.',
      results: '{n} professionnelles',
      openDossier: 'Ouvrir le dossier',
      backToList: 'Toutes les professionnelles',
      notFound: 'Ce dossier professionnelle est introuvable.',
      total: 'Inscrites',
      active: 'Actives',
      newPeriod: 'Nouvelles sur la période',
      reviewQueue: 'À valider',
      bookings: 'Réservations',
      paid: 'Paiements encaissés',
      gmv: 'Volume encaissé',
      gmvHint: 'Paiements clientes encaissés uniquement — pas toutes les réservations.',
      commission: 'Commission PeaLuna',
      commissionHint: '20 % des paiements encaissés.',
      payout: 'Part experte',
      payoutHint: 'Volume encaissé moins la commission plateforme.',
      transferred: 'Reversé',
      transferredHint: 'Virements carte réellement envoyés à l’experte.',
      cashKept: 'Espèces conservées',
      cashKeptHint: 'Argent déjà reçu en espèces, avant le versement à PeaLuna.',
      cashDue: 'Commission cash due',
      rating: 'Note moyenne',
      reviews: 'Avis',
      reviewsEmpty: 'Aucun avis pour le moment.',
      completedRate: 'Taux terminé',
      cancellationRate: 'Taux d’annulation',
      profile: 'Profil',
      services: 'Services et tarifs',
      servicesEmpty: 'Aucun service sélectionné.',
      priceBase: 'Catalogue',
      priceCustom: 'Personnalisé',
      history: 'Réservations',
      historyEmpty: 'Aucune réservation assignée pour le moment.',
      finance: 'Argent',
      unpaidBooking: 'Réservation non payée',
      captured: 'Encaissé',
      city: 'Ville',
      signedUp: 'Inscription',
      stripeReady: 'Stripe prêt',
      stripeMissing: 'Stripe non configuré',
      home: 'Domicile',
      salon: 'Salon',
      cash: 'Espèces',
      approve: 'Approuver',
      reject: 'Refuser',
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
    verifyPending: 'Un lien de confirmation a été envoyé dans ta boîte mail. Ouvre-le pour prouver que cet email existe — tu ne peux pas réserver tant que ce n’est pas fait.',
    verifySuccess: 'Email confirmé. Tu peux maintenant réserver et postuler comme experte.',
    verifyError: 'Ce lien est invalide ou expiré.',
    verifyCta: 'Aller au tableau de bord',
    resend: 'Renvoyer l’email',
    resending: 'Envoi…',
    resent: 'Un nouveau lien a été envoyé. Vérifie la boîte et les spams.',
    verifyHint:
      'Regarde ta boîte mail et les spams. Le premier email peut mettre une minute — clique « Renvoyer » seulement si rien n’arrive.',
    mailTestMode:
      'Resend a refusé cette adresse : ce n’est pas l’email de ton compte Resend. Inscris-toi avec cet email exact, ou ajoute ton domaine dans Resend → Domains.',
    mailBlockedRecipient:
      'Ce compte utilise une fausse adresse (@example.com). Crée un nouveau compte avec ta vraie boîte mail — le même email que ton compte Resend.',
    mailSendFailed: 'L’email de confirmation n’a pas pu partir. Réessaie dans un instant.',
    continueWithGoogle: 'Continuer avec Google',
    orEmail: 'ou par email',
    googleError: 'La connexion Google a échoué. Réessaie.',
    googleTerms: 'En continuant avec Google, tu acceptes les conditions d’utilisation.',
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
  notifications: {
    title: 'Notifications',
    empty: 'Aucune notification pour le moment.',
    markAllRead: 'Tout marquer comme lu',
    unread: 'Non lues',
    openRequest: 'Ouvrir la demande',
    seeAll: 'Tout voir',
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
    AUTHORIZED: 'Paiement confirmé',
    CAPTURED: 'Payé',
    CASH_PENDING: 'Espèces le jour du RDV',
    REFUNDED: 'Remboursé',
    FAILED: 'Échoué',
    CAPTURING: 'Confirmation du paiement',
    VOIDED: 'Paiement annulé',
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
    applyPending: 'Demande reçue. Une admin la validera avant que tu n’apparaisse aux clientes.',
    applyRejected: 'Cette demande n’a pas été acceptée. Tu peux corriger tes infos et renvoyer.',
    pendingReview: 'Ta demande est en cours de revue. Tu apparaîtras aux clientes après validation.',
    resubmit: 'Renvoyer la demande',
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
    skills: 'Compétences maîtrisées',
    workflowTitle: 'Étapes de la prestation',
    skipStep: 'Passer cette étape',
    workflowHint: 'Coche ce qui est fait, ou passe une étape qui ne s’applique pas. Passer une étape ne bloque pas la finalisation.',
    workflowIncomplete: 'Passe ou complète les étapes restantes, puis termine.',
    markDone: 'Marquer comme fait',
    stepNote: 'Note',
    availabilityHint: 'Définis tes créneaux hebdomadaires (récurrent).',
    closed: 'Fermé',
    viewCareSheet: 'Voir la fiche de soin',
    careDoneBanner: 'Soin terminé avec succès ✓',
    backToDashboard: 'Retour au tableau de bord',
  },
  geo: {
    meters: '{n} m',
    km: '{n} km',
    denied: 'Position non partagée. Tu peux quand même choisir une experte dans la liste.',
    unavailable: 'La géolocalisation n’est pas disponible sur cet appareil.',
    emptyExperts: 'Aucune experte pour ces filtres.',
    searchAddress: 'Adresse',
    noResults: 'Aucune adresse correspondante en Israël.',
    pickOnMap: 'Ou place un pin sur la carte.',
    useLocation: 'Utiliser ma position',
  },
  orders: {
    title: 'Rendez-vous',
    subtitle: 'Suis chaque réservation, de la demande à la fin du soin.',
    newBooking: 'Nouvelle réservation',
    empty: 'Aucun rendez-vous pour le moment.',
  },
  cookies: {
    title: 'Cookies',
    message:
      'On utilise uniquement des cookies essentiels pour te connecter et retenir ta langue. Pas de pub, pas de trackers.',
    accept: 'Accepter',
    learnMore: 'En savoir plus',
    policyTitle: 'Politique cookies',
    policyIntro:
      'PeaLuna utilise le moins de cookies possible. Tu peux continuer après avoir accepté ce message.',
    essentialTitle: 'Essentiels',
    essentialBody:
      'Un cookie de session sécurisé te garde connectée. Ton choix de langue est enregistré sur cet appareil. Ils sont nécessaires au fonctionnement du site.',
    optionalTitle: 'Optionnels',
    optionalBody:
      'Aujourd’hui on ne pose ni cookie pub ni cookie analytics. Si ça change, on te redemandera.',
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
    menu: 'תפריט',
    closeMenu: 'סגירה',
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
    adminHome: 'לוח בקרה',
    adminCustomers: 'לקוחות',
    adminExperts: 'מומחיות',
    adminSkills: 'כישורים',
    adminWorkflow: 'שלבים',
    clients: 'לקוחות',
    notifications: 'התראות',
  },
  home: {
    eyebrow: 'מרקטפלייס פרימיום לטיפול בפאות',
    titleLine1: 'לשחזר. לשנות.',
    titleAccent: 'אמון בכל תלתל.',
    subtitle:
      'PeaLuna מחברת אותך למומחיות תיקון וטיפול בפאות — מעקב מלא, תשלומים מאובטחים ולוגיסטיקה מקצועית.',
    ctaBook: 'להזמין טיפול',
    ctaBecomeExpert: 'להפוך למומחית',
    trustEscrowTitle: 'תשלום מאובטח',
    trustEscrowDesc: 'שלמי את מחיר הטיפול בתשלום מוגן — פשוט, מקצועי ומאובטח.',
    trustLogisticsTitle: 'איסוף ומסירה',
    trustLogisticsDesc: 'לוגיסטיקה מתואמת עם מעקב אחר כל שלב בלוח הבקרה.',
    trustHistoryTitle: 'היסטוריית פאה מלאה',
    trustHistoryDesc: 'כל תיקון נשמר בפרופיל הפאה — לטיפול ארוך טווח.',
    howTitle: 'איך PeaLuna עובדת',
    howStep1: 'הוסיפי את הפאה ובחרי שירותים',
    howStep2: 'מצאי מומחית קרובה אליך',
    howStep3: 'קבעי תור — עקבי אחרי כל שלב',
    howStep4: 'שלמי בצורה מאובטחת ואשרי כשהטיפול מסתיים',
    servicesTitle: 'תיקון פאות, טיפול ועיצוב שיער',
    serviceRepairTitle: 'תיקון פאות',
    serviceRepairDesc: 'תיקון מקצועי לפאות פגועות — ונטילציה, תפירה ושחזור.',
    serviceCareTitle: 'טיפול בפאות',
    serviceCareDesc: 'שטיפה, תחזוקה ומעקב ארוך טווח בפרופיל הפאה.',
    serviceDesignTitle: 'עיצוב שיער',
    serviceDesignDesc: 'גזרה, עיצוב וצבע אצל מומחיות קרובות אליך בישראל.',
    footer: 'מאוחסן באיחוד האירופי · מוכן ל-GDPR.',
  },
  common: {
    loading: 'טוען…',
    total: 'סה״כ',
    continue: 'המשך',
    back: 'חזרה',
    save: 'שמירה',
    delete: 'מחיקה',
    edit: 'עריכה',
    cancel: 'ביטול',
    confirmTitle: 'אישור',
    confirmDelete: 'למחוק את הפאה?',
    choose: 'בחירה…',
    yes: 'כן',
    no: 'לא',
    active: 'פעיל',
    dateTbd: 'תאריך לאישור',
    requiredProfile: 'נדרש פרופיל מומחית.',
    actionFailed: 'לא ניתן לבצע את הפעולה.',
    required: 'חובה',
    optional: 'רשות',
    search: 'חיפוש',
    noMatches: 'אין אפשרות תואמת.',
    previousMonth: 'חודש קודם',
    nextMonth: 'חודש הבא',
    today: 'היום',
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
    title: 'תשלום',
    status: 'סטטוס',
    secureLabel: 'תשלום מאובטח',
    escrowExplain: 'התשלום שלך מוגן עד לסיום הטיפול. משלמים רק את הסכום הכולל המוצג.',
    payHold: 'לתשלום עכשיו',
    paying: 'משלמת…',
    prepareIntent: 'תשלום בכרטיס',
    payCard: 'תשלום בכרטיס',
    stripeHeld: 'התשלום אושר. הסכום מוגן עד לסיום הטיפול.',
    release: 'אישור שהטיפול הסתיים',
    releasing: 'מאשרת…',
    captured: 'התשלום אושר. תודה.',
    waitingExpert: 'אפשר לשלם אחרי שהמומחית מאשרת את התור.',
    releaseWhenComplete: 'התשלום אושר. תוכלי לאשר את הטיפול כשיסתיים.',
    statusDue: 'לתשלום',
    statusConfirmed: 'התשלום אושר',
    statusPaid: 'שולם',
    statusCash: 'מזומן ביום התור',
    platformFee: 'שירות',
    appointment: 'תור',
    homeVenue: 'בבית',
    salonVenue: 'בסלון',
    notes: 'הערות',
    notFound: 'ההזמנה לא נמצאה.',
    services: 'שירותים',
    simulationReady: 'התשלום אושר.',
    stripeCreated: 'המשיכי לתשלום מאובטח.',
    failed: 'התשלום נכשל',
    simulationFailed: 'התשלום נכשל',
    releaseFailed: 'לא ניתן לאשר',
    reviewFailed: 'הביקורת נכשלה',
  },
  cash: {
    payCash: 'תשלום במזומן',
    chosen: 'בחרת לשלם במזומן, ישירות למומחית ביום התור.',
    waitingConfirm: 'המומחית תאשר שקיבלה את התשלום ביום התור.',
    cancel: 'לשלם בכרטיס במקום',
    confirmed: 'התשלום במזומן אושר על ידי המומחית — ההזמנה סגורה.',
    failed: 'לא ניתן לעבור לתשלום במזומן',
    expertPending: 'הלקוחה משלמת במזומן. אשרי לאחר שקיבלת את הכסף.',
    expertConfirm: 'קיבלתי את התשלום במזומן',
    expertConfirming: 'מאשר…',
    expertConfirmPrompt: 'הפעולה מאשרת שקיבלת את הסכום וסוגרת את ההזמנה.',
    expertDue: 'עמלת PeaLuna שעליך להעביר על הזמנה זו: {amount}',
    expertConfirmed: 'התשלום במזומן אושר — ההזמנה סגורה.',
    optIn: 'אני מקבלת תשלומים במזומן',
    optInHint: 'לקוחות יוכלו לשלם לך ישירות. עמלת 20% ל-PeaLuna עדיין חלה.',
    adminTitle: 'עמלות מזומן',
    adminEmpty: 'אין עמלות מזומן לגבייה.',
    adminDue: 'לגבייה',
    adminSettled: 'שולמה',
    adminSettle: 'סימון כשולמה',
    adminTabDue: 'ממתינות',
    adminTabSettled: 'שולמו',
  },
  book: {
    eyebrow: 'הזמנה',
    title: 'תיקון וטיפול',
    subtitle: 'בחרי שירות, מומחית ואשרי את התור — ואז שלמי בצורה מאובטחת.',
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
    needAddress: 'יש להוסיף כתובת לטיפול בבית.',
    mediaFailed: 'העלאת התמונה נכשלה. נסי את הגלריה, או תמונה קטנה יותר.',
    addressPlaceholder: 'רחוב, עיר',
    choosePlaceholder: 'בחירה…',
    city: 'עיר',
    postalCode: 'מיקוד',
    service: 'שירות',
    nearbyDistance: 'ממוינות לפי מרחק ממך',
    noSlots: 'אין שעות פנויות ביום הזה.',
    pickSlot: 'שעות פנויות',
    availableLegend: 'פנוי',
    unavailableLegend: 'לא פנוי',
    selectedLegend: 'נבחר',
  },
  admin: {
    title: 'קטלוג',
    services: 'שירותים',
    add: '+ הוספה',
    price: 'מחיר',
    name: 'שם',
    category: 'קטגוריה',
    minutes: 'דקות',
    inactive: 'הסתרה',
    hidden: 'מוסתר',
    priceIls: 'מחיר (ILS)',
    nameHint: 'לפחות 2 תווים. מזהה URL נוצר אוטומטית.',
    deleteConfirm: 'להסיר את הפריט מהקטלוג?',
    skills: 'כישורים',
    skillsSubtitle: 'רשימת כישורים — הוספה, עריכה או מחיקה. המומחיות מסמנות את אותה רשימה בפרופיל ובסיום טיפול.',
    addSkill: '+ הוספת כישור',
    workflow: 'שלבי ביצוע',
    workflowSubtitle: 'שלבים שמומחית חייבת למלא לפני סיום שירות.',
    addStep: '+ הוספת שלב',
    stepTitle: 'כותרת השלב',
    stepDescription: 'הנחיות',
    stepRequired: 'חובה לסיום השירות',
    inputKind: 'סוג קלט',
    inputCheck: 'סימון',
    inputText: 'הערת טקסט',
    moveUp: 'למעלה',
    moveDown: 'למטה',
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
    overview: {
      title: 'לוח בקרה',
      subtitle: 'נתונים חיים מההזמנות, הלקוחות והתשלומים שנגבו ב-PeaLuna.',
      period7: '7 ימים',
      period30: '30 ימים',
      period90: '90 ימים',
      periodYear: '12 חודשים',
      periodAll: 'הכול',
      customers: 'לקוחות רשומות',
      customersHint: 'כל הרשמה יוצרת פרופיל לקוחה, כולל מומחיות ואימיילים שטרם אומתו',
      new7: 'חדשות ב-7 ימים',
      new30: 'חדשות ב-30 ימים',
      bookings: 'הזמנות',
      pending: 'ממתינות',
      confirmed: 'מאושרות',
      completed: 'הושלמו',
      cancelled: 'בוטלו',
      gmv: 'מחזור',
      gmvHint: 'תשלומים שנגבו בלבד',
      commission: 'עמלת פלטפורמה',
      averageBasket: 'סל ממוצע',
      cancellationRate: 'שיעור ביטולים',
      revenueOverTime: 'התפתחות המחזור',
      bookingsOverTime: 'התפתחות ההזמנות',
      noChartData: 'אין פעילות בתקופה זו.',
      loadFailed: 'לא ניתן לטעון את הנתונים. נסי שוב בעוד רגע.',
      recent: 'הזמנות אחרונות',
      expertsApproved: 'מומחיות מאושרות',
      expertsReview: 'מומחיות לבדיקה',
      noneRecent: 'עדיין אין הזמנות.',
      paidOrders: 'הזמנות ששולמו',
    },
    customersPage: {
      title: 'לקוחות רשומות',
      subtitle: 'חשבונות אמיתיים עם פרופיל לקוחה. גם מומחיות ומנהלות מופיעות אם נרשמו קודם כלקוחות.',
      count: 'חשבונות',
      empty: 'אין פרופיל לקוחה שמתאים לסינון.',
      bookings: 'הזמנות',
      alsoExpert: 'מומחית',
      alsoAdmin: 'ניהול',
      statusActive: 'פעיל',
      statusPending: 'אימייל לא אומת',
      statusSuspended: 'מושעה',
      search: 'חיפוש',
      searchPlaceholder: 'שם, אימייל או טלפון',
      sort: 'מיון',
      sortCreated: 'תאריך הרשמה',
      sortBookings: 'הזמנות',
      sortSpent: 'הוצאות',
      newest: 'יורד',
      oldest: 'עולה',
      filterAll: 'כל הסטטוסים',
      activityAll: 'כל הפעילות',
      activityBooked: 'עם הזמנות',
      activityNone: 'בלי הזמנות',
      phone: 'טלפון',
      spent: 'הוצאות',
      average: 'ממוצע הזמנה',
      lastBooking: 'הזמנה אחרונה',
      signedUp: 'נרשמה',
      openDossier: 'פתיחת תיק',
      backToList: 'כל הלקוחות',
      profile: 'פרופיל',
      signupDate: 'תאריך הרשמה',
      country: 'מדינה',
      language: 'שפה',
      verified: 'אימייל אומת',
      unverified: 'אימייל לא אומת',
      summary: 'פעילות',
      experts: 'מומחיות שהוזמנו',
      expertsEmpty: 'עדיין לא הוזמנה מומחית.',
      history: 'הזמנות וטיפולים',
      historyEmpty: 'אין עדיין הזמנות.',
      care: 'דוח טיפול',
      photos: 'תמונות לפני / אחרי',
      photosEmpty: 'אין עדיין תמונות לפני/אחרי.',
      nextCare: 'טיפול הבא',
      wigs: 'פאות רשומות',
      wigsEmpty: 'אין פאה רשומה בפלטפורמה.',
      archived: 'בארכיון',
      transactions: 'עסקאות אחרונות',
      transactionsEmpty: 'אין עדיין תשלומים שנגבו.',
      pending: 'ממתינות',
      confirmed: 'מאושרות',
      completed: 'הושלמו',
      cancelled: 'בוטלו',
      paid: 'שולמו',
      noPhone: 'אין טלפון',
      googleAccount: 'גוגל',
      passwordAccount: 'אימייל',
      notFound: 'תיק הלקוחה לא נמצא.',
      pageOf: 'עמוד {page} מתוך {pages}',
      nextPage: 'הבא',
      prevPage: 'הקודם',
      results: '{n} חשבונות',
    },
    expertsPage: {
      title: 'מומחיות',
      subtitle: 'מעקב חי אחר המומחיות. הזמנות נספרות בנפרד מתשלומים שנגבו, עמלות והעברות.',
      search: 'חיפוש',
      searchPlaceholder: 'שם, אימייל או עיר',
      sort: 'דירוג לפי',
      sortCreated: 'תאריך הרשמה',
      sortBookings: 'הזמנות',
      sortGmv: 'מחזור שנגבה',
      sortCommission: 'עמלת PeaLuna',
      sortPayout: 'חלק המומחית',
      sortRating: 'דירוג',
      sortCompleted: 'שיעור השלמה',
      sortCancelled: 'שיעור ביטולים',
      newest: 'יורד',
      oldest: 'עולה',
      filterAll: 'כל הסטטוסים',
      activityAll: 'כל הפעילות',
      activityBooked: 'עם הזמנות',
      activityNone: 'בלי הזמנות',
      empty: 'אין מומחית שמתאימה לסינון.',
      results: '{n} מומחיות',
      openDossier: 'פתיחת תיק',
      backToList: 'כל המומחיות',
      notFound: 'תיק המומחית לא נמצא.',
      total: 'רשומות',
      active: 'פעילות',
      newPeriod: 'חדשות בתקופה',
      reviewQueue: 'לבדיקה',
      bookings: 'הזמנות',
      paid: 'תשלומים שנגבו',
      gmv: 'מחזור שנגבה',
      gmvHint: 'תשלומי לקוחות שנגבו בלבד — לא כל הזמנה.',
      commission: 'עמלת PeaLuna',
      commissionHint: '20% מהתשלומים שנגבו.',
      payout: 'חלק המומחית',
      payoutHint: 'המחזור שנגבה פחות עמלת הפלטפורמה.',
      transferred: 'הועבר',
      transferredHint: 'העברות כרטיס שנשלחו בפועל למומחית.',
      cashKept: 'מזומן אצלה',
      cashKeptHint: 'מזומן שכבר התקבל, לפני התשלום ל-PeaLuna.',
      cashDue: 'עמלת מזומן לתשלום',
      rating: 'דירוג ממוצע',
      reviews: 'ביקורות',
      reviewsEmpty: 'אין עדיין ביקורות.',
      completedRate: 'שיעור השלמה',
      cancellationRate: 'שיעור ביטולים',
      profile: 'פרופיל',
      services: 'שירותים ומחירים',
      servicesEmpty: 'לא נבחרו שירותים.',
      priceBase: 'קטלוג',
      priceCustom: 'מותאם',
      history: 'הזמנות',
      historyEmpty: 'אין עדיין הזמנות משויכות.',
      finance: 'כסף',
      unpaidBooking: 'הזמנה לא שולמה',
      captured: 'נגבה',
      city: 'עיר',
      signedUp: 'נרשמה',
      stripeReady: 'Stripe מוכן',
      stripeMissing: 'Stripe לא הוגדר',
      home: 'בית',
      salon: 'סלון',
      cash: 'מזומן',
      approve: 'אישור',
      reject: 'דחייה',
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
    verifyPending: 'שלחנו קישור לאימות לתיבת הדואר. פתחי אותו כדי לאשר שהאימייל קיים — אי אפשר להזמין תור לפני האימות.',
    verifySuccess: 'האימייל אומת. אפשר להזמין תור ולהגיש מועמדות כמומחית.',
    verifyError: 'הקישור אינו תקף או שפג תוקפו.',
    verifyCta: 'ללוח הבקרה',
    resend: 'שליחה מחדש',
    resending: 'שולחת…',
    resent: 'נשלח קישור חדש. בדקי גם בספאם.',
    verifyHint:
      'בדקי את תיבת הדואר ואת הספאם. המייל הראשון יכול לקחת עד דקה — שלחי מחדש רק אם כלום לא הגיע.',
    mailTestMode:
      'Resend דחה את הכתובת: זו לא כתובת חשבון Resend. היכנסי עם אותה כתובת בדיוק, או הוסיפי דומיין ב-Resend → Domains.',
    mailBlockedRecipient:
      'החשבון הזה משתמש בכתובת בדיקה (@example.com). צרי חשבון חדש עם תיבת דואר אמיתית — אותה כתובת כמו חשבון Resend.',
    mailSendFailed: 'לא הצלחנו לשלוח את מייל האימות. נסי שוב בעוד רגע.',
    continueWithGoogle: 'המשך עם Google',
    orEmail: 'או עם אימייל',
    googleError: 'ההתחברות עם Google נכשלה. נסי שוב.',
    googleTerms: 'בהמשך עם Google את מאשרת את תנאי השימוש.',
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
  notifications: {
    title: 'התראות',
    empty: 'אין התראות כרגע.',
    markAllRead: 'סמני הכל כנקרא',
    unread: 'לא נקראו',
    openRequest: 'לפתיחת הבקשה',
    seeAll: 'הצג הכל',
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
    AUTHORIZED: 'התשלום אושר',
    CAPTURED: 'שולם',
    CASH_PENDING: 'מזומן ביום התור',
    REFUNDED: 'הוחזר',
    FAILED: 'נכשל',
    CAPTURING: 'מאשר תשלום',
    VOIDED: 'התשלום בוטל',
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
    applyPending: 'הבקשה התקבלה. אדמין יאשר אותה לפני שתופיעי ללקוחות.',
    applyRejected: 'הבקשה לא אושרה. אפשר לעדכן פרטים ולשלוח שוב.',
    pendingReview: 'הבקשה בבדיקה. תופיעי ללקוחות רק אחרי אישור אדמין.',
    resubmit: 'שליחת הבקשה שוב',
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
    skills: 'כישורים שאני שולטת בהם',
    workflowTitle: 'שלבי השירות',
    skipStep: 'דילוג על השלב',
    workflowHint: 'סמני מה שבוצע, או דלגי על שלב לא רלוונטי. דילוג לא חוסם את סיום הטיפול.',
    workflowIncomplete: 'יש לדלג או להשלים את השלבים הנותרים ואז לסיים.',
    markDone: 'סימון כבוצע',
    stepNote: 'הערה',
    availabilityHint: 'הגדירי את המשבצות השבועיות הקבועות.',
    closed: 'סגור',
    viewCareSheet: 'צפייה בדוח הטיפול',
    careDoneBanner: 'הטיפול הסתיים בהצלחה ✓',
    backToDashboard: 'חזרה ללוח הבקרה',
  },
  geo: {
    meters: '{n} מ׳',
    km: '{n} ק״מ',
    denied: 'המיקום לא שותף. אפשר עדיין לבחור מומחית מהרשימה.',
    unavailable: 'אין מיקום במכשיר הזה.',
    emptyExperts: 'לא נמצאו מומחיות לסינון הזה.',
    searchAddress: 'כתובת',
    noResults: 'לא נמצאה כתובת תואמת בישראל.',
    pickOnMap: 'או שימי סיכה על המפה.',
    useLocation: 'השתמשי במיקום שלי',
  },
  orders: {
    title: 'תורים',
    subtitle: 'מעקב אחרי כל הזמנה מהבקשה ועד הסיום.',
    newBooking: 'הזמנה חדשה',
    empty: 'אין תורים עדיין.',
  },
  cookies: {
    title: 'עוגיות',
    message:
      'אנחנו משתמשות רק בעוגיות חיוניות כדי להשאיר אותך מחוברת ולזכור את השפה. בלי פרסומות ובלי מעקב.',
    accept: 'אישור',
    learnMore: 'מידע נוסף',
    policyTitle: 'מדיניות עוגיות',
    policyIntro:
      'PeaLuna משתמשת בכמה שפחות עוגיות. אפשר להמשיך אחרי אישור ההודעה הזו.',
    essentialTitle: 'חיוניות',
    essentialBody:
      'עוגיית התחברות מאובטחת שומרת אותך מחוברת. בחירת השפה נשמרת במכשיר. זה נחוץ לפעולת האתר.',
    optionalTitle: 'אופציונליות',
    optionalBody:
      'כרגע אין עוגיות פרסום או אנליטיקס. אם זה ישתנה, נבקש שוב.',
  },
};

export const dictionaries: Record<Locale, Messages> = { en, fr, he };

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'fr' || value === 'he';
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}
