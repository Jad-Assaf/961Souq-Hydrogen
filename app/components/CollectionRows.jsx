import React, { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { ProductRow } from './CollectionDisplay';
import { Image } from '@shopify/hydrogen-react';

const ROW_LOAD_DELAY = 300; // Delay in milliseconds between rows

const CollectionRows = ({ menuCollections }) => {
    const [visibleRows, setVisibleRows] = useState(0); // Number of visible rows

    useEffect(() => {
        if (visibleRows < menuCollections.length) {
            const timer = setTimeout(() => {
                setVisibleRows((prev) => prev + 1); // Increment visible rows
            }, ROW_LOAD_DELAY);
            return () => clearTimeout(timer); // Cleanup timeout
        }
    }, [visibleRows, menuCollections]);

    return (
        <>
            {menuCollections.slice(0, visibleRows).map((menuCollection, index) => (
                <React.Fragment key={index}>
                    {/* Render the menu slider */}
                    <div className="menu-slider-container">
                        <div className="menu-category-slider">
                            {menuCollection.map((collection) => (
                                <Link
                                    key={collection.id}
                                    to={`/collections/${collection.handle}`}
                                    className="menu-item-container"
                                >
                                    {collection.image && (
                                        <Image
                                            srcSet={`${collection.image.url}?width=300&quality=15 300w,
                                                     ${collection.image.url}?width=600&quality=15 600w,
                                                     ${collection.image.url}?width=1200&quality=15 1200w`}
                                            alt={collection.image.altText || collection.title}
                                            className="menu-item-image"
                                            width={150}
                                            height={150}
                                        />
                                    )}
                                    <div className="category-title">
                                        {collection.title}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Render the product rows for this menu slider */}
                    {menuCollection.map((collection) => (
                        <div key={collection.id} className="collection-section">
                            <div className="collection-header">
                                <h3>{collection.title}</h3>
                                <Link
                                    to={`/collections/${collection.handle}`}
                                    className="view-all-link"
                                >
                                    View All
                                </Link>
                            </div>
                            <ProductRow products={collection.products.nodes} />
                        </div>
                    ))}
                </React.Fragment>
            ))}
        </>
    );
};

export default CollectionRows;
