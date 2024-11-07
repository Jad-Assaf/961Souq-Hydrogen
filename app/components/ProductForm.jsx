import {Link} from '@remix-run/react';
import {CartForm, VariantSelector} from '@shopify/hydrogen';
import React from 'react';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductFragment['selectedVariant'];
 *   variants: Array<ProductVariantFragment>;
 * }}
 */
export function ProductForm({product, selectedVariant, variants, quantity = 1}) {
  const {open} = useAside();

  const safeQuantity = typeof quantity === 'number' && quantity > 0 ? quantity : 1;

  return (
    <div className="product-form">
      <VariantSelector
        handle={product.handle}
        options={product.options.filter((option) => option.values.length > 1)}
        variants={variants}
      >
        {({option}) => <ProductOptions key={option.name} option={option} />}
      </VariantSelector>
      <br />
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          open('cart');
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: safeQuantity, // Use safeQuantity instead of quantity
                  selectedVariant,
                },
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
      </AddToCartButton>
    </div>
  );
}

/**
 * @param {{option: VariantOption}}
 */
function ProductOptions({option}) {
  return (
    <div className="product-options" key={option.name}>
      <h5>{option.name}</h5>
      <div className="product-options-grid">
        {option.values.map(({value, isAvailable, isActive, to}) => {
          return (
            <Link
              className="product-options-item"
              key={option.name + value}
              prefetch="intent"
              preventScrollReset
              replace
              to={to}
              style={{
                border: isActive ? '1px solid black' : '1px solid transparent',
                opacity: isAvailable ? 1 : 0.3,
              }}
            >
              {value}
            </Link>
          );
        })}
      </div>
      <br />
    </div>
  );
}

export function DirectCheckoutButton({ selectedVariant, quantity }) {
  if (!selectedVariant || !selectedVariant.availableForSale) return null;

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{
        lines: [
          {
            merchandiseId: selectedVariant.id,
            quantity: quantity,
          },
        ],
      }}
    >
      {(fetcher) => {
        if (fetcher.state === 'submitting') {
          return <p>Processing...</p>;
        }

        if (fetcher.data?.cart?.checkoutUrl) {
          window.location.href = fetcher.data.cart.checkoutUrl;
        }

        return (
          <button
            type="submit"
            disabled={!selectedVariant || !selectedVariant.availableForSale}
            className="buy-now-button"
          >
            Buy Now
          </button>
        );
      }}
    </CartForm>
  );
}

/** @typedef {import('@shopify/hydrogen').VariantOption} VariantOption */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */
