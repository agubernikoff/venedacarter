import {redirect, json} from '@shopify/remix-oxygen';
import {Form, NavLink, Outlet, useLoaderData} from '@remix-run/react';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

export function shouldRevalidate() {
  return true;
}

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context, request}) {
  if (context.session.get('customerAccessToken')) {
    const token = context.session.get('customerAccessToken');

    const {customer} = await context.storefront.query(CUSTOMER_DETAILS_QUERY, {
      variables: {cutomerAccessToken: token},
    });

    return json(
      {customer},
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Set-Cookie': await context.session.commit(),
        },
      },
    );
  } else if (request.url.includes('/account/reset')) return json({});
  else return redirect('/account/login');
}

export default function AccountLayout() {
  /** @type {LoaderReturnData} */
  const {customer} = useLoaderData();

  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}`
      : `ACCOUNT`
    : 'Account Details';

  return (
    <div className="account">
      <p className="stockists-title">ACCOUNT</p>
      {/* <p className="stockists-title">{heading}</p> */}
      <br />
      <AccountMenu />
      <br />
      <br />
      <Outlet context={{customer}} />
    </div>
  );
}

function AccountMenu() {
  function isActiveStyle({isActive, isPending}) {
    return {
      textDecoration: isActive ? 'underline' : undefined,
      color: isPending ? 'grey' : 'black',
    };
  }

  return (
    <nav role="navigation">
      <div className="account-nav">
        <NavLink to="/account/profile" style={isActiveStyle}>
          Account Details
        </NavLink>
        <NavLink to="/account/addresses" style={isActiveStyle}>
          Addresses
        </NavLink>
        <NavLink to="/account/orders" style={isActiveStyle}>
          Orders
        </NavLink>
        <Logout />
      </div>
    </nav>
  );
}

function Logout() {
  return (
    <Form className="account-logout" method="POST" action="/account/logout">
      <button className="account-logout-button" type="submit">
        Log out
      </button>
    </Form>
  );
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
