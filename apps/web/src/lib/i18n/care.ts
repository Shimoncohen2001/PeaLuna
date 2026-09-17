import type { Locale } from './messages';

export const CONDITION_OPTIONS = ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED', 'VERY_DAMAGED'] as const;
export const WEAR_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const;
export const TANGLE_OPTIONS = ['NONE', 'LIGHT', 'MODERATE', 'SEVERE'] as const;
export const WIG_KIND_OPTIONS = ['LACE_FRONT', 'FULL_LACE', 'CLOSURE', 'GLUELESS', 'CLASSIC', 'OTHER'] as const;
export const HAIR_KIND_OPTIONS = ['HUMAN', 'SYNTHETIC', 'MIXED', 'OTHER'] as const;
export const PHOTO_ANGLES = ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'LACE', 'EXTRA'] as const;
export const OPERATION_CODES = [
  'WASH',
  'DEEP_TREATMENT',
  'DETANGLE',
  'DRY',
  'BLOW_DRY',
  'STYLE',
  'CUT',
  'COLOR',
  'BLEACH',
  'TONER',
  'LACE_REPAIR',
  'LACE_REPLACE',
  'BASE_REPAIR',
  'HAIR_ADD',
  'HAIR_REPLACE',
  'RECONSTRUCTION',
  'TRANSFORMATION',
  'BABY_HAIR',
  'KNOT_REPAIR',
  'OTHER',
] as const;

const fr: Record<string, string> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Bon',
  FAIR: 'Moyen',
  DAMAGED: 'Abîmé',
  VERY_DAMAGED: 'Très abîmé',
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Important',
  VERY_HIGH: 'Très important',
  NONE: 'Aucun',
  LIGHT: 'Léger',
  MODERATE: 'Modéré',
  SEVERE: 'Important',
  LACE_FRONT: 'Lace front',
  FULL_LACE: 'Full lace',
  CLOSURE: 'Closure',
  GLUELESS: 'Glueless',
  CLASSIC: 'Classique',
  OTHER: 'Autre',
  HUMAN: 'Cheveux naturels',
  SYNTHETIC: 'Synthétique',
  MIXED: 'Mixte',
  FRONT: 'Face',
  BACK: 'Arrière',
  LEFT: 'Côté gauche',
  RIGHT: 'Côté droit',
  LACE: 'Lace / zone à réparer',
  EXTRA: 'Photo supplémentaire',
  WASH: 'Lavage',
  DEEP_TREATMENT: 'Soin profond',
  DETANGLE: 'Démêlage',
  DRY: 'Séchage',
  BLOW_DRY: 'Brushing',
  STYLE: 'Coiffage',
  CUT: 'Coupe',
  COLOR: 'Coloration',
  BLEACH: 'Décoloration',
  TONER: 'Patine',
  LACE_REPAIR: 'Réparation lace',
  LACE_REPLACE: 'Remplacement lace',
  BASE_REPAIR: 'Réparation de la base',
  HAIR_ADD: 'Ajout de cheveux',
  HAIR_REPLACE: 'Remplacement de cheveux',
  RECONSTRUCTION: 'Reconstruction',
  TRANSFORMATION: 'Transformation',
  BABY_HAIR: 'Baby hair',
  KNOT_REPAIR: 'Réparation des nœuds',
};

const en: Record<string, string> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',
  DAMAGED: 'Damaged',
  VERY_DAMAGED: 'Very damaged',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  VERY_HIGH: 'Very high',
  NONE: 'None',
  LIGHT: 'Light',
  MODERATE: 'Moderate',
  SEVERE: 'Severe',
  LACE_FRONT: 'Lace front',
  FULL_LACE: 'Full lace',
  CLOSURE: 'Closure',
  GLUELESS: 'Glueless',
  CLASSIC: 'Classic',
  OTHER: 'Other',
  HUMAN: 'Human hair',
  SYNTHETIC: 'Synthetic',
  MIXED: 'Mixed',
  FRONT: 'Front',
  BACK: 'Back',
  LEFT: 'Left side',
  RIGHT: 'Right side',
  LACE: 'Lace / repair area',
  EXTRA: 'Extra photo',
  WASH: 'Wash',
  DEEP_TREATMENT: 'Deep treatment',
  DETANGLE: 'Detangle',
  DRY: 'Dry',
  BLOW_DRY: 'Blow-dry',
  STYLE: 'Styling',
  CUT: 'Cut',
  COLOR: 'Color',
  BLEACH: 'Bleach',
  TONER: 'Toner',
  LACE_REPAIR: 'Lace repair',
  LACE_REPLACE: 'Lace replacement',
  BASE_REPAIR: 'Base repair',
  HAIR_ADD: 'Hair added',
  HAIR_REPLACE: 'Hair replacement',
  RECONSTRUCTION: 'Reconstruction',
  TRANSFORMATION: 'Transformation',
  BABY_HAIR: 'Baby hair',
  KNOT_REPAIR: 'Knot repair',
};

