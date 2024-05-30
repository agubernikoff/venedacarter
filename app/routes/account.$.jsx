import {redirect} from '@shopify/remix-oxygen';

// fallback wild card for all unauthenticated routes in account section
/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context, request}) {
  if (!context.session.get('customerAccessToken')) {
    if (!request.url.includes('/account/reset')) {
      return redirect('/account/login', {
        headers: {
          'Set-Cookie': await context.session.commit(),
        },
      });
    } else {
      const path = request.url.split('.com')[1];
      return redirect(path);
    }
  }
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
