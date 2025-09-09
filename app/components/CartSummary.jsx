import {CartForm, Money} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';
import {trackInitiateCheckout} from '~/lib/metaPixelEvents'; // **Added Import**

/**
 * @param {CartSummaryProps}
 */
export function CartSummary({cart, layout}) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  const subtotal = parseFloat(cart?.cost?.subtotalAmount?.amount ?? '0');

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <p style={{margin: '15px 0 10px 0'}}>
        Shipping: &nbsp;Calculated At Checkout
      </p>
      <dl className="cart-subtotal">
        <h4>
          <strong>Estimated Total: &nbsp;</strong>
        </h4>
        <dd>
          {cart.cost?.subtotalAmount?.amount ? (
            <Money
              data={cart.cost.subtotalAmount}
              style={{fontWeight: '500'}}
            />
          ) : (
            '-'
          )}
        </dd>
      </dl>

      {/* **Added `cart` Prop Here** */}
      <CartCheckoutActions
        checkoutUrl={cart.checkoutUrl}
        cartTotal={subtotal}
        cart={cart} // **Added Prop**
      />
    </div>
  );
}

/**
 * @param {{checkoutUrl?: string, cartTotal?: number, cart: CartApiQueryFragment}} // **Updated Prop Types**
 */
export default function CartCheckoutActions({
  checkoutUrl,
  cartTotal = 0,
  cart,
}) {
  // **Added `cart` Parameter**
  const [showAlert, setShowAlert] = useState(false);

  // Hide the alert if the subtotal drops below $5000
  useEffect(() => {
    if (cartTotal < 10000 && showAlert) {
      setShowAlert(false);
    }
  }, [cartTotal, showAlert]);

  const handleButtonClick = () => {
    if (cartTotal > 10000) {
      // Prevent navigation, show alert
      setShowAlert(true);
    } else {
      // **Added: Track Initiate Checkout Event**
      trackInitiateCheckout(cart); // **Added Line**

      // Navigate to checkout
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        console.error('Checkout URL is undefined.');
      }
    }
  };

  if (!checkoutUrl) return null;

  return (
    <div className="cart-checkout-container">
      <button
        type="button"
        className={`cart-checkout-button ${
          cartTotal > 10000 ? 'disabled-look' : ''
        }`}
        onClick={handleButtonClick}
        aria-label="Continue to Checkout" // **Optional: Added aria-label for accessibility**
      >
        Continue to Checkout
      </button>

      {showAlert && (
        <div className="alert-box">
          <span className="alert-icon">&times;</span>
          <span className="alert-message">
            We apologize for any inconvenience! Your order is above $10000.
            Please contact sales to proceed.{' '}
            <a className="cart-err-msg-link" href="https://wa.me/96171888036">
              +961 70 888 036
            </a>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * @param {{
 *   discountCodes?: CartApiQueryFragment['discountCodes'];
 * }}
 */
function CartDiscounts({discountCodes}) {
  const codes =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div>
      {/* Have existing discount, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt>Discount(s)</dt>
          <UpdateDiscountForm>
            <div className="cart-discount">
              <code>{codes?.join(', ')}</code>
              &nbsp;
              <button>Remove</button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div>
          <input type="text" name="discountCode" placeholder="Discount code" />
          &nbsp;
          <button type="submit">Apply</button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

/**
 * @param {{
 *   discountCodes?: string[];
 *   children: React.ReactNode;
 * }}
 */
function UpdateDiscountForm({discountCodes, children}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

/**
 * @param {{
 *   giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
 * }}
 */
function CartGiftCard({giftCardCodes}) {
  const appliedGiftCardCodes = useRef([]);
  const giftCardCodeInput = useRef(null);
  const codes =
    giftCardCodes?.map(({lastCharacters}) => `***${lastCharacters}`) || [];

  function saveAppliedCode(code) {
    const formattedCode = code.replace(/\s/g, ''); // Remove spaces
    if (!appliedGiftCardCodes.current.includes(formattedCode)) {
      appliedGiftCardCodes.current.push(formattedCode);
    }
    giftCardCodeInput.current.value = '';
  }

  function removeAppliedCode() {
    appliedGiftCardCodes.current = [];
  }

  return (
    <div>
      {/* Have existing gift card applied, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt>Applied Gift Card(s)</dt>
          <UpdateGiftCardForm>
            <div className="cart-discount">
              <code>{codes?.join(', ')}</code>
              &nbsp;
              {/* **Changed `onSubmit` to `onClick`** */}
              <button onClick={removeAppliedCode}>Remove</button>
            </div>
          </UpdateGiftCardForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateGiftCardForm
        giftCardCodes={appliedGiftCardCodes.current}
        saveAppliedCode={saveAppliedCode}
      >
        <div>
          <input
            type="text"
            name="giftCardCode"
            placeholder="Gift card code"
            ref={giftCardCodeInput}
          />
          &nbsp;
          <button type="submit">Apply</button>
        </div>
      </UpdateGiftCardForm>
    </div>
  );
}

/**
 * @param {{
 *   giftCardCodes?: string[];
 *   saveAppliedCode?: (code: string) => void;
 *   removeAppliedCode?: () => void;
 *   children: React.ReactNode;
 * }}
 */
function UpdateGiftCardForm({giftCardCodes, saveAppliedCode, children}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesUpdate}
      inputs={{
        giftCardCodes: giftCardCodes || [],
      }}
    >
      {(fetcher) => {
        const code = fetcher.formData?.get('giftCardCode');
        if (code) saveAppliedCode && saveAppliedCode(code);
        return children;
      }}
    </CartForm>
  );
}

/**
 * @typedef {{
 *   cart: OptimisticCart<CartApiQueryFragment | null>;
 *   layout: CartLayout;
 * }} CartSummaryProps
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('~/components/CartMain').CartLayout} CartLayout */
/** @typedef {import('@shopify/hydrogen').OptimisticCart} OptimisticCart */
