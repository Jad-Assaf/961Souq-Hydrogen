// app/routes/api.user.status.jsx
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
          }
        }
      `,
    });

    if (errors) return json({loggedIn: false});
    return json({
      loggedIn: Boolean(data?.customer?.id),
      customerId: data?.customer?.id || null,
    });
  } catch {
    return json({loggedIn: false});
  }
}
