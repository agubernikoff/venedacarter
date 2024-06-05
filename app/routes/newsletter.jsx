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
  const action = useActionData();

  const [isClient, setIsClient] = useState(false);
  const [email, setEmail] = useState('');
  const [messageText, setMessageText] = useState(
    'Join our newsletter for the latest news and releases.',
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  function subscribe(email) {
    if (!email) {
      setMessageText('PLEASE ENTER AN EMAIL');
      setTimeout(() => {
        setMessageText('Join our newsletter for the latest news and releases.');
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
        setMessageText('Thank you for signing up.');
      })
      .catch((error) => {
        console.log('error', error);
        setMessageText('Error, please try again.');
        setTimeout(() => {
          setMessageText(
            'Join our newsletter for the latest news and releases.',
          );
        }, 1500);
      });
  }

  return (
    <div className="newsletter-container">
      <div className="newsletter-header">
        <p>NEWSLETTER</p>
      </div>
      <div className="newsletter-content">
        <p>{messageText}</p>
      </div>
      <div className="newsletter-form">
        <input
          id="email_114352042"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{marginBottom: '1rem', borderRadius: '0', fontSize: '16px'}}
        ></input>
        <button className="profile-button" onClick={() => subscribe(email)}>
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
