import {redirect, json} from '@shopify/remix-oxygen';
import {
  Form,
  NavLink,
  useActionData,
  useNavigate,
  useNavigation,
  useOutletContext,
} from '@remix-run/react';
import {CUSTOMER_RESET_MUTATION} from '../graphql/customer-account/CustomerResetByUrl';
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
export async function action({request, context, params}) {
  const {storefront} = context;
  const customerId = `gid://shopify/Customer/${params.customerId}`;
  const resetToken = params.resetToken;

  if (!customerId || !resetToken) return redirect('/account/login');

  if (request.method !== 'POST') {
    // Changed method to POST
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();
  const password = form.get('password');

  if (!password) {
    return json({error: 'Password is required'}, {status: 400});
  }

  try {
    const response = await storefront.mutate(CUSTOMER_RESET_MUTATION, {
      variables: {id: customerId, input: {password, resetToken}},
    });

    const errors = response?.customerReset?.customerUserErrors;
    if (errors.length > 0) {
      throw new Error(errors[0].message);
    }

    if (response?.customerReset?.customerAccessToken?.accessToken) {
      await context.session.set(
        'customerAccessToken',
        response?.customerReset?.customerAccessToken?.accessToken,
      );

      return json(
        {success: true},
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
          error: response?.customerReset?.customerUserErrors[0]?.message,
        },
        {
          status: 404,
          headers: {
            'Set-Cookie': await context.session.commit(),
          },
        },
      );
  } catch (error) {
    return json({error: error.message}, {status: 400});
  }
}

export default function RecoverAccount() {
  const {state} = useNavigation();
  const action = useActionData();

  return (
    <div className="account-login">
      <p className="stockists-title">RESET PASSWORD</p>
      <div className="account-profile">
        <div className="account-profile">
          <Form method="POST">
            {' '}
            {/* Changed method to POST */}
            <fieldset className="profile-fieldset">
              <p
                style={{
                  textAlign: 'left',
                  fontSize: '.75rem',
                  marginBottom: '.75rem',
                }}
              >
                Please enter a new password.
              </p>
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
