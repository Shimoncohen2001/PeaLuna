import { geoAutocompleteQuerySchema, geoReverseQuerySchema, successResponse } from '@velure/contracts';
import type { AppInstance } from '../../types/app.js';
import type { Env } from '../../config/env.js';
import { API_PREFIX } from '../../config/constants.js';
import { requireUser } from '../../lib/access.js';
import { reverseAddress, searchAddresses } from './nominatim.js';

export async function geoRoutes(app: AppInstance, env: Env): Promise<void> {
  app.get(
    `${API_PREFIX}/geo/autocomplete`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: geoAutocompleteQuerySchema },
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      requireUser(request);
      const items = await searchAddresses(env, request.query.q);
      return reply.send(successResponse(items, request.requestId));
    },
  );

  app.get(
    `${API_PREFIX}/geo/reverse`,
    {
      preHandler: [app.authenticate],
      schema: { querystring: geoReverseQuerySchema },
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      requireUser(request);
      const item = await reverseAddress(env, request.query.lat, request.query.lon);
      return reply.send(successResponse(item, request.requestId));
    },
  );
}
