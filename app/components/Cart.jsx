import {CartForm, Image, Money} from '@shopify/hydrogen';
import {Link, useLocation} from '@remix-run/react';
import {useVariantUrl} from '~/lib/variants';
import {SimplyWidget} from './SimplyWidget';
import {useEffect, useState} from 'react';
/**
 * @param {CartMainProps}
 */
export function CartMain({layout, cart}) {
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;

  return (
    <div className={className}>
      <CartEmpty hidden={linesCount} layout={layout} />
      <CartDetails cart={cart} layout={layout} />
    </div>
  );
}

/**
 * @param {CartMainProps}
 */
function CartDetails({layout, cart}) {
  const [insurancePlan, setInsurancePlan] = useState({});
  const [SkipProduct, setSkipProduct] = useState({});

  useEffect(() => {
    var myHeaders = new Headers();
    myHeaders.append('shopname', '478902-43.myshopify.com');

    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    };

    fetch(
      'https://478902-43.myshopify.com/apps/simplyinsurance/storefront-api/metafields/',
      requestOptions,
    )
      .then((response) => response.json())
      .then((result) => {
        console.log('result : ', result);
        // setting state
        setInsurancePlan(result.data.InsurancePlan);
        setSkipProduct(result.data.SkipProduct);
      })
      .catch((error) => console.log('error', error));
  }, []);
  const cartHasItems = !!cart && cart.totalQuantity > 0;
  const {pathname} = useLocation();

  return (
    <div className="cart-details">
      <CartLines
        lines={cart?.lines}
        layout={layout}
        insurancePlan={insurancePlan}
      />
      {cartHasItems &&
        insurancePlan &&
        insurancePlan.planArray &&
        SkipProduct && (
          <SimplyWidget
            cart={cart}
            insurancePlan={insurancePlan}
            SkipProduct={SkipProduct}
          />
        )}
      <CartSummary cost={cart?.cost} layout={layout}>
        {/* <CartDiscounts discountCodes={cart.discountCodes} /> */}

        <CartCheckoutActions
          checkoutUrl={cart?.checkoutUrl}
          cartHasItems={cartHasItems}
          pathname={pathname}
        />
      </CartSummary>
    </div>
  );
}

/**
 * @param {{
 *   layout: CartMainProps['layout'];
 *   lines: CartApiQueryFragment['lines'] | undefined;
 * }}
 */
function CartLines({lines, layout, insurancePlan}) {
  if (!lines) return null;
  return (
    <div aria-labelledby="cart-lines" className="cart-lines">
      <ul>
        {lines.nodes
          .filter(
            (line) =>
              line.merchandise?.product?.handle !== 'shipping-protection',
          )
          .map((line) => (
            <CartLineItem
              key={line.id}
              line={line}
              layout={layout}
              insurancePlan={insurancePlan}
            />
          ))}
      </ul>
    </div>
  );
}

/**
 * @param {{
 *   layout: CartMainProps['layout'];
 *   line: CartLine;
 * }}
 */
function CartLineItem({layout, line, insurancePlan}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const getProductId = (item) => {
    let merchandiseId = item.merchandise.id;
    let variantId = merchandiseId.replace('gid://shopify/ProductVariant/', '');
    let id = parseInt(variantId);
    return id;
  };
  const getInsuranceProduct = () => {
    let variant_id = getProductId(line);
    let plans = insurancePlan.planArray;

    let currentPlan = plans.find((plan) => {
      if (plan.variant_id == variant_id) {
        return plan;
      }
    });
    return currentPlan;
  };

  let currentInsurancePlan;
  if (insurancePlan && insurancePlan.planArray) {
    currentInsurancePlan = getInsuranceProduct();
  }
  return (
    <li key={id} className="cart-line">
      {image && (
        <Image
          alt={title}
          aspectRatio="1/1"
          data={image}
          height={100}
          loading="lazy"
          width={100}
        />
      )}

      <div style={{width: '50%'}}>
        <Link
          prefetch="intent"
          to={lineItemUrl}
          onClick={() => {
            if (layout === 'aside') {
              // close the drawer
              window.location.href = lineItemUrl;
            }
          }}
        >
          <p style={{marginBottom: '-3%'}} className="bold-cart">
            {product.title || ''}
          </p>
        </Link>
        <CartLinePrice line={line} as="span" />
        <ul className="cart-material-size">
          {selectedOptions.map(
            (option) =>
              option.value !== 'Default Title' && (
                <li key={option.name}>
                  <p>
                    {option.name}: {option.value}
                  </p>
                </li>
              ),
          )}
        </ul>
        <CartLineQuantity
          line={line}
          currentInsurancePlan={currentInsurancePlan}
        />
      </div>
    </li>
  );
}

/**
 * @param {{checkoutUrl: string}}
 */
