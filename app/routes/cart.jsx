import {Await, useRouteLoaderData, useLoaderData, data} from '@remix-run/react';
import {Suspense} from 'react';
import {CartForm} from '@shopify/hydrogen';
import {CartMain} from '~/components/CartMain';
import {TopProductSections} from '~/components/TopProductSections';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: `961Souq | Cart`}];
};

/**
 * Loader: Fetch the New Arrivals collection along with any additional data.
 * (This loader runs in parallel with your root loader.)
 *
 * @param {Object} args
 * @param {import("@shopify/remix-oxygen").OxygenRequestContext} args.context
 */
export async function loader({context}) {
  // Fetch new arrivals using the helper function below.
  const newArrivals = await fetchCollectionByHandle(context, 'new-arrivals');

  return ({
    newArrivals,
  });
}

/**
 * Action for updating the cart
 *
 * @param {ActionFunctionArgs} args
 */
export async function action({request, context}) {
  const {cart} = context;
  const formData = await request.formData();
  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;
      const discountCodes = formDiscountCode ? [formDiscountCode] : [];
      discountCodes.push(...inputs.discountCodes);
      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesUpdate: {
      const formGiftCardCode = inputs.giftCardCode;
      const giftCardCodes = formGiftCardCode ? [formGiftCardCode] : [];
      giftCardCodes.push(...inputs.giftCardCodes);
      result = await cart.updateGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

/**
 * Helper function to fetch a collection by its handle.
 *
 * @param {import('@shopify/remix-oxygen').OxygenRequestContext} context
 * @param {string} handle
 */
async function fetchCollectionByHandle(context, handle) {
  const {collectionByHandle} = await context.storefront.query(
    GET_COLLECTION_BY_HANDLE_QUERY,
    {
      variables: {handle},
      cache: context.storefront.CacheLong(),
    },
  );
  return collectionByHandle || null;
}

// GraphQL query to retrieve a collection along with its products.
const GET_COLLECTION_BY_HANDLE_QUERY = `#graphql
  query GetCollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      title
      handle
      image {
        url
        altText
      }
      products(first: 10) {
        nodes {
          id
          title
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 2) {
            nodes {
              url
              altText
            }
          }
          variants(first: 5) {
            nodes {
              id
              availableForSale
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  }
`;

export default function Cart() {
  // Data from the root loader (for the cart)
  const rootData = useRouteLoaderData('root');
  // Data from this route's loader (for the new arrivals collection)
  const {newArrivals} = useLoaderData();

  if (!rootData) return null;

  return (
    <div className="cart">
      <h1>Cart</h1>
        <Await
          resolve={rootData.cart}
          errorElement={<div>An error occurred</div>}
        >
          {(cart) => {
            return (
              <>
                <CartMain layout="page" cart={cart} />
              </>
            );
          }}
        </Await>
      {/* Render the New Arrivals section */}
      {newArrivals && (
        <section className="new-arrivals-section">
          <TopProductSections collection={newArrivals} />
        </section>
      )}
    </div>
  );
}

/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/hydrogen').CartQueryDataReturn} CartQueryDataReturn */
/** @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs */
/** @typedef {import('~/root').RootLoader} RootLoader */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof action>} ActionReturnData */
