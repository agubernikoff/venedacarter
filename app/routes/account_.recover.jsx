import {redirect, json} from '@shopify/remix-oxygen';
import {
  Form,
  NavLink,
  useActionData,
  useNavigate,
  useNavigation,
  useOutletContext,
} from '@remix-run/react';
import {CUSTOMER_RECOVER_BY_URL_MUTATION} from '../graphql/customer-account/CustomerResetByUrl';
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
    const response = await storefront.mutate(CUSTOMER_RECOVER_BY_URL_MUTATION, {
      variables: {email},
    });

    const errors = response?.customerRecover?.customerUserErrors;
    if (errors?.length > 0) {
      throw new Error(errors[0]?.message);
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
      <p className="stockists-title">FORGOT PASSWORD</p>
      <div className="account-profile">
        <Form method="POST">
          {/* Changed method to POST */}
          <fieldset className="profile-fieldset">
            <p
              style={{
                textAlign: 'left',
                fontSize: '.75rem',
                marginBottom: '.75rem',
              }}
            >
              {action?.success
                ? 'Thank you. An email has been sent containing your reset password link.'
                : "Please enter your login email and we'll email you a link to reset your password."}
            </p>
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
            {state !== 'idle' ? 'SUBMIT' : 'SUBMIT'}
          </button>
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
