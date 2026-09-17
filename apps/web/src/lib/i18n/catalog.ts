import type { Locale } from './messages';

type ServiceCopy = {
  name: string;
  description: string;
  category: string;
};

type StepCopy = {
  title: string;
  description: string;
};

const SERVICES: Record<string, Record<Locale, ServiceCopy>> = {
  'comble-trou': {
    en: {
      name: 'Hole repair',
      description: 'Repair holes and damaged areas in the lace or base',
      category: 'Repair',
    },
    fr: {
      name: 'Comblement de trou',
      description: 'Réparer les trous et zones abîmées de la lace ou de la base',
      category: 'Réparation',
    },
    he: {
      name: 'תיקון חור',
      description: 'תיקון חורים ואזורים פגומים בלייס או בבסיס',
      category: 'תיקון',
    },
  },
  'couper-lace': {
    en: {
      name: 'Lace cut',
      description: 'Professional lace cutting for a natural look',
      category: 'Repair',
    },
    fr: {
      name: 'Coupe de lace',
      description: 'Coupe professionnelle de la lace pour un rendu naturel',
      category: 'Réparation',
    },
    he: {
      name: 'חיתוך לייס',
      description: 'חיתוך מקצועי של הלייס למראה טבעי',
      category: 'תיקון',
    },
  },
  'baby-hair': {
    en: {
      name: 'Baby hair',
      description: 'Create and style baby hairs',
      category: 'Styling',
    },
    fr: {
      name: 'Baby hair',
      description: 'Création et coiffage des baby hairs',
      category: 'Coiffage',
    },
    he: {
      name: 'בייבי הייר',
      description: 'יצירה ועיצוב בייבי הייר',
      category: 'עיצוב',
    },
  },
  'lavage-brushing-soin': {
    en: {
      name: 'Wash / blow-dry / treatment',
      description: 'Wash, moisture treatment and professional blow-dry',
      category: 'Care',
    },
    fr: {
      name: 'Lavage / brushing / soin',
      description: 'Lavage, soin hydratant et brushing professionnel',
      category: 'Soin',
    },
    he: {
      name: 'שטיפה / בראשינג / טיפול',
      description: 'שטיפה, טיפול לחות ובראשינג מקצועי',
      category: 'טיפול',
    },
  },
  couleur: {
    en: {
      name: 'Color',
      description: 'Color, balayage or color correction',
      category: 'Color',
    },
    fr: {
      name: 'Coloration',
      description: 'Coloration, balayage ou correction de couleur',
      category: 'Couleur',
    },
    he: {
      name: 'צבע',
      description: 'צביעה, באליאז׳ או תיקון צבע',
      category: 'צבע',
    },
  },
  'transformation-lace': {
    en: {
      name: 'Lace conversion',
      description: 'Full conversion of a classic wig to lace',
      category: 'Conversion',
    },
    fr: {
      name: 'Transformation en lace',
      description: 'Transformation complète d’une perruque classique en lace',
      category: 'Transformation',
    },
    he: {
      name: 'המרה לפאה לייס',
      description: 'המרה מלאה של פאה קלאסית ללייס',
      category: 'המרה',
    },
  },
  'repair-lace-front': {
    en: {
      name: 'Lace front repair',
      description: 'Repair and restore a lace front',
      category: 'Repair',
    },
    fr: {
      name: 'Réparation lace front',
      description: 'Réparer et restaurer une lace front',
      category: 'Réparation',
    },
    he: {
      name: 'תיקון לייס פרונט',
      description: 'תיקון ושחזור לייס פרונט',
      category: 'תיקון',
    },
  },
  'deep-conditioning': {
    en: {
      name: 'Deep conditioning',
      description: 'Hydrating treatment for the wig',
      category: 'Care',
    },
    fr: {
      name: 'Soin profond',
      description: 'Soin hydratant pour la perruque',
      category: 'Soin',
    },
    he: {
      name: 'טיפול עמוק',
      description: 'טיפול לחות לפאה',
      category: 'טיפול',
    },
  },
  'transformation-style': {
    en: {
      name: 'Style transformation',
      description: 'Restyle or transform the wig',
      category: 'Styling',
    },
    fr: {
      name: 'Transformation de style',
      description: 'Restyler ou transformer la perruque',
      category: 'Coiffage',
    },
    he: {
      name: 'המרת סגנון',
      description: 'עיצוב מחדש או המרה של הפאה',
      category: 'עיצוב',
    },
  },
};

