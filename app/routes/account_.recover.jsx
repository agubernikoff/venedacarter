import {redirect, json} from '@shopify/remix-oxygen';
import {
  Form,
  NavLink,
  useActionData,
  useNavigate,
  useNavigation,
  useOutletContext,
} from '@remix-run/react';
import {CUSTOMER_RESET_BY_URL_MUTATION} from '../graphql/customer-account/CustomerResetByUrl';
import {useEffect} from 'react';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Reset Account'}];
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

  if (request.method !== 'POST') {
    // Changed method to POST
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();
  const email = form.get('email');

  if (!email) {
    return json({error: 'Email is required'}, {status: 400});
  }

  try {
    const response = await storefront.mutate(CUSTOMER_RESET_BY_URL_MUTATION, {
      variables: {email},
    });

    const errors = response.customerRecover.customerUserErrors;
    if (errors.length > 0) {
      throw new Error(errors[0].message);
    }

    return json({success: true}, {status: 200});
  } catch (error) {
    return json({error: error.message}, {status: 400});
  }
}

export default function RecoverAccount() {
  const {state} = useNavigation();
  const action = useActionData();

  return (
    <div className="account-login">
      <p className="stockists-title">RESET ACCOUNT</p>
      <div className="account-profile">
        <Form method="POST">
          {' '}
          {/* Changed method to POST */}
          <fieldset className="profile-fieldset">
            <input
              className="profile-input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
              minLength={2}
              required
            />
          </fieldset>
          {action?.error ? (
            <p>
              <mark>
                <small>{action.error}</small>
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
            {state !== 'idle' ? 'SUBMITTING' : 'SUBMIT'}
          </button>
          {action?.success && (
            <p>
              <small>Check your email for a reset link</small>
            </p>
          )}
        </Form>
        <div className="login-links">
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
 *   success: boolean | null;
 * }} ActionResponse
 */