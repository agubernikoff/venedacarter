import {
  Await,
  NavLink,
  useFetcher,
  useParams,
  useLocation,
} from '@remix-run/react';
import {Suspense, useState, useEffect} from 'react';
import {useRootLoaderData} from '~/root';
import {motion, AnimatePresence} from 'framer-motion';
import search from '../assets/search.png';
import cart from '../assets/cart.png';
import mobIcon from '../assets/mobile-icon.png';
import menu from '../assets/menu.png';
import x from '../assets/X.png';
import {usePredictiveSearch} from './Search';
import {useNavigate} from 'react-router-dom';

/**
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart, supportMenu, mobileMenu}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    window
      .matchMedia('(max-width:44em)')
      .addEventListener('change', (e) => setIsMobile(e.matches));
    if (window.matchMedia('(max-width:44em)').matches) setIsMobile(true);
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  function toggleMenu() {
    setIsOpen(!isOpen);
    document.body.classList.toggle('no-scroll', !isOpen);
    window.location.href = `${window.location.href}#x`;
  }

  function closeMenu() {
    setIsOpen(false);
    document.body.classList.toggle('no-scroll', !isOpen);
  }
  const {shop, menu} = header;

  function closeAside(event) {
    window.location.href = `${event.currentTarget.href}#x`;
  }

  return (
    <header className={isMobile ? 'header-mobile' : 'header'}>
      <div className="header-left">
        {isMobile ? (
          <HeaderMenuMobileToggle
            isOpen={isOpen}
            toggleMenu={toggleMenu}
            closeAside={closeAside}
          />
        ) : (
          <NavLink
            onClick={closeAside}
            prefetch="intent"
            to="/"
            style={activeLinkStyle}
            end
          >
            <p className="shop-name">VENEDA CARTER</p>
          </NavLink>
        )}
      </div>
      <div className={isMobile ? 'header-center-mobile' : 'header-center'}>
        {isMobile ? (
          <NavLink
            onClick={closeAside}
            prefetch="intent"
            to="/"
            style={activeLinkStyle}
            // onClick={closeMenu}
            end
          >
            <img className="shop-name-mobile" src={mobIcon} />
          </NavLink>
        ) : (
          <HeaderMenu
            menu={menu}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain.url}
          />
        )}
      </div>
      <div className="header-right">
        <HeaderCtas
          isLoggedIn={isLoggedIn}
          cart={cart}
          isMobile={isMobile}
          closeMenu={closeMenu}
          closeAside={closeAside}
        />
      </div>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="mobile-menu-container"
          >
            <HeaderMenuMobile
              menu={menu}
              viewport="mobile"
              primaryDomainUrl={header.shop.primaryDomain.url}
              menu2={mobileMenu}
              menu3={supportMenu}
              isLoggedIn={isLoggedIn}
              closeMenu={closeMenu}
              closeAside={closeAside}
            />
          </motion.div>
        )}
      </AnimatePresence>
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

  function closeAside(event) {
    if (viewport === 'mobile') {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    } else {
      window.location.href = `${event.currentTarget.href}#x`;
    }
  }
  const [hovered, setHovered] = useState(false);

  return (
    <motion.nav
      onMouseLeave={() => {
        setHovered(false);
      }}
      className={className}
      role="navigation"
      layout
      layoutRoot
    >
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
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => (
        <HeaderMenuItem
          key={item.title}
          item={item}
          publicStoreDomain={publicStoreDomain}
          primaryDomainUrl={primaryDomainUrl}
          closeAside={closeAside}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </motion.nav>
  );
}

function HeaderMenuItem({
  item,
  publicStoreDomain,
  primaryDomainUrl,
  closeAside,
  hovered,
  setHovered,
}) {
  const [isActive, setIsActive] = useState(false);
  const {pathname} = useLocation();

  useEffect(() => {
    if (new URL(item.url).pathname === pathname) setIsActive(true);
    else if (pathname.includes('collections') && item.title === 'Shop') {
      if (pathname.includes('new_arrivals')) setIsActive(false);
      else setIsActive(true);
    } else setIsActive(false);
  }, [pathname, item.title, item.url]);

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
      className={
        item.title === 'Shop' ? 'header-catalog-submenu-container' : null
      }
      style={{paddingBlock: '.5em'}}
    >
      <motion.div layout="position" transition={{ease: 'easeInOut'}}>
        <NavLink
          className={isActive ? 'header-menu-item-active' : 'header-menu-item'}
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
}

export function HeaderMenuMobile({
  menu,
  primaryDomainUrl,
  viewport,
  menu2,
  menu3,
  isLoggedIn,
  closeMenu,
  closeAside,
}) {
  const navigate = useNavigate();
  const {publicStoreDomain} = useRootLoaderData();
  const className = `header-menu-${viewport}`;

  return (
    <nav className={className} role="navigation">
      <div
        className={className}
        style={{borderBottom: '1px solid #eaeaea', paddingBottom: '1em'}}
      >
        <p className="subheader-menu-item" style={{fontFamily: 'bold-font'}}>
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
                    onClick={(event) => {
                      setTimeout(() => closeMenu(), 250);
                    }}
                    prefetch="intent"
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
                onClick={(event) => {
                  setTimeout(() => closeMenu(), 250);
                }}
                prefetch="intent"
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

        const title =
          item.title === 'Log In' && isLoggedIn ? 'Account' : item.title;

        return (
          <div className="mobile-middle-menu-item-container">
            <NavLink
              className="mobile-middle-menu-item"
              end
              key={item.id}
              onClick={(event) => {
                setTimeout(() => closeMenu(), 250);
              }}
              prefetch="intent"
              to={url}
            >
              {title}
            </NavLink>
          </div>
        );
      })}
      <div
        className={className}
        style={{borderBottom: '1px solid #eaeaea', paddingBottom: '1em'}}
      >
        <p
          className="subheader-menu-item"
          style={{fontFamily: 'bold-font', marginTop: '.5em'}}
        >
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
              onClick={(event) => {
                setTimeout(() => closeMenu(), 250);
              }}
              prefetch="intent"
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
function HeaderCtas({isLoggedIn, cart, isMobile, closeMenu, closeAside}) {
  return (
    <nav className="header-ctas" role="navigation">
      <SearchToggle isMobile={isMobile} closeMenu={closeMenu} />
      {isMobile ? null : (
        <NavLink
          prefetch="intent"
          to={isLoggedIn ? '/account/profile' : '/account/login'}
          style={activeLinkStyle}
          onClick={closeAside}
        >
          {isLoggedIn ? 'Account' : 'Log in'}
        </NavLink>
      )}
      <CartToggle cart={cart} isMobile={isMobile} closeMenu={closeMenu} />
    </nav>
  );
}

function HeaderMenuMobileToggle({isOpen, toggleMenu}) {
  const href = !isOpen ? '#x' : '#mobile-menu-aside';

  return (
    <button
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        marginTop: '5px',
      }}
      className="header-menu-mobile-toggle"
      onClick={toggleMenu}
    >
      <img src={isOpen ? x : menu} alt="menu-toggle" />
    </button>
  );
}

function SearchToggle({isMobile, closeMenu}) {
  const {hash} = useLocation();

  const params = useParams();
  const fetcher = useFetcher({
    key: 'search',
  });

  const {results, totalResults, searchInputRef, searchTerm, state} =
    usePredictiveSearch();

  function goToSearchResult(event) {
    if (!searchInputRef.current) return;
    searchInputRef.current.blur();
    searchInputRef.current.value = '';
    // close the aside
    window.location.href = event.currentTarget.href;
  }

  function clearSearch() {
    if (searchInputRef.current) {
      searchInputRef.current.blur();
      searchInputRef.current.value = '';
    }

    const searchAction = '/api/predictive-search';
    const newSearchTerm = '';
    const localizedAction = params.locale
      ? `/${params.locale}${searchAction}`
      : searchAction;

    fetcher.submit(
      {q: newSearchTerm, limit: '4'},
      {method: 'GET', action: localizedAction},
    );
  }

  return (
    <>
      {isMobile ? (
        <a
          href={hash === '#search-aside' ? '#x' : '#search-aside'}
          onClick={() => {
            clearSearch();
            closeMenu();
          }}
        >
          <img src={search} />{' '}
        </a>
      ) : (
        <a
          href={hash === '#search-aside' ? '#x' : '#search-aside'}
          onClick={clearSearch}
        >
          Search
        </a>
      )}
    </>
  );
}

/**
 * @param {{count: number}}
 */
