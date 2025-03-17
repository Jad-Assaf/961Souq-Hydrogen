import {CartForm} from '@shopify/hydrogen';
import React, {useState, useEffect} from 'react';
import {useRevalidator} from '@remix-run/react';

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
 * }}
 */
export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const revalidator = useRevalidator();

  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => {
        useEffect(() => {
          // Check that the fetcher has completed and returned data before revalidating.
          if (fetcher.state === 'idle' && isAnimating && fetcher.data) {
            setIsAnimating(false);
            // Delay slightly to ensure the cart action is fully processed
            setTimeout(() => {
              revalidator.revalidate();
            }, 100);
          }
        }, [fetcher.state, isAnimating, fetcher.data, revalidator]);

        const handleClick = (e) => {
          setIsAnimating(true);
          if (onClick) onClick(e);
        };

        const buttonStyles = {
          transition: 'transform 0.3s ease',
          transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
        };

        return (
          <>
            <input
              name="analytics"
              type="hidden"
              value={JSON.stringify(analytics)}
            />
            <button
              type="submit"
              onClick={handleClick}
              disabled={disabled ?? fetcher.state !== 'idle'}
              className={`add-to-cart-button ${disabled ? 'disabled' : ''} ${
                fetcher.state !== 'idle' ? 'loading' : ''
              }`}
              style={buttonStyles}
            >
              {children}
            </button>
          </>
        );
      }}
    </CartForm>
  );
}

/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
