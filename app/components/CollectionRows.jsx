// CollectionRows.jsx
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'your-image-component'; // Import your Image component
import { ProductRow } from './CollectionDisplay';

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
                                            width="740px"
                                            height="300px"
                                        >
                                            <Image
                                                data={image}
                                                sizes="(min-width: 45em) 20vw, 40vw"
                                                srcSet={`${image}?width=300&quality=30 300w,
                                                         ${image}?width=600&quality=30 600w,
                                                         ${image}?width=1200&quality=30 1200w`}
                                                alt={`Image Row ${Math.floor(index / 3) + 1} Image ${i + 1}`}
                                                width="740px"
                                                height="300px"
                                            />
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