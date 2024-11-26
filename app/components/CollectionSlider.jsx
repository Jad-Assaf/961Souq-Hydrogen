// CategorySlider.jsx
import { Link } from '@remix-run/react';
import { Image } from '@shopify/hydrogen-react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';

export const CategorySlider = ({ menuItems, sliderCollections }) => {
    const [expandedCategoryId, setExpandedCategoryId] = useState(null);

    // Map collection handles to collections for easy access
    const collectionMap = new Map(
        sliderCollections.map((collection) => [collection.handle, collection])
    );

    // Function to extract collection handle from URL
    const getCollectionHandleFromUrl = (url) => {
        const match = url.match(/\/collections\/([^\/?#]+)/);
        return match ? match[1] : null;
    };

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Shop By Categories</h3>
            <div className="category-slider">
                {menuItems.map((item) => (
                    <CategoryItem
                        key={item.id}
                        item={item}
                        isExpanded={expandedCategoryId === item.id}
                        onClick={() =>
                            setExpandedCategoryId((prev) => (prev === item.id ? null : item.id))
                        }
                        getCollectionHandleFromUrl={getCollectionHandleFromUrl}
                        collectionMap={collectionMap}
                    />
                ))}
            </div>
        </div>
    );
};

function CategoryItem({
    item,
    isExpanded,
    onClick,
    getCollectionHandleFromUrl,
    collectionMap,
}) {
    const hasSubitems = item.items && item.items.length > 0;
    const handle = getCollectionHandleFromUrl(item.url);
    const collection = handle ? collectionMap.get(handle) : null;

    return (
        <div className="category-container">
            <div
                onClick={onClick}
                className="category-link"
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        onClick();
                    }
                }}
                aria-expanded={isExpanded}
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="category-image-wrapper"
                >
                    {collection?.image ? (
                        <Image
                            data={collection.image}
                            aspectRatio="1/1"
                            sizes="(min-width: 45em) 20vw, 40vw"
                            alt={collection.image?.altText || collection.title}
                            className="category-image"
                        />
                    ) : (
                        <div className="category-placeholder-image">{item.title.charAt(0)}</div>
                    )}
                </motion.div>
                <div className="category-title">{item.title}</div>
            </div>
            <AnimatePresence>
                {isExpanded && hasSubitems && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="category-slider" // Use the same class for consistent styling
                    >
                        {item.items.map((subItem) => {
                            const subHandle = getCollectionHandleFromUrl(subItem.url);
                            const subCollection = subHandle ? collectionMap.get(subHandle) : null;

                            return (
                                <Link key={subItem.id} to={`/collections/${subHandle}`} className="category-container">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.3 }}
                                        className="category-image-wrapper"
                                    >
                                        {subCollection?.image ? (
                                            <Image
                                                data={subCollection.image}
                                                aspectRatio="1/1"
                                                sizes="(min-width: 45em) 20vw, 40vw"
                                                alt={subCollection.image?.altText || subCollection.title}
                                                className="category-image"
                                            />
                                        ) : (
                                            <div className="category-placeholder-image">
                                                {subItem.title.charAt(0)}
                                            </div>
                                        )}
                                    </motion.div>
                                    <div className="category-title">{subItem.title}</div>
                                </Link>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
