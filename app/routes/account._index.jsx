import {redirect} from '@shopify/remix-oxygen';

export async function loader({context}) {
  const currentURL = context.req.url;

  if (!currentURL.includes('/account/reset')) {
    if (context.session.get('customerAccessToken'))
      return redirect('/account/profile');
    else return redirect('/account/login');
  } else {
    return json({});
  }
}

/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
