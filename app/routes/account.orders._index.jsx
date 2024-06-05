import {Link, useLoaderData} from '@remix-run/react';
import {
  Money,
  Pagination,
  getPaginationVariables,
  flattenConnection,
  Image,
} from '@shopify/hydrogen';
import React, {useState, useRef} from 'react';
import {redirect, json} from '@shopify/remix-oxygen';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import {motion, AnimatePresence, animate, LayoutGroup} from 'framer-motion';
import closearrow from '../assets/closearrow.png';
import openarrow from '../assets/openarrow.png';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Orders'}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, context}) {
  const token = context.session.get('customerAccessToken');
  if (!token) return redirect('account/login');

  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });
  const {customer, errors} = await context.storefront.query(
    CUSTOMER_ORDERS_QUERY,
    {
      variables: {
        ...paginationVariables,
        customerAccessToken: token,
      },
    },
  );

  if (errors?.length || !customer) {
    throw Error('Customer orders not found');
  }

  return json(
    {customer},
    {
      headers: {
        'Set-Cookie': await context.session.commit(),
      },
    },
  );
}

export default function Orders() {
  /** @type {LoaderReturnData} */
  const {customer} = useLoaderData();
  const {orders} = customer;
  return (
    <div className="orders">
      {orders.nodes.length ? <OrdersTable orders={orders} /> : <EmptyOrders />}
    </div>
  );
}

/**
 * @param {Pick<CustomerOrdersFragment, 'orders'>}
 */
