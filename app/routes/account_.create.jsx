import {redirect, json} from '@shopify/remix-oxygen';
import {
  Form,
  Link,
  NavLink,
  useActionData,
  useNavigate,
  useNavigation,
  useOutletContext,
} from '@remix-run/react';
import {CUSTOMER_CREATE_MUTATION} from '../graphql/customer-account/CustomerCreate';
import {CUSTOMER_LOGIN_MUTATION} from '../graphql/customer-account/CustomerLogin';
import {useEffect} from 'react';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Sign Up'}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  if (context.session.get('customerAccessToken'))
    return redirect('/account/profile');
  return null;
}

/**
 * @param {ActionFunctionArgs}
 */
export async function action({request, context}) {
  const {storefront} = context;
  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();

  try {
    const input = {};
    const validInputKeys = ['firstName', 'lastName', 'email', 'password'];
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key)) {
        continue;
      }
      if (typeof value === 'string' && value.length) {
        input[key] = value;
      }
    }

    const {customerCreate} = await storefront.mutate(CUSTOMER_CREATE_MUTATION, {
      cache: storefront.CacheNone(),
      variables: {
        input,
      },
    });
    const {customerAccessTokenCreate} = await storefront.mutate(
      CUSTOMER_LOGIN_MUTATION,
      {
        cache: storefront.CacheNone(),
        variables: {input: {email: input.email, password: input.password}},
      },
    );

    if (
      customerCreate?.customerUserErrors?.length ||
      customerAccessTokenCreate?.customerUserErrors?.length
    ) {
      throw new Error(
        customerCreate?.customerUserErrors[0]?.message ||
          customerAccessTokenCreate?.customerUserErrors[0]?.message,
      );
    }
    // return json({1: customerCreate, 2: customerAccessTokenCreate});
    if (
      customerCreate?.customer?.id &&
      customerAccessTokenCreate?.customerAccessToken?.accessToken
    ) {
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
          },
        },
      );
    } else
      return json(
        {
          error:
            customerCreate?.customerUserErrors[0].message ||
            customerAccessTokenCreate?.customerUserErrors[0].message,
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
  const navigate = useNavigate();

  useEffect(() => {
    if (action && action.created) navigate('/account/profile');
  }, [action, navigate]);
  return (
    <div className="account-login">
      <p className="stockists-title">CREATE AN ACCOUNT</p>
      <div className="account-profile">
        <Form method="POST">
          <fieldset className="profile-fieldset">
            {/* <label htmlFor="firstName">First name</label> */}
            <input
              className="profile-input"
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              aria-label="First name"
              minLength={2}
            />
            {/* <label htmlFor="lastName">Last name</label> */}
            <input
              className="profile-input"
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Last name"
              aria-label="Last name"
              minLength={2}
            />
            {/* <label htmlFor="firstName">First name</label> */}
            <input
              className="profile-input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
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
              minLength={2}
            />
          </fieldset>
          {action?.error ? (
            <p>
              <mark>
                {action.error === 'Email has already been taken' ? (
                  <small>
                    An account already exists for this email address. Please{' '}
                    <Link
                      style={{color: 'red', textDecoration: 'underline'}}
                      to={'/account/login'}
                    >
                      log in
                    </Link>{' '}
                    or{' '}
                    <Link style={{color: 'red', textDecoration: 'underline'}}>
                      reset your password.
                    </Link>
                  </small>
                ) : (
                  <small style={{lineHeight: '1'}}>{action.error}</small>
                )}
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
            {state !== 'idle' ? 'LOADING' : 'REGISTER'}
          </button>
        </Form>
        <div className="login-links">
          <a prefetch="intent" href="/account/recover">
            Forgot Password?
          </a>
          {/* <NavLink prefetch="intent" to="/account/create">
            Create an Account
          </NavLink> */}
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
