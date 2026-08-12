import { onRequest as handleSvg } from './svg-handler.js';
import { onRequest as handleVrv } from './vrv-handler.js';

export async function onRequest(context) {
  const pathname = new URL(context.request.url).pathname;

  if (/^\/svg[A-Za-z0-9_-]+$/.test(pathname)) {
    return handleSvg(context);
  }

  if (/^\/vrv[A-Za-z0-9_-]+$/.test(pathname)) {
    return handleVrv(context);
  }

  return new Response('Not Found', { status: 404 });
}
