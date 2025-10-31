import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {useState, useEffect, useMemo} from 'react';

export function CartMain({layout, cart: originalCart}) {
  const cart = useOptimisticCart(originalCart);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(cart?.pendingActions?.length > 0);
  }, [cart?.pendingActions]);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity > 0;

  /**
   * Build clean WhatsApp message
   */
  const whatsappLink = useMemo(() => {
    if (!cartHasItems) return '';

    let message = 'Hi, I want to place an order for the following items:\n\n';
    let counter = 1;

    for (const line of cart.lines.nodes) {
      const product = line.merchandise?.product;
      const title = product?.title || 'Untitled';
      const variantTitle = line.merchandise?.title;
      const price = line.cost?.totalAmount?.amount;
      const currency = line.cost?.totalAmount?.currencyCode || '';
      const handle = product?.handle;
      const link = handle
        ? `https://961souq.com/products/${handle}`
        : product?.onlineStoreUrl || '';

      message += `${counter}. ${title}${
        variantTitle && variantTitle !== 'Default Title'
          ? ` (${variantTitle})`
          : ''
      }\n`;
      if (link) message += `${link}\n`;
      if (price) message += `Price: $${price} ${currency}\n\n`;
      counter++;
    }

    const subtotal = cart.cost?.subtotalAmount?.amount;
    const currency = cart.cost?.subtotalAmount?.currencyCode;
    if (subtotal) message += `Subtotal: $${subtotal} ${currency}\n`;

    const encoded = encodeURIComponent(message.trim());
    const whatsappNumber = '9613963961';
    return `https://wa.me/${whatsappNumber}?text=${encoded}`;
  }, [cart, cartHasItems]);

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
          <ul className="cart-lines-ul">
            {(cart?.lines?.nodes ?? []).map((line) => (
              <CartLineItem key={line.id} line={line} layout={layout} />
            ))}
          </ul>
        </div>
      </div>

      <button className="gtc-button">
        <a href="/cart" className="go-to-cart">
          Go to Cart
        </a>
      </button>

      {cartHasItems && (
        <>
          <CartSummary cart={cart} layout={layout} />
        </>
      )}
    </div>
  );
}

/**
 * Empty Cart Component
 */
function CartEmpty({hidden = false}) {
  const {close} = useAside();
  return (
    <div hidden={hidden} className="empty-cart">
      <img
        className="empty-cart-image"
        src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ChatGPT_Image_Oct_18_2025_12_58_01_PM.png?v=1760781648"
        alt=""
      />
      <Link
        to="/collections/new-arrivals"
        onClick={close}
        className="empty-cart-link"
      >
        Continue shopping
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