const SKILLS: Record<string, Record<Locale, string>> = {
  lavage: { en: 'Wash', fr: 'Lavage', he: 'שטיפה' },
  'soin-profond': { en: 'Deep treatment', fr: 'Soin profond', he: 'טיפול עמוק' },
  demelage: { en: 'Detangling', fr: 'Démêlage', he: 'סירוק' },
  sechage: { en: 'Drying', fr: 'Séchage', he: 'ייבוש' },
  brushing: { en: 'Blow-dry', fr: 'Brushing', he: 'בראשינג' },
  coiffage: { en: 'Styling', fr: 'Coiffage', he: 'עיצוב' },
  coupe: { en: 'Cut', fr: 'Coupe', he: 'תספורת' },
  coloration: { en: 'Color', fr: 'Coloration', he: 'צבע' },
  decoloration: { en: 'Bleach', fr: 'Décoloration', he: 'הבהרה' },
  patine: { en: 'Toner', fr: 'Patine', he: 'פטין' },
  'reparation-lace': { en: 'Lace repair', fr: 'Réparation lace', he: 'תיקון לייס' },
  'remplacement-lace': { en: 'Lace replacement', fr: 'Remplacement lace', he: 'החלפת לייס' },
  'reparation-de-la-base': { en: 'Base repair', fr: 'Réparation de la base', he: 'תיקון הבסיס' },
  'ajout-de-cheveux': { en: 'Hair addition', fr: 'Ajout de cheveux', he: 'הוספת שיער' },
  'remplacement-de-cheveux': { en: 'Hair replacement', fr: 'Remplacement de cheveux', he: 'החלפת שיער' },
  reconstruction: { en: 'Reconstruction', fr: 'Reconstruction', he: 'שחזור' },
  transformation: { en: 'Transformation', fr: 'Transformation', he: 'המרה' },
  'baby-hair-style': { en: 'Baby hair', fr: 'Baby hair', he: 'בייבי הייר' },
  'reparation-des-noeuds': { en: 'Knot repair', fr: 'Réparation des nœuds', he: 'תיקון קשרים' },
  autre: { en: 'Other', fr: 'Autre', he: 'אחר' },
  'lace-repair': { en: 'Lace repair', fr: 'Réparation lace', he: 'תיקון לייס' },
  'baby-hair': { en: 'Baby hair', fr: 'Baby hair', he: 'בייבי הייר' },
  color: { en: 'Color', fr: 'Coloration', he: 'צבע' },
  'wash-treatment': { en: 'Wash & treatment', fr: 'Lavage et soin', he: 'שטיפה וטיפול' },
  'lace-conversion': { en: 'Lace conversion', fr: 'Transformation lace', he: 'המרה ללייס' },
};

