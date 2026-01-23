import {CartForm, Image} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from '@remix-run/react';
import {ProductPrice} from './ProductPrice';
import {useAside} from './Aside';
import {truncateText} from './CollectionDisplay';

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 * @param {{
 *   layout: CartLayout;
 *   line: CartLine;
 * }}
 */
export function CartLineItem({layout, line}) {
  const {id, merchandise} = line;
  const product = merchandise?.product ?? {};
  const title = merchandise?.title;
  const image = merchandise?.image;
  const selectedOptions = merchandise?.selectedOptions ?? [];
  const lineItemUrl = useVariantUrl(product.handle || '', selectedOptions);
  const {close} = useAside();
  const imageWidth = image?.width ?? 600;
  const imageHeight = image?.height ?? 600;
  const imageUrl = image?.url || '';
  const imageAlt = title || product.title || 'Cart item';
  const linePrice = line?.cost?.totalAmount;

  return (
    <li key={id} className="cart-line">
      <div
        className="cart-line-image-wrap"
        style={{aspectRatio: imageWidth / imageHeight}}
      >
        {imageUrl ? (
          <img
            src={`${imageUrl}${imageUrl.includes('?') ? '&' : '?'}quality=15`}
            alt={imageAlt}
            loading="lazy"
            width={imageWidth}
            height={imageHeight}
            className="cart-line-image"
          />
        ) : (
          <div className="cart-line-image-placeholder" aria-hidden="true" />
        )}
      </div>

      <div className="cart-item-details">
        <Link
          prefetch="intent"
          to={lineItemUrl}
          onClick={() => {
            if (layout === 'aside') {
              close();
            }
          }}
        >
          <p>
            <strong className="cart-product-title">
              {truncateText(product.title, 15)}
            </strong>
          </p>
        </Link>
        {linePrice ? (
          <ProductPrice price={linePrice} />
        ) : (
          <div className="cart-price-skeleton" aria-hidden="true" />
        )}
        <ul>
          {selectedOptions
            .filter((option) => option.value.toLowerCase() !== 'default title')
            .map((option) => (
              <li key={option.name}>
                <small>
                  <strong>{option.name}:</strong> {option.value}
                </small>
              </li>
            ))}
        </ul>
        <CartLineQuantity line={line} />
      </div>
    </li>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 * @param {{line: CartLine}}
 */
function CartLineQuantity({line}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;

  const maxQuantity = 5; // Set the maximum allowed quantity
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number(Math.min(maxQuantity, quantity + 1).toFixed(0)); // Limit to maxQuantity

  return (
    <div className="cart-line-quantity">
      <div className="qnt-rem">
        <small>
          <strong>Quantity:</strong> {quantity} &nbsp;&nbsp;
        </small>
        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
            <button
              className="group cursor-pointer outline-none hover:rotate-90 duration-300"
              title="Add New"
            >
              <svg
                className="stroke-red-500 fill-none group-hover:fill-red-800 group-active:stroke-red-200 group-active:fill-red-600 group-active:duration-0 duration-300"
                viewBox="0 0 24 24"
                height="25px"
                width="25px"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeWidth="1.5"
                  d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                ></path>
                <path strokeWidth="1.5" d="M8 12H16"></path>
              </svg>
            </button>
          </CartLineUpdateButton>
          <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
            <button
              className="group cursor-pointer outline-none hover:rotate-90 duration-300"
              title="Add New"
            >
              <svg
                className="stroke-teal-500 fill-none group-hover:fill-teal-800 group-active:stroke-teal-200 group-active:fill-teal-600 group-active:duration-0 duration-300"
                viewBox="0 0 24 24"
                height="25px"
                width="25px"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeWidth="1.5"
                  d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                ></path>
                <path strokeWidth="1.5" d="M8 12H16"></path>
                <path strokeWidth="1.5" d="M12 16V8"></path>
              </svg>
            </button>
          </CartLineUpdateButton>
        </div>
      </div>
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 * @param {{
 *   lineIds: string[];
 *   disabled: boolean;
 * }}
 */
function CartLineRemoveButton({lineIds, disabled}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button className="bin-button">Remove Item</button>
    </CartForm>
  );
}

/**
 * @param {{
 *   children: React.ReactNode;
 *   lines: CartLineUpdateInput[];
 * }}
 */
function CartLineUpdateButton({children, lines}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/** @typedef {OptimisticCartLine<CartApiQueryFragment>} CartLine */

/** @typedef {import('@shopify/hydrogen/storefront-api-types').CartLineUpdateInput} CartLineUpdateInput */
/** @typedef {import('~/components/CartMain').CartLayout} CartLayout */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLine} OptimisticCartLine */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
