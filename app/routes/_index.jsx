import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link} from '@remix-run/react';

import {Suspense, useState, useEffect} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {motion, AnimatePresence} from 'framer-motion';
import colorPicker from '~/helper/ColorPicker';
import mobileIcon from '../assets/VC-Opengraph.jpg';
import {useRootLoaderData} from '~/root';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'Veneda Carter | Home'},
    {property: 'og:image', content: mobileIcon},
    {property: 'og:title', content: 'Veneda Carter'},
  ];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  const {storefront} = context;
  const {collections} = await storefront.query(FEATURED_COLLECTION_QUERY);
  const featuredCollection = collections.nodes[6];
  const newArrivalsCollection = collections.nodes[5];
  const restOfCollections = [...collections.nodes].filter(
    (c) =>
      c.handle === 'ring' || c.handle === 'earring' || c.handle === 'necklace',
  );
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);
  const handle = 'hero-image-ju8lmyyz';
  const key = 'hero_image';
  const heroImage = await storefront.query(HERO_IMAGE_QUERY, {
    variables: {handle, key},
  });
  return defer({
    featuredCollection,
    newArrivalsCollection,
    restOfCollections,
    recommendedProducts,
    heroImage,
  });
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  const [isHomepage, setIsHomepage] = useState(false);

  useEffect(() => {
    // Check if the current URL path is the homepage
    setIsHomepage(
      window.location.pathname === '/' || window.location.pathname === '/#',
    );
  }, []);

  const {isMobileRoot} = useRootLoaderData();
  const [isMobile, setIsMobile] = useState(isMobileRoot);
  useEffect(() => {
    window
      .matchMedia('(max-width:44em)')
      .addEventListener('change', (e) => setIsMobile(e.matches));
    if (window.matchMedia('(max-width:44em)').matches) setIsMobile(true);
  }, []);

  return (
    <div className={isMobile ? 'home-mobile' : 'home'}>
      {isMobile ? (
        <MobileNewArrivals
          collection={data.newArrivalsCollection}
          image={data?.heroImage?.metaobject?.field?.reference?.image}
        />
      ) : (
        <NewArrivals
          collection={data.newArrivalsCollection}
          image={data?.heroImage?.metaobject?.field?.reference?.image}
        />
      )}
      <FeaturedProducts
        products={data.featuredCollection.products.nodes}
        isMobile={isMobile}
        isHomepage={isHomepage}
      />
      <Categories categories={data.restOfCollections} isMobile={isMobile} />
    </div>
  );
}

/**
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function NewArrivals({collection, image}) {
  if (!collection) return null;
  // const image = collection?.image;

  return (
    <>
      <div className="new-arrivals-container">
        <div style={{margin: '1rem', marginLeft: '0'}}>
          <p className="new-arrivals-container-p">{collection.title}</p>
        </div>
        <div className="new-arrivals-text">
          <p>{collection.description}</p>
          <Link to={'/collections/new-arrivals'}>Discover</Link>
        </div>
      </div>
      <Link
        className="new-arrivals-collection"
        to={`/collections/${collection.handle}`}
      >
        {image && (
          <Image
            data={image}
            sizes="66vw"
            className="new-arrivals-collection-image"
          />
        )}
      </Link>
    </>
  );
}

function MobileNewArrivals({collection, image}) {
  if (!collection) return null;
  return (
    <div className="mobile-new-arrivals">
      <div className="title-container">
        <p className="title">{collection.title}</p>
      </div>
      <Link
        className="new-arrivals-collection"
        to={`/collections/${collection.handle}`}
      >
        {image && (
          <Image
            data={image}
            sizes="66vw"
            className="new-arrivals-collection-image"
          />
        )}
      </Link>
      <div className="mobile-new-arrivals-text">
        <p>{collection.description}</p>
        <Link to={'/collections/new-arrivals'}>Discover</Link>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery>;
 * }}
 */
