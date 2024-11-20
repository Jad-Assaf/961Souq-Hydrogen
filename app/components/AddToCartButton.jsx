import {CartForm} from '@shopify/hydrogen';
import { motion } from 'framer-motion';
import React from 'react';

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
  children,
  disabled,
  lines,
  onClick,
}) {
  return (
    <CartForm route="/cart" inputs={{ lines }} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <motion.button
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
            animate={isCartAnimating ? { scale: 1.2 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`add-to-cart-button ${disabled ? 'disabled' : ''} ${fetcher.state !== 'idle' ? 'loading' : ''
              }`}
          >
            {children}
          </motion.button>
        </>
      )}
    </CartForm>
  );
}


/** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
