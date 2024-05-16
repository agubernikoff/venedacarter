import {Link, useLoaderData} from '@remix-run/react';
import {
  Money,
  Pagination,
  getPaginationVariables,
  flattenConnection,
  Image,
} from '@shopify/hydrogen';
import React, {useState} from 'react';
import {json} from '@shopify/remix-oxygen';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';

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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const {data, errors} = await context.customerAccount.query(
    CUSTOMER_ORDERS_QUERY,
    {
      variables: {
        ...paginationVariables,
      },
    },
  );

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return json(
    {customer: data.customer},
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
  console.log(customer);
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
                <NextLink>
                  {isLoading ? 'Loading...' : <span>Load more ↓</span>}
                </NextLink>
              </>
            );
          }}
        </Pagination>
      ) : (
        <EmptyOrders />
      )}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="empty-orders">
      <p>You haven&apos;t placed any orders yet.</p>
    </div>
  );
}

/**
 * @param {{order: OrderItemFragment}}
 */
function OrderItem({order}) {
  const [expanded, setExpanded] = useState(false);
  function toggleExpanded() {
    setExpanded(!expanded);
  }
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  return (
    <>
      {/* <fieldset> */}
      <button
        style={{
          background: '#f4f4f4',
          display: 'flex',
          alignItems: 'center',
          border: 'none',
        }}
        onClick={toggleExpanded}
      >
        x
      </button>
      <p style={{background: '#f4f4f4', display: 'flex', alignItems: 'center'}}>
        {new Date(order.processedAt).toDateString()}
      </p>
      <Link
        style={{background: '#f4f4f4', display: 'flex', alignItems: 'center'}}
        to={`/account/orders/${order.id}`}
      >
        <p>#{order.number}</p>
      </Link>
      <p style={{background: '#f4f4f4', display: 'flex', alignItems: 'center'}}>
        {order.lineItems?.nodes
          ?.map((n) => n.quantity)
          .reduce((partialSum, a) => partialSum + a, 0)}
      </p>
      <p style={{background: '#f4f4f4', display: 'flex', alignItems: 'center'}}>
        {order.financialStatus}
      </p>
      {fulfillmentStatus && <p>{fulfillmentStatus}</p>}
      <Money
        style={{
          background: '#f4f4f4',
          display: 'flex',
          alignItems: 'center',
          fontSize: '.75rem',
          fontFamily: 'regular-font',
        }}
        data={order.totalPrice}
      />
      {expanded
        ? order.lineItems?.nodes?.map((n) => (
            <React.Fragment key={n.id}>
              <br />
              <Image data={n.image} />
              <div>
                <p style={{fontFamily: 'bold-font'}}>Description</p>
                {n.title}
                {n.variantOptions?.find((o) => isNaN(o.value))?.value &&
                n.variantOptions?.find((o) => isNaN(o.value))?.value !==
                  'Default Title' ? (
                  <p>
                    Color:{' '}
                    {n.variantOptions?.find((o) => isNaN(o.value))?.value}
                  </p>
                ) : null}
                {n.variantOptions?.find((o) => !isNaN(o.value))?.value ? (
                  <p>
                    Size:{' '}
                    {n.variantOptions?.find((o) => !isNaN(o.value))?.value}
                  </p>
                ) : null}
              </div>
              <div>
                <p style={{fontFamily: 'bold-font'}}>Qty</p>
                <p>{n.quantity}</p>
              </div>
              <br />
              <div>
                <p style={{fontFamily: 'bold-font'}}>Item Total</p>
                <Money data={n.totalPrice} />
              </div>
            </React.Fragment>
          ))
        : null}
      {expanded ? (
        <>
          <br />
          <a style={{gridColumn: 'span 2'}}>Track Order</a>
          <br />
          <div>
            <div>
              <p>Unit Total:</p>
              <p>Tax:</p>
              <p>Shipping:</p>
            </div>
            <p style={{fontFamily: 'bold-font'}}>Order total:</p>
          </div>
          <div>
            <div>
              <Money
                data={{
                  amount: order.lineItems?.nodes
                    ?.map((n) => n.totalPrice.amount)
                    .reduce((partialSum, a) => partialSum + a, 0),
                  currencyCode: order.totalPrice.currencyCode,
                }}
              />
              <Money data={order.totalTax} />
              <Money
                data={{
                  amount: (
                    parseFloat(order.totalPrice.amount) -
                    parseFloat(order.totalTax.amount)
                  ).toString(),
                  currencyCode: order.totalPrice.currencyCode,
                }}
              />
            </div>
            <Money style={{fontFamily: 'bold-font'}} data={order.totalPrice} />
          </div>
        </>
      ) : null}
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
