import {useOptimisticCart} from '@shopify/hydrogen';
import {useRevalidator} from '@remix-run/react';
import {Link} from '@remix-run/react';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {useState, useEffect} from 'react';

export function CartMain({layout, cart: originalCart}) {
  const cart = useOptimisticCart(originalCart);
  const revalidator = useRevalidator();
  const [isLoading, setIsLoading] = useState(false);

  // Monitor pendingActions and trigger revalidation when they clear
  useEffect(() => {
    if (cart?.pendingActions?.length > 0) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
      // Once pending actions are done, re-run the loader to fetch updated cart data.
      revalidator.revalidate();
    }
  }, [cart?.pendingActions, revalidator]);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity > 0;

  return (
    <div className={className}>
      {isLoading && (
        <div className="cart-loader">
          <p>Updating cart...</p>
        </div>
      )}

      <CartEmpty hidden={linesCount} layout={layout} />
      <div className="cart-details">
        <div className="cart-lines" aria-labelledby="cart-lines">
          <ul>
            {(cart?.lines?.nodes ?? []).map((line) => (
              <CartLineItem key={line.id} line={line} layout={layout} />
            ))}
          </ul>
        </div>
      </div>
      {cartHasItems && <CartSummary cart={cart} layout={layout} />}
    </div>
  );
}

function CartEmpty({hidden = false, layout}) {
  const {close} = useAside();
  return (
    <div hidden={hidden}>
      <br />
      <p>
        <strong>
          Looks like you haven’t added anything yet, let’s get you started!
        </strong>
      </p>
      <br />
      <Link to="/collections/new-arrivals" onClick={close} prefetch="viewport">
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
