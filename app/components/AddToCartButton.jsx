import {CartForm} from '@shopify/hydrogen';
import React, {useState} from 'react';
import {CartTrackingFields} from './CartTrackingFields';

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: () => void;
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
  onClick,
  title,
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAnimation = (e) => {
    setIsAnimating(true);
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
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
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
            style={buttonStyles} // Apply inline styles for animation
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}

/** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
