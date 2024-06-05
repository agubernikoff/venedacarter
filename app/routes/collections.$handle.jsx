import {json, redirect} from '@shopify/remix-oxygen';
import {
  useLocation,
  useLoaderData,
  Link,
  useSearchParams,
  useNavigate,
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
import {useInView} from 'react-intersection-observer';
import x2 from '../assets/X2.png';

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
  const filterFromParams = String(searchParams.get('filter') || '');
  const isFeatured = Boolean(searchParams.get('isFeatured'));
  const filter = filterFromParams
    ? [
        {
          variantOption: {name: 'Material', value: filterFromParams},
        },
      ]
    : [];
  const featuredFilter = {
    productMetafield: {
      key: 'featured',
      namespace: 'custom',
      value: 'true',
    },
  };

  if (isFeatured && handle !== 'all' && handle !== 'new_arrivals')
    filter.push(featuredFilter);

  const filterAll = filterFromParams
    ? `variantOption.value:${filterFromParams}`
    : '';
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 6,
  });

  if (!handle) {
    return redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {
      sortKey:
        handle !== 'all' && handle !== 'new_arrivals'
          ? sortKey
          : handle === 'new_arrivals'
          ? 'CREATED'
          : null,
      reverse: handle !== 'new_arrivals' ? reverse : true,
      handle:
        (handle === 'all' || handle === 'new_arrivals') && isFeatured
          ? 'frontpage'
          : handle,
      productFilter: filter,
      ...paginationVariables,
    },
  });
  const {products} =
    handle === 'all'
      ? await storefront.query(ALL_QUERY, {
          variables: {
            sortKey:
              handle === 'all' || handle === 'new_arrivals'
                ? sortKey || null
                : null,
            reverse,
            query: filterAll,
            ...paginationVariables,
          },
        })
      : await storefront.query(NEW_ARRIVALS_QUERY, {
          variables: {
            query: filterAll,
          },
        });

  if (handle === 'new_arrivals' && sortKey === 'PRICE') {
    if (reverse)
      products.nodes.sort(
        (a, b) =>
          b.priceRange.minVariantPrice.amount -
          a.priceRange.minVariantPrice.amount,
      );
    else
      products.nodes.sort(
        (a, b) =>
          a.priceRange.minVariantPrice.amount -
          b.priceRange.minVariantPrice.amount,
      );
  }

  if (!collection && handle !== 'all' && handle !== 'new_arrivals') {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }
  if (collection) return json({collection});
  else return json({products});
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {ref, inView, entry} = useInView();
  const {collection, products} = useLoaderData();

  const {pathname, search} = useLocation();

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
        <p className="collection-title">
          <Link to="/" className="home-link">
            Home
          </Link>{' '}
          /{' '}
          {!pathname.includes('all') && !pathname.includes('new_arrivals')
            ? collection.title
            : pathname.includes('new_arrivals')
            ? 'New Arrivals'
            : 'All'}
        </p>
        <button className="collection-title" onClick={() => toggleFilter()}>
          {isFilterOpen && isMobile ? 'Close -' : 'Filter +'}
        </button>
      </div>
      <Pagination
        connection={
          (!pathname.includes('all') && !pathname.includes('new_arrivals')) ||
          search.includes('isFeatured=true')
            ? collection.products
            : products
        }
      >
        {({nodes, NextLink, hasNextPage, nextPageUrl, state}) => (
          <>
            <ProductsLoadedOnScroll
              nodes={nodes}
              inView={inView}
              hasNextPage={hasNextPage}
              nextPageUrl={nextPageUrl}
              state={state}
              isMobile={isMobile}
            />
            <NextLink ref={ref}></NextLink>
          </>
        )}
      </Pagination>
    </div>
  );
}

function ProductsLoadedOnScroll({
  nodes,
  inView,
  hasNextPage,
  nextPageUrl,
  state,
  isMobile,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (inView && hasNextPage) {
      navigate(nextPageUrl, {
        replace: true,
        preventScrollReset: true,
        state,
      });
    }
  }, [inView, navigate, state, nextPageUrl, hasNextPage]);

  return <ProductsGrid products={nodes} isMobile={isMobile} />;
}

/**
 * @param {{products: ProductItemFragment[]}}
 */
