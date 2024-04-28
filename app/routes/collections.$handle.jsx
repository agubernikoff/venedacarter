import {json, redirect} from '@shopify/remix-oxygen';
import {
  useLocation,
  useLoaderData,
  Link,
  useSearchParams,
} from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {FeaturedProduct} from './_index';
import {useState, useEffect} from 'react';
import {AnimatePresence, motion} from 'framer-motion';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection?.title ?? ''} Collection`}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, params, context}) {
  const {handle} = params;
  const {storefront} = context;
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const sortKey = searchParams.get('sortkey')
    ? String(searchParams.get('sortkey'))
    : null;
  const reverse = Boolean(searchParams.get('reverse'));
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  if (!handle) {
    return redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {
      sortKey: handle !== 'all' ? sortKey : null,
      reverse,
      handle,
      ...paginationVariables,
    },
  });
  const {products} = await storefront.query(ALL_QUERY, {
    variables: {
      sortKey: handle === 'all' ? sortKey : null,
      reverse,
      ...paginationVariables,
    },
  });

  if (!collection && handle !== 'all') {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }
  if (collection) return json({collection});
  else return json({products});
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {collection, products} = useLoaderData();

  const {pathname} = useLocation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  function toggleFilter() {
    setIsFilterOpen(!isFilterOpen);
    document.body.classList.toggle('no-scroll', !isFilterOpen);
  }
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    window
      .matchMedia('(max-width:44em)')
      .addEventListener('change', (e) => setIsMobile(e.matches));
    if (window.matchMedia('(max-width:44em)').matches) setIsMobile(true);
  }, []);

  return (
    <div className={isMobile ? 'home-mobile' : 'home'}>
      <AnimatePresence mode="wait">
        {isFilterOpen && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            style={{zIndex: 5}}
          >
            <FilterAside isMobile={isMobile} toggleFilter={toggleFilter} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className={isMobile ? 'title-container-mobile' : 'title-container'}>
        <p className="collection-title">{`Shop/${
          !pathname.includes('all') ? collection.title : 'All'
        }`}</p>
        <motion.button
          layoutId="abc"
          transition={{ease: 'easeInOut'}}
          className="collection-title"
          onClick={() => toggleFilter()}
        >
          Filter +
        </motion.button>
      </div>
      <Pagination
        connection={!pathname.includes('all') ? collection.products : products}
      >
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <>
            <PreviousLink>
              {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
            </PreviousLink>
            <ProductsGrid products={nodes} />

            <NextLink>
              {isLoading ? 'Loading...' : <span>Load more ↓</span>}
            </NextLink>
          </>
        )}
      </Pagination>
    </div>
  );
}

/**
 * @param {{products: ProductItemFragment[]}}
 */
function ProductsGrid({products}) {
  return (
    <>
      {products.map((product, index) => {
        return (
          <FeaturedProduct
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        );
      })}
    </>
  );
}

/**
 * @param {{
 *   product: ProductItemFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
function ProductItem({product, loading}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);
  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {product.featuredImage && (
        <Image
          alt={product.featuredImage.altText || product.title}
          aspectRatio="1/1"
          data={product.featuredImage}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}

function FilterAside({isMobile, toggleFilter}) {
  const {pathname, search, hash} = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = new URLSearchParams(search);

  useEffect(() => {
    if (hash && hash !== '#x') toggleFilter();
    if (!pathname.includes('collections')) toggleFilter();
  }, [hash, toggleFilter, pathname]);
  return (
    <div
      aria-modal
      className="filter-overlay"
      id={isMobile ? 'filter-aside-mobile' : 'filter-aside'}
      role="dialog"
    >
      {isMobile ? null : (
        <button
          className="close-outside"
          onClick={(e) => {
            toggleFilter();
          }}
        />
      )}
      <motion.div
        initial={!isMobile ? {x: 400} : null}
        animate={!isMobile ? {x: 0} : null}
        exit={!isMobile ? {x: 400} : null}
        transition={{ease: 'easeInOut'}}
        className="filter-container"
      >
        {isMobile ? null : (
          <header className="title-container">
            <motion.button
              layoutId="abc"
              transition={{ease: 'easeInOut'}}
              className="collection-title"
              onClick={() => toggleFilter()}
            >
              Filter +
            </motion.button>
          </header>
        )}
        <main>
          <div className="filters-container">
            <p className="filter-header-bold">Sort By:</p>
            <div className="filter-selection-container">
              <button className="filter-selection">Featured</button>

              <button
                className="filter-selection"
                onClick={() => {
                  params.set('sortkey', 'PRICE');
                  params.delete('reverse');
                }}
              >
                Price: Low to High
              </button>
              <button
                className="filter-selection"
                onClick={() => {
                  params.set('sortkey', 'PRICE');
                  params.set('reverse', 'true');
                }}
              >
                Price: High to Low
              </button>
              <button
                className="filter-selection"
                onClick={() => {
                  params.set(
                    'sortkey',
                    pathname.includes('all') ? 'CREATED_AT' : 'CREATED',
                  );
                  params.set('reverse', 'true');
                }}
              >
                Date: New to Old
              </button>
              <button
                className="filter-selection"
                onClick={() => {
                  params.set(
                    'sortkey',
                    pathname.includes('all') ? 'CREATED_AT' : 'CREATED',
                  );
                  params.delete('reverse');
                }}
              >
                Date: Old to New
              </button>
            </div>
            <p className="filter-header-bold">Materials:</p>
            <div className="filter-selection-container">
              <button className="filter-selection">Sterling Silver</button>
              <button className="filter-selection">Gold Vermeil</button>
              <button className="filter-selection">
                14k Solid Yellow Gold
              </button>
              <button className="filter-selection">14k Solid White Gold</button>
            </div>
          </div>
          <div className="filter-submit-container">
            <button
              className="show-results-button"
              onClick={() => {
                setSearchParams(params, {
                  preventScrollReset: true,
                });
                toggleFilter();
              }}
            >
              Show Results
            </button>
            <button
              className="clear-flter-button"
              onClick={() => {
                setSearchParams(
                  {},
                  {
                    preventScrollReset: true,
                  },
                );
                toggleFilter();
              }}
            >
              Clear Filter
            </button>
          </div>
        </main>
      </motion.div>
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    options {
      name
      values
    }
    images(first: 2) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortKey,
        reverse: $reverse,
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

const ALL_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: $sortKey,
      reverse: $reverse,
    ) {
      nodes {
        ...ProductItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
