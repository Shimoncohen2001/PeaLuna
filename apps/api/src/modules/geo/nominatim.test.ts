import { describe, expect, it } from 'vitest';
import { mapNominatimHit } from './nominatim.js';

describe('mapNominatimHit', () => {
  it('maps Israel address fields', () => {
    const mapped = mapNominatimHit({
      lat: '32.0853',
      lon: '34.7818',
      display_name: 'Rothschild Blvd, Tel Aviv, Israel',
      address: {
        city: 'Tel Aviv',
        postcode: '66881',
        country_code: 'il',
      },
    });
    expect(mapped).toEqual({
      label: 'Rothschild Blvd, Tel Aviv, Israel',
      lat: 32.0853,
      lng: 34.7818,
      city: 'Tel Aviv',
      postalCode: '66881',
      countryCode: 'IL',
    });
  });

  it('falls back to town or village', () => {
    const mapped = mapNominatimHit({
      lat: '31.7683',
      lon: '35.2137',
      display_name: 'A village',
      address: { village: 'Ein Kerem', country_code: 'il' },
    });
    expect(mapped?.city).toBe('Ein Kerem');
  });

  it('drops invalid coordinates', () => {
    expect(
      mapNominatimHit({
        lat: 'n/a',
        lon: '34.7',
        display_name: 'bad',
      }),
    ).toBeNull();
  });
});
