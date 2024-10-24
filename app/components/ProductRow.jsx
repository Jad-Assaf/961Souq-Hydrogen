import { ProductProvider, useProduct } from '@shopify/hydrogen-react';
import { AddToCartButton } from '~/components/AddToCartButton';
import { Image, Money } from '@shopify/hydrogen';
import { Link } from '@remix-run/react';

export function ProductRow({ product }) {
    return (
        <ProductProvider data={product}>
            <div className="product-row">
                <Link to={`/products/${product.handle}`}>
                    <Image
                        data={product.images.nodes[0]}
                        aspectRatio="1/1"
                        sizes="(min-width: 45em) 20vw, 50vw"
                        width={300}
                        height={400}
                    />
                </Link>

                <h4>{product.title}</h4>
                <small>
                    <Money data={product.priceRange.minVariantPrice} />
                </small>

                <ProductOptions />
                <AddToCartButtonWrapper />
            </div>
        </ProductProvider>
    );
}

function ProductOptions() {
    const { options, setSelectedOption, selectedOptions } = useProduct();

    return (
        <div className="product-options">
            {options.map((option) => (
                <div key={option.name} className="product-option">
                    <h5>{option.name}</h5>
                    <div className="product-option-values">
                        {option.values.map((value) => (
                            <button
                                key={`${option.name}-${value}`}
                                className={`product-option-value ${selectedOptions[option.name] === value ? 'active' : ''
                                    }`}
                                onClick={() => setSelectedOption(option.name, value)}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function AddToCartButtonWrapper() {
    const { selectedVariant } = useProduct();

    return (
        <AddToCartButton
            disabled={!selectedVariant?.availableForSale}
            lines={[
                { merchandiseId: selectedVariant?.id, quantity: 1 },
            ]}
        >
            {selectedVariant?.availableForSale ? 'Add to Cart' : 'Sold Out'}
        </AddToCartButton>
    );
}
