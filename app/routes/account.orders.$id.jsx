import {redirect} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {Money, Image, flattenConnection} from '@shopify/hydrogen';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Order ${data?.order?.name}`}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({params, context}) {
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const {data, errors} = await context.customerAccount.query(
    CUSTOMER_ORDER_QUERY,
    {
      variables: {orderId},
    },
  );

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const {order} = data;

  const lineItems = flattenConnection(order.lineItems);
  const discountApplications = flattenConnection(order.discountApplications);

  const fulfillmentStatus =
    flattenConnection(order.fulfillments)[0]?.status ?? 'N/A';

  const firstDiscount = discountApplications[0]?.value;

  const discountValue =
    firstDiscount?.__typename === 'MoneyV2' && firstDiscount;

  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue' &&
    firstDiscount?.percentage;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

export default function OrderRoute() {
  /** @type {LoaderReturnData} */
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData();
  return (
    <section className="account-panel account-order-detail">
      <div className="account-panel-header account-panel-header--split">
        <div>
          <h2>Order {order.name}</h2>
          <p>Placed on {new Date(order.processedAt).toDateString()}</p>
        </div>
        <a
          className="account-button account-button--ghost"
          target="_blank"
          href={order.statusPageUrl}
          rel="noreferrer"
        >
          View order status
        </a>
      </div>

      <div className="account-order-layout">
        <div className="account-order-items">
          <div className="account-order-table">
            <div className="account-order-head">
              <div>Item</div>
              <div>Price</div>
              <div>Qty</div>
              <div>Total</div>
            </div>
            <div className="account-order-body">
              {lineItems.map((lineItem) => (
                <OrderLineRow key={lineItem.id} lineItem={lineItem} />
              ))}
            </div>
          </div>
        </div>

        <aside className="account-order-sidebar">
          <div className="account-card">
            <h3>Shipping address</h3>
            {order?.shippingAddress ? (
              <address>
                <p>{order.shippingAddress.name}</p>
                {order.shippingAddress.formatted ? (
                  <p>{order.shippingAddress.formatted.join(', ')}</p>
                ) : null}
                {order.shippingAddress.formattedArea ? (
                  <p>{order.shippingAddress.formattedArea}</p>
                ) : null}
              </address>
            ) : (
              <p>No shipping address defined.</p>
            )}
          </div>

          <div className="account-card">
            <h3>Status</h3>
            <div className="status-pill">{fulfillmentStatus}</div>
          </div>

          <div className="account-card">
            <h3>Totals</h3>
            <div className="account-total-row">
              <span>Subtotal</span>
              <Money data={order.subtotal} />
            </div>
            <div className="account-total-row">
              <span>Tax</span>
              <Money data={order.totalTax} />
            </div>
            {((discountValue && discountValue.amount) ||
              discountPercentage) && (
              <div className="account-total-row">
                <span>Discounts</span>
                {discountPercentage ? (
                  <span>-{discountPercentage}%</span>
                ) : (
                  discountValue && <Money data={discountValue} />
                )}
              </div>
            )}
            <div className="account-total-row account-total-row--strong">
              <span>Total</span>
              <Money data={order.totalPrice} />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/**
 * @param {{lineItem: OrderLineItemFullFragment}}
 */
function OrderLineRow({lineItem}) {
  return (
    <div className="account-line-item">
      <div className="account-line-item-product">
        {lineItem?.image && (
          <div className="account-line-item-image">
            <Image data={lineItem.image} width={96} height={96} />
          </div>
        )}
        <div className="account-line-item-details">
          <p className="account-line-item-title">{lineItem.title}</p>
          <small className="account-line-item-variant">
            {lineItem.variantTitle}
          </small>
        </div>
      </div>

      <div className="account-line-item-price">
        <Money data={lineItem.price} />
      </div>
      <div className="account-line-item-quantity">{lineItem.quantity}</div>
      <div className="account-line-item-total">
        <Money data={lineItem.totalDiscount} />
      </div>
    </div>
  );
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('customer-accountapi.generated').OrderLineItemFullFragment} OrderLineItemFullFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
