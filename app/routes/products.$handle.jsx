import React, {Suspense, useState, useEffect, useRef} from 'react';
import {defer, redirect} from '@shopify/remix-oxygen';
import {Await, Link, useLoaderData, useLocation} from '@remix-run/react';
import size from '../assets/size.png';
import colorPicker from '~/helper/ColorPicker';
import x2 from '../assets/X2.png';
import rings from '../assets/ring-guide.png';
import bracelets from '../assets/bracelet-guide.png';
import necklaces from '../assets/necklace-guide.png';

import {
  Image,
  Money,
  VariantSelector,
  getSelectedProductOptions,
  CartForm,
} from '@shopify/hydrogen';
import {getVariantUrl} from '~/lib/variants';
import {FeaturedProduct} from './_index';
import {CUSTOMER_EMAIL_QUERY} from '../graphql/customer-account/CustomerDetailsQuery';
import {useRootLoaderData} from '~/root';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [
    {title: `Veneda Carter | ${data?.product?.title ?? ''}`},
    {property: 'og:title', content: data?.product?.title},
    {property: 'og:image', content: data?.product?.images?.nodes[0].url},
  ];
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

  const collectionHandle = product.collections.nodes.find(
    (node) =>
      node.title !== 'Featured Products' || node.title !== 'New Arrivals',
  )?.handle;

  const recs = storefront.query(RECOMMENDATIONS_QUERY, {
    variables: {handle: collectionHandle || 'featured-products'},
  });

  const token = context.session.get('customerAccessToken');
  const customer = token
    ? await storefront.query(CUSTOMER_EMAIL_QUERY, {
        variables: {cutomerAccessToken: token},
      })
    : null;

  return defer({product, variants, recs, customer});
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
  const {product, variants, recs, customer} = useLoaderData();
  const {selectedVariant} = product;
  const {isMobileRoot} = useRootLoaderData();
  const [isMobile, setIsMobile] = useState(isMobileRoot);
  const productDiv = useRef();

  function scrollToTopOfProductImages() {
    productDiv.current.scrollTop = 0;
  }
  useEffect(() => {
    window
      .matchMedia('(max-width:44em)')
      .addEventListener('change', (e) => setIsMobile(e.matches));
    if (window.matchMedia('(max-width:44em)').matches) setIsMobile(true);
  }, []);

  useEffect(() => scrollToTopOfProductImages(), [product]);

  return (
    <>
      <div ref={productDiv} className={isMobile ? 'product-mobile' : 'product'}>
        <ProductMain
          selectedVariant={selectedVariant}
          product={product}
          variants={variants}
          isMobile={isMobile}
          customer={customer}
        />
        <ProductImage
          images={product?.images.nodes}
          selectedVariant={selectedVariant}
          isMobile={isMobile}
          productTitle={product.title}
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
function ProductImage({images, selectedVariant, isMobile, productTitle}) {
  const [imageIndex, setImageIndex] = useState(0);

  const filteredImages = images.filter((i) => {
    if (selectedVariant?.availableForSale || !i?.altText)
      return (
        i?.altText?.toLowerCase() ===
        selectedVariant?.image?.altText?.toLowerCase()
      );
    else
      return selectedVariant.title
        .toLowerCase()
        .includes(i?.altText?.toLowerCase());
  });
  const {pathname} = useLocation();
  if (pathname.includes('gift-card'))
    filteredImages.splice(0, filteredImages.length - 1);

  function handleScroll(scrollWidth, scrollLeft) {
    const widthOfAnImage = scrollWidth / filteredImages.length;
    const dividend = scrollLeft / widthOfAnImage;
    const rounded = parseFloat((scrollLeft / widthOfAnImage).toFixed(0));

    if (Math.abs(dividend - rounded) < 0.001) setImageIndex(rounded);
  }

  const mappedIndicators =
    filteredImages.length > 1
      ? filteredImages.map((e, i) => (
          <div
            key={e.id}
            className="circle"
            style={{
              background: i === imageIndex ? 'black' : 'grey',
              height: '10px',
              width: '10px',
            }}
          ></div>
        ))
      : null;

  useEffect(() => {
    setImageIndex(0);
  }, [selectedVariant]);

  if (!images) {
    return (
      // <div className="product-image">
      <Image
        className="product-image"
        alt={selectedVariant?.image?.altText || 'Product Image'}
        aspectRatio="1/1"
        data={selectedVariant?.image}
        sizes="(min-width: 45em) 50vw, 100vw"
        height={2000}
        width={2000}
      />
      // </div>
    );
  }
  return isMobile ? (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: 'fit-content',
          gap: '.2rem',
          transform: 'translateY(-400%)',
          zIndex: 2,
          margin: 'auto',
        }}
      >
        {mappedIndicators}
      </div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: '100vw',
          overflow: 'scroll',
          scrollSnapType: 'x mandatory',
          alignItems: 'flex-end',
        }}
        className="mobile-images-div-just-need-a-classname-to-remove-scrollbar"
        onScroll={(e) =>
          handleScroll(e.target.scrollWidth, e.target.scrollLeft)
        }
      >
        {filteredImages.map((i) => (
          <div key={i.id}>
            <Image
              className="product-image"
              alt={i.altText || 'Product Image'}
              aspectRatio="1/1"
              data={i}
              sizes="(min-width: 45em) 50vw, 100vw"
              height={2000}
              width={2000}
              style={{width: '100vw'}}
            />
          </div>
        ))}
      </div>
    </>
  ) : (
    filteredImages.map((image, i) => (
      <div
        key={image.id}
        className="product-image"
        style={
          i === 0
            ? pathname.includes('gift-card')
              ? {position: 'absolute', top: 0, background: '#eaeaea'}
              : productTitle.toLowerCase().includes('necklace') ||
                productTitle.toLowerCase().includes('chain')
              ? {position: 'absolute', top: 0, alignItems: 'start'}
              : {position: 'absolute', top: 0}
            : productTitle.toLowerCase().includes('necklace') ||
              productTitle.toLowerCase().includes('chain')
            ? {alignItems: 'start'}
            : null
        }
      >
        <Image
          alt={image?.altText || 'Product Image'}
          aspectRatio="1/1"
          data={image}
          sizes="(min-width: 45em) 50vw, 100vw"
          height={2000}
          width={2000}
        />
      </div>
    ))
  );
}

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductFragment['selectedVariant'];
 *   variants: Promise<ProductVariantsQuery>;
 * }}
 */
