/** Platform commission: 20% (2000 basis points) */
export const PLATFORM_COMMISSION_BPS = 2000;

/** Israel marketplace defaults */
export const DEFAULT_COUNTRY_CODE = 'IL' as const;
export const DEFAULT_CURRENCY = 'ILS' as const;
export const DEFAULT_CITY = 'Tel Aviv' as const;
export const DEFAULT_TIMEZONE = 'Asia/Jerusalem' as const;
export const DEFAULT_LOCALE = 'he-IL' as const;
export const DEFAULT_LATITUDE = 32.0853;
export const DEFAULT_LONGITUDE = 34.7818;
export const DEFAULT_SEARCH_RADIUS_KM = 40;

/** Default deployment region — override per environment */
export const DEFAULT_DEPLOYMENT_REGION = 'eu-central-1' as const;

export const API_VERSION = 'v1' as const;

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export const PRODUCT_NAME = 'PeaLuna' as const;
export const PRODUCT_TAGLINE = 'Premium wig repair & care' as const;
