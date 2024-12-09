import React, { useRef } from 'react';
import { Link } from '@remix-run/react';
import { motion, useInView } from 'framer-motion';
import { ProductRow } from './CollectionDisplay';
import { Image } from '@shopify/hydrogen-react';

const CollectionRows = ({ menuCollections }) => {
    return (
        <>
            {menuCollections.map((menuCollection, index) => (
                <React.Fragment key={menuCollection.id}>
                    {/* Render the menu slider */}
                    <div className="menu-slider-container">
                        <div className="menu-category-slider">
                            {menuCollection.map((collection, collectionIndex) => (
                                <CollectionItem
                                    key={collection.id}
                                    collection={collection}
                                    index={collectionIndex}
                                />
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

const CollectionItem = ({ collection, index }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="animated-menu-item"
        >
            <Link
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
                <div className="category-title">{collection.title}</div>
            </Link>
        </motion.div>
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