function CartBadge({count, isMobile, closeMenu}) {
  function toggleScroll() {
    document.body.classList.toggle('no-scroll');
  }
  return (
    <>
      {isMobile ? (
        <a
          href="#cart-aside"
          onClick={() => {
            toggleScroll();
            closeMenu();
          }}
        >
          <img src={cart} />
        </a>
      ) : (
        <a href="#cart-aside">Bag ({count})</a>
      )}
    </>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart, isMobile, closeMenu}) {
  return (
    <Suspense
      fallback={
        <CartBadge isMobile={isMobile} count={0} closeMenu={closeMenu} />
      }
    >
      <Await resolve={cart}>
        {(cart) => {
          if (!cart)
            return (
              <CartBadge isMobile={isMobile} count={0} closeMenu={closeMenu} />
            );
          return (
            <CartBadge
              isMobile={isMobile}
              count={cart.totalQuantity || 0}
              closeMenu={closeMenu}
            />
          );
        }}
      </Await>
    </Suspense>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/191401492558',
  items: [
    {
      id: 'gid://shopify/MenuItem/444996321358',
      items: [],
      resourceId: null,
      tags: [],
      title: 'New Arrivals',
      type: 'HTTP',
      url: 'https://dumby-veneda.myshopify.com/collections/new_arrivals',
    },
    {
      id: 'gid://shopify/MenuItem/444996354126',
      items: [
        {
          id: 'gid://shopify/MenuItem/445625139278',
          resourceId: 'gid://shopify/Collection/277859336270',
          tags: [],
          title: 'Rings',
          type: 'COLLECTION',
          url: 'https://dumby-veneda.myshopify.com/collections/rings',
        },
        {
          id: 'gid://shopify/MenuItem/445623304270',
          resourceId: 'gid://shopify/Collection/277859369038',
          tags: [],
          title: 'Necklaces',
          type: 'COLLECTION',
          url: 'https://dumby-veneda.myshopify.com/collections/necklaces',
        },
        {
          id: 'gid://shopify/MenuItem/445625073742',
          resourceId: 'gid://shopify/Collection/277859401806',
          tags: [],
          title: 'Earrings',
          type: 'COLLECTION',
          url: 'https://dumby-veneda.myshopify.com/collections/earrings',
        },
        {
          id: 'gid://shopify/MenuItem/445625106510',
          resourceId: 'gid://shopify/Collection/278376218702',
          tags: [],
          title: 'Bracelets',
          type: 'COLLECTION',
          url: 'https://dumby-veneda.myshopify.com/collections/bracelets',
        },
        {
          id: 'gid://shopify/MenuItem/445625172046',
          resourceId: null,
          tags: [],
          title: 'All',
          type: 'CATALOG',
          url: 'https://dumby-veneda.myshopify.com/collections/all',
        },
      ],
      resourceId: null,
      tags: [],
      title: 'Shop',
      type: 'CATALOG',
      url: 'https://dumby-veneda.myshopify.com/collections/all',
    },
    {
      id: 'gid://shopify/MenuItem/444996386894',
      items: [],
      resourceId: 'gid://shopify/Page/93070065742',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: 'https://dumby-veneda.myshopify.com/pages/about',
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
