import { Link } from '@remix-run/react';
import { Image, Money } from '@shopify/hydrogen';
import '../styles/productRow.css';

/**
 * @param {{
 *   collection: { 
 *     title: string; 
 *     handle: string; 
 *     products: { nodes: Array<ProductFragment> } 
 *   }
 * }}
 */
export function CollectionDisplay({ collection }) {
    if (!collection) return null;
    const { title, products } = collection;

    return (
        <div className="collection-display">
            <h3>{title}</h3>
            <div className="collection-products-row">
                {products.nodes.map((product) => (
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
    );
}
