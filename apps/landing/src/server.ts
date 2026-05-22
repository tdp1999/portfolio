import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { Readable } from 'node:stream';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

// `/experience` was retired into `/about#experience`. 301 keeps the SEO equity
// and lets bookmarks land on the right anchor; the fragment is preserved by
// the browser when it follows the redirect.
app.get('/experience', (_req, res) => {
  res.redirect(301, '/about#experience');
});

/**
 * Reverse-proxy `/api/*` to the API service.
 *
 * Why: the browser sees the landing app and the API on the SAME origin
 * (`https://<DOMAIN>/api/*`). Without this proxy, that request hits the
 * landing Express server and falls through to the Angular SSR catch-all,
 * which returns 302 → /404. SSR-side `globalThis.fetch` rewrite (in
 * `main.server.ts`) only fixes the SERVER side; the browser has no
 * `API_URL` env var.
 *
 * Keeping browser & SSR both calling `/api/...` means the HTTP transfer
 * cache key matches on both sides — hydration uses the cache, no refetch,
 * no flash.
 */
const apiBase = (process.env['API_URL'] || 'http://localhost:3000').replace(/\/$/, '');

app.use('/api', async (req, res) => {
  const targetUrl = `${apiBase}${req.originalUrl}`;
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      // Strip hop-by-hop / host headers — let undici/fetch set them fresh.
      if (['host', 'connection', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) continue;
      if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
      else headers.set(key, value);
    }

    const hasBody = !['GET', 'HEAD'].includes(req.method.toUpperCase());
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
      // Required by undici when streaming a request body
      ...(hasBody ? { duplex: 'half' } : {}),
      redirect: 'manual',
      // Cap upstream wait so an unresponsive API doesn't hold sockets open
      // until Cloudflare's ~100s proxy timeout fires.
      signal: AbortSignal.timeout(15_000),
    } as RequestInit);

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      // Skip hop-by-hop headers Express/Node will manage
      if (['transfer-encoding', 'connection'].includes(key.toLowerCase())) return;
      res.setHeader(key, value);
    });
    if (upstream.body) Readable.fromWeb(upstream.body as never).pipe(res);
    else res.end();
  } catch (err) {
    console.error('[api-proxy]', req.method, targetUrl, err);
    res.status(502).json({ error: 'Bad Gateway', detail: String(err) });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
