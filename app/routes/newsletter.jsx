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
import {useEffect, useState} from 'react';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Newsletter'}];
};

export default function Newsletter() {
  const account = useOutletContext();
  const {state} = useNavigation();
  /** @type {ActionReturnData} */
  const action = useActionData();

  const [isClient, setIsClient] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  function subscribe(email, btn, originalText) {
    if (!email) {
      btn.innerText = 'PLEASE ENTER AN EMAIL';
      setTimeout(() => {
        btn.innerText = originalText;
      }, 1500);
      return;
    }
    const payload = {
      data: {
        type: 'subscription',
        attributes: {
          custom_source: 'Newsletter',
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: `${email}`,
              },
            },
          },
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: 'Tby4b3',
            },
          },
        },
      },
    };

    var requestOptions = {
      mode: 'cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        revision: '2023-12-15',
      },
      body: JSON.stringify(payload),
    };
    fetch(
      'https://a.klaviyo.com/client/subscriptions/?company_id=XFjCZj',
      requestOptions,
    )
      .then((result) => {
        console.log(result);
        // if (result.ok) {
        //   btn.innerText = 'YOUR NOTIFICATION HAS BEEN REGISTERED';
        //   setTimeout(() => {
        //     btn.innerText = originalText;
        //   }, 1500);
        // } else {
        //   btn.innerText =
        //     'YOUR REQUEST COULD NOT BE COMPLETED. PLEASE EMAIL test@test.com TO BE NOTIFIED';
        //   setTimeout(() => {
        //     btn.innerText = originalText;
        //   }, 1500);
        // }
      })
      .catch((error) => console.log('error', error));
  }

  return (
    <div className="account-login">
      <p className="stockists-title">NEWSLETTER</p>
      <div className="newsletter-mobile-page">
        {isClient && <div className="klaviyo-form-XrMRY4"></div>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{borderRadius: '0'}}
        ></input>
        <button
          onClick={(e) => {
            subscribe(email, e.target, e.target.innerText);
          }}
        >
          NOTIFY
        </button>
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
