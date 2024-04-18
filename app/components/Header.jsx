import {Await, NavLink} from '@remix-run/react';
import {Suspense, useState, useEffect} from 'react';
import {useRootLoaderData} from '~/root';
import {motion, AnimatePresence} from 'framer-motion';

/**
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    window
      .matchMedia('(max-width:44em)')
      .addEventListener('change', (e) => setIsMobile(e.matches));
    if (window.matchMedia('(max-width:44em)').matches) setIsMobile(true);
  }, []);
  const {shop, menu} = header;
  return (
    <header className="header">
      <div className="header-left">
        <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
          <p className={isMobile ? 'shop-name-mobile' : 'shop-name'}>
            VENEDA CARTER
          </p>
        </NavLink>
      </div>
      <div className="header-center">
        <HeaderMenu
          menu={menu}
          viewport="desktop"
          primaryDomainUrl={header.shop.primaryDomain.url}
        />
      </div>
      <div className="header-right">
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>
    </header>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 * }}
 */
export function HeaderMenu({menu, primaryDomainUrl, viewport}) {
  const {publicStoreDomain} = useRootLoaderData();
  const className = `header-menu-${viewport}`;
  const [hovered, setHovered] = useState(false);

  function closeAside(event) {
    if (viewport === 'mobile') {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }
  function isActive(item) {
    if (typeof window !== 'undefined') {
      if (new URL(item.url).pathname === window.location.pathname) return true;
      if (
        window.location.pathname.includes('collections') &&
        item.title === 'Shop'
      ) {
        if (window.location.pathname.includes('new-arrivals')) return false;
        return true;
      }
      return false;
    }
  }

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={closeAside}
          prefetch="intent"
          style={activeLinkStyle}
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        // if (item.items.length > 0) {
        return (
          <div
            key={item.id}
            onMouseEnter={() => {
              if (item.title === 'Shop') setHovered(true);
            }}
            onMouseLeave={() => {
              if (item.title === 'Shop') setHovered(false);
            }}
            className={
              item.title === 'Shop' ? 'header-catalog-submenu-container' : null
            }
          >
            <motion.div layout="position" transition={{ease: 'easeInOut'}}>
              <NavLink
                className={
                  isActive(item)
                    ? 'header-menu-item-active'
                    : 'header-menu-item'
                }
                end
                onClick={closeAside}
                prefetch="intent"
                style={(activeLinkStyle, hovered ? {opacity: 0.25} : null)}
                to={url}
              >
                {item.title}
              </NavLink>
            </motion.div>
            <AnimatePresence mode="popLayout">
              {hovered && (
                <motion.div
                  initial={{opacity: 0, x: 500}}
                  animate={{opacity: 1, x: 0}}
                  exit={{opacity: 0, x: 500}}
                  transition={{ease: 'easeInOut'}}
                  className="header-catalog-submenu-container"
                >
                  {item.items.map((item) => {
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
                        className="subheader-menu-item"
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}
export function HeaderMenuMobile({
  menu,
  primaryDomainUrl,
  viewport,
  menu2,
  menu3,
}) {
  const {publicStoreDomain} = useRootLoaderData();
  const className = `header-menu-${viewport}`;
  function closeAside(event) {
    if (viewport === 'mobile') {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }

  return (
    <nav className={className} role="navigation">
      <div
        className={className}
        style={{borderBottom: '1px solid #eaeaea', paddingBottom: '1rem'}}
      >
        <p className="subheader-menu-item" style={{fontWeight: 'bold'}}>
          Shop
        </p>
        {(menu || FALLBACK_HEADER_MENU).items
          .filter((item) => item.title !== 'About')
          .map((item) => {
            if (!item.url) return null;

            // if the url is internal, we strip the domain
            const url =
              item.url.includes('myshopify.com') ||
              item.url.includes(publicStoreDomain) ||
              item.url.includes(primaryDomainUrl)
                ? new URL(item.url).pathname
                : item.url;
            if (item.items.length > 0)
              return item.items.map((item) => {
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
                    className="subheader-menu-item"
                    end
                    key={item.id}
                    onClick={closeAside}
                    prefetch="intent"
                    // style={activeLinkStyle}
                    to={url}
                  >
                    {item.title}
                  </NavLink>
                );
              });
            return (
              <NavLink
                className="subheader-menu-item"
                end
                key={item.id}
                onClick={closeAside}
                prefetch="intent"
                // style={activeLinkStyle}
                to={url}
              >
                {item.title}
              </NavLink>
            );
          })}
      </div>
      {(menu2 || FALLBACK_HEADER_MENU).items.map((item) => {
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
            className="mobile-middle-menu-item"
            end
            key={item.id}
            onClick={closeAside}
            prefetch="intent"
            // style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
      <div
        className={className}
        style={{borderBottom: '1px solid #eaeaea', paddingBottom: '1rem'}}
      >
        <p className="subheader-menu-item" style={{fontWeight: 'bold'}}>
          Support
        </p>
        {(menu3 || FALLBACK_HEADER_MENU).items.map((item) => {
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
              className="subheader-menu-item"
              end
              key={item.id}
              onClick={closeAside}
              prefetch="intent"
              // style={activeLinkStyle}
              to={url}
            >
              {item.title}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart'>}
 */
function HeaderCtas({isLoggedIn, cart}) {
  return (
    <nav className="header-ctas" role="navigation">
      <HeaderMenuMobileToggle />
      <SearchToggle />
      <NavLink prefetch="intent" to="/account" style={activeLinkStyle}>
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Log in')}
          </Await>
        </Suspense>
      </NavLink>
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  return (
    <a className="header-menu-mobile-toggle" href="#mobile-menu-aside">
      <p>☰</p>
    </a>
  );
}

function SearchToggle() {
  return <a href="#search-aside">Search</a>;
}

/**
 * @param {{count: number}}
 */
function CartBadge({count}) {
  return <a href="#cart-aside">Bag ({count})</a>;
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        {(cart) => {
          if (!cart) return <CartBadge count={0} />;
          return <CartBadge count={cart.totalQuantity || 0} />;
        }}
      </Await>
    </Suspense>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
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
    color: isPending ? 'grey' : 'black',
  };
}

/** @typedef {Pick<LayoutProps, 'header' | 'cart' | 'isLoggedIn'>} HeaderProps */
/** @typedef {'desktop' | 'mobile'} Viewport */

/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('./Layout').LayoutProps} LayoutProps */
