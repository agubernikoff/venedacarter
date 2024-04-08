import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Hydrogen | Home'}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  const {storefront} = context;
  const {collections} = await storefront.query(FEATURED_COLLECTION_QUERY);
  const featuredCollection = collections.nodes[0];
  const newArrivalsCollection = collections.nodes[1];
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);

  return defer({
    featuredCollection,
    newArrivalsCollection,
    recommendedProducts,
  });
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  console.log(data);
  return (
    <div className="home">
      <NewArrivals collection={data.newArrivalsCollection} />
      <FeaturedProducts products={data.featuredCollection.products.nodes} />
    </div>
  );
}

/**
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function NewArrivals({collection}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <>
      <div className="new-arrivals-container">
        <h1>{collection.title}</h1>
      </div>
      <Link
        className="new-arrivals-collection"
        to={`/collections/${collection.handle}`}
      >
        {image && (
          <div className="new-arrivals-collection-image">
            <Image data={image} sizes="66vw" />
          </div>
        )}
      </Link>
    </>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery>;
 * }}
 */
function FeaturedProducts({products}) {
  if (!products) return null;
  return (
    <>
      {/* <div className="featured-products"> */}
      <h2 className="featured-products">Featured Products</h2>
      {/* <div className="featured-products-grid"> */}
      {products.map((product) => (
        <Link
          key={product.id}
          className="featured-product"
          to={`/products/${product.handle}`}
        >
          <Image
            data={product.images.nodes[0]}
            aspectRatio="1/1"
            sizes="(min-width: 45em) 20vw, 50vw"
          />
          <h4>{product.title}</h4>
          <small>
            <Money data={product.priceRange.minVariantPrice} />
          </small>
        </Link>
      ))}
      {/* </div> */}
      <br />
      {/* </div> */}
    </>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    products(first: 6) {
      nodes {
        id
        title
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
    collections(first: 2, sortKey: UPDATED_AT, reverse: true) {
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

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
