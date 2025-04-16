import {CartForm, Image} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from '@remix-run/react';
import {ProductPrice} from './ProductPrice';
import {useAside} from './Aside';
import '../styles/CartPage.css';
import { truncateText } from './CollectionDisplay';


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
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();

  return (
    <li key={id} className="cart-line">
      {image && (
        <img
          src={image.url}
          // sizes="(min-width: 45em) 20vw, 40vw"
          alt={title}
          loading="lazy"
        />
      )}

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
            <strong className="cart-product-title">{truncateText(product.title, 15)}</strong>
          </p>
        </Link>
        <ProductPrice price={line?.cost?.totalAmount} />
        {/* <ul>
          {selectedOptions.map((option) => (
            <li key={option.name}>
              <small>
                <strong>{option.name}:</strong> {option.value}
              </small>
            </li>
          ))}
        </ul> */}
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
      <small>
        <strong>Quantity:</strong> {quantity} &nbsp;&nbsp;
      </small>
      <div className="qnt-rem">
        <div style={{display: 'flex', gap: '12px', marginBottom: '7px'}}>
          <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
            <button
              className="group cursor-pointer outline-none hover:rotate-90 duration-300"
              title="Add New"
            >
              <svg
                className="stroke-red-500 fill-none group-hover:fill-red-800 group-active:stroke-red-200 group-active:fill-red-600 group-active:duration-0 duration-300"
                viewBox="0 0 24 24"
                height="30px"
                width="30px"
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
                height="30px"
                width="30px"
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
        <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
      </div>
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
      <button className="bin-button">
        <svg
          className="bin-top"
          viewBox="0 0 39 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line y1="5" x2="39" y2="5" stroke="white" strokeWidth="4"></line>
          <line
            x1="12"
            y1="1.5"
            x2="26.0357"
            y2="1.5"
            stroke="white"
            strokeWidth="3"
          ></line>
        </svg>
        <svg
          className="bin-bottom"
          viewBox="0 0 33 39"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <mask id="path-1-inside-1_8_19" fill="white">
            <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"></path>
          </mask>
          <path
            d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
            fill="white"
            mask="url(#path-1-inside-1_8_19)"
          ></path>
          <path d="M12 6L12 29" stroke="white" strokeWidth="4"></path>
          <path d="M21 6V29" stroke="white" strokeWidth="4"></path>
        </svg>
      </button>
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