const he: Record<string, string> = {
  EXCELLENT: 'מצוין',
  GOOD: 'טוב',
  FAIR: 'בינוני',
  DAMAGED: 'פגום',
  VERY_DAMAGED: 'פגום מאוד',
  LOW: 'נמוך',
  MEDIUM: 'בינוני',
  HIGH: 'גבוה',
  VERY_HIGH: 'גבוה מאוד',
  NONE: 'אין',
  LIGHT: 'קל',
  MODERATE: 'בינוני',
  SEVERE: 'חמור',
  LACE_FRONT: 'לייס קדמי',
  FULL_LACE: 'פול לייס',
  CLOSURE: 'קלוז׳ר',
  GLUELESS: 'ללא דבק',
  CLASSIC: 'קלאסי',
  OTHER: 'אחר',
  HUMAN: 'שיער טבעי',
  SYNTHETIC: 'סינתטי',
  MIXED: 'מעורב',
  FRONT: 'קדמי',
  BACK: 'אחורי',
  LEFT: 'צד שמאל',
  RIGHT: 'צד ימין',
  LACE: 'לייס / אזור תיקון',
  EXTRA: 'תמונה נוספת',
  WASH: 'שטיפה',
  DEEP_TREATMENT: 'טיפול עמוק',
  DETANGLE: 'התרה',
  DRY: 'ייבוש',
  BLOW_DRY: 'בראשינג',
  STYLE: 'עיצוב',
  CUT: 'גזירה',
  COLOR: 'צבע',
  BLEACH: 'הבהרה',
  TONER: 'פאטין',
  LACE_REPAIR: 'תיקון לייס',
  LACE_REPLACE: 'החלפת לייס',
  BASE_REPAIR: 'תיקון בסיס',
  HAIR_ADD: 'הוספת שיער',
  HAIR_REPLACE: 'החלפת שיער',
  RECONSTRUCTION: 'שחזור',
  TRANSFORMATION: 'המרה',
  BABY_HAIR: 'בייבי הייר',
  KNOT_REPAIR: 'תיקון קשרים',
};

const DICTS: Record<Locale, Record<string, string>> = { fr, en, he };

export function careLabel(locale: Locale, code: string): string {
  return DICTS[locale][code] ?? DICTS.fr[code] ?? code;
}

