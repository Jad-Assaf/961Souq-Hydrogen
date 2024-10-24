import { Link } from '@remix-run/react';
import { Image, Money } from '@shopify/hydrogen';

/**
 * @param {{
 *   collections: Array<{
 *     title: string;
 *     handle: string;
 *     products: { nodes: Array<ProductFragment> };
 *   }>;
 * }}
 */
export function CollectionDisplay({ collections }) {
    if (!collections || collections.length === 0) return null;

    return (
        <div className="collection-display">
            {collections.map((collection) => (
                <div key={collection.handle} className="collection-section">
                    <h3>{collection.title}</h3>
                    <div className="collection-products-row">
                        {collection.products.nodes.map((product) => (
                            <Link
                                key={product.id}
                                className="product-item"
                                to={`/products/${product.handle}`}
                            >
                                <Image
                                    data={product.images.nodes[0]}
                                    aspectRatio="1/1"
                                    sizes="(min-width: 45em) 20vw, 50vw"
                                />
                                <h4>{product.title}</h4>
                                <Money data={product.priceRange.minVariantPrice} />
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
