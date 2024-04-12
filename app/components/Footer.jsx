import {NavLink} from '@remix-run/react';
import {useRootLoaderData} from '~/root';
import lisa from '../assets/lisa.jpg';

/**
 * @param {FooterQuery & {shop: HeaderQuery['shop']}}
 */
export function Footer({menu, shop}) {
  return (
    <footer className="footer">
      <FooterTitles />
      <FooterContent />
    </footer>
  );
}

/**
 * @param {{
 *   menu: FooterQuery['menu'];
 *   primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url'];
 * }}
 */
function FooterTitles() {
  return (
    <>
      <div className="brand-footer">
        <h2>Brand</h2>
      </div>
      <div className="support-footer">
        <h2>Support</h2>
      </div>
      <div className="newsletter-footer">
        <h2>Newsletter</h2>
      </div>
    </>
  );
}

function FooterContent() {
  return (
    <>
      <div className="brand-content-footer">
        <div className="brand-list">
          <a>New Arrivals</a>
          <a>Shop</a>
          <a>About</a>
          <a>Stockists</a>
          <a>Instagram</a>
        </div>
        <div className="site-credit">
          <p>© Veneda Carter 2024, All Rights Reserved. </p>
          <a>Site Credit</a>
        </div>
      </div>
      <div className="support-content-footer">
        <div className="brand-list">
          <a>Terms of Servive</a>
          <a>Privacy Policy</a>
          <a>Refund Policy</a>
          <a>Claim Portal</a>
          <a>Contact</a>
        </div>
      </div>
      <div className="newsletter-content-footer">
        <div className="newsletter-image-container">
          <img src={lisa} />
        </div>
        <div className="newsletter-form-footer">
          <p>Join our newsletter for the latest news and releases.</p>
          <form className="newsletter-input-container">
            <input placeholder="Email" name="email"></input>
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};

/**
 * @param {{
 *   isActive: boolean;
 *   isPending: boolean;
 * }}
 */
function activeLinkStyle({isActive, isPending}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'white',
  };
}

/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