export type CareUi = {
  steps: [string, string, string, string, string, string, string, string];
  incomplete: string;
  uploadFailed: string;
  uploadImpossible: string;
  errBefore: string;
  errBeforePhoto: string;
  errOps: string;
  errHair: string;
  errAfter: string;
  errAfterPhoto: string;
  errAdvice: string;
  loadingSheet: string;
  openFailed: string;
  savedTitle: string;
  savedHint: string;
  finishSuccessTitle: string;
  finishSuccessCash: string;
  finishSuccessCard: string;
  finishSuccessDone: string;
  redirecting: string;
  nextCash: string;
  nextDashboard: string;
  nextJob: string;
  general: string;
  weightBefore: string;
  wigAge: string;
  wigKind: string;
  hairKind: string;
  lengthCm: string;
  lace: string;
  base: string;
  hair: string;
  wear: string;
  tangle: string;
  hairLoss: string;
  visibleDamage: string;
  repairsNeeded: string;
  internalNotes: string;
  opNotes: string;
  comment: string;
  hairAddedHint: string;
  addedGrams: string;
  color: string;
  texture: string;
  origin: string;
  zone: string;
  weightAfter: string;
  weightDelta: string;
  generalAfter: string;
  wearAfter: string;
  result: string;
  watchInternal: string;
  afterInternal: string;
  washFreq: string;
  nextCare: string;
  recommended: string;
  avoid: string;
  styling: string;
  storage: string;
  heat: string;
  laceAdvice: string;
  otherAdvice: string;
  summary: string;
  photosCount: string;
  adviceLine: string;
  toComplete: string;
  lockHint: string;
  skipHint: string;
  confirmSubmit: string;
  validating: string;
  finishCare: string;
  photosBefore: string;
  photosAfter: string;
  extraPhotos: string;
  takePhoto: string;
  chooseLibrary: string;
  cameraHint: string;
  beforeAfter: string;
  currentState: string;
  noSheet: string;
  lastCare: string;
  knownIssues: string;
  expertAdvice: string;
  wash: string;
  products: string;
  toAvoid: string;
  careHistory: string;
  noHistory: string;
  care: string;
  before: string;
  after: string;
  hairAdded: string;
  expert: string;
  watch: string;
    extra: string;
    backToJob: string;
    sheetEyebrow: string;
    sheetTitle: string;
    sheetHint: string;
    notFoundWig: string;
    noCareYet: string;
  };

