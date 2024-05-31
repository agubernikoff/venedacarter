import {Await} from '@remix-run/react';
import React, {useEffect, useState, Suspense} from 'react';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenuMobile} from '~/components/Header';
import {CartMain} from '~/components/Cart';
import {
  PredictiveSearchForm,
  PredictiveSearchResults,
} from '~/components/Search';

/**
 * @param {LayoutProps}
 */
export function Layout({
  cart,
  children = null,
  footer,
  supportMenu,
  mobileMenu,
  footerImage,
  header,
  isLoggedIn,
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    window
      .matchMedia('(max-width:44em)')
      .addEventListener('change', (e) => setIsMobile(e.matches));
    if (window.matchMedia('(max-width:44em)').matches) setIsMobile(true);
  }, []);
  return (
    <>
      <CartAside cart={cart} />
      <SearchAside
        menu={footer?.menu}
        shop={header?.shop}
        footerImage={footerImage}
        supportMenu={supportMenu?.menu}
      />
      {header && (
        <Header
          header={header}
          cart={cart}
          isLoggedIn={isLoggedIn}
          supportMenu={supportMenu.menu}
          mobileMenu={mobileMenu.menu}
        />
      )}
      <main>{children}</main>
      <Footer
        menu={footer?.menu}
        shop={header?.shop}
        footerImage={footerImage}
        supportMenu={supportMenu?.menu}
      />
    </>
  );
}

/**
 * @param {{cart: LayoutProps['cart']}}
 */
function CartAside({cart}) {
  return (
    <Suspense>
      <Await resolve={cart}>
        {(cart) => {
          return (
            <Aside
              id="cart-aside"
              heading={`Bag (${cart?.lines?.nodes?.length || 0})`}
            >
              <CartMain cart={cart} layout="aside" />{' '}
            </Aside>
          );
        }}
      </Await>
    </Suspense>
  );
}

function SearchAside({menu, shop, footerImage, supportMenu}) {
  return (
    <Aside id="search-aside" heading="SEARCH">
      <div className="predictive-search">
        <PredictiveSearchResults
          menu={menu}
          shop={shop}
          footerImage={footerImage}
          supportMenu={supportMenu}
        />
      </div>
    </Aside>
  );
}

/**
 * @param {{
 *   menu: HeaderQuery['menu'];
 *   shop: HeaderQuery['shop'];
 * }}
 */
function MobileMenuAside({menu, shop, menu2, menu3}) {
  return (
    menu &&
    shop?.primaryDomain?.url && (
      <Aside id="mobile-menu-aside" heading="MENU">
        <HeaderMenuMobile
          menu={menu}
          viewport="mobile"
          primaryDomainUrl={shop.primaryDomain.url}
          menu2={menu2}
          menu3={menu3}
        />
      </Aside>
    )
  );
}

/**
 * @typedef {{
 *   cart: Promise<CartApiQueryFragment | null>;
 *   children?: React.ReactNode;
 *   footer: Promise<FooterQuery>;
 *   header: HeaderQuery;
 *   isLoggedIn: Promise<boolean>;
 * }} LayoutProps
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
