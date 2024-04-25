import {Await, useLocation, useSearchParams} from '@remix-run/react';
import {Suspense} from 'react';
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
  return (
    <>
      <CartAside cart={cart} />
      <SearchAside />
      <FilterAside />
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
    <Aside id="cart-aside" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  return (
    <Aside id="search-aside" heading="SEARCH">
      <div className="predictive-search">
        <br />
        <PredictiveSearchForm>
          {({fetchResults, inputRef}) => (
            <div>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search"
                ref={inputRef}
                type="search"
              />
              &nbsp;
              <button
                onClick={() => {
                  window.location.href = inputRef?.current?.value
                    ? `/search?q=${inputRef.current.value}`
                    : `/search`;
                }}
              >
                Search
              </button>
            </div>
          )}
        </PredictiveSearchForm>
        <PredictiveSearchResults />
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

function FilterAside() {
  const {pathname} = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <Aside id="filter-aside" heading="FILTER">
      <button
        className="collection-title"
        onClick={() => {
          const params = new URLSearchParams();
          params.set('sortkey', 'CREATED_AT');
          params.set('reverse', 'true');
          setSearchParams(params, {
            preventScrollReset: true,
          });
        }}
      >
        Filter
      </button>
    </Aside>
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
