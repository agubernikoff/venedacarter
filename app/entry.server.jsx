import {RemixServer} from '@remix-run/react';
import isbot from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

/**
 * @param {Request} request
 * @param {number} responseStatusCode
 * @param {Headers} responseHeaders
 * @param {EntryContext} remixContext
 */
export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    connectSrc: [
      // (ie. 'wss://<your-ngrok-domain>.app:*')
      'wss://engaged-orca-warm.ngrok-free.app:*',
      'https://engaged-orca-warm.ngrok-free.app:*',
      'http://127.0.0.1:4040',
      'wss://kitten-composed-notably.ngrok-free.app:*',
      'https://kitten-composed-notably.ngrok-free.app:*',
      'https://klaviyo.com',
      'https://*.klaviyo.com',
      'https://*.klaviyo.com/*',
    ],
    styleSrc: [
      'https://klaviyo.com',
      'https://*.klaviyo.com',
      'https://fonts.googleapis.com',
    ],
    scriptSrc: [
      'https://klaviyo.com',
      'https://*.klaviyo.com',
      'https://cdn.shopify.com',
      'http://localhost:3100',
      'https://*.klaviyo.com/*',
    ],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/** @typedef {import('@shopify/remix-oxygen').EntryContext} EntryContext */
