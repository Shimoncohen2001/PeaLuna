import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  const apiUrl = (process.env.API_URL ?? '').trim().replace(/\/$/, '');
  if (!apiUrl) {
    return Response.json(
      { error: { code: 'API_URL_MISSING', message: 'API_URL is not set on the web service' } },
      { status: 502 },
    );
  }

  const rawParams = await Promise.resolve(context.params);
  const dest = `${apiUrl}/api/${rawParams.path.join('/')}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const authorization = request.headers.get('authorization');
  if (authorization) headers.set('authorization', authorization);
  headers.set('x-request-id', request.headers.get('x-request-id') ?? crypto.randomUUID());

  try {
    const body =
      request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();

    const upstream = await fetch(dest, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    });

    const out = new Headers();
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'transfer-encoding' || lower === 'content-encoding') return;
      out.append(key, value);
    });

    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: out,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'API unreachable';
    console.error('API proxy failed', { dest, message });
    return Response.json(
      { error: { code: 'API_UNREACHABLE', message: `${message} (${dest})` } },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
