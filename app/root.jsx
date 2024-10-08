import {useNonce} from '@shopify/hydrogen';
import {defer} from '@shopify/remix-oxygen';
import {Script} from '@shopify/hydrogen';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  LiveReload,
  useMatches,
  useRouteError,
  useLoaderData,
  ScrollRestoration,
  isRouteErrorResponse,
} from '@remix-run/react';
// import favicon from './assets/favicon.svg';
import vclogo from './assets/vc_logo.png';
import resetStyles from './styles/reset.css';
import appStyles from './styles/app.css';
import {Layout} from '~/components/Layout';

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 * @type {ShouldRevalidateFunction}
 */
export const shouldRevalidate = ({formMethod, currentUrl, nextUrl}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') {
    return true;
  }

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) {
    return true;
  }

  return false;
};

export function links() {
  return [
    {rel: 'stylesheet', href: resetStyles},
    {rel: 'stylesheet', href: appStyles},
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/png', href: vclogo},
  ];
}

/**
 * Access the result of the root loader from a React component.
 * @return {LoaderReturnData}
 */
export const useRootLoaderData = () => {
  const [root] = useMatches();
  return root?.data;
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context, request}) {
  const {storefront, cart, session} = context;

  const publicStoreDomain = context.env.PUBLIC_STORE_DOMAIN;

  function isLoggedIn() {
    if (session.get('customerAccessToken')) return true;
    else return false;
  }
  const isLoggedInPromise = isLoggedIn();

  const cartPromise = cart.get();

  // defer the footer query (below the fold)
  const footerPromise = storefront.query(FOOTER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      footerMenuHandle: 'footer-hydro', // Adjust to your footer menu handle
    },
  });

  const footerSupportPromise = storefront.query(FOOTER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      footerMenuHandle: 'support-menu', // Adjust to your footer menu handle
    },
  });

  const mobileMenuPromise = storefront.query(FOOTER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      footerMenuHandle: 'mobile-menu-2', // Adjust to your footer menu handle
    },
  });

  const footerImage = storefront.query(FOOTER_IMAGE_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      type: 'footer_image', // Adjust to your footer menu handle
    },
  });

  // await the header query (above the fold)
  const headerPromise = storefront.query(HEADER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      headerMenuHandle: 'main-menu-hydro', // Adjust to your header menu handle
    },
  });

  const userAgent = request.headers.get('User-Agent');

  // Basic check for mobile devices (can be extended)
  const isMobileRoot = /Mobile|Android|iP(hone|od)/i.test(userAgent);

  return defer(
    {
      cart: cartPromise,
      footer: await footerPromise,
      supportMenu: await footerSupportPromise,
      mobileMenu: await mobileMenuPromise,
      footerImage,
      header: await headerPromise,
      isLoggedIn: isLoggedInPromise,
      publicStoreDomain,
      isMobileRoot,
    },
    {
      headers: {
        'Set-Cookie': await context.session.commit(),
      },
    },
  );
}

export default function App() {
  const nonce = useNonce();
  /** @type {LoaderReturnData} */
  const data = useLoaderData();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* <meta property="og:title" content="Veneda Carter" /> */}
        {/* <meta property="og:description" content="Veneda Carter" /> */}
        <Meta />
        <Links />
      </head>
      <body>
        <Layout {...data}>
          <Outlet />
        </Layout>
        <Script
          async
          type="text/javascript"
          src="//static.klaviyo.com/onsite/js/klaviyo.js?company_id=WzY7Xy"
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const rootData = useRootLoaderData();
  const nonce = useNonce();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout {...rootData}>
          <div className="route-error">
            <p>{errorStatus}</p>
            {errorMessage && (
              <fieldset>
                <pre>
                  <p>The page you are looking for has been moved or renamed.</p>
                  <span>Return </span>
                  <a href="/">home.</a>
                </pre>
              </fieldset>
            )}
          </div>
        </Layout>
        <Script
          async
          type="text/javascript"
          src="//static.klaviyo.com/onsite/js/klaviyo.js?company_id=WzY7Xy"
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}

const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
`;

const HEADER_QUERY = `#graphql
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
        image {
          url
        }
      }
    }
  }
  query Header(
    $country: CountryCode
    $headerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      ...Shop
    }
    menu(handle: $headerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
`;

const FOOTER_QUERY = `#graphql
  query Footer(
    $country: CountryCode
    $footerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
`;

const FOOTER_IMAGE_QUERY = `#graphql
query getMetafields($type: String!) {
  metaobjects(first: 10, type: $type) {
    edges {
      node {
        id
        handle
        fields {
          reference {
            ... on MediaImage {
              image {
                url
              }
            }
          }
          value
          key
        }
      }
    }
  }
}
`;
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@remix-run/react').ShouldRevalidateFunction} ShouldRevalidateFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
