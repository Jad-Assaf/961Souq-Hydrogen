// app/routes/api.user-status.jsx
import {json} from '@shopify/remix-oxygen';

export async function loader({context}) {
  try {
    const {customerAccount} = context;
    if (!customerAccount) return json({loggedIn: false});

    const {data, errors} = await customerAccount.query({
      query: `#graphql
        query {
          customer {
            id
            firstName
            lastName
            emailAddress {
              emailAddress
            }
          }
        }
      `,
    });

    if (errors) return json({loggedIn: false});
    
    const customer = data?.customer;
    if (!customer?.id) {
      return json({loggedIn: false});
    }

    return json({
      loggedIn: true,
      customerId: customer.id || null,
      firstName: customer.firstName || null,
      lastName: customer.lastName || null,
      email: customer.emailAddress?.emailAddress || null,
      fullName: customer.firstName && customer.lastName
        ? `${customer.firstName} ${customer.lastName}`
        : customer.firstName || customer.lastName || null,
    });
  } catch {
    return json({loggedIn: false});
  }
}