function CartCheckoutActions({checkoutUrl, cartHasItems, pathname}) {
  // if (!checkoutUrl) return null;

  return (
    <div>
      <button
        className="cart-checkout-button"
        onClick={() => {
          if (!cartHasItems) {
            history.go(-1);
            window.location.hash = '';
          }
        }}
      >
        {cartHasItems ? (
          <a href={checkoutUrl} target="_self">
            <p className="cart-checkout-button-text">CHECKOUT</p>
          </a>
        ) : (
          <p className="cart-checkout-button-text">CHECKOUT</p>
        )}
      </button>
    </div>
  );
}

/**
 * @param {{
 *   children?: React.ReactNode;
 *   cost: CartApiQueryFragment['cost'];
 *   layout: CartMainProps['layout'];
 * }}
 */
export function CartSummary({cost, layout, children = null}) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <dl className="cart-subtotal">
        <dt>Subtotal</dt>
        <dd>
          {cost?.subtotalAmount?.amount ? (
            <Money data={cost?.subtotalAmount} />
          ) : (
            '$0.00'
          )}
        </dd>
      </dl>
      <p className="cart-tax-sales">
        Estimated sales tax and shipping to be calculated at checkout.
      </p>
      {children}
    </div>
  );
}

/**
 * @param {{lineIds: string[]}}
 */
function CartLineRemoveButton({lineIds, currentInsurancePlan}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button
        className="cart-remove-button"
        type="submit"
        disabled={currentInsurancePlan ? true : false}
      >
        Remove
      </button>
    </CartForm>
  );
}

/**
 * @param {{line: CartLine}}
 */
function CartLineQuantity({line, currentInsurancePlan}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div>
      <div className="cart-line-quantity">
        <p>Quantity: {quantity} &nbsp;&nbsp;</p>
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            aria-label="Decrease quantity"
            disabled={currentInsurancePlan ? true : quantity <= 1}
            name="decrease-quantity"
            value={prevQuantity}
            className="quantity-button"
          >
            <span>&#8722; </span>
          </button>
        </CartLineUpdateButton>
        &nbsp;
        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            disabled={currentInsurancePlan ? true : false}
            aria-label="Increase quantity"
            name="increase-quantity"
            value={nextQuantity}
            className="quantity-button"
          >
            <span>&#43;</span>
          </button>
        </CartLineUpdateButton>
        &nbsp;
      </div>
      <CartLineRemoveButton
        lineIds={[lineId]}
        currentInsurancePlan={currentInsurancePlan}
      />
    </div>
  );
}

/**
 * @param {{
 *   line: CartLine;
 *   priceType?: 'regular' | 'compareAt';
 *   [key: string]: any;
 * }}
 */
function CartLinePrice({line, priceType = 'regular', ...passthroughProps}) {
  if (!line?.cost?.amountPerQuantity || !line?.cost?.totalAmount) return null;

  const moneyV2 =
    priceType === 'regular'
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

  return (
    <div>
      <Money
        className="bold-cart"
        withoutTrailingZeros
        {...passthroughProps}
        data={moneyV2}
      />
    </div>
  );
}

/**
 * @param {{
 *   hidden: boolean;
 *   layout?: CartMainProps['layout'];
 * }}
 */
export function CartEmpty({hidden = false, layout = 'aside'}) {
  return (
    <div className="empty-bag" hidden={hidden}>
      <br />
      <p>
        {'Your cart is empty. Shop New Arrivals'}{' '}
        <Link
          to="/collections/new_arrivals"
          style={{textDecoration: 'underline'}}
          onClick={() => {
            if (layout === 'aside') {
              window.location.hash = '';
            }
          }}
        >
          here.
        </Link>
      </p>
      <br />
    </div>
  );
}

/**
 * @param {{
 *   discountCodes: CartApiQueryFragment['discountCodes'];
 * }}
 */
function CartDiscounts({discountCodes}) {
  const codes =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div>
      {/* Have existing discount, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt>Discount(s)</dt>
          <UpdateDiscountForm>
            <div className="cart-discount">
              <code>{codes?.join(', ')}</code>
              &nbsp;
              <button>Remove</button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div>
          <input type="text" name="discountCode" placeholder="Discount code" />
          &nbsp;
          <button type="submit">Apply</button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

/**
 * @param {{
 *   discountCodes?: string[];
 *   children: React.ReactNode;
 * }}
 */
function UpdateDiscountForm({discountCodes, children}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

/**
 * @param {{
 *   children: React.ReactNode;
 *   lines: CartLineUpdateInput[];
 * }}
 */
function CartLineUpdateButton({children, lines}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/** @typedef {CartApiQueryFragment['lines']['nodes'][0]} CartLine */
/**
 * @typedef {{
 *   cart: CartApiQueryFragment | null;
 *   layout: 'page' | 'aside';
 * }} CartMainProps
 */

/** @typedef {import('@shopify/hydrogen/storefront-api-types').CartLineUpdateInput} CartLineUpdateInput */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
