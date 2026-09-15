import type { GeoSuggestionDto } from '@velure/contracts';
import type { Env } from '../../config/env.js';
import { getRedis } from '../../infrastructure/redis.js';

export type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    postcode?: string;
    country_code?: string;
  };
};

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const CACHE_TTL_SECONDS = 60 * 60 * 24;
let lastNominatimAt = 0;
let nominatimChain: Promise<unknown> = Promise.resolve();

export function mapNominatimHit(hit: NominatimHit): GeoSuggestionDto | null {
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const address = hit.address ?? {};
  return {
    label: hit.display_name,
    lat,
    lng,
    city: address.city || address.town || address.village || address.suburb || null,
    postalCode: address.postcode ?? null,
    countryCode: address.country_code ? address.country_code.toUpperCase() : null,
  };
}

function userAgent(env: Env) {
  return `PeaLuna/1.0 (${env.WEB_ORIGIN}; geo@pealuna.com)`;
}

function cacheKey(kind: 'search' | 'reverse', value: string) {
  return `geo:${kind}:${value.toLowerCase()}`;
}

async function readCache(env: Env, key: string): Promise<string | null> {
  try {
    return await getRedis(env).get(key);
  } catch {
    return null;
  }
}

async function writeCache(env: Env, key: string, value: string) {
  try {
    await getRedis(env).set(key, value, 'EX', CACHE_TTL_SECONDS);
  } catch {
    // Cache is optional — Nominatim still works without Redis.
  }
}

async function throttleNominatim<T>(run: () => Promise<T>): Promise<T> {
  const job = nominatimChain.then(async () => {
    const wait = 1100 - (Date.now() - lastNominatimAt);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    try {
      return await run();
    } finally {
      lastNominatimAt = Date.now();
    }
  });
  nominatimChain = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

async function nominatimGet<T>(env: Env, path: string): Promise<T> {
  return throttleNominatim(async () => {
    const response = await fetch(`${NOMINATIM_BASE}${path}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': userAgent(env),
      },
    });
    if (!response.ok) {
      throw Object.assign(new Error('Address lookup is temporarily unavailable'), {
        statusCode: 502,
        code: 'GEO_UPSTREAM',
      });
    }
    return (await response.json()) as T;
  });
}

export async function searchAddresses(env: Env, query: string): Promise<GeoSuggestionDto[]> {
  const q = query.trim();
  const key = cacheKey('search', q);
  const cached = await readCache(env, key);
  if (cached) {
    return JSON.parse(cached) as GeoSuggestionDto[];
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'il',
    limit: '6',
    q,
  });
  const hits = await nominatimGet<NominatimHit[]>(env, `/search?${params}`);
  const items = hits.map(mapNominatimHit).filter((row): row is GeoSuggestionDto => row != null);
  await writeCache(env, key, JSON.stringify(items));
  return items;
}

export async function reverseAddress(
  env: Env,
  lat: number,
  lon: number,
): Promise<GeoSuggestionDto | null> {
  const key = cacheKey('reverse', `${lat.toFixed(5)},${lon.toFixed(5)}`);
  const cached = await readCache(env, key);
  if (cached) {
    return JSON.parse(cached) as GeoSuggestionDto | null;
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '18',
    lat: String(lat),
    lon: String(lon),
  });
  const hit = await nominatimGet<NominatimHit>(env, `/reverse?${params}`);
  const item = mapNominatimHit(hit);
  await writeCache(env, key, JSON.stringify(item));
  return item;
}
