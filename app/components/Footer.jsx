import React, {Suspense, useState, useEffect} from 'react';
import {NavLink} from '@remix-run/react';
import {useRootLoaderData} from '~/root';
import {Image} from '@shopify/hydrogen';
import {Await} from '@remix-run/react';
import {useNavigate} from 'react-router-dom';

/**
 * @param {FooterQuery & {shop: HeaderQuery['shop']}}
 */
export function Footer({menu, shop, footerImage, supportMenu}) {
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
  const navigate = useNavigate();
  const {publicStoreDomain} = useRootLoaderData();

  function closeAside(event, url) {
    if (isMobile) {
      event.preventDefault();
      navigate(url);
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

            const url =
              item.url.includes('myshopify.com') ||
              item.url.includes(publicStoreDomain) ||
              item.url.includes(primaryDomainUrl)
                ? new URL(item.url).pathname
                : item.url;

            return (
              <NavLink
                end
                key={item.id}
                onClick={(event) => closeAside(event, url)}
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
            <a
              href="https://www.swallstudios.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Site Credit
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Support({isMobile, menu, primaryDomainUrl}) {
  const navigate = useNavigate();
  const {publicStoreDomain} = useRootLoaderData();

  function closeAside(event, url) {
    if (isMobile) {
      event.preventDefault();
      navigate(url);
    }
  }

  return (
    <div className="support-footer">
      <div className="footer-title-container">
        <p className="footer-title">Support</p>
      </div>
      <div className="footer-content-container">
        <div className="brand-list">
          {(menu || FALLBACK_FOOTER_SUPPORT_MENU).items.map((item) => {
            if (!item.url) return null;

            const url =
              item.url.includes('myshopify.com') ||
              item.url.includes(publicStoreDomain) ||
              item.url.includes(primaryDomainUrl)
                ? new URL(item.url).pathname
                : item.url;

            return (
              <NavLink
                end
                key={item.id}
                onClick={(event) => closeAside(event, url)}
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

function KlaviyoForm() {
  useEffect(() => {}, []);

  return <div className="klaviyo-form-XrMRY4"></div>;
}

function Newsletter({footerImage, isMobile}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
          {isClient && (
            <Suspense fallback={<div>Loading...</div>}>
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
          )}
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
          {isClient && (
            <Suspense fallback={<div>...</div>}>
              <KlaviyoForm />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/191401525326',
  items: [
    {
      id: 'gid://shopify/MenuItem/444996419662',
      items: [],
      resourceId: null,
      tags: [],
      title: 'New Arrivals',
      type: 'HTTP',
      url: 'https://dumby-veneda.myshopify.com/collections/new_arrivals',
    },
    {
      id: 'gid://shopify/MenuItem/445769252942',
      items: [],
      resourceId: null,
      tags: [],
      title: 'Shop',
      type: 'CATALOG',
      url: 'https://dumby-veneda.myshopify.com/collections/all',
    },
    {
      id: 'gid://shopify/MenuItem/445769285710',
      items: [],
      resourceId: 'gid://shopify/Page/93070065742',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: 'https://dumby-veneda.myshopify.com/pages/about',
    },
    {
      id: 'gid://shopify/MenuItem/445769318478',
      items: [],
      resourceId: 'gid://shopify/Page/93680959566',
      tags: [],
      title: 'Stockists',
      type: 'PAGE',
      url: 'https://dumby-veneda.myshopify.com/pages/stockists',
    },
    {
      id: 'gid://shopify/MenuItem/445769351246',
      items: [],
      resourceId: null,
      tags: [],
      title: 'Instagram',
      type: 'HTTP',
      url: 'https://www.instagram.com/venedaacarter/',
    },
  ],
};

const FALLBACK_FOOTER_SUPPORT_MENU = {
  id: 'gid://shopify/Menu/191706923086',
  items: [
    {
      id: 'gid://shopify/MenuItem/445768728654',
      items: [],
      resourceId: 'gid://shopify/Page/93681025102',
      tags: [],
      title: 'Terms of Service + Privacy',
      type: 'PAGE',
      url: 'https://dumby-veneda.myshopify.com/pages/terms-of-service',
    },

    {
      id: 'gid://shopify/MenuItem/445768794190',
      items: [],
      resourceId: 'gid://shopify/Page/93681188942',
      tags: [],
      title: 'Refund Policy',
      type: 'PAGE',
      url: 'https://dumby-veneda.myshopify.com/pages/refund-policy',
    },
    {
      id: 'gid://shopify/MenuItem/445768826958',
      items: [],
      resourceId: 'gid://shopify/Page/93681156174',
      tags: [],
      title: 'Claim Portal',
      type: 'PAGE',
      url: 'https://dumby-veneda.myshopify.com/pages/claim-portal',
    },
    {
      id: 'gid://shopify/MenuItem/445768859726',
      items: [],
      resourceId: 'gid://shopify/Page/92875718734',
      tags: [],
      title: 'Contact',
      type: 'PAGE',
      url: 'https://dumby-veneda.myshopify.com/pages/contact',
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
