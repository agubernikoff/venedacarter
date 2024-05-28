import React, {Suspense, useState, useEffect} from 'react';
import {NavLink} from '@remix-run/react';
import {useRootLoaderData} from '~/root';
import {Image} from '@shopify/hydrogen';
import {Await} from '@remix-run/react';

/**
 * @param {FooterQuery & {shop: HeaderQuery['shop']}}
 */
export function Footer({menu, shop, footerImage, supportMenu}) {
  // DONT DELETE UNTIL YOU USE THESE LOGS TO CREATE TWO SEPERATE FALLBACK MENUS
  console.log(menu);
  console.log(supportMenu);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    window
      .matchMedia('(max-width:44em)')
      .addEventListener('change', (e) => setIsMobile(e.matches));
    if (window.matchMedia('(max-width:44em)').matches) setIsMobile(true);
  }, []);

  return (
    <footer className={isMobile ? 'footer-mobile' : 'footer'}>
      <Brand
        isMobile={isMobile}
        menu={menu}
        primaryDomainUrl={shop.primaryDomain.url}
      />
      <Support
        isMobile={isMobile}
        menu={supportMenu}
        primaryDomainUrl={shop.primaryDomain.url}
      />
      <Newsletter footerImage={footerImage} isMobile={isMobile} />
      {isMobile ? (
        <div className="site-credit-mobile">
          <p>© Veneda Carter 2024, All Rights Reserved. </p>
          <a href="https://www.swallstudios.com" target="_blank">
            Site Credit
          </a>
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

function Brand({isMobile, menu, primaryDomainUrl}) {
  const {publicStoreDomain} = useRootLoaderData();
  function closeAside(event) {
    if (isMobile) {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }
  return (
    <div className="brand-footer">
      <div className="footer-title-container">
        <p className="footer-title">Brand</p>
      </div>
      <div className="footer-content-container">
        <div className="brand-list">
          {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
            if (!item.url) return null;

            // if the url is internal, we strip the domain
            const url =
              item.url.includes('myshopify.com') ||
              item.url.includes(publicStoreDomain) ||
              item.url.includes(primaryDomainUrl)
                ? new URL(item.url).pathname
                : item.url;

            return (
              <NavLink
                // className="header-menu-item"
                end
                key={item.id}
                onClick={closeAside}
                prefetch="intent"
                style={activeLinkStyle}
                to={url}
              >
                {item.title}
              </NavLink>
            );
          })}
        </div>
        {isMobile ? null : (
          <div className="site-credit">
            <p>© Veneda Carter 2024, All Rights Reserved. </p>
            <a href="https://www.swallstudios.com" target="_blank">
              Site Credit
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Support({isMobile, menu, primaryDomainUrl}) {
  const {publicStoreDomain} = useRootLoaderData();
  function closeAside(event) {
    if (isMobile) {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }
  return (
    <div className="support-footer">
      <div className="footer-title-container">
        <p className="footer-title">Support</p>
      </div>
      <div className="footer-content-container">
        <div className="brand-list">
          {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
            if (!item.url) return null;

            // if the url is internal, we strip the domain
            const url =
              item.url.includes('myshopify.com') ||
              item.url.includes(publicStoreDomain) ||
              item.url.includes(primaryDomainUrl)
                ? new URL(item.url).pathname
                : item.url;

            return (
              <NavLink
                // className="header-menu-item"
                end
                key={item.id}
                onClick={closeAside}
                prefetch="intent"
                style={activeLinkStyle}
                to={url}
              >
                {item.title}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function Newsletter({footerImage, isMobile}) {
  return (
    <div className="newsletter-footer">
      <div className="footer-title-container">
        <p className="footer-title">Newsletter</p>
      </div>
      <div className="newsletter-content-footer">
        <div
          className={
            isMobile
              ? 'newsletter-image-container-mobile'
              : 'newsletter-image-container'
          }
        >
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
        <div
          className={
            isMobile
              ? 'newsletter-form-footer-mobile'
              : 'newsletter-form-footer'
          }
        >
          <p style={{marginBottom: '.25rem'}}>
            Join our newsletter for the latest news and releases.
          </p>
          {/* <form
            className={
              isMobile
                ? 'newsletter-input-container-mobile'
                : 'newsletter-input-container'
            }
          >
            <input placeholder="Email" name="email"></input>
            <button type="submit">Submit</button>
          </form> */}
          <div class="klaviyo-form-XrMRY4 klaviyo-form form-version-cid-1"></div>
        </div>
      </div>
    </div>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
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
      title: 'Terms of Service + Privacy',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service-+-privacy',
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
    fontWeight: isActive ? 'normal' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}

/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
