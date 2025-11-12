// CartSummary.jsx – updated: checkout button is direct; hidden OTP test button triggers the gate
import {CartForm, Money} from '@shopify/hydrogen';
import {useEffect, useRef, useState, useMemo} from 'react';
import {trackInitiateCheckout} from '~/lib/metaPixelEvents';

const OTP_API_BASE = 'https://whatsapp-otp-gate.vercel.app'; // replace with your Vercel deployment
const OTP_CLIENT_COOLDOWN_MS = 2 * 60 * 1000; // 2-minute wait limit

async function startOtp(cartId, phone) {
  const res = await fetch(`${OTP_API_BASE}/api/otp/start`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({cartId, phone}),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || 'Failed to start OTP');
  }
  return res.json();
}

async function verifyOtp(cartId, code) {
  const res = await fetch(`${OTP_API_BASE}/api/otp/verify`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({cartId, code}),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || 'Invalid code');
  }
  return res.json();
}

async function getCheckoutUrl(cartId) {
  const res = await fetch(`${OTP_API_BASE}/api/checkout-url`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({cartId}),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || 'Not verified');
  }
  return res.json();
}

// fallback prompt-based UI; override via window.otpUI.requestPhone / requestCode
async function requestPhoneFallback() {
  const val = prompt(
    'Enter your WhatsApp number (E.164, e.g. +96170000000):',
    '',
  );
  if (!val) throw new Error('Phone number is required');
  return val.trim();
}
async function requestCodeFallback(ctx) {
  const val = prompt('Enter the 6-digit code we sent via WhatsApp:', '');
  if (!val) throw new Error('Code is required');
  return val.trim();
}

export function CartSummary({cart, layout}) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';
  const subtotal = parseFloat(cart?.cost?.subtotalAmount?.amount ?? '0');
  return (
    <div aria-labelledby="cart-summary" className={className}>
      {/* ... existing subtotal and shipping display ... */}
      <CartCheckoutActions
        checkoutUrl={cart.checkoutUrl}
        cartTotal={subtotal}
        cart={cart}
      />
    </div>
  );
}

export default function CartCheckoutActions({
  checkoutUrl,
  cartTotal = 0,
  cart,
}) {
  const [showAlert, setShowAlert] = useState(false);
  const [busy, setBusy] = useState(false); // busy only affects the hidden OTP flow now
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (cartTotal < 10000 && showAlert) {
      setShowAlert(false);
    }
  }, [cartTotal, showAlert]);

  // OTP gate (unchanged logic)
  const handleOtpGate = async () => {
    setErrorMsg('');
    setBusy(true);
    try {
      // enforce client-side cooldown
      const waitUntil = Number(localStorage.getItem('otpWaitUntil') || '0');
      const now = Date.now();
      if (now < waitUntil) {
        const remaining = Math.ceil((waitUntil - now) / 1000);
        throw new Error(
          `Please wait ${remaining} seconds before requesting a new verification code.`,
        );
      }

      const requestPhone = window.otpUI?.requestPhone || requestPhoneFallback;
      const requestCode = window.otpUI?.requestCode || requestCodeFallback;

      const phone = await requestPhone(cart);
      const startRes = await startOtp(cart.id, phone);

      // set 2-minute cooldown
      localStorage.setItem(
        'otpWaitUntil',
        (Date.now() + OTP_CLIENT_COOLDOWN_MS).toString(),
      );

      let verified = false;
      for (let i = 0; i < 6; i++) {
        const code = await requestCode({resendAt: startRes?.resendAt});
        try {
          await verifyOtp(cart.id, code);
          verified = true;
          break;
        } catch (e) {
          setErrorMsg(e instanceof Error ? e.message : String(e));
          if (/expired/i.test(errorMsg)) break;
        }
      }
      if (!verified)
        throw new Error('Verification failed. Please request a new code.');

      const {checkoutUrl: gatedUrl} = await getCheckoutUrl(cart.id);
      window.location.href = gatedUrl;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  // Visible checkout button: direct to checkout (no OTP)
  const handleButtonClick = async () => {
    if (cartTotal > 10000) {
      setShowAlert(true);
      return;
    }
    trackInitiateCheckout(cart);
    window.location.href = checkoutUrl;
  };

  if (!checkoutUrl) return null;

  return (
    <div className="cart-checkout-container">
      {/* Visible button – no OTP */}
      <button
        type="button"
        className={`cart-checkout-button ${
          cartTotal > 10000 ? 'disabled-look' : ''
        }`}
        onClick={handleButtonClick}
        disabled={cartTotal > 10000}
      >
        Continue to Checkout
      </button>

      {/* Hidden OTP test trigger – display:none; click via console */}
      {/* Usage: document.getElementById('otp-test')?.click() */}
      <button
        id="otp-test"
        type="button"
        style={{display: 'none'}}
        onClick={handleOtpGate}
        aria-hidden="true"
        tabIndex={-1}
      >
        OTP Test
      </button>

      {errorMsg && (
        <div className="alert-box" style={{marginTop: 10}}>
          <span className="alert-message">{errorMsg}</span>
        </div>
      )}
      {showAlert && (
        <div className="alert-box">
          <span className="alert-icon">&times;</span>
          <span className="alert-message">
            We apologize for any inconvenience! Your order is above $10000.
            Please contact sales to proceed.&nbsp;
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
