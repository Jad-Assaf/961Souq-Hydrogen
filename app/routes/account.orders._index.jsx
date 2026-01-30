import {Link, useLoaderData} from '@remix-run/react';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

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

  return {customer: data.customer};
}

export default function Orders() {
  /** @type {LoaderReturnData} */
  const {customer} = useLoaderData();
  const {orders} = customer;
  return (
    <section className="account-panel">
      <div className="account-panel-header">
        <div>
          <h2>Orders</h2>
          <p>Track shipments, returns, and invoices.</p>
        </div>
      </div>
      <div className="account-panel-body">
        {orders.nodes.length ? <OrdersTable orders={orders} /> : <EmptyOrders />}
      </div>
    </section>
  );
}

/**
 * @param {Pick<CustomerOrdersFragment, 'orders'>}
 */
function OrdersTable({orders}) {
  return (
    <div className="account-orders">
      <PaginatedResourceSection
        connection={orders}
        resourcesClassName="account-order-list"
      >
        {({node: order}) => <OrderItem key={order.id} order={order} />}
      </PaginatedResourceSection>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="account-empty">
      <p>You have not placed any orders yet.</p>
      <Link className="account-link" to="/collections">
        Start shopping
      </Link>
    </div>
  );
}

/**
 * @param {{order: OrderItemFragment}}
 */
function OrderItem({order}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  return (
    <article className="account-order-card">
      <div className="account-order-main">
        <Link
          className="account-order-number"
          to={`/account/orders/${btoa(order.id)}`}
        >
          Order #{order.number}
        </Link>
        <div className="account-order-meta">
          <span>{new Date(order.processedAt).toLocaleDateString()}</span>
          <span className="status-pill">{order.financialStatus}</span>
          {fulfillmentStatus && (
            <span className="status-pill is-muted">{fulfillmentStatus}</span>
          )}
        </div>
      </div>
      <div className="account-order-total">
        <Money data={order.totalPrice} />
        <Link className="account-link" to={`/account/orders/${btoa(order.id)}`}>
          View details
        </Link>
      </div>
    </article>
  );
}

/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('customer-accountapi.generated').CustomerOrdersFragment} CustomerOrdersFragment */
/** @typedef {import('customer-accountapi.generated').OrderItemFragment} OrderItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
