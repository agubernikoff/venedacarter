// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/customerAddressUpdate
export const UPDATE_ADDRESS_MUTATION = `#graphql
mutation customerAddressUpdate($address: MailingAddressInput!, $customerAccessToken: String!, $id: ID!) {
  customerAddressUpdate(address: $address, customerAccessToken: $customerAccessToken, id: $id) {
    customerAddress {
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
    customerUserErrors {
      code
      field
      message
    }
    userErrors {
      field
      message
    }
  }
}
`;

// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/customerAddressDelete
export const DELETE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressDelete(
    $addressId: ID!,
  ) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors {
        code
        field
        message
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/customerAddressCreate
export const CREATE_ADDRESS_MUTATION = `#graphql
mutation customerAddressCreate($address: MailingAddressInput!, $customerAccessToken: String!) {
  customerAddressCreate(address: $address, customerAccessToken: $customerAccessToken) {
    customerAddress {
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
    customerUserErrors {
      code
      field
      message
    }
    userErrors {
      field
      message
    }
  }
}
`;
