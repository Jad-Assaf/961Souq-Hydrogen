import React from 'react';
import { motion } from 'framer-motion';
import { ProductRow } from './CollectionDisplay';
import { Link } from '@remix-run/react';

const CollectionRows = ({ collections, alternateCollections }) => {
    return (
        <>
            {collections.map((collection, index) => {
                const isSliderRow = index % 3 === 0; // Display slider every 3 product rows
                const sliderIndex = Math.floor(index / 3);
                const currentSlider = alternateCollections[sliderIndex];

                return (
                    <React.Fragment key={collection.id}>
                        {/* Render the collections slider row */}
                        {isSliderRow && Array.isArray(currentSlider) && (
                            <div className="slider-row">
                                <div className="category-slider">
                                    {currentSlider.map((sliderCollection) => (
                                        sliderCollection && (
                                            <Link
                                                key={sliderCollection.id}
                                                to={`/collections/${sliderCollection.handle}`}
                                                className="category-container"
                                            >
                                                {sliderCollection.image && (
                                                    <img
                                                        src={sliderCollection.image.url}
                                                        alt={sliderCollection.image.altText || sliderCollection.title}
                                                        className="category-image"
                                                        width={150}
                                                        height={150}
                                                    />
                                                )}
                                                <div className="category-title">{sliderCollection.title}</div>
                                            </Link>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Render product row */}
                        <div className="collection-section">
                            <div className="collection-header">
                                <h3>{collection.title}</h3>
                                <Link to={`/collections/${collection.handle}`} className="view-all-link">
                                    View All
                                </Link>
                            </div>
                            <ProductRow products={collection.products.nodes} />
                        </div>
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default CollectionRows;