function ProductMain({selectedVariant, product, variants, isMobile, customer}) {
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

  const getRelevantCollectionType = (product) => {
    const keywords = ['rings', 'bracelets', 'necklaces', 'earrings'];
    const nodes = product.collections.nodes;

    for (let i = 0; i < nodes.length; i++) {
      const titleWords = nodes[i].title.toLowerCase().split(' ');

      for (let keyword of keywords) {
        if (titleWords.includes(keyword)) {
          return keyword;
        }
      }
    }
    return null;
  };

  const collectionType = getRelevantCollectionType(product);

  let imageSrc = null;

  if (collectionType === 'rings') {
    imageSrc = rings;
  } else if (collectionType === 'bracelets') {
    imageSrc = bracelets;
  } else if (collectionType === 'necklaces') {
    imageSrc = necklaces;
  }

  return (
    <div className={isMobile ? 'product-main-mobile' : 'product-main'}>
      <div
        className={isMobile ? 'product-main-top-mobile' : 'product-main-top'}
      >
        {isMobile ? null : (
          <p className="breadcrumbs">
            <Link to="/collections/all" className="breadcrumbs-hover">
              Shop
            </Link>{' '}
            / {title}
          </p>
        )}
      </div>
      <div
        className={
          isMobile ? 'product-main-middle-mobile' : 'product-main-middle'
        }
      >
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

        <div
          className={
            isMobile
              ? 'product-main-description-mobile'
              : 'product-main-description'
          }
          dangerouslySetInnerHTML={{__html: descriptionHtml}}
        />
        {collectionType && collectionType !== 'earrings' ? (
          <div className={isMobile ? 'size-guide-mobile' : 'size-guide'}>
            <p
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
                width: 'fit-content',
              }}
              onClick={() => setIsSizeGuideOpen(true)}
            >
              Size Guide
            </p>
            {isSizeGuideOpen && (
              <div className="size-guide-overlay">
                <div className="size-guide-popup" ref={sizeGuideRef}>
                  <img
                    src={imageSrc}
                    alt={`${collectionType} Size Guide`}
                    className="size-guide-image"
                  />
                  <img
                    src={x2}
                    className="close-button"
                    onClick={() => setIsSizeGuideOpen(false)}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{borderBottom: '1px solid #eaeaea'}}>
            {/* Other content if needed */}
          </div>
        )}
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
      <div
        className={
          isMobile ? 'product-main-bottom-mobile' : 'product-main-bottom'
        }
      >
        <AddToCartButtonComponent
          selectedVariant={selectedVariant}
          isMobile={isMobile}
          customer={customer}
        />
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
    </div>
  );
}

