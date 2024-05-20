export const CUSTOMER_UPDATE_MUTATION = `#graphql
  # https://shopify.dev/docs/api/customer/latest/mutations/customerUpdate
  mutation customerUpdate($customer: CustomerUpdateInput!, $customerAccessToken: String!) {
    customerUpdate(customer: $customer, customerAccessToken: $customerAccessToken) {
      customer {
        firstName
        lastName
        email
      }
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;
