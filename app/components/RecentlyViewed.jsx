import { useEffect, useState } from 'react';
import { Link } from '@remix-run/react';
import { Image, Money } from '@shopify/hydrogen';

export default function RecentlyViewed({ products }) {
    const [recentlyViewed, setRecentlyViewed] = useState([]);

    useEffect(() => {
        // Load recently viewed products from localStorage
        const handles = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
        setRecentlyViewed(handles.slice(0, 5)); // Limit to 5 products
    }, []);

    if (!recentlyViewed.length) return null;

    return (
        <div className="recently-viewed-section">
            <h3>Recently Viewed Products</h3>
            <div className="recently-viewed-container">
                {products.map((product) => (
                    <div key={product.id} className="recently-viewed-item">
                        <Link to={`/products/${product.handle}`}>
                            <Image
                                data={product.images.edges[0]?.node}
                                alt={product.title}
                                width="150px"
                                height="150px"
                            />
                            <h4>{product.title}</h4>
                            <div className="product-price">
                                <Money data={product.priceRange.minVariantPrice} />
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
