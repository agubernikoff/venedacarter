// https://shopify.dev/docs/api/customer/latest/objects/Order
export const ORDERLINEITEMFULL = `#graphql
fragment OrderMoney on MoneyV2 {
  amount
  currencyCode
}
fragment DiscountApplication on DiscountApplication {
  value {
    __typename
    ... on MoneyV2 {
      ...OrderMoney
    }
    ... on PricingPercentageValue {
      percentage
    }
  }
}
fragment OrderLineItemFull on OrderLineItem {
  title
  quantity
  originalTotalPrice {
    ...OrderMoney
  }
  discountAllocations {
    allocatedAmount {
      ...OrderMoney
    }
    discountApplication {
      ...DiscountApplication
    }
  }
  variant{
    title
    image{
      url
      altText
      height
      id
      width
    }
    selectedOptions{
      name
      value
    }
    price{
      ...OrderMoney
    }
  }
}`;
export const ORDER_ITEM_FRAGMENT = `#graphql
  fragment OrderItem on Order {
    totalPrice {
      amount
      currencyCode
    }
    totalTax{
      amount
      currencyCode
    }
    financialStatus
    fulfillmentStatus
    successfulFulfillments(first:10){
      trackingCompany
      trackingInfo(first:10){
        number
        url
      }
    }
    id
    name
    processedAt
    lineItems(first: 100) {
      nodes {
        ...OrderLineItemFull
      }
    }
  }
  ${ORDERLINEITEMFULL}
`;

// https://shopify.dev/docs/api/customer/latest/objects/Customer
export const CUSTOMER_ORDERS_FRAGMENT = `#graphql
  fragment CustomerOrders on Customer {
    orders(
      sortKey: PROCESSED_AT,
      reverse: true,
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...OrderItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
  ${ORDER_ITEM_FRAGMENT}
`;

// https://shopify.dev/docs/api/customer/latest/queries/customer
export const CUSTOMER_ORDERS_QUERY = `#graphql
  ${CUSTOMER_ORDERS_FRAGMENT}
  query CustomerOrders(
    $endCursor: String
    $first: Int
    $last: Int
    $startCursor: String
    $customerAccessToken:String!
  ) {
    customer(customerAccessToken:$customerAccessToken) {
      ...CustomerOrders
    }
  }
`;