function AddToCartButtonComponent({selectedVariant, isMobile, customer}) {
  return (
    <AddToCartButton
      selectedVariant={selectedVariant}
      disabled={!selectedVariant || !selectedVariant.availableForSale}
      onClick={() => {
        window.location.hash = '#cart-aside';
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
      customer={customer}
    >
      {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
    </AddToCartButton>
  );
}

/**
 * @param {{option: VariantOption}}
 */
function ProductOptions({option}) {
  return (
    <div className="product-options" key={option.name}>
      <p style={{marginBottom: '1%'}}>
        {option.name.toLowerCase() === 'metal' ||
        option.name.toLowerCase() === 'color' ||
        option.name.toLowerCase() === 'material'
          ? 'MATERIAL'
          : option.name.toUpperCase()}
      </p>
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
              {option.name.toLowerCase() === 'metal' ||
              option.name.toLowerCase() === 'color' ||
              option.name.toLowerCase() === 'material' ? (
                <div
                  className="circle"
                  style={{
                    background: colorPicker(value),
                    outline:
                      colorPicker(value) === 'black'
                        ? '1px solid white'
                        : 'none',
                  }}
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
  selectedVariant,
  customer,
}) {
  const [isOpen, setIsOpen] = useState(false);
  function closePopUp() {
    setIsOpen(false);
  }
  function subscribe(email, btn, originalText) {
    if (!email) {
      btn.innerText = 'PLEASE ENTER AN EMAIL';
      setTimeout(() => {
        btn.innerText = originalText;
      }, 1500);
      return;
    }
    const payload = {
      data: {
        type: 'back-in-stock-subscription',
        attributes: {
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: `${email}`,
              },
            },
          },
          channels: ['EMAIL'],
        },
        relationships: {
          variant: {
            data: {
              type: 'catalog-variant',
              id: `$shopify:::$default:::${
                selectedVariant.id.split('ProductVariant/')[1]
              }`,
            },
          },
        },
      },
    };

    var requestOptions = {
      mode: 'cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        revision: '2023-12-15',
      },
      body: JSON.stringify(payload),
    };
    fetch(
      'https://a.klaviyo.com/client/back-in-stock-subscriptions/?company_id=WzY7Xy',
      requestOptions,
    )
      .then((result) => {
        if (result.ok) {
          btn.innerText = 'YOUR NOTIFICATION HAS BEEN REGISTERED';
          setTimeout(() => {
            btn.innerText = originalText;
            closePopUp();
          }, 1500);
        } else {
          btn.innerText =
            'YOUR REQUEST COULD NOT BE COMPLETED. PLEASE EMAIL test@test.com TO BE NOTIFIED';
          setTimeout(() => {
            btn.innerText = originalText;
          }, 1500);
        }
      })
      .catch((error) => console.log('error', error));
  }
  return (
    <>
      <CartForm
        route="/cart"
        inputs={{lines}}
        action={CartForm.ACTIONS.LinesAdd}
      >
        {(fetcher) => (
          <>
            <input
              name="analytics"
              type="hidden"
              value={JSON.stringify(analytics)}
            />
            <button
              className={
                selectedVariant?.availableForSale
                  ? isMobile
                    ? 'profile-button-pdp'
                    : 'add-to-cart-button'
                  : isMobile
                  ? 'profile-button-sold-out'
                  : 'sold-out-cart-button'
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
      {selectedVariant?.availableForSale ? null : (
        <div className="out-stock-button-container">
          <button
            className={
              isMobile ? 'profile-button-clear-pdp' : 'out-stock-cart-button'
            }
            style={{cursor: 'pointer'}}
            onClick={(e) => {
              if (customer?.customer?.email)
                subscribe(
                  customer.customer.email,
                  e.target,
                  e.target.innerText,
                );
              else setIsOpen(true);
            }}
          >
            NOTIFY ME WHEN AVAILABLE
          </button>
        </div>
      )}
      {isOpen ? (
        <NotifyMePopUp
          closePopUp={closePopUp}
          selectedVariant={selectedVariant}
          subscribe={subscribe}
        />
      ) : null}
    </>
  );
}
function NotifyMePopUp({closePopUp, selectedVariant, subscribe}) {
  const [email, setEmail] = useState();
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closePopUp();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closePopUp]);

  return (
    <div onClick={closePopUp} className="notify-me-overlay">
      <div className="notify-me-modal" onClick={(e) => e.stopPropagation()}>
        <img onClick={closePopUp} src={x2} className="notify-close" />
        <div className="notify-me-middle">
          <p className="bold-cart" style={{marginBottom: '.5rem'}}>
            Notify Me When Available
          </p>
          <p style={{width: '100%'}}>
            We'll email you when this product is back in stock.
          </p>
          <Image
            data={selectedVariant?.image}
            aspectRatio="1/1.2"
            alt={selectedVariant?.image?.altText}
          />
          <p className="bold-cart" style={{marginBottom: '1rem'}}>
            {selectedVariant?.product.title}
          </p>
          <div>
            {selectedVariant?.selectedOptions?.map(
              (o) =>
                o.value !== 'Default Title' && (
                  <p key={o.value}>{`${o.name}: ${o.value}`}</p>
                ),
            )}
          </div>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{borderRadius: '0'}}
        ></input>
        <button
          onClick={(e) => {
            subscribe(email, e.target, e.target.innerText);
          }}
        >
          NOTIFY
        </button>
      </div>
    </div>
  );
}
function ProductRecommendations({recs, product, isMobile}) {
  const endOfSlice = isMobile ? 6 : 3;
  return (
    <Suspense>
      <Await resolve={recs}>
        {(recs) => (
          <div className={isMobile ? 'home-mobile' : 'home'}>
            <div
              style={{borderTop: 'none'}}
              className={
                isMobile ? 'title-container-mobile' : 'title-container'
              }
            >
              <p className="title">Recommended Products</p>
            </div>
            {recs?.collection?.products?.nodes
              .filter((rec) => rec.id !== product.id)
              .slice(0, endOfSlice)
              .map((rec) => (
                <FeaturedProduct
                  isMobile={isMobile}
                  product={rec}
                  key={rec.id}
                />
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
    tags
    vendor
    handle
    descriptionHtml
    description
    collections(first:3){
      nodes{
        title
        id
        handle
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
query ($handle: String) {
  collection(handle: $handle) {
    title
    products(first: 7) {
      nodes {
        id
        title
        tags
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
