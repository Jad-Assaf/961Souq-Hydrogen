import React, { useState } from 'react';
import { Link } from '@remix-run/react';
import { ProductRow } from './CollectionDisplay';
import { Image } from '@shopify/hydrogen-react';
import { useInView } from 'react-intersection-observer';

const CollectionRows = ({ menuCollections }) => {
    // Track which rows are in view
    const [visibleRows, setVisibleRows] = useState([]);

    const handleInView = (index) => {
        if (!visibleRows.includes(index)) {
            setVisibleRows((prev) => [...prev, index]);
        }
    };

    return (
        <>
            {menuCollections.map((menuCollection, index) => {
                const { ref, inView } = useInView({
                    threshold: 0.1, // Trigger when 10% of the element is visible
                    triggerOnce: true, // Trigger only once
                });

                // Mark the row as visible if it's in view
                if (inView) {
                    handleInView(index);
                }

                return (
                    <React.Fragment key={index}>
                        <div ref={ref} className="menu-slider-container">
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
                                                loading="lazy"
                                            />
                                        )}
                                        <div className="category-title">
                                            {collection.title}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {visibleRows.includes(index) && (
                            <>
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
                            </>
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
};

const LeftArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const RightArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

export default CollectionRows;
