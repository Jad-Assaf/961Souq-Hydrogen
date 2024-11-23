// CollectionRows.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ProductRow } from './CollectionDisplay';
import { Link } from '@remix-run/react';
import { Image } from '@shopify/hydrogen-react';

const CollectionRows = ({ collections, images }) => {
    return (
        <>
            {collections
                .filter((collection) => collection.handle !== "new-arrivals" && collection.handle !== "laptops")
                .map((collection, index) => {
                    const isImageRow = index % 3 === 0; // Render image rows first and after every 3 product rows
                    const imageIndex = Math.floor(index / 3) * 2; // Determine which images to display for the current image row

                    return (
                        <React.Fragment key={collection.id}>
                            {/* Render image row before product rows */}
                            {isImageRow && images.length > imageIndex && (
                                <div className="image-row">
                                    {images.slice(imageIndex, imageIndex + 2).map((image, i) => (
                                        <motion.div
                                            key={`${collection.id}-image-${i}`}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 + 0.2 }}
                                            className="row-image"
                                        >
                                            <a href={image.link} target="_self" rel="noopener noreferrer">
                                                <Image
                                                    data={{
                                                        url: image.src, // Ensure the `src` field contains the image URL
                                                        altText: `Image Row ${Math.floor(index / 3) + 1} Image ${i + 1}`,
                                                    }}
                                                    sizes="(min-width: 45em) 20vw, 40vw"
                                                    width="740px"
                                                    height="300px"
                                                    className="image-row-item"
                                                />
                                            </a>
                                        </motion.div>
                                    ))}
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