function FeaturedProducts({products, isMobile, isHomepage}) {
  if (!products) return null;
  const endOfSlice = isMobile ? 8 : 9;
  return (
    <div className={isMobile ? 'subgrid-mobile' : 'subgrid'}>
      <div className={isMobile ? 'title-container-mobile' : 'title-container'}>
        <p className="title">Featured Products</p>
      </div>
      {products.slice(0, endOfSlice).map((product, i) => {
        // if (i === 0 && isMobile)
        //   return (
        //     <MainFeaturedProduct
        //       product={product}
        //       key={product.id}
        //       isMobile={isMobile}
        //     />
        //   );
        // else
        return (
          <FeaturedProduct
            product={product}
            key={product.id}
            isMobile={isMobile}
            isHomepage={isHomepage}
          />
        );
      })}
    </div>
  );
}

function MainFeaturedProduct({product, isMobile}) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setTimeout(() => {
      if (index === product.images.nodes.length - 1) setIndex(0);
      else setIndex(index + 1);
    }, 2000);
  });
  return (
    <Link className="main-featured-product" to={`/products/${product.handle}`}>
      <div style={{background: '#f4f4f4'}}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={index}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2}}
          >
            <Image
              data={product.images.nodes[index]}
              aspectRatio="1/1"
              crop={false}
              sizes="(min-width: 45em) 20vw, 50vw"
              height={500}
              width={500}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{marginBottom: '1.25rem'}}>
        <div
          className={
            isMobile
              ? 'product-details-container-mobile'
              : 'product-details-container'
          }
          style={{marginBottom: '.5rem', marginTop: '1rem'}}
        >
          <div
            className={
              isMobile ? 'product-title-price-mobile' : 'product-title-price'
            }
          >
            <p>{product.title}</p>
            <small>
              <Money data={product.priceRange.minVariantPrice} />
            </small>
          </div>
        </div>
        <div
          className={
            isMobile
              ? 'product-title-description-mobile'
              : 'product-title-description'
          }
          dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
        >
          {/* <p
            style={{marginTop: '-1rem'}}
            dangerouslySetInnerHTML={{__html: descriptionHtml}}
          >
            {product.description}
          </p> */}
        </div>
        <p
          style={{
            textDecoration: 'underline',
            marginTop: '.5rem',
            marginLeft: '1rem',
            fontFamily: 'regular-font',
            fontSize: '.75rem',
            marginBottom: '-.25rem',
          }}
        >
          View Product
        </p>
      </div>
    </Link>
  );
}

