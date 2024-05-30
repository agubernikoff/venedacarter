// app/graphql/customer-account/CustomerResetByUrl.js
export const CUSTOMER_RESET_BY_URL_MUTATION = `#graphql
mutation customerResetByUrl($email: String!) {
  customerRecover(email: $email) {
    customerUserErrors {
      code
      field
      message
    }
  }
}`;
