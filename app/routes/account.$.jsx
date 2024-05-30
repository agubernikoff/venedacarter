import {redirect} from '@shopify/remix-oxygen';

// fallback wild card for all unauthenticated routes in account section
/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context, request}) {
  if (!context.session.get('customerAccessToken')) {
    if (!request.url.includes('/account/reset')) {
      // Redirect to login page if not already on reset page
      return redirect('/account/login', {
        headers: {
          'Set-Cookie': await context.session.commit(),
        },
      });
    } else {
      // Extract path and query parameters from the request URL
      const url = new URL(request.url);
      const path = url.pathname; // Extract path
      const params = url.search; // Extract query parameters

      // Redirect to the original URL with preserved path and query parameters
      return redirect(`${path}${params}`);
    }
  }
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
