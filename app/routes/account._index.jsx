import {data} from '@shopify/remix-oxygen';
import {Link, useLoaderData, useOutletContext} from '@remix-run/react';
import {Money, flattenConnection} from '@shopify/hydrogen';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  const isLoggedIn = await context.customerAccount.isLoggedIn();

  if (!isLoggedIn) {
    return data(
      {orders: null, isLoggedIn},
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  }

  const {data: ordersData, errors} = await context.customerAccount.query(
    CUSTOMER_ORDERS_QUERY,
    {
      variables: {
        first: 3,
      },
    },
  );

  if (errors?.length) {
    throw new Error('Customer orders not found');
  }

  return data(
    {orders: ordersData?.customer?.orders ?? null, isLoggedIn},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountIndex() {
  /** @type {LoaderReturnData} */
  const {orders, isLoggedIn} = useLoaderData();
  const {customer} = useOutletContext();
  if (!isLoggedIn) return null;
  const recentOrders = orders?.nodes ?? [];
  const defaultAddress = customer?.defaultAddress;
  const fullName = [customer?.firstName, customer?.lastName]
    .filter(Boolean)
    .join(' ');
  const addressSummary = formatAddressSummary(defaultAddress);
  const addressCount = customer?.addresses?.nodes?.length ?? 0;
  const addressLabel = addressCount === 1 ? 'address saved' : 'addresses saved';

  return (
    <div className="account-dashboard">
      <div className="account-dashboard-grid">
        <section className="account-panel account-panel--span">
          <div className="account-panel-header">
            <div>
              <h2>Recent orders</h2>
              <p>Track shipments, returns, and receipts.</p>
            </div>
            <Link className="account-link" to="/account/orders">
              View all
            </Link>
          </div>
          {recentOrders.length ? (
            <div className="account-order-list">
              {recentOrders.map((order) => {
                const fulfillmentStatus =
                  flattenConnection(order.fulfillments)[0]?.status;
                return (
                  <div className="account-order-card" key={order.id}>
                    <div className="account-order-main">
                      <Link
                        className="account-order-number"
                        to={`/account/orders/${btoa(order.id)}`}
                      >
                        Order #{order.number}
                      </Link>
                      <div className="account-order-meta">
                        <span>
                          {new Date(order.processedAt).toLocaleDateString()}
                        </span>
                        <span className="status-pill">
                          {order.financialStatus}
                        </span>
                        {fulfillmentStatus && (
                          <span className="status-pill is-muted">
                            {fulfillmentStatus}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="account-order-total">
                      <Money data={order.totalPrice} />
                      <Link
                        className="account-link"
                        to={`/account/orders/${btoa(order.id)}`}
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="account-empty">
              <p>No orders yet.</p>
              <Link className="account-link" to="/collections">
                Start shopping
              </Link>
            </div>
          )}
        </section>

        <section className="account-panel">
          <div className="account-panel-header">
            <div>
              <h2>Profile</h2>
              <p>Keep your details up to date.</p>
            </div>
            <Link className="account-link" to="/account/profile">
              Edit
            </Link>
          </div>
          <div className="account-panel-body">
            <div className="account-summary-row">
              <span>Name</span>
              <span>{fullName || 'Customer'}</span>
            </div>
            <div className="account-summary-row">
              <span>Status</span>
              <span>Active</span>
            </div>
          </div>
        </section>

        <section className="account-panel">
          <div className="account-panel-header">
            <div>
              <h2>Addresses</h2>
              <p>Manage delivery details.</p>
            </div>
            <Link className="account-link" to="/account/addresses">
              Manage
            </Link>
          </div>
          <div className="account-panel-body">
            <div className="account-summary-row">
              <span>Default</span>
              <span>{addressSummary}</span>
            </div>
            <div className="account-summary-row">
              <span>Saved</span>
              <span>
                {addressCount} {addressLabel}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * @param {CustomerFragment['defaultAddress'] | null | undefined} address
 */
function formatAddressSummary(address) {
  if (!address) return 'No default address';
  if (address.formatted?.length) return address.formatted.join(', ');
  const fallback = [
    address.address1,
    address.city,
    address.zoneCode,
    address.territoryCode,
  ]
    .filter(Boolean)
    .join(', ');
  return fallback || 'Default address saved';
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
/** @typedef {import('customer-accountapi.generated').CustomerFragment} CustomerFragment */