function ProductsGrid({products, isMobile}) {
  const columns = isMobile ? 2 : 3;
  const itemsInLastRow = products.length % columns;
  const firstItemInLastRow = products.length - itemsInLastRow;
  const firstItemInSecondLastRow = firstItemInLastRow - columns;
  const lastItemInSecondLastRow = firstItemInLastRow - 1;
  return (
    <>
      {products.map((product, index) => {
        return (
          <FeaturedProduct
            isMobile={isMobile}
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
            emptyCellBelow={
              itemsInLastRow !== 0 &&
              index >= firstItemInSecondLastRow &&
              index <= lastItemInSecondLastRow &&
              index + columns >= products.length
            }
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
  const [sort, setSort] = useState();
  const [rev, setRev] = useState(false);
  const [mat, setMat] = useState();
  const [feat, setFeat] = useState();

  useEffect(() => {
    if (hash && hash !== '#x') toggleFilter();
    if (!pathname.includes('collections')) toggleFilter();
  }, [hash, toggleFilter, pathname]);

  useEffect(() => {
    if (searchParams.get('sortkey')) setSort(searchParams.get('sortkey'));
    if (searchParams.get('reverse')) setRev(searchParams.get('reverse'));
    if (searchParams.get('filter')) setMat(searchParams.get('filter'));
    if (searchParams.get('isFeatured')) setFeat(true);
  }, [searchParams]);
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
      <div className="filter-container">
        {isMobile ? null : (
          <header className="title-container">
            <button className="collection-title" style={{cursor: 'auto'}}>
              Filter +
            </button>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                marginRight: '1rem',
                padding: 0,
                cursor: 'pointer',
              }}
              onClick={toggleFilter}
            >
              <img src={x2} style={{maxWidth: '1vw'}} />
            </button>
          </header>
        )}
        <main>
          <div className="filters-container">
            <p className="filter-header-bold">Sort By:</p>
            <div className="filter-selection-container">
              <button
                className="filter-selection"
                onClick={() => {
                  setFeat(true);
                  setRev(false);
                  setSort(null);
                }}
                style={feat ? {textDecoration: 'underline'} : null}
              >
                Featured
              </button>
              <button
                className="filter-selection"
                onClick={() => {
                  setSort('PRICE');
                  setRev('');
                  setFeat(false);
                }}
                style={
                  sort === 'PRICE' && !rev
                    ? {textDecoration: 'underline'}
                    : null
                }
              >
                Price: Low to High
              </button>
              <button
                className="filter-selection"
                onClick={() => {
                  setSort('PRICE');
                  setRev('true');
                  setFeat(false);
                }}
                style={
                  sort === 'PRICE' && rev === 'true'
                    ? {textDecoration: 'underline'}
                    : null
                }
              >
                Price: High to Low
              </button>
              {!pathname.includes('new_arrivals') ? (
                <>
                  <button
                    className="filter-selection"
                    onClick={() => {
                      setSort(
                        pathname.includes('all') ? 'CREATED_AT' : 'CREATED',
                      );
                      setRev('true');
                      setFeat(false);
                    }}
                    style={
                      (sort === 'CREATED_AT' || sort === 'CREATED') &&
                      rev === 'true'
                        ? {textDecoration: 'underline'}
                        : null
                    }
                  >
                    Date: New to Old
                  </button>
                  <button
                    className="filter-selection"
                    onClick={() => {
                      setSort(
                        pathname.includes('all') ? 'CREATED_AT' : 'CREATED',
                      );
                      setRev('');
                      setFeat(false);
                    }}
                    style={
                      (sort === 'CREATED_AT' || sort === 'CREATED') && !rev
                        ? {textDecoration: 'underline'}
                        : null
                    }
                  >
                    Date: Old to New
                  </button>
                </>
              ) : null}
            </div>
            <p className="filter-header-bold">Materials:</p>
            <div className="filter-selection-container">
              <button
                className="filter-selection"
                onClick={() => {
                  setMat('Sterling Silver');
                }}
                style={
                  mat === 'Sterling Silver'
                    ? {textDecoration: 'underline'}
                    : null
                }
              >
                Sterling Silver
              </button>
              <button
                className="filter-selection"
                onClick={() => {
                  setMat('Gold Vermeil');
                }}
                style={
                  mat === 'Gold Vermeil' ? {textDecoration: 'underline'} : null
                }
              >
                Gold Vermeil
              </button>
              <button
                className="filter-selection"
                onClick={() => {
                  setMat('14k Solid Yellow Gold');
                }}
                style={
                  mat === '14k Solid Yellow Gold'
                    ? {textDecoration: 'underline'}
                    : null
                }
              >
                14k Solid Yellow Gold
              </button>
              <button
                className="filter-selection"
                onClick={() => {
                  setMat('14k Solid White Gold');
                }}
                style={
                  mat === '14k Solid White Gold'
                    ? {textDecoration: 'underline'}
                    : null
                }
              >
                14k Solid White Gold
              </button>
            </div>
          </div>
          <div className="filter-submit-container">
            <button
              className={isMobile ? 'profile-button' : 'show-results-button'}
              onClick={() => {
                if (sort) params.set('sortkey', sort);
                else params.set('sortkey', '');
                if (rev) params.set('reverse', true);
                else params.set('reverse', '');
                if (mat) params.set('filter', mat);
                else params.set('filter', '');
                if (feat) params.set('isFeatured', true);
                else params.set('isFeatured', '');
                setSearchParams(params, {
                  preventScrollReset: true,
                });
                toggleFilter();
              }}
            >
              Show Results
            </button>
            <button
              className={
                isMobile ? 'profile-button-clear' : 'clear-flter-button'
              }
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
      </div>
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
    $productFilter: [ProductFilter!]
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
        filters: $productFilter
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
    $query: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: $sortKey,
      reverse: $reverse,
      query: $query
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

const NEW_ARRIVALS_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $query: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: 12,
      sortKey: CREATED_AT,
      reverse: true,
      query: $query
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