export function FeaturedProduct({
  product,
  isMobile,
  loading,
  emptyCellBelow,
  goToSearchResult,
  isHomepage,
}) {
  const [index, setIndex] = useState(0);
  const colorOptionsObj = product.options.find(
    (o) =>
      o.name.toLowerCase() === 'metal' ||
      o.name.toLowerCase() === 'color' ||
      o.name.toLowerCase() === 'material',
  );
  return (
    <Link
      className="featured-product"
      to={`/products/${product.handle}`}
      onMouseEnter={() => {
        if (product.images.nodes.length > 1) setIndex(1);
      }}
      onMouseLeave={() => setIndex(0)}
      style={
        isHomepage
          ? {borderBottom: '1px solid #eaeaea'}
          : emptyCellBelow
          ? {borderBottom: '1px solid #eaeaea'}
          : {}
      }
      onClick={() => {
        if (goToSearchResult) goToSearchResult();
      }}
    >
      <div
        style={{
          transition: 'background 300ms ease-in-out',
          background: index === 0 ? '#f4f4f4' : '#ededed',
          aspectRatio: '1/1.2',
          display: 'flex',
          alignItems:
            product.tags.includes('necklace') ||
            product.title.toUpperCase().includes('CHAIN') ||
            product.title.toUpperCase().includes('NECKLACE') ||
            product.title.toUpperCase().includes('PENDANT')
              ? 'flex-start'
              : 'center',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {isMobile ? (
          <div style={{width: '100%'}}>
            <Image
              data={product.images.nodes[0]}
              // aspectRatio="1/1"
              crop={false}
              loading={loading}
              sizes="(min-width: 45em) 20vw, 50vw"
            />
          </div>
        ) : (
          // <AnimatePresence mode="popLayout" initial={false}>
          <div
            // transition={{duration: 0.2}}
            style={{
              width: '100%',
              maxHeight: '100%',
              overflow: 'hidden',
              position: 'relative',
              // background: index === 0 ? '#f4f4f4' : '#ededed',
            }}
          >
            <Image
              data={product.images.nodes[0]}
              aspectRatio="1/1"
              crop={false}
              loading={loading}
              sizes="(min-width: 45em) 20vw, 50vw"
              style={{
                opacity: index === 0 ? 1 : 0,
                transition: 'opacity 300ms ease-in-out',
              }}
              // height={2000}
              width={700}
            />
            <Image
              data={product.images.nodes[1]}
              aspectRatio="1/1"
              crop={false}
              loading={loading}
              sizes="(min-width: 45em) 20vw, 50vw"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: index === 0 ? 0 : 1,
                transition: 'opacity 300ms ease-in-out',
              }}
              // height={2000}
              width={700}
            />
          </div>
          // </AnimatePresence>
        )}
      </div>
      <div
        className={
          isMobile
            ? 'product-details-container-mobile'
            : 'product-details-container'
        }
      >
        <div
          className={
            isMobile ? 'product-title-price-mobile' : 'product-title-price'
          }
        >
          <p>{product.title}</p>
          <small>
            <Money
              data={product.priceRange?.minVariantPrice || product.price}
            />
          </small>
        </div>
        <div className="product-color-variants">
          {
            //JANKY SOLUTION FOR NOW... UPDATE TO SET HEX CODE BASED ON METAL NAME
            colorOptionsObj ? (
              index === 1 && !isMobile ? (
                <div
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'row',
                    gap: '.5em',
                    padding: '.25em',
                  }}
                >
                  {colorOptionsObj.values.map((v) => (
                    <div
                      className="circle"
                      style={{
                        background: colorPicker(v),
                        outline:
                          colorPicker(v) === 'black'
                            ? '1px solid white'
                            : 'none',
                      }}
                      key={v}
                    />
                  ))}
                </div>
              ) : (
                <p>{`+${colorOptionsObj.values.length} Colors`}</p>
              )
            ) : null
          }
        </div>
      </div>
    </Link>
  );
}

function Categories({categories, isMobile}) {
  return (
    <>
      <div className="title-container">
        <p className="title">Categories</p>
      </div>
      {categories.map((category) => (
        <Link
          key={category.handle}
          className={
            isMobile ? 'category-collection-mobile' : 'category-collection'
          }
          to={`/collections/${category.handle}`}
        >
          <Image
            data={category.image}
            aspectRatio="1/1.2"
            sizes="(min-width: 45em) 20vw, 50vw"
            className="category-image"
          />
          <p
            style={{fontFamily: 'regular-font', fontSize: '.75rem'}}
          >{`Shop ${category.title}`}</p>
        </Link>
      ))}
    </>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    description
    products(first: 9) {
      nodes {
        id
        tags
        title
        handle
        description
        descriptionHtml
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
        images(first: 4) {
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
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 7, sortKey: ID) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    tags
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;

const MEDIA_IMAGE_FRAGMENT = `#graphql
fragment MediaImage on MediaImage{
	alt
  id
  image{
    altText
    height
    id
    width
    url
  }
  presentation{
    asJson(format:IMAGE)
  }
}
`;

const HERO_IMAGE_QUERY = `#graphql
query heroImage($handle: String!, $key: String!){
  metaobject(handle: {handle:$handle , type: $key}) {
    field(key: $key) {
      reference{
        ...MediaImage
      }
    }
  }
}
${MEDIA_IMAGE_FRAGMENT}
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