const CARE_UI: Record<Locale, CareUi> = {
  fr: {
    steps: ['État avant', 'Photos avant', 'Travail effectué', 'Cheveux ajoutés', 'État après', 'Photos après', 'Conseils', 'Vérification'],
    incomplete: 'Formulaire incomplet',
    uploadFailed: 'Échec du téléversement',
    uploadImpossible: 'Téléversement impossible',
    errBefore: 'Complète tous les champs obligatoires de l’état avant le soin.',
    errBeforePhoto: 'Ajoute au moins une photo avant le soin.',
    errOps: 'Sélectionne au moins une opération réalisée.',
    errHair: 'Complète les informations sur les cheveux ajoutés.',
    errAfter: 'Complète tous les champs obligatoires de l’état après le soin.',
    errAfterPhoto: 'Ajoute au moins une photo après le soin.',
    errAdvice: 'Indique la fréquence de lavage et au moins un conseil pour la cliente.',
    loadingSheet: 'Chargement de la fiche…',
    openFailed: 'Impossible d’ouvrir la fiche de soin.',
    savedTitle: 'Fiche de soin enregistrée',
    savedHint: 'Cette fiche est verrouillée dans l’historique de la perruque.',
    finishSuccessTitle: 'Soin terminé avec succès ✓',
    finishSuccessCash: 'Confirme maintenant que tu as bien reçu le paiement en espèces.',
    finishSuccessCard: 'La cliente validera le paiement de son côté. Tu n’as rien d’autre à faire.',
    finishSuccessDone: 'Ce rendez-vous est clos. Tu peux revenir à tes prochains soins.',
    redirecting: 'Redirection…',
    nextCash: 'Confirmer le paiement',
    nextDashboard: 'Tableau de bord',
    nextJob: 'Voir le rendez-vous',
    general: 'État général',
    weightBefore: 'Poids avant (g)',
    wigAge: 'Âge de la perruque (années)',
    wigKind: 'Type de perruque',
    hairKind: 'Type de cheveux',
    lengthCm: 'Longueur (cm)',
    lace: 'État de la lace',
    base: 'État de la base',
    hair: 'État des cheveux',
    wear: 'Niveau d’usure',
    tangle: 'Nœuds / emmêlements',
    hairLoss: 'Chute de cheveux constatée',
    visibleDamage: 'Dommages visibles',
    repairsNeeded: 'Réparations nécessaires',
    internalNotes: 'Commentaires internes',
    opNotes: 'Précisions optionnelles par opération',
    comment: 'Commentaire',
    hairAddedHint: 'Renseigne les cheveux ajoutés ou remplacés.',
    addedGrams: 'Poids ajouté (g)',
    color: 'Couleur',
    texture: 'Texture',
    origin: 'Origine',
    zone: 'Zone',
    weightAfter: 'Poids après (g)',
    weightDelta: 'Écart',
    generalAfter: 'État général après',
    wearAfter: 'Usure après',
    result: 'Résultat obtenu',
    watchInternal: 'Problèmes à surveiller (interne)',
    afterInternal: 'Commentaires internes après le soin',
    washFreq: 'Fréquence de lavage',
    nextCare: 'Prochain soin (date)',
    recommended: 'Produits recommandés',
    avoid: 'Produits à éviter',
    styling: 'Conseils de coiffage',
    storage: 'Stockage',
    heat: 'Chaleur',
    laceAdvice: 'Lace',
    otherAdvice: 'Autres recommandations',
    summary: 'Résumé du soin',
    photosCount: 'Photos avant {before} · après {after}',
    adviceLine: 'Conseils : {text}',
    toComplete: 'à compléter',
    lockHint: '« Terminer le soin » enregistre la fiche et clôture le rendez-vous.',
    skipHint: 'Tu peux passer une étape si elle ne s’applique pas — ça ne bloque pas la finalisation.',
    confirmSubmit: 'Valider et terminer ce soin ? La fiche sera verrouillée dans l’historique.',
    validating: 'Validation…',
    finishCare: 'Terminer le soin',
    photosBefore: 'Photos avant le soin',
    photosAfter: 'Photos après le soin',
    extraPhotos: 'Photos supplémentaires',
    takePhoto: 'Photo',
    chooseLibrary: 'Galerie',
    cameraHint: 'Sur téléphone, Photo ouvre la caméra arrière.',
    beforeAfter: 'Avant / Après',
    currentState: 'État actuel',
    noSheet: 'Pas encore de fiche',
    lastCare: 'Dernier soin',
    knownIssues: 'Problèmes connus',
    expertAdvice: 'Conseils de l’experte',
    wash: 'Lavage',
    products: 'Produits',
    toAvoid: 'À éviter',
    careHistory: 'Historique des soins',
    noHistory: 'Aucun soin enregistré.',
    care: 'Soin',
    before: 'Avant',
    after: 'Après',
    hairAdded: 'Cheveux ajoutés',
    expert: 'Experte',
    watch: 'À surveiller',
    extra: 'extra',
    backToJob: 'Dossier rendez-vous',
    sheetEyebrow: 'Fiche de soin',
    sheetTitle: 'Terminer le soin',
    sheetHint:
      'Toutes les informations obligatoires doivent être remplies avant validation. La fiche alimente l’historique de la perruque.',
    notFoundWig: 'Perruque introuvable.',
    noCareYet: 'Pas encore de soin',
  },
  en: {
    steps: ['Before', 'Before photos', 'Work done', 'Hair added', 'After', 'After photos', 'Advice', 'Review'],
    incomplete: 'Form incomplete',
    uploadFailed: 'Upload failed',
    uploadImpossible: 'Upload failed',
    errBefore: 'Fill in all required fields for the wig’s condition before care.',
    errBeforePhoto: 'Add at least one photo before care.',
    errOps: 'Select at least one operation performed.',
    errHair: 'Complete the details for hair that was added.',
    errAfter: 'Fill in all required fields for the wig’s condition after care.',
    errAfterPhoto: 'Add at least one photo after care.',
    errAdvice: 'Enter wash frequency and at least one piece of advice for the client.',
    loadingSheet: 'Loading care report…',
    openFailed: 'Could not open the care report.',
    savedTitle: 'Care report saved',
    savedHint: 'This report is locked in the wig history.',
    finishSuccessTitle: 'Care completed successfully ✓',
    finishSuccessCash: 'Confirm now that you received the cash payment.',
    finishSuccessCard: 'The client will validate payment on their side. You’re done here.',
    finishSuccessDone: 'This appointment is closed. You can go back to your next jobs.',
    redirecting: 'Redirecting…',
    nextCash: 'Confirm payment',
    nextDashboard: 'Dashboard',
    nextJob: 'View appointment',
    general: 'Overall condition',
    weightBefore: 'Weight before (g)',
    wigAge: 'Wig age (years)',
    wigKind: 'Wig type',
    hairKind: 'Hair type',
    lengthCm: 'Length (cm)',
    lace: 'Lace condition',
    base: 'Base condition',
    hair: 'Hair condition',
    wear: 'Wear level',
    tangle: 'Tangles / knots',
    hairLoss: 'Hair loss observed',
    visibleDamage: 'Visible damage',
    repairsNeeded: 'Repairs needed',
    internalNotes: 'Internal notes',
    opNotes: 'Optional notes per operation',
    comment: 'Comment',
    hairAddedHint: 'Describe hair that was added or replaced.',
    addedGrams: 'Weight added (g)',
    color: 'Color',
    texture: 'Texture',
    origin: 'Origin',
    zone: 'Zone',
    weightAfter: 'Weight after (g)',
    weightDelta: 'Delta',
    generalAfter: 'Overall condition after',
    wearAfter: 'Wear after',
    result: 'Result',
    watchInternal: 'Issues to watch (internal)',
    afterInternal: 'Internal notes after care',
    washFreq: 'Wash frequency',
    nextCare: 'Next care (date)',
    recommended: 'Recommended products',
    avoid: 'Products to avoid',
    styling: 'Styling advice',
    storage: 'Storage',
    heat: 'Heat',
    laceAdvice: 'Lace',
    otherAdvice: 'Other recommendations',
    summary: 'Care summary',
    photosCount: 'Photos before {before} · after {after}',
    adviceLine: 'Advice: {text}',
    toComplete: 'to complete',
    lockHint: '“Finish care” saves the report and closes the appointment.',
    skipHint: 'You can skip a step if it doesn’t apply — it won’t block finishing the care.',
    confirmSubmit: 'Validate and finish this care? The report will be locked in the history.',
    validating: 'Validating…',
    finishCare: 'Finish care',
    photosBefore: 'Photos before care',
    photosAfter: 'Photos after care',
    extraPhotos: 'Extra photos',
    takePhoto: 'Camera',
    chooseLibrary: 'Library',
    cameraHint: 'On a phone, Camera opens the rear camera.',
    beforeAfter: 'Before / After',
    currentState: 'Current condition',
    noSheet: 'No report yet',
    lastCare: 'Last care',
    knownIssues: 'Known issues',
    expertAdvice: 'Expert advice',
    wash: 'Wash',
    products: 'Products',
    toAvoid: 'Avoid',
    careHistory: 'Care history',
    noHistory: 'No care recorded.',
    care: 'Care',
    before: 'Before',
    after: 'After',
    hairAdded: 'Hair added',
    expert: 'Expert',
    watch: 'Watch',
    extra: 'extra',
    backToJob: 'Appointment file',
    sheetEyebrow: 'Care report',
    sheetTitle: 'Finish this care',
    sheetHint: 'All required information must be filled in before validation. The report feeds the wig history.',
    notFoundWig: 'Wig not found.',
    noCareYet: 'No care yet',
  },
  he: {
    steps: ['מצב לפני', 'תמונות לפני', 'העבודה שבוצעה', 'שיער שנוסף', 'מצב אחרי', 'תמונות אחרי', 'המלצות', 'בדיקה'],
    incomplete: 'הטופס לא מלא',
    uploadFailed: 'ההעלאה נכשלה',
    uploadImpossible: 'לא ניתן להעלות',
    errBefore: 'מלאי את כל השדות החובה של מצב הפאה לפני הטיפול.',
    errBeforePhoto: 'הוסיפי לפחות תמונה אחת לפני הטיפול.',
    errOps: 'בחרי לפחות פעולה אחת שבוצעה.',
    errHair: 'השלימי את פרטי השיער שנוסף.',
    errAfter: 'מלאי את כל השדות החובה של מצב הפאה אחרי הטיפול.',
    errAfterPhoto: 'הוסיפי לפחות תמונה אחת אחרי הטיפול.',
    errAdvice: 'צייני תדירות שטיפה ולפחות המלצה אחת ללקוחה.',
    loadingSheet: 'טוען את דוח הטיפול…',
    openFailed: 'לא ניתן לפתוח את דוח הטיפול.',
    savedTitle: 'דוח הטיפול נשמר',
    savedHint: 'הדוח נעול בהיסטוריית הפאה.',
    finishSuccessTitle: 'הטיפול הסתיים בהצלחה ✓',
    finishSuccessCash: 'אשרי עכשיו שקיבלת את התשלום במזומן.',
    finishSuccessCard: 'הלקוחה תאשר את התשלום מצדה. אין לך מה לעשות עכשיו.',
    finishSuccessDone: 'התור נסגר. אפשר לחזור לטיפולים הבאים.',
    redirecting: 'מעבירה…',
    nextCash: 'אישור תשלום',
    nextDashboard: 'לוח בקרה',
    nextJob: 'צפייה בתור',
    general: 'מצב כללי',
    weightBefore: 'משקל לפני (ג׳)',
    wigAge: 'גיל הפאה (שנים)',
    wigKind: 'סוג פאה',
    hairKind: 'סוג שיער',
    lengthCm: 'אורך (ס״מ)',
    lace: 'מצב הלייס',
    base: 'מצב הבסיס',
    hair: 'מצב השיער',
    wear: 'רמת בלאי',
    tangle: 'קשרים / הסתבכויות',
    hairLoss: 'נשירת שיער שנצפתה',
    visibleDamage: 'נזק נראה',
    repairsNeeded: 'תיקונים נדרשים',
    internalNotes: 'הערות פנימיות',
    opNotes: 'הערות אופציונליות לכל פעולה',
    comment: 'הערה',
    hairAddedHint: 'פרטי השיער שנוסף או הוחלף.',
    addedGrams: 'משקל שנוסף (ג׳)',
    color: 'צבע',
    texture: 'מרקם',
    origin: 'מקור',
    zone: 'אזור',
    weightAfter: 'משקל אחרי (ג׳)',
    weightDelta: 'הפרש',
    generalAfter: 'מצב כללי אחרי',
    wearAfter: 'בלאי אחרי',
    result: 'התוצאה',
    watchInternal: 'נושאים למעקב (פנימי)',
    afterInternal: 'הערות פנימיות אחרי הטיפול',
    washFreq: 'תדירות שטיפה',
    nextCare: 'טיפול הבא (תאריך)',
    recommended: 'מוצרים מומלצים',
    avoid: 'מוצרים להימנע',
    styling: 'המלצות עיצוב',
    storage: 'אחסון',
    heat: 'חום',
    laceAdvice: 'לייס',
    otherAdvice: 'המלצות נוספות',
    summary: 'סיכום הטיפול',
    photosCount: 'תמונות לפני {before} · אחרי {after}',
    adviceLine: 'המלצות: {text}',
    toComplete: 'להשלים',
    lockHint: '«סיום הטיפול» שומר את הדוח וסוגר את התור.',
    skipHint: 'אפשר לדלג על שלב אם הוא לא רלוונטי — זה לא יחסום את סיום הטיפול.',
    confirmSubmit: 'לאשר ולסיים את הטיפול? הדוח יינעל בהיסטוריה.',
    validating: 'מאשר…',
    finishCare: 'סיום הטיפול',
    photosBefore: 'תמונות לפני הטיפול',
    photosAfter: 'תמונות אחרי הטיפול',
    extraPhotos: 'תמונות נוספות',
    takePhoto: 'מצלמה',
    chooseLibrary: 'גלריה',
    cameraHint: 'בטלפון, מצלמה פותחת את המצלמה האחורית.',
    beforeAfter: 'לפני / אחרי',
    currentState: 'מצב נוכחי',
    noSheet: 'אין עדיין דוח',
    lastCare: 'טיפול אחרון',
    knownIssues: 'בעיות ידועות',
    expertAdvice: 'המלצות המומחית',
    wash: 'שטיפה',
    products: 'מוצרים',
    toAvoid: 'להימנע',
    careHistory: 'היסטוריית טיפולים',
    noHistory: 'אין טיפולים רשומים.',
    care: 'טיפול',
    before: 'לפני',
    after: 'אחרי',
    hairAdded: 'שיער שנוסף',
    expert: 'מומחית',
    watch: 'למעקב',
    extra: 'נוסף',
    backToJob: 'תיק התור',
    sheetEyebrow: 'דוח טיפול',
    sheetTitle: 'סיום הטיפול',
    sheetHint: 'יש למלא את כל השדות החובה לפני האישור. הדוח נשמר בהיסטוריית הפאה.',
    notFoundWig: 'הפאה לא נמצאה.',
    noCareYet: 'אין עדיין טיפול',
  },
};

export function careUi(locale: Locale): CareUi {
  return CARE_UI[locale];
}

