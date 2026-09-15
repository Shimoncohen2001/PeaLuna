import { z } from 'zod';

export const geoAutocompleteQuerySchema = z.object({
  q: z.string().trim().min(2).max(200),
});

export const geoReverseQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export const geoSuggestionSchema = z.object({
  label: z.string(),
  lat: z.number(),
  lng: z.number(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string().nullable(),
});

export type GeoSuggestionDto = z.infer<typeof geoSuggestionSchema>;
