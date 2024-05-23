import {redirect} from '@shopify/remix-oxygen';

export async function loader({context}) {
  if (context.session.get('customerAccessToken'))
    return redirect('/account/profile');
  else return redirect('/account/login');
}

/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
