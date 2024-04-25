import React, {Suspense, useState, useEffect, useRef} from 'react';
import {defer, redirect} from '@shopify/remix-oxygen';
import {Await, Link, useLoaderData} from '@remix-run/react';
import size from '../assets/size.png';
import colorPicker from '~/helper/ColorPicker';

import {
  Image,
  Money,
  VariantSelector,
  getSelectedProductOptions,
  CartForm,
} from '@shopify/hydrogen';
import {getVariantUrl} from '~/lib/variants';
import {FeaturedProduct} from './_index';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.product.title ?? ''}`}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({params, request, context}) {
  const {handle} = params;
  const {storefront} = context;

  const selectedOptions = getSelectedProductOptions(request).filter(
    (option) =>
      // Filter out Shopify predictive search query params
      !option.name.startsWith('_sid') &&
      !option.name.startsWith('_pos') &&
      !option.name.startsWith('_psq') &&
      !option.name.startsWith('_ss') &&
      !option.name.startsWith('_v') &&
      // Filter out third party tracking params
      !option.name.startsWith('fbclid'),
  );

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // await the query for the critical product data
  const {product} = await storefront.query(PRODUCT_QUERY, {
    variables: {handle, selectedOptions},
  });

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option) => option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    // if no selected variant was returned from the selected options,
    // we redirect to the first variant's url with it's selected options applied
    if (!product.selectedVariant) {
      throw redirectToFirstVariant({product, request});
    }
  }

  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deffered query resolves, the UI will update.
  const variants = storefront.query(VARIANTS_QUERY, {
    variables: {handle},
  });

  const collectionId = product.collections.nodes.find(
    (node) =>
      node.title !== 'Featured Products' || node.title !== 'New Arrivals',
  ).id;

  const recs = storefront.query(RECOMMENDATIONS_QUERY, {
    variables: {id: collectionId},
  });

  return defer({product, variants, recs});
}

/**
 * @param {{
 *   product: ProductFragment;
 *   request: Request;
 * }}
 */
function redirectToFirstVariant({product, request}) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    {
      status: 302,
    },
  );
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, variants, recs} = useLoaderData();
  const {selectedVariant} = product;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    window
      .matchMedia('(max-width:44em)')
      .addEventListener('change', (e) => setIsMobile(e.matches));
    if (window.matchMedia('(max-width:44em)').matches) setIsMobile(true);
  }, []);

  console.log(
    'pppppp',
    product.collections.nodes.find(
      (node) =>
        node.title !== 'Featured Products' && node.title !== 'New Arrivals',
    ),
  );
  console.log('rrrrrrr', recs);
  return (
    <>
      <div className={isMobile ? 'product-mobile' : 'product'}>
        <ProductImage
          images={product?.images.nodes}
          selectedVariant={selectedVariant}
          isMobile={isMobile}
        />
        <ProductMain
          selectedVariant={selectedVariant}
          product={product}
          variants={variants}
          isMobile={isMobile}
        />
      </div>
      <ProductRecommendations
        isMobile={isMobile}
        recs={recs}
        product={product}
      />
    </>
  );
}

/**
 * @param {{image: ProductVariantFragment['image']}}
 */
function ProductImage({images, selectedVariant, isMobile}) {
  if (!images) {
    return (
      <div className="product-image">
        <Image
          alt={selectedVariant.image.altText || 'Product Image'}
          aspectRatio="1/1"
          data={selectedVariant.image}
          sizes="(min-width: 45em) 50vw, 100vw"
        />
      </div>
    );
  }
  return (
    <div className="product-image">
      {images
        .filter((i) => i.altText === selectedVariant.image.altText)
        .map((image) => (
          <Image
            alt={image.altText || 'Product Image'}
            aspectRatio="1/1"
            data={image}
            key={image.id}
            sizes="(min-width: 45em) 50vw, 100vw"
          />
        ))}
    </div>
  );
}

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductFragment['selectedVariant'];
 *   variants: Promise<ProductVariantsQuery>;
 * }}
 */
function ProductMain({selectedVariant, product, variants, isMobile}) {
  const {title, descriptionHtml} = product;
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const sizeGuideRef = useRef(null);

  useEffect(() => {
    const handleEscapeKeyPress = (event) => {
      if (event.key === 'Escape') {
        setIsSizeGuideOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      if (
        sizeGuideRef.current &&
        !sizeGuideRef.current.contains(event.target)
      ) {
        setIsSizeGuideOpen(false);
      }
    };

    if (isSizeGuideOpen) {
      document.addEventListener('keydown', handleEscapeKeyPress);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKeyPress);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSizeGuideOpen]);

  const firstSpaceIndex = title.indexOf(' ');

  const firstPart = title.slice(0, firstSpaceIndex + 1);
  const secondPart = title.slice(firstSpaceIndex + 1);

  return (
    <div className={isMobile ? 'product-main-mobile' : 'product-main'}>
      <div
        className={isMobile ? 'product-main-top-mobile' : 'product-main-top'}
      >
        {isMobile ? null : <p className="breadcrumbs">Shop/{title}</p>}
        <div
          className={
            isMobile ? 'product-main-title-mobile' : 'product-main-title'
          }
        >
          <div className={isMobile ? 'title-dissect-mobile' : 'title-dissect'}>
            <p>{firstPart}</p>
            <p>{secondPart}</p>
          </div>
          <ProductPrice selectedVariant={selectedVariant} isMobile={isMobile} />
        </div>
      </div>
      <div
        className={
          isMobile ? 'product-main-middle-mobile' : 'product-main-middle'
        }
      >
        <div
          className={
            isMobile
              ? 'product-main-description-mobile'
              : 'product-main-description'
          }
          dangerouslySetInnerHTML={{__html: descriptionHtml}}
        />
        <div className={isMobile ? 'size-guide-mobile' : 'size-guide'}>
          <p
            style={{textDecoration: 'underline', cursor: 'pointer'}}
            onClick={() => setIsSizeGuideOpen(true)}
          >
            Size Guide
          </p>
          {isSizeGuideOpen && (
            <div className="size-guide-overlay">
              <div className="size-guide-popup" ref={sizeGuideRef}>
                <img src={size} alt="Size Guide" className="size-guide-image" />
                <button
                  className="close-button"
                  onClick={() => setIsSizeGuideOpen(false)}
                >
                  X
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className={
          isMobile ? 'product-main-bottom-mobile' : 'product-main-bottom'
        }
      >
        <Suspense
          fallback={
            <ProductForm
              product={product}
              selectedVariant={selectedVariant}
              variants={[]}
              isMobile={isMobile}
            />
          }
        >
          <Await
            errorElement="There was a problem loading product variants"
            resolve={variants}
          >
            {(data) => (
              <ProductForm
                product={product}
                selectedVariant={selectedVariant}
                variants={data.product?.variants.nodes || []}
                isMobile={isMobile}
              />
            )}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   selectedVariant: ProductFragment['selectedVariant'];
 * }}
 */
function ProductPrice({selectedVariant, isMobile}) {
  return (
    <div className={isMobile ? 'product-price-mobile' : 'product-price'}>
      {selectedVariant?.compareAtPrice ? (
        <>
          <p>Sale</p>
          <br />
          <div className="product-price-on-sale">
            {selectedVariant ? <Money data={selectedVariant.price} /> : null}
            <s>
              <Money data={selectedVariant.compareAtPrice} />
            </s>
          </div>
        </>
      ) : (
        selectedVariant?.price && <Money data={selectedVariant?.price} />
      )}
    </div>
  );
}

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductFragment['selectedVariant'];
 *   variants: Array<ProductVariantFragment>;
 * }}
 */
function ProductForm({product, selectedVariant, variants, isMobile}) {
  return (
    <div className={isMobile ? 'product-form-mobile' : 'product-form'}>
      <div
        className={
          isMobile
            ? 'product-options-container-mobile'
            : 'product-options-container'
        }
      >
        <VariantSelector
          handle={product.handle}
          options={product.options}
          variants={variants}
        >
          {({option}) => <ProductOptions key={option.name} option={option} />}
        </VariantSelector>
      </div>
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          window.location.href = window.location.href + '#cart-aside';
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                },
              ]
            : []
        }
        isMobile={isMobile}
      >
        {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
      </AddToCartButton>
    </div>
  );
}

/**
 * @param {{option: VariantOption}}
 */
function ProductOptions({option}) {
  console.log('ooooo', option);
  return (
    <div className="product-options" key={option.name}>
      <p style={{marginBottom: '1%'}}>{option.name.toUpperCase()}</p>
      <div className="product-options-grid">
        {option.values.map(({value, isAvailable, isActive, to}) => {
          return (
            <Link
              className="product-options-item"
              key={option.name + value}
              prefetch="intent"
              preventScrollReset
              replace
              to={to}
              style={{
                backgroundColor: isActive ? 'black' : 'transparent',
                color: isActive ? 'white' : 'black',
                opacity: isAvailable ? 1 : 0.3,
              }}
            >
              {option.name === 'Material' ? (
                <div
                  className="circle"
                  style={{background: colorPicker(value)}}
                  key={value}
                />
              ) : null}
              <span>{value}</span>
            </Link>
          );
        })}
      </div>
      <br />
    </div>
  );
}

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: CartLineInput[];
 *   onClick?: () => void;
 * }}
 */
function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  isMobile,
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            className={
              isMobile ? 'add-to-cart-button-mobile' : 'add-to-cart-button'
            }
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
          >
            {children.toUpperCase()}
          </button>
        </>
      )}
    </CartForm>
  );
}

function ProductRecommendations({recs, product}) {
  return (
    <Suspense>
      <Await resolve={recs}>
        {(recs) => (
          <div className="home">
            {recs.collection.products.nodes
              .filter((rec) => rec.id !== product.id)
              .map((rec) => (
                <FeaturedProduct product={rec} key={rec.id} />
              ))}
          </div>
        )}
      </Await>
    </Suspense>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    collections(first:3){
      nodes{
        title
        id
      }
    }
    images(first: 8) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
`;

const RECOMMENDATIONS_QUERY = `#graphql
query ($id: ID) {
  collection(id: $id) {
    title
    products(first: 4) {
      nodes {
        id
        title
        handle
        options {
          name
          values
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
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
      }
    }
  }
}
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('storefrontapi.generated').ProductVariantsQuery} ProductVariantsQuery */
/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */
/** @typedef {import('@shopify/hydrogen').VariantOption} VariantOption */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').CartLineInput} CartLineInput */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').SelectedOption} SelectedOption */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
