// app/graphql/customer-account/CustomerResetByUrl.js
export const CUSTOMER_RECOVER_BY_URL_MUTATION = `#graphql
mutation customerResetByUrl($email: String!) {
  customerRecover(email: $email) {
    customerUserErrors {
      code
      field
      message
    }
  }
}`;
export const CUSTOMER_RESET_MUTATION = `#graphql
mutation customerReset($id: ID!, $input: CustomerResetInput!) {
  customerReset(id: $id, input: $input) {
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
