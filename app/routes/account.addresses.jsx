import {redirect, json} from '@shopify/remix-oxygen';
import {
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from '@remix-run/react';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';
import {useState, useEffect, useRef} from 'react';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Addresses'}];
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

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    // this will ensure redirecting to login never happen for mutatation

    if (!token) {
      return json(
        {error: {[addressId]: 'Unauthorized'}},
        {
          status: 401,
          headers: {
            'Set-Cookie': await context.session.commit(),
          },
        },
      );
    }

    const address = {};
    const keys = [
      'firstName',
      'lastName',
      'address1',
      'address2',
      'city',
      'province',
      'country',
      'zip',
      'phone',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    let defaultAddress;
    if (form.has('defaultAddress')) {
      defaultAddress = String(form.get('defaultAddress')) === 'on';
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const {customerAddressCreate, errors} = await storefront.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {address, customerAccessToken: token},
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (customerAddressCreate?.customerUserErrors?.length) {
            throw new Error(
              customerAddressCreate?.customerUserErrors[0].message,
            );
          }

          if (customerAddressCreate?.userErrors?.length) {
            throw new Error(customerAddressCreate?.userErrors[0].message);
          }

          if (!customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return json(
            {
              error: null,
              createdAddress: customerAddressCreate?.customerAddress,
            },
            {
              headers: {
                'Set-Cookie': await context.session.commit(),
              },
            },
          );
        } catch (error) {
          if (error instanceof Error) {
            return json(
              {error: {[addressId]: error.message}},
              {
                status: 400,
                headers: {
                  'Set-Cookie': await context.session.commit(),
                },
              },
            );
          }
          return json(
            {error: {[addressId]: error}},
            {
              status: 400,
              headers: {
                'Set-Cookie': await context.session.commit(),
              },
            },
          );
        }
      }

      case 'PUT': {
        // handle address updates

        try {
          const {customerAddressUpdate, errors} = await storefront.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                id: decodeURIComponent(addressId),
                customerAccessToken: token,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (customerAddressUpdate?.customerUserErrors?.length) {
            throw new Error(
              customerAddressUpdate?.customerUserErrors[0].message,
            );
          }

          if (customerAddressUpdate?.userErrors?.length) {
            throw new Error(customerAddressUpdate?.userErrors[0].message);
          }

          if (!customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return json(
            {
              error: null,
              updatedAddress: customerAddressUpdate,
            },
            {
              headers: {
                'Set-Cookie': await context.session.commit(),
              },
            },
          );
        } catch (error) {
          if (error instanceof Error) {
            return json(
              {error: {[addressId]: error.message}},
              {
                status: 400,
                headers: {
                  'Set-Cookie': await context.session.commit(),
                },
              },
            );
          }
          return json(
            {error: {[addressId]: error}},
            {
              status: 400,
              headers: {
                'Set-Cookie': await context.session.commit(),
              },
            },
          );
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const {customerAddressDelete, errors} = await storefront.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                id: decodeURIComponent(addressId),
                customerAccessToken: token,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (customerAddressDelete?.customerUserErrors?.length) {
            throw new Error(
              customerAddressDelete?.customerUserErrors[0].message,
            );
          }

          if (!customerAddressDelete?.deletedCustomerAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return json(
            {
              error: null,
              deletedAddress: customerAddressDelete?.deletedCustomerAddressId,
            },
            {
              headers: {
                'Set-Cookie': await context.session.commit(),
              },
            },
          );
        } catch (error) {
          if (error instanceof Error) {
            return json(
              {error: {[addressId]: error.message}},
              {
                status: 400,
                headers: {
                  'Set-Cookie': await context.session.commit(),
                },
              },
            );
          }
          return json(
            {error: {[addressId]: error}},
            {
              status: 400,
              headers: {
                'Set-Cookie': await context.session.commit(),
              },
            },
          );
        }
      }

      default: {
        return json(
          {error: {[addressId]: 'Method not allowed'}},
          {
            status: 405,
            headers: {
              'Set-Cookie': await context.session.commit(),
            },
          },
        );
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return json(
        {error: error.message},
        {
          status: 400,
          headers: {
            'Set-Cookie': await context.session.commit(),
          },
        },
      );
    }
    return json(
      {error},
      {
        status: 400,
        headers: {
          'Set-Cookie': await context.session.commit(),
        },
      },
    );
  }
}

export default function Addresses() {
  const {customer} = useOutletContext();
  const {defaultAddress, addresses} = customer;
  const [addys, setAddys] = useState(addresses?.nodes);
  const [editAddressId, setEditAddressId] = useState(null);
  const [displayForm, setDisplayForm] = useState(false);
  const actionData = useActionData();

  useEffect(() => {
    if (actionData?.createdAddress) {
      addresses?.nodes?.push(actionData.createdAddress);
    }
  }, [actionData?.createdAddress, addresses?.nodes]);

  useEffect(() => {
    if (actionData?.updatedAddress?.customerAddress?.id) {
      const old = addresses?.nodes?.find(
        (n) =>
          stripQueryString(n.id) ===
          stripQueryString(actionData?.updatedAddress?.customerAddress?.id),
      );
      const index = addresses?.nodes?.indexOf(old);
      addresses?.nodes?.splice(
        index,
        1,
        actionData?.updatedAddress?.customerAddress,
      );
      setAddys(addresses?.nodes);
      handleCancelEdit();
    }
  }, [actionData?.updatedAddress, addresses?.nodes]);

  useEffect(() => {
    if (actionData?.deletedAddress) {
      const old = addresses?.nodes?.find(
        (n) =>
          stripQueryString(n.id) ===
          stripQueryString(actionData?.deletedAddress),
      );
      const index = addresses?.nodes?.indexOf(old);
      addresses?.nodes?.splice(index, 1);
      setAddys(addresses?.nodes);
    }
  }, [actionData?.deletedAddress, addresses?.nodes]);

  const handleEditClick = (addressId) => {
    setEditAddressId(addressId);
  };

  const handleCancelEdit = () => {
    window.scrollTo(0, 0);
    if (editAddressId) setEditAddressId(null);
    if (displayForm) setDisplayForm(false);
  };

  return (
    <div className="account-addresses">
      {!displayForm ? (
        <>
          {!editAddressId && (
            <p className="account-address-bold">Saved Addresses</p>
          )}
          {!addys.length ? (
            <div className="empty-addresses">
              <p>You have no addresses saved.</p>
            </div>
          ) : (
            <div>
              <div className="address-container">
                <ExistingAddresses
                  addresses={addys}
                  defaultAddress={defaultAddress}
                  editAddressId={editAddressId}
                  onEditClick={handleEditClick}
                  onCancelEdit={handleCancelEdit}
                />
              </div>
            </div>
          )}
          {!editAddressId && (
            <button
              className="add-new-address"
              onClick={() => {
                setDisplayForm(true);
              }}
            >
              ADD NEW
            </button>
          )}
        </>
      ) : !editAddressId ? (
        <NewAddressForm handleCancelEdit={handleCancelEdit} />
      ) : null}
    </div>
  );
}

function NewAddressForm({handleCancelEdit}) {
  const newAddress = {
    id: 'new',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    country: '',
    zip: '',
    phone: '',
  };

  return (
    <AddressForm
      addressId={'NEW_ADDRESS_ID'}
      address={newAddress}
      defaultAddress={null}
      onCancel={handleCancelEdit}
    >
      {({stateForMethod}) => (
        <div className="address-form-buttons">
          <button style={{background: 'white'}} onClick={handleCancelEdit}>
            CANCEL
          </button>
          <button
            style={{backgroundColor: 'black', color: 'white'}}
            disabled={stateForMethod('POST') !== 'idle'}
            formMethod="POST"
            type="submit"
          >
            {stateForMethod('POST') !== 'idle' ? 'SAVING' : 'SAVE CHANGES'}
          </button>
        </div>
      )}
    </AddressForm>
  );
}

function stripQueryString(id) {
  if (id) return id.split('?')[0];
  return id;
}

/**
 * @param {Pick<CustomerFragment, 'addresses' | 'defaultAddress'>}
 */
export function ExistingAddresses({
  addresses,
  defaultAddress,
  editAddressId,
  onEditClick,
  handleCancelEdit,
  onCancelEdit, // Added onCancelEdit prop
}) {
  return (
    <div>
      {addresses.map((address) => (
        <div key={address.id} className="existing-address">
          {stripQueryString(editAddressId) === stripQueryString(address.id) ? (
            <AddressForm
              addressId={address.id}
              address={address}
              defaultAddress={defaultAddress}
              onCancel={onCancelEdit} // Pass onCancelEdit as a prop to AddressForm
            >
              {({stateForMethod}) => (
                <div className="address-form-buttons">
                  <button style={{background: 'white'}} onClick={onCancelEdit}>
                    CANCEL
                  </button>
                  <button
                    style={{backgroundColor: 'black', color: 'white'}}
                    disabled={stateForMethod('PUT') !== 'idle'}
                    formMethod="PUT"
                    type="submit"
                  >
                    {stateForMethod('PUT') !== 'idle'
                      ? 'SAVING'
                      : 'SAVE CHANGES'}
                  </button>
                </div>
              )}
            </AddressForm>
          ) : (
            <div
              style={{
                display: editAddressId !== null ? 'none' : 'block',
                marginBottom: '1rem',
              }}
            >
              <AddressDisplay address={address} />
              <div className="address-action-container">
                <button onClick={() => onEditClick(address.id)}>EDIT</button>
                <Form id={address.id} method="delete">
                  <fieldset>
                    <input
                      type="hidden"
                      name="addressId"
                      defaultValue={address.id}
                    />
                  </fieldset>
                  <button type="submit">DELETE</button>
                </Form>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddressDisplay({address}) {
  return (
    <div className="address-display">
      <p>
        {address.firstName} {address.lastName}
      </p>
      <p>{address.company}</p>
      <p>{address.address1}</p>
      <p>{address.address2}</p>
      <p>
        {address.city}, {address.zoneCode} {address.zip}
      </p>
      <p>{address.phone}</p>
    </div>
  );
}

/**
 * @param {Class<useNavigation>['state']>}
 */
export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
  onCancel,
  onSave,
}) {
  const prevPOST = useRef();
  const {formMethod} = useNavigation();
  const {state} = useNavigation();
  const actionData = useActionData();
  const error = actionData?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;
  const stateForMethod = (method) => (formMethod === method ? state : 'idle');

  useEffect(() => {
    if (
      stateForMethod('PUT') === 'idle' &&
      stripQueryString(actionData?.updatedAddress?.customerAddress?.id) ===
        stripQueryString(address.id) &&
      actionData?.updatedAddress?.customerAddress?.id !== address.id &&
      !error
    ) {
      onCancel();
    }
  }, [actionData?.updatedAddress?.customerAddress?.id, stateForMethod('PUT')]);

  useEffect(() => {
    if (
      stateForMethod('POST') === 'idle' &&
      prevPOST.current === 'loading' &&
      !error
    ) {
      onCancel();
    }
    prevPOST.current = stateForMethod('POST');
  }, [stateForMethod('POST')]);

  return (
    <Form id={addressId}>
      <p className="account-address-bold">
        {addressId === 'NEW_ADDRESS_ID' ? 'Add New Address' : 'Edit Address'}
      </p>
      <fieldset>
        <input type="hidden" name="addressId" defaultValue={addressId} />
        <label htmlFor="firstName">First Name:</label>
        <input
          aria-label="First name"
          autoComplete="given-name"
          defaultValue={address?.firstName ?? ''}
          id="firstName"
          name="firstName"
          placeholder="First name"
          required
          type="text"
        />
        <label htmlFor="lastName">Last Name:</label>
        <input
          aria-label="Last name"
          autoComplete="family-name"
          defaultValue={address?.lastName ?? ''}
          id="lastName"
          name="lastName"
          placeholder="Last name"
          required
          type="text"
        />
        <label htmlFor="address1">Street Address:</label>
        <input
          aria-label="Street Address"
          autoComplete="address-line1"
          defaultValue={address?.address1 ?? ''}
          id="address1"
          name="address1"
          placeholder="Street Address*"
          required
          type="text"
        />
        <label htmlFor="address2">Apt:</label>
        <input
          aria-label="Apt"
          autoComplete="address-line2"
          defaultValue={address?.address2 ?? ''}
          id="address2"
          name="address2"
          placeholder="Apt"
          type="text"
        />
        <label htmlFor="city">City:</label>
        <input
          aria-label="City"
          autoComplete="address-level2"
          defaultValue={address?.city ?? ''}
          id="city"
          name="city"
          placeholder="City"
          required
          type="text"
        />
        <label htmlFor="province">State:</label>
        <input
          aria-label="State/Province"
          autoComplete="address-level1"
          defaultValue={address?.province ?? ''}
          id="province"
          name="province"
          placeholder="State"
          required
          type="text"
        />
        <label htmlFor="zip">Zip / Postal Code:</label>
        <input
          aria-label="Zip"
          autoComplete="postal-code"
          defaultValue={address?.zip ?? ''}
          id="zip"
          name="zip"
          placeholder="Zip / Postal Code"
          required
          type="text"
        />
        <label htmlFor="country">Country/Region:</label>
        <input
          aria-label="country"
          autoComplete="country"
          defaultValue={address?.country ?? ''}
          id="country"
          name="country"
          placeholder="Country"
          required
          type="text"
          // maxLength={2}
        />
        <label htmlFor="phone">Phone:</label>
        <input
          aria-label="Phone Number"
          autoComplete="tel"
          defaultValue={address?.phone ?? ''}
          id="phone"
          name="phone"
          placeholder="+16135551111"
          pattern="^\+?[1-9]\d{3,14}$"
          type="tel"
        />

        {/* <div>
          <input
            defaultChecked={isDefaultAddress}
            id="defaultAddress"
            name="defaultAddress"
            type="checkbox"
          />
          <label htmlFor="defaultAddress">Set as default address</label>
        </div> */}
        {error && (
          <p>
            <mark>
              <small>{error}</small>
            </mark>
          </p>
        )}
        <br />
        {children({
          stateForMethod: (method) => (formMethod === method ? state : 'idle'),
        })}
      </fieldset>
    </Form>
  );
}

/**
 * @typedef {{
 *   addressId?: string | null;
 *   createdAddress?: AddressFragment;
 *   defaultAddress?: string | null;
 *   deletedAddress?: string | null;
 *   error: Record<AddressFragment['id'], string> | null;
 *   updatedAddress?: AddressFragment;
 * }} ActionResponse
 */

/** @typedef {import('@shopify/hydrogen/customer-account-api-types').CustomerAddressInput} CustomerAddressInput */
/** @typedef {import('customer-accountapi.generated').AddressFragment} AddressFragment */
/** @typedef {import('customer-accountapi.generated').CustomerFragment} CustomerFragment */
/** @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof action>} ActionReturnData */
