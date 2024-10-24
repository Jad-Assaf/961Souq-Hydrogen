// src/components/ProductRow.jsx

import { Link } from '@shopify/hydrogen';

export default function ProductRow({ products }) {
    return (
        <div className="product-row">
            {products.map((product) => (
                <div key={product.id} className="product-card">
                    <Link to={`/products/${product.handle}`}>
                        <img
                            src={product.images.edges[0]?.node.url}
                            alt={product.images.edges[0]?.node.altText || 'Product Image'}
                        />
                        <h2>{product.title}</h2>
                        <p>{product.description}</p>
                        <p>
                            {product.priceRange.minVariantPrice.amount}{' '}
                            {product.priceRange.minVariantPrice.currencyCode}
                        </p>
                    </Link>
                    <button>Add to Cart</button>
                </div>
            ))}
        </div>
    );
}
