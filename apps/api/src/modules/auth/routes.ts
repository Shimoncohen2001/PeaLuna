import {

  buildRefreshCookie,

  clearRefreshCookie,

  REFRESH_COOKIE_NAME,

} from '@velure/auth';

import {

  loginSchema,

  refreshBodySchema,

  registerSchema,

  successResponse,

  verifyEmailSchema,

} from '@velure/contracts';

import type { AppInstance } from '../../types/app.js';

import type { Env } from '../../config/env.js';

import { API_PREFIX } from '../../config/constants.js';

import { AuthService } from './auth.service.js';

import { PrivacyService } from './privacy.service.js';



function cookieOptions(env: Env) {

  return {

    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',

    domain: env.COOKIE_DOMAIN,

    sameSite: 'lax' as const,

  };

}



function publicSession(result: {

  accessToken: string;

  expiresIn: number;

  user: {

    id: string;

    email: string;

    firstName: string;

    lastName: string;

    roles: string[];

  };

  emailVerified?: boolean;

  verificationToken?: string;

}) {

  return {

    accessToken: result.accessToken,

    expiresIn: result.expiresIn,

    user: result.user,

    emailVerified: result.emailVerified,

    ...(result.verificationToken ? { verificationToken: result.verificationToken } : {}),

  };

}



export async function authRoutes(app: AppInstance, env: Env): Promise<void> {

  const authService = new AuthService(env);



  app.post(

    `${API_PREFIX}/auth/register`,

    {

      schema: {

        body: registerSchema,

      },

    },

    async (request, reply) => {

      const result = await authService.register({

        ...request.body,

        userAgent: request.headers['user-agent'],

        ipAddress: request.ip,

      });



      reply.header('Set-Cookie', buildRefreshCookie(result.refreshToken, cookieOptions(env)));



      return reply.status(201).send(successResponse(publicSession(result), request.requestId));

    },

  );



  app.post(

    `${API_PREFIX}/auth/login`,

    {

      schema: {

        body: loginSchema,

      },

    },

    async (request, reply) => {

      const result = await authService.login({

        ...request.body,

        userAgent: request.headers['user-agent'],

        ipAddress: request.ip,

      });



      reply.header('Set-Cookie', buildRefreshCookie(result.refreshToken, cookieOptions(env)));



      return reply.send(successResponse(publicSession(result), request.requestId));

    },

  );



  app.post(

    `${API_PREFIX}/auth/refresh`,

    {

      schema: {

        body: refreshBodySchema,

      },

    },

    async (request, reply) => {

      const refreshToken =

        request.body.refreshToken ?? request.cookies[REFRESH_COOKIE_NAME];



      if (!refreshToken) {

        throw app.httpErrors.unauthorized('Refresh token missing');

      }



      const result = await authService.refresh({

        refreshToken,

        userAgent: request.headers['user-agent'],

        ipAddress: request.ip,

      });



      reply.header('Set-Cookie', buildRefreshCookie(result.refreshToken, cookieOptions(env)));



      return reply.send(successResponse(publicSession(result), request.requestId));

    },

  );



  app.post(`${API_PREFIX}/auth/logout`, {}, async (request, reply) => {

    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

    await authService.logout(refreshToken);

    reply.header('Set-Cookie', clearRefreshCookie(cookieOptions(env)));

    return reply.send(successResponse({ loggedOut: true }, request.requestId));

  });



  app.get(

    `${API_PREFIX}/auth/me`,

    { preHandler: [app.authenticate] },

    async (request, reply) => {

      const claims = request.user!;

      return reply.send(

        successResponse(

          {

            id: claims.sub,

            email: claims.email,

            roles: claims.roles,

            homeRegion: claims.homeRegion,

          },

          request.requestId,

        ),

      );

    },

  );

  app.post(

    `${API_PREFIX}/auth/verify-email`,

    {

      schema: {

        body: verifyEmailSchema,

      },

    },

    async (request, reply) => {

      const result = await authService.verifyEmail(request.body.token);

      return reply.send(successResponse(result, request.requestId));

    },

  );

  app.post(

    `${API_PREFIX}/auth/resend-verification`,

    { preHandler: [app.authenticate] },

    async (request, reply) => {

      const result = await authService.resendVerification(request.user!.sub);

      return reply.send(successResponse(result, request.requestId));

    },

  );

  app.get(

    `${API_PREFIX}/auth/export`,

    { preHandler: [app.authenticate] },

    async (request, reply) => {

      const privacy = new PrivacyService();

      const result = await privacy.exportForUser(request.user!.sub);

      return reply.send(successResponse(result, request.requestId));

    },

  );

  app.post(

    `${API_PREFIX}/auth/delete-account`,

    { preHandler: [app.authenticate] },

    async (request, reply) => {

      const privacy = new PrivacyService();

      const result = await privacy.deleteAccount(request.user!.sub);

      reply.header('Set-Cookie', clearRefreshCookie(cookieOptions(env)));

      return reply.send(successResponse(result, request.requestId));

    },

  );

}

