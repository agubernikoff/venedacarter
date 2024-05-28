// NOTE: https://shopify.dev/docs/api/customer/latest/objects/Customer
export const CUSTOMER_FRAGMENT = `#graphql
  fragment Customer on Customer {
    firstName
    lastName
    email
    defaultAddress {
      id
      formatted
      firstName
      lastName
      company
      address1
      address2
      city
      zip
      phone
    }
    addresses(first: 6) {
      nodes {
        id
        formatted
        firstName
        lastName
        company
        address1
        address2
        city
        country
        province
        zip
        phone
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/customer/latest/queries/customer
export const CUSTOMER_DETAILS_QUERY = `#graphql
  query CustomerDetails($cutomerAccessToken: String!) {
    customer(customerAccessToken: $cutomerAccessToken) {
      ...Customer
    }
  }
  ${CUSTOMER_FRAGMENT}
`;

export const CUSTOMER_EMAIL_QUERY = `#graphql
  query CustomerDetails($cutomerAccessToken: String!) {
    customer(customerAccessToken: $cutomerAccessToken) {
      email
    }
  }
`;
