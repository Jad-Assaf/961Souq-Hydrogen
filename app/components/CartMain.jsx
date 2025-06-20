import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {useState, useEffect} from 'react';

/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 * @param {CartMainProps}
 */
export function CartMain({layout, cart: originalCart}) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  // Loader state to track pending cart updates
  const [isLoading, setIsLoading] = useState(false);

  // Track cart fetcher state
  useEffect(() => {
    // If cart has pending actions, set loading state
    if (cart?.pendingActions?.length > 0) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [cart?.pendingActions]);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity > 0;

  return (
    <div className={className}>
      {/* Loader */}
      {isLoading && (
        <div className="cart-loader">
          <p>Updating cart...</p>
        </div>
      )}

      <CartEmpty hidden={linesCount} layout={layout} />
      <div className="cart-details">
        <div className="cart-lines" aria-labelledby="cart-lines">
          <ul className="cart-lines-ul">
            {(cart?.lines?.nodes ?? []).map((line) => (
              <CartLineItem key={line.id} line={line} layout={layout} />
            ))}
          </ul>
        </div>
      </div>
      <button className='gtc-button'>
        <a href="/cart" className="go-to-cart">
          Go to Cart
        </a>
      </button>
      {cartHasItems && <CartSummary cart={cart} layout={layout} />}
    </div>
  );
}

/**
 * @param {{
 *   hidden: boolean;
 *   layout?: CartMainProps['layout'];
 * }}
 */
function CartEmpty({hidden = false}) {
  const {close} = useAside();
  return (
    <div hidden={hidden} className='empty-cart'>
      <br />
      <p>
        <strong>
          Looks like you haven&rsquo;t added anything yet, let&rsquo;s get you
          started!
        </strong>
      </p>
      <br />
      <Link to="/collections/new-arrivals" onClick={close} className='empty-cart-link'>
        Continue shopping →
      </Link>
    </div>
  );
}

/** @typedef {'page' | 'aside'} CartLayout */
/**
 * @typedef {{
 *   cart: CartApiQueryFragment | null;
 *   layout: CartLayout;
 * }} CartMainProps
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