function OrdersTable({orders}) {
  return (
    <div className="account-orders">
      <p></p>
      <p style={{fontFamily: 'bold-font'}}>Date</p>
      <p style={{fontFamily: 'bold-font'}}>Order No.</p>
      <p style={{fontFamily: 'bold-font'}}>Items</p>
      <p style={{fontFamily: 'bold-font'}}>Status</p>
      <p style={{fontFamily: 'bold-font'}}>Total</p>
      <div className="account-orders-subgrid">
        <LayoutGroup>
          {orders?.nodes.length ? (
            <Pagination connection={orders}>
              {({nodes, isLoading, PreviousLink, NextLink}) => {
                return (
                  <>
                    <PreviousLink>
                      {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
                    </PreviousLink>
                    {nodes.map((order) => {
                      return <OrderItem key={order.id} order={order} />;
                    })}
                    <NextLink>{isLoading ? 'Loading...' : null}</NextLink>
                  </>
                );
              }}
            </Pagination>
          ) : (
            <EmptyOrders />
          )}
        </LayoutGroup>
      </div>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="empty-orders">
      <p>You have no orders.</p>
    </div>
  );
}

/**
 * @param {{order: OrderItemFragment}}
 */
function OrderItem({order}) {
  const arrow = useRef();
  const [expanded, setExpanded] = useState(false);
  function toggleExpanded() {
    setExpanded(!expanded);
    if (!expanded) animate(arrow.current, {transform: 'rotate(0deg)'});
    if (expanded) animate(arrow.current, {transform: 'rotate(-90deg)'});
  }

  const unitTotal = order?.lineItems?.nodes
    .map((lineitem) => lineitem.quantity * lineitem.originalTotalPrice?.amount)
    .reduce((partialSum, a) => partialSum + a, 0);

  const aspectRatio = '1:1.1';
  const [aspectWidth, aspectHeight] = aspectRatio.split(':').map(Number);

  const calculateHeight = (width) => (width / aspectWidth) * aspectHeight;

  const imageWidth = order.variant?.image?.width || 100;
  const imageHeight = calculateHeight(imageWidth);

  return (
    <>
      {/* <fieldset> */}
      <motion.div
        className="account-orders-grey-row"
        layout
        transition={{ease: 'easeInOut'}}
      >
        <img
          src={expanded ? openarrow : closearrow}
          onClick={toggleExpanded}
          style={{
            width: '30%',
            margin: 'auto',
            transform: 'rotate(-90deg)',
          }}
          ref={arrow}
          alt="arrow"
        />
        <div className="account-orders-grid-box-container">
          <p>{new Date(order.processedAt).toDateString()}</p>
        </div>
        <div className="account-orders-grid-box-container">
          <Link to={`/account/orders/${order.id}`}>
            <p>{order.name}</p>
          </Link>
        </div>
        <div className="account-orders-grid-box-container">
          <p>
            {order.lineItems?.nodes
              ?.map((n) => n.quantity)
              .reduce((partialSum, a) => partialSum + a, 0)}
          </p>
        </div>
        <div className="account-orders-grid-box-container">
          <p>
            {order.fulfillmentStatus === 'UNFULFILLED'
              ? 'Processing'
              : order.fulfillmentStatus === 'FULFILLED'
              ? 'Shipped'
              : order.fulfillmentStatus}
          </p>
        </div>
        {/* {fulfillmentStatus && <p>{fulfillmentStatus}</p>} */}
        <Money data={order.totalPrice} />
      </motion.div>
      <AnimatePresence mode="sync">
        {expanded && (
          <motion.div
            className="account-orders-subgrid-2"
            initial={{opacity: 0, scaleY: 0}}
            animate={{opacity: 1, scaleY: 1}}
            exit={{opacity: 0, scaleY: 1}}
            style={{originY: 0}}
            transition={{ease: 'easeInOut'}}
            key={order.name}
          >
            {order.lineItems?.nodes?.map((n, i) => (
              <div
                style={
                  i === order.lineItems.nodes.length - 1
                    ? {paddingBottom: '.75rem'}
                    : null
                }
                key={n.title}
                className="account-orders-expanded-row"
              >
                <br />
                <Image
                  data={n.variant.image}
                  style={{
                    width: '100%',
                    height: 'auto',
                    aspectRatio: `${aspectWidth}/${aspectHeight}`,
                  }}
                  height={n.variant?.image?.height}
                />
                <div style={{width: '90%'}}>
                  <p style={{fontFamily: 'bold-font'}}>Description</p>
                  <br />
                  <p>{n.title}</p>
                  <br />
                  {n.variant.selectedOptions?.find(
                    (o) => o.name === 'Material',
                  ) ? (
                    <p>
                      Color:{' '}
                      {
                        n.variant.selectedOptions?.find(
                          (o) => o.name === 'Material',
                        )?.value
                      }
                    </p>
                  ) : null}
                  {n.variant.selectedOptions?.find((o) => o.name === 'Size') ? (
                    <p>
                      Size:{' '}
                      {
                        n.variant.selectedOptions?.find(
                          (o) => o.name === 'Size',
                        )?.value
                      }
                    </p>
                  ) : null}
                  {n.variant.selectedOptions?.find(
                    (o) => o.name === 'Thickness',
                  ) ? (
                    <p>
                      Width:{' '}
                      {
                        n.variant.selectedOptions?.find(
                          (o) => o.name === 'Thickness',
                        )?.value
                      }
                    </p>
                  ) : null}
                </div>
                <div>
                  <p style={{fontFamily: 'bold-font'}}>Qty</p>
                  <br />
                  <p>{n.quantity}</p>
                </div>
                <br />
                <div>
                  <p style={{fontFamily: 'bold-font'}}>Item Total</p>
                  <br />
                  <Money data={n.originalTotalPrice} />
                </div>
              </div>
            ))}
            <div className="account-orders-expanded-totals-row">
              <br />
              {order.successfulFulfillments?.[0]?.trackingInfo?.[0]?.url !=
              null ? (
                <a
                  target="_blank"
                  className="track-order"
                  href={
                    order.successfulFulfillments?.[0]?.trackingInfo?.[0]?.url
                  }
                >
                  TRACK ORDER
                </a>
              ) : (
                <p className="track-order">PROCESSING ORDER</p>
              )}
              <br />
              <div>
                <div style={{marginBottom: '1rem'}}>
                  <p>Unit Total:</p>
                  <p>Tax:</p>
                  <p>Shipping:</p>
                </div>
                <p style={{fontFamily: 'bold-font'}}>Order total:</p>
              </div>
              <div>
                <div style={{marginBottom: '1rem'}}>
                  {/* <Money
                    data={{
                      amount: order.lineItems?.nodes
                        ?.map((n) => n.totalPrice.amount)
                        .reduce((partialSum, a) => partialSum + a, 0),
                      currencyCode: order.totalPrice.currencyCode,
                    }}
                  /> */}
                  <Money
                    data={{
                      amount: `${unitTotal}`,
                      currencyCode: order.totalPrice.currencyCode,
                    }}
                  />
                  <Money data={order.totalTax} />
                  <Money
                    data={{
                      amount: `${order.totalPrice.amount - unitTotal}`,
                      currencyCode: order.totalPrice.currencyCode,
                    }}
                  />
                  {/* <Money
                    data={{
                      amount: (
                        parseFloat(order.totalPrice.amount) -
                        parseFloat(order.totalTax.amount)
                      ).toString(),
                      currencyCode: order.totalPrice.currencyCode,
                    }}
                  /> */}
                </div>
                <Money
                  style={{fontFamily: 'bold-font'}}
                  data={order.totalPrice}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* <Link to={`/account/orders/${btoa(order.id)}`}>View Order →</Link> */}
      {/* </fieldset> */}
    </>
  );
}

/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('customer-accountapi.generated').CustomerOrdersFragment} CustomerOrdersFragment */
/** @typedef {import('customer-accountapi.generated').OrderItemFragment} OrderItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
