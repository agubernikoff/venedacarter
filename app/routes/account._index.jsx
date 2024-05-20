import {redirect} from '@shopify/remix-oxygen';

export async function loader() {
  return redirect('/account/profile');
}

/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