const WORKFLOW: Record<string, Record<Locale, StepCopy>> = {
  'confirm-start': {
    en: {
      title: 'Confirm start of care',
      description: 'Confirm you have the wig and care can begin.',
    },
    fr: {
      title: 'Confirmer le début du soin',
      description: 'Confirme que la perruque est entre tes mains et que le soin peut commencer.',
    },
    he: {
      title: 'אישור תחילת הטיפול',
      description: 'אשר שהפאה בידך ושהטיפול יכול להתחיל.',
    },
  },
  'document-work': {
    en: {
      title: 'Document the work done',
      description: 'Fill in the work details on the care report.',
    },
    fr: {
      title: 'Documenter le travail effectué',
      description: 'Renseigne le détail du travail dans la fiche de soin.',
    },
    he: {
      title: 'תיעוד העבודה שבוצעה',
      description: 'מלא את פירוט העבודה בגיליון הטיפול.',
    },
  },
  'confirm-ready': {
    en: {
      title: 'Confirm the service is ready',
      description: 'Confirm the wig is ready to return to the client.',
    },
    fr: {
      title: 'Confirmer que le soin est prêt',
      description: 'Confirme que la perruque est prête à être rendue à la cliente.',
    },
    he: {
      title: 'אישור שהשירות מוכן',
      description: 'אשר שהפאה מוכנה להחזרה ללקוחה.',
    },
  },
};

function indexByLabel(entries: [string, Record<Locale, { name?: string; title?: string } | string>][]) {
  const map: Record<string, string> = {};
  for (const [slug, locales] of entries) {
    map[slug] = slug;
    for (const copy of Object.values(locales)) {
      const label = typeof copy === 'string' ? copy : copy.name ?? copy.title;
      if (label) map[label] = slug;
    }
  }
  return map;
}

const SERVICE_SLUG_BY_LABEL = indexByLabel(Object.entries(SERVICES));
const SKILL_SLUG_BY_LABEL = indexByLabel(Object.entries(SKILLS));
const WORKFLOW_SLUG_BY_LABEL = indexByLabel(Object.entries(WORKFLOW));

function resolveSlug(
  index: Record<string, string>,
  slug?: string | null,
  stored?: string | null,
) {
  if (slug && (index[slug] || SERVICES[slug] || SKILLS[slug] || WORKFLOW[slug])) return slug;
  if (stored && index[stored]) return index[stored];
  return slug ?? undefined;
}

export function catalogServiceName(
  locale: Locale,
  slug: string | null | undefined,
  fallback: string,
) {
  const resolved = resolveSlug(SERVICE_SLUG_BY_LABEL, slug, fallback);
  return (resolved && SERVICES[resolved]?.[locale]?.name) || fallback;
}

export function catalogServiceDescription(
  locale: Locale,
  slug: string | null | undefined,
  fallback: string | null | undefined,
) {
  const resolved = resolveSlug(SERVICE_SLUG_BY_LABEL, slug, fallback);
  return (resolved && SERVICES[resolved]?.[locale]?.description) || fallback || '';
}

export function catalogServiceCategory(
  locale: Locale,
  slug: string | null | undefined,
  fallback: string | null | undefined,
) {
  const resolved = resolveSlug(SERVICE_SLUG_BY_LABEL, slug, fallback);
  return (resolved && SERVICES[resolved]?.[locale]?.category) || fallback || '';
}

export function catalogSkillName(
  locale: Locale,
  slug: string | null | undefined,
  fallback: string,
) {
  const resolved = resolveSlug(SKILL_SLUG_BY_LABEL, slug, fallback);
  return (resolved && SKILLS[resolved]?.[locale]) || fallback;
}

export function catalogWorkflowTitle(
  locale: Locale,
  slug: string | null | undefined,
  fallback: string,
) {
  const resolved = resolveSlug(WORKFLOW_SLUG_BY_LABEL, slug, fallback);
  return (resolved && WORKFLOW[resolved]?.[locale]?.title) || fallback;
}

export function catalogWorkflowDescription(
  locale: Locale,
  slug: string | null | undefined,
  fallback: string | null | undefined,
) {
  const resolved = resolveSlug(WORKFLOW_SLUG_BY_LABEL, slug, fallback);
  return (resolved && WORKFLOW[resolved]?.[locale]?.description) || fallback || '';
}

export function catalogServiceLabels(locale: Locale, names: string[]) {
  return names.map((name) => catalogServiceName(locale, undefined, name));
}

export function catalogSkillLabels(locale: Locale, names: string[]) {
  return names.map((name) => catalogSkillName(locale, undefined, name));
}
