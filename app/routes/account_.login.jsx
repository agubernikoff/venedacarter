import {redirect, json} from '@shopify/remix-oxygen';
import {
  Form,
  NavLink,
  useActionData,
  useNavigate,
  useNavigation,
  useOutletContext,
} from '@remix-run/react';
import {CUSTOMER_LOGIN_MUTATION} from '../graphql/customer-account/CustomerLogin';
import {useEffect} from 'react';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Log In'}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  if (context.session.get('customerAccessToken'))
    return redirect('/account/profile');
  return json({});
}

/**
 * @param {ActionFunctionArgs}
 */
export async function action({request, context}) {
  const {storefront} = context;

  if (request.method !== 'PUT') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();

  try {
    const input = {};
    const validInputKeys = ['email', 'password'];
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key)) {
        continue;
      }
      if (typeof value === 'string' && value.length) {
        input[key] = value;
      }
    }
    // update customer and possibly password
    const {customerAccessTokenCreate} = await storefront.mutate(
      CUSTOMER_LOGIN_MUTATION,
      {
        cache: storefront.CacheNone(),
        variables: {input: {email: input.email, password: input.password}},
      },
    );

    if (customerAccessTokenCreate?.customerUserErrors.length) {
      throw new Error(customerAccessTokenCreate?.customerUserErrors[0].message);
    }

    if (customerAccessTokenCreate?.customerAccessToken?.accessToken) {
      await context.session.set(
        'customerAccessToken',
        customerAccessTokenCreate?.customerAccessToken?.accessToken,
      );

      return json(
        {created: true},
        {
          status: 200,
          headers: {
            'Set-Cookie': await context.session.commit(),
            Location: '/account/profile',
          },
        },
      );
    } else
      return json(
        {
          error: customerAccessTokenCreate?.customerUserErrors[0].message,
        },
        {
          status: 404,
          headers: {
            'Set-Cookie': await context.session.commit(),
          },
        },
      );
  } catch (error) {
    return json(
      {error: error.message, customer: null},
      {
        status: 400,
        headers: {
          'Set-Cookie': await context.session.commit(),
        },
      },
    );
  }
}

export default function AccountProfile() {
  const account = useOutletContext();
  const {state} = useNavigation();
  /** @type {ActionReturnData} */
  const action = useActionData();

  return (
    <div className="account-login">
      <p className="stockists-title">LOG IN</p>
      <div className="account-profile">
        <Form method="PUT">
          <fieldset className="profile-fieldset">
            {/* <label htmlFor="firstName">First name</label> */}
            <input
              className="profile-input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
              // defaultValue={customer.lastName ?? ''}
              minLength={2}
            />
            {/* <label htmlFor="lastName">Last name</label> */}
            <input
              className="profile-input"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              aria-label="Password"
              // defaultValue={customer.firstName ?? ''}
              minLength={2}
            />
          </fieldset>
          {action?.error ? (
            <p>
              <mark>
                <small>
                  {action.error === 'Unidentified customer'
                    ? 'Login unsuccessful. Please check the username and password. If the error persists, please contact our support.'
                    : action.error}
                </small>
              </mark>
            </p>
          ) : (
            <br />
          )}
          <button
            className="profile-button"
            type="submit"
            disabled={state !== 'idle'}
          >
            {state !== 'idle' ? 'LOGGING IN' : 'CONTINUE'}
          </button>
        </Form>
        <div className="login-links">
          <a href="/account/recover">Forgot Password?</a>
          <NavLink prefetch="intent" to="/account/create">
            Create an Account
          </NavLink>
        </div>
      </div>
    </div>
  );
}

/**
 * @typedef {{
 *   error: string | null;
 *   customer: CustomerFragment | null;
 * }} ActionResponse
 */

/** @typedef {import('customer-accountapi.generated').CustomerFragment} CustomerFragment */
/** @typedef {import('@shopify/hydrogen/customer-account-api-types').CustomerUpdateInput} CustomerUpdateInput */
/** @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof action>} ActionReturnData */
