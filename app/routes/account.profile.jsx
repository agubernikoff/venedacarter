import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {redirect, json} from '@shopify/remix-oxygen';
import {
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from '@remix-run/react';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Profile'}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  if (!context.session.get('customerAccessToken'))
    return redirect('account/login');
  // await context.customerAccount.handleAuthStatus();
  else
    return json(
      {},
      {
        headers: {
          'Set-Cookie': await context.session.commit(),
        },
      },
    );
}

/**
 * @param {ActionFunctionArgs}
 */
export async function action({request, context}) {
  const {storefront} = context;
  const token = context.session.get('customerAccessToken');

  if (request.method !== 'PUT') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();
  try {
    const customer = {};
    const validInputKeys = ['firstName', 'lastName', 'email', 'password'];
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key)) {
        continue;
      }
      if (typeof value === 'string' && value.length) {
        customer[key] = value;
      }
    }

    // update customer and possibly password
    const {customerUpdate, errors} = await storefront.mutate(
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customerAccessToken: token,
          customer,
        },
      },
    );

    if (errors?.length || customerUpdate?.customerUserErrors?.length) {
      throw new Error(
        errors[0].message || customerUpdate?.customerUserErrors[0].message,
      );
    }

    if (!customerUpdate?.customer) {
      throw new Error('Customer profile update failed.');
    }

    if (customerUpdate.customerAccessToken?.accessToken) {
      await context.session.set(
        'customerAccessToken',
        customerUpdate?.customerAccessToken?.accessToken,
      );
    }

    return json(
      {
        error: null,
        customer: customerUpdate?.customer,
      },
      {
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
  const customer = action?.customer ?? account?.customer;
  const {formMethod} = useNavigation();
  const stateForMethod = (method) => (formMethod === method ? state : 'idle');

  return (
    <div className="account-profile">
      <Form method="PUT">
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
            defaultValue={customer.firstName ?? ''}
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
            defaultValue={customer.lastName ?? ''}
            minLength={2}
          />
          <input
            className="profile-input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            aria-label="Email"
            defaultValue={customer.email ?? ''}
            minLength={2}
          />
          <input
            className="profile-input"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="New Password"
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
          {stateForMethod('PUT') !== 'idle' ? 'SAVING' : 'SAVE CHANGES'}
        </button>
      </Form>
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
