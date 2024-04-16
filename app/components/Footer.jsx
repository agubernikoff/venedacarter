import React, {Suspense, useState, useEffect} from 'react';
import {NavLink} from '@remix-run/react';
import {useRootLoaderData} from '~/root';
import lisa from '../assets/lisa.png';
import {Image} from '@shopify/hydrogen';
import {Await} from '@remix-run/react';

/**
 * @param {FooterQuery & {shop: HeaderQuery['shop']}}
 */
export function Footer({menu, shop, footerImage}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    window
      .matchMedia('(max-width:700px)')
      .addEventListener('change', (e) => setIsMobile(e.matches));
    if (window.matchMedia('(max-width:700px)').matches) setIsMobile(true);
  }, []);

  return (
    <footer className="footer">
      <Brand isMobile={isMobile} />
      <Support />
      <Newsletter footerImage={footerImage} />
      {isMobile ? (
        <div className="site-credit">
          <p>© Veneda Carter 2024, All Rights Reserved. </p>
          <a>Site Credit</a>
        </div>
      ) : null}
    </footer>
  );
}

/**
 * @param {{
 *   menu: FooterQuery['menu'];
 *   primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url'];
 * }}
 */

function Brand({isMobile}) {
  return (
    <div className="brand-footer">
      <div className="footer-title-container">
        <h2 className="footer-title">Brand</h2>
      </div>
      <div className="footer-content-container">
        <div className="brand-list">
          <a>New Arrivals</a>
          <a>Shop</a>
          <a>About</a>
          <a>Stockists</a>
          <a>Instagram</a>
        </div>
        {isMobile ? null : (
          <div className="site-credit">
            <p>© Veneda Carter 2024, All Rights Reserved. </p>
            <a>Site Credit</a>
          </div>
        )}
      </div>
    </div>
  );
}

function Support() {
  return (
    <div className="support-footer">
      <div className="footer-title-container">
        <h2 className="footer-title">Support</h2>
      </div>
      <div className="footer-content-container">
        <div className="brand-list">
          <a>Terms of Servive</a>
          <a>Privacy Policy</a>
          <a>Refund Policy</a>
          <a>Claim Portal</a>
          <a>Contact</a>
        </div>
      </div>
    </div>
  );
}
function Newsletter({footerImage}) {
  console.log(footerImage);
  return (
    <div className="newsletter-footer">
      <div className="footer-title-container">
        <h2 className="footer-title">Newsletter</h2>
      </div>
      <div className="newsletter-content-footer">
        <div className="newsletter-image-container">
          {/* <img src={lisa} /> */}
          <Suspense>
            <Await resolve={footerImage}>
              {(footerImage) => (
                <Image
                  data={
                    footerImage.metaobjects.edges[0].node.fields[0].reference
                      .image
                  }
                />
              )}
            </Await>
          </Suspense>
        </div>
        <div className="newsletter-form-footer">
          <p>Join our newsletter for the latest news and releases.</p>
          <form className="newsletter-input-container">
            <input placeholder="Email" name="email"></input>
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </div>
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
