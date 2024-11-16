import React from 'react';
import { Link } from '@remix-run/react';

export default function RelatedProductsRow({ products }) {
    if (!products.length) {
        return <p>No related products found.</p>;
    }

    return (
        <div className="related-products-grid">
            {products.map((product) => (
                <div key={product.id} className="related-product-card">
                    <Link to={`/products/${product.handle}`}>
                        <img
                            src={product.images.edges[0]?.node.url}
                            alt={product.images.edges[0]?.node.altText || product.title}
                        />
                        <h3>{product.title}</h3>
                        <p>
                            From {product.priceRange.minVariantPrice.amount}{' '}
                            {product.priceRange.minVariantPrice.currencyCode}
                        </p>
                    </Link>
                </div>
            ))}
        </div>
    );
}
