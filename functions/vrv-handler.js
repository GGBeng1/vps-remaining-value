import { decodeBase64Params } from './decode-params.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/^\/vrv([A-Za-z0-9_-]+)$/);

  if (!pathMatch?.[1]) {
    return new Response('Not Found', { status: 404 });
  }

  const params = decodeBase64Params(pathMatch[1]);
  if (!params.ed) {
    return new Response('Invalid share link', { status: 400 });
  }

  const qs = new URLSearchParams(params).toString();
  return Response.redirect(new URL(`/?${qs}`, request.url).href, 302);
}
