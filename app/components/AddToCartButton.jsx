import {CartForm} from '@shopify/hydrogen';
import React, {useEffect, useRef, useState} from 'react';
import {CartTrackingFields} from './CartTrackingFields';

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: () => void;
 *   onCartAddSuccess?: () => void;
 * }}
 */
export function AddToCartButton({
  analytics,
  ariaLabel,
  children,
  className = '',
  disabled,
  includeBaseClass = true,
  lines,
  onCartAddSuccess,
  onClick,
  title,
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const pendingTrackRef = useRef(false);

  const handleAnimation = (e) => {
    setIsAnimating(true);
    pendingTrackRef.current = true;
    if (onClick) onClick(e);
    setTimeout(() => setIsAnimating(false), 300); // Reset animation after 300ms
  };

  const buttonStyles = {
    transition: 'transform 0.3s ease', // Smooth transition for scaling
    transform: isAnimating ? 'scale(1.1)' : 'scale(1)', // Scale up when animating
  };

  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
        <AddToCartButtonContent
          analytics={analytics}
          ariaLabel={ariaLabel}
          buttonStyles={buttonStyles}
          className={className}
          disabled={disabled}
          fetcher={fetcher}
          handleAnimation={handleAnimation}
          includeBaseClass={includeBaseClass}
          onCartAddSuccess={onCartAddSuccess}
          pendingTrackRef={pendingTrackRef}
          title={title}
        >
          {children}
        </AddToCartButtonContent>
      )}
    </CartForm>
  );
}

function AddToCartButtonContent({
  analytics,
  ariaLabel,
  buttonStyles,
  children,
  className,
  disabled,
  fetcher,
  handleAnimation,
  includeBaseClass,
  onCartAddSuccess,
  pendingTrackRef,
  title,
}) {
  useEffect(() => {
    if (!pendingTrackRef.current || fetcher.state !== 'idle') return;
    if (!fetcher.data) return;

    const errors = fetcher.data?.errors || [];
    pendingTrackRef.current = false;

    if (Array.isArray(errors) && errors.length > 0) return;
    if (typeof onCartAddSuccess === 'function') {
      onCartAddSuccess(fetcher.data);
    }
  }, [fetcher.data, fetcher.state, onCartAddSuccess, pendingTrackRef]);

  return (
    <>
      <input name="analytics" type="hidden" value={JSON.stringify(analytics)} />
      <CartTrackingFields />
      <button
        type="submit"
        data-tt-event="AddToCart"
        aria-label={ariaLabel}
        title={title}
        onClick={handleAnimation}
        disabled={disabled ?? fetcher.state !== 'idle'}
        className={[
          includeBaseClass ? 'add-to-cart-button' : '',
          className,
          disabled ? 'disabled' : '',
          fetcher.state !== 'idle' ? 'loading' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={buttonStyles}
      >
        {children}
      </button>
    </>
  );
}

/** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